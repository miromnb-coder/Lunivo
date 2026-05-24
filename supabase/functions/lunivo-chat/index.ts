import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type ChatRole = "user" | "assistant" | "system" | "developer";
type ModelMode = "auto" | "fast" | "smart";

type IncomingMessage = {
  role?: ChatRole;
  content?: unknown;
};

type ChatRequestBody = {
  conversationId?: unknown;
  modelMode?: ModelMode;
  messages?: IncomingMessage[];
};

type NormalizedMessage = {
  role: "user" | "assistant";
  content: string;
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-nano";
const SMART_MODEL = "gpt-5-mini";
const MAX_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_TITLE_CHARS = 54;
const MAX_OUTPUT_TOKENS = 900;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function selectModel(modelMode: ModelMode = "auto") {
  // Keep costs low: auto and fast always use nano.
  // Use mini only when the app explicitly asks for smart mode later.
  if (modelMode === "smart") {
    return SMART_MODEL;
  }

  return DEFAULT_MODEL;
}

function normalizeMessages(messages: IncomingMessage[] | undefined): NormalizedMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .slice(-MAX_MESSAGES)
    .map((message) => {
      const role = message.role === "assistant" ? "assistant" : "user";
      const content = typeof message.content === "string" ? message.content.trim() : "";

      return {
        role,
        content: content.slice(0, MAX_MESSAGE_CHARS),
      };
    })
    .filter((message) => message.content.length > 0);
}

function createConversationTitle(message: string) {
  const cleanMessage = message.replace(/\s+/g, " ").trim();

  if (!cleanMessage) {
    return "New chat";
  }

  if (cleanMessage.length <= MAX_TITLE_CHARS) {
    return cleanMessage;
  }

  return `${cleanMessage.slice(0, MAX_TITLE_CHARS - 1).trim()}…`;
}

function getLatestUserMessage(messages: NormalizedMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user") ?? null;
}

function extractOutputText(data: unknown) {
  if (typeof data !== "object" || data === null) {
    return "";
  }

  const response = data as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        text?: unknown;
        type?: unknown;
      }>;
    }>;
  };

  if (typeof response.output_text === "string") {
    return response.output_text.trim();
  }

  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((content) => (typeof content.text === "string" ? content.text : ""))
    .join("")
    .trim();
}

function getOpenAIError(data: unknown) {
  if (typeof data !== "object" || data === null) {
    return "OpenAI request failed.";
  }

  const maybeError = data as { error?: { message?: unknown } };
  return typeof maybeError.error?.message === "string"
    ? maybeError.error.message
    : "OpenAI request failed.";
}

async function getOrCreateConversation({
  accessToken,
  conversationId,
  latestUserMessage,
  modelMode,
  userId,
}: {
  accessToken: string;
  conversationId: string | null;
  latestUserMessage: NormalizedMessage;
  modelMode: ModelMode;
  userId: string;
}) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  if (conversationId) {
    const { data, error } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.id) {
      return { conversationId: data.id, supabase };
    }
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title: createConversationTitle(latestUserMessage.content),
      model_mode: modelMode,
    })
    .select("id")
    .single();

  if (conversationError) {
    throw conversationError;
  }

  return { conversationId: conversation.id as string, supabase };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const openAIKey = Deno.env.get("OPENAI_API_KEY");

  if (!openAIKey) {
    return jsonResponse(
      {
        error: "Missing OPENAI_API_KEY",
        detail: "Add OPENAI_API_KEY in Supabase Edge Function secrets.",
      },
      500,
    );
  }

  let body: ChatRequestBody;

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const messages = normalizeMessages(body.messages);

  if (messages.length === 0) {
    return jsonResponse({ error: "Message is required" }, 400);
  }

  const latestUserMessage = getLatestUserMessage(messages);

  if (!latestUserMessage) {
    return jsonResponse({ error: "User message is required" }, 400);
  }

  const authorization = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    return jsonResponse({ error: "Authentication required" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Supabase environment variables are missing" }, 500);
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return jsonResponse({ error: "Invalid user session" }, 401);
  }

  const modelMode: ModelMode = body.modelMode === "smart" || body.modelMode === "fast" ? body.modelMode : "auto";
  const model = selectModel(modelMode);
  const requestedConversationId = typeof body.conversationId === "string" ? body.conversationId : null;

  let savedConversationId: string;
  let supabaseForUser: ReturnType<typeof createClient>;

  try {
    const result = await getOrCreateConversation({
      accessToken,
      conversationId: requestedConversationId,
      latestUserMessage,
      modelMode,
      userId: userData.user.id,
    });

    savedConversationId = result.conversationId;
    supabaseForUser = result.supabase;

    const { error: userMessageError } = await supabaseForUser.from("messages").insert({
      conversation_id: savedConversationId,
      user_id: userData.user.id,
      role: "user",
      content: latestUserMessage.content,
    });

    if (userMessageError) {
      throw userMessageError;
    }
  } catch (error) {
    return jsonResponse(
      {
        error: "Could not save user message",
        detail: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }

  const instructions = [
    "You are Lunivo, a calm personal AI study agent for students.",
    "Help the student understand school topics clearly and step by step.",
    "Keep answers concise unless the student asks for more detail.",
    "Use the same language as the student's latest message when clear.",
    "Ask one helpful follow-up question only when it genuinely helps.",
    "Be age-appropriate and do not provide unsafe instructions.",
  ].join("\n");

  try {
    const openAIResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions,
        input: messages,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        store: false,
      }),
    });

    const data = await openAIResponse.json().catch(() => ({}));

    if (!openAIResponse.ok) {
      return jsonResponse(
        {
          error: "OpenAI request failed",
          detail: getOpenAIError(data),
          conversationId: savedConversationId,
          model,
          modelMode,
        },
        openAIResponse.status,
      );
    }

    const answer = extractOutputText(data);

    if (!answer) {
      return jsonResponse(
        {
          error: "Empty AI answer",
          conversationId: savedConversationId,
          model,
          modelMode,
        },
        502,
      );
    }

    const { error: assistantMessageError } = await supabaseForUser.from("messages").insert({
      conversation_id: savedConversationId,
      user_id: userData.user.id,
      role: "assistant",
      content: answer,
      model,
    });

    if (assistantMessageError) {
      return jsonResponse(
        {
          error: "Could not save assistant message",
          detail: assistantMessageError.message,
          conversationId: savedConversationId,
          model,
          modelMode,
        },
        500,
      );
    }

    return jsonResponse({
      answer,
      conversationId: savedConversationId,
      model,
      modelMode,
      provider: "openai",
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "AI request failed",
        detail: error instanceof Error ? error.message : String(error),
        conversationId: savedConversationId,
        model,
        modelMode,
      },
      500,
    );
  }
});
