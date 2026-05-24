import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type ChatRole = "user" | "assistant" | "system" | "developer";
type ModelMode = "auto" | "fast" | "smart";

type IncomingMessage = {
  role?: ChatRole;
  content?: unknown;
};

type ChatRequestBody = {
  modelMode?: ModelMode;
  messages?: IncomingMessage[];
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-nano";
const SMART_MODEL = "gpt-5-mini";
const MAX_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 4_000;
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

function normalizeMessages(messages: IncomingMessage[] | undefined) {
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

  const modelMode: ModelMode = body.modelMode === "smart" || body.modelMode === "fast" ? body.modelMode : "auto";
  const model = selectModel(modelMode);

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
          model,
          modelMode,
        },
        502,
      );
    }

    return jsonResponse({
      answer,
      model,
      modelMode,
      provider: "openai",
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "AI request failed",
        detail: error instanceof Error ? error.message : String(error),
        model,
        modelMode,
      },
      500,
    );
  }
});
