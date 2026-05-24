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

function getEnv() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
  };
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

  let env: ReturnType<typeof getEnv>;

  try {
    env = getEnv();
  } catch (error) {
    return jsonResponse(
      {
        error: "Supabase environment variables are missing",
        detail: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }

  const authClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return jsonResponse(
      {
        error: "Invalid user session",
        detail: userError?.message ?? "Could not identify the signed-in user.",
      },
      401,
    );
  }

  const modelMode: ModelMode = body.modelMode === "smart" || body.modelMode === "fast" ? body.modelMode : "auto";
  const model = selectModel(modelMode);
  const requestedConversationId = typeof body.conversationId === "string" ? body.conversationId : null;
  const dbClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey ?? env.supabaseAnonKey, env.supabaseServiceRoleKey
    ? undefined
    : {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

  let savedConversationId: string | null = null;
  let persistenceError: string | null = null;

  try {
    if (requestedConversationId) {
      const { data, error } = await dbClient
        .from("conversations")
        .select("id")
        .eq("id", requestedConversationId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      savedConversationId = typeof data?.id === "string" ? data.id : null;
    }

    if (!savedConversationId) {
      const { data, error } = await dbClient
        .from("conversations")
        .insert({
          user_id: userData.user.id,
          title: createConversationTitle(latestUserMessage.content),
          model_mode: modelMode,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      savedConversationId = typeof data?.id === "string" ? data.id : null;
    }

    if (savedConversationId) {
      const { error } = await dbClient.from("messages").insert({
        conversation_id: savedConversationId,
        user_id: userData.user.id,
        role: "user",
        content: latestUserMessage.content,
      });

      if (error) {
        throw error;
      }
    }
  } catch (error) {
    persistenceError = error instanceof Error ? error.message : String(error);
  }

  const instructions = [
    "You are Lunivo, a calm personal AI study agent for students.",
    "Your job is to help the student learn, not just give final answers.",
    "Use the same language as the student's latest message when it is clear.",
    "Start with the direct answer, then explain the idea step by step.",
    "For school topics, use simple examples and define important terms briefly.",
    "For math, science, and language tasks, show the reasoning in small understandable steps without overcomplicating.",
    "When the student asks for an explanation, keep it structured and easy to follow.",
    "When the student asks for a quiz, ask one question at a time and wait for their answer.",
    "When the student asks for a study plan, make a realistic plan with short focused sessions and breaks.",
    "Keep responses concise by default, but provide more detail when the student asks.",
    "Be encouraging, clear, and age-appropriate.",
    "Do not provide unsafe instructions, and avoid graphic or explicit details.",
    "Ask at most one helpful follow-up question, and only when it genuinely helps the next step.",
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
          persistenceError,
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
          persistenceError,
        },
        502,
      );
    }

    if (savedConversationId) {
      const { error } = await dbClient.from("messages").insert({
        conversation_id: savedConversationId,
        user_id: userData.user.id,
        role: "assistant",
        content: answer,
        model,
      });

      if (error) {
        persistenceError = error.message;
      }
    }

    return jsonResponse({
      answer,
      conversationId: savedConversationId,
      model,
      modelMode,
      persistenceError,
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
        persistenceError,
      },
      500,
    );
  }
});
