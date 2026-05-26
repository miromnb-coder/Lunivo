import { loadMemoryContext } from './memory.ts';
import { resolveModelProfile } from './modelRouter.ts';
import {
  recordAgentRunError,
  recordAgentRunStart,
  recordAgentRunSuccess,
} from './persistence.ts';
import { checkAgentRequestSafety } from './safety.ts';
import { buildSystemPrompt } from './systemPrompt.ts';
import { getAvailableTools } from './tools.ts';
import type {
  AgentMessage,
  AgentRequest,
  AgentResponse,
  StreamDeltaHandler,
} from './types.ts';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const MAX_MESSAGES_TO_SEND = 24;
const MAX_MESSAGE_CHARS = 4000;
const OPENAI_TIMEOUT_MS = 45000;

type OpenAIResponsePayload = {
  output?: unknown;
  output_text?: unknown;
  error?: {
    message?: string;
  };
};

type OpenAIStreamChunk = {
  type?: string;
  delta?: unknown;
  error?: {
    message?: string;
  };
  response?: OpenAIResponsePayload;
};

function getOpenAIKey() {
  const apiKey = Deno.env.get('OPENAI_API_KEY')?.trim();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  return apiKey;
}

function normalizeMessages(messages: AgentMessage[]): AgentMessage[] {
  return messages
    .filter((message) => (message.role === 'user' || message.role === 'assistant') && message.content.trim().length > 0)
    .slice(-MAX_MESSAGES_TO_SEND)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_CHARS),
    }));
}

function collectText(value: unknown, parts: string[] = []): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed) {
      parts.push(trimmed);
    }

    return parts;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectText(item, parts);
    }

    return parts;
  }

  if (typeof value !== 'object' || value === null) {
    return parts;
  }

  const object = value as Record<string, unknown>;
  const type = typeof object.type === 'string' ? object.type : '';

  if (typeof object.output_text === 'string') {
    collectText(object.output_text, parts);
  }

  if ((type === 'output_text' || type === 'text') && typeof object.text === 'string') {
    collectText(object.text, parts);
  }

  if (typeof object.content === 'string' || Array.isArray(object.content)) {
    collectText(object.content, parts);
  }

  if (Array.isArray(object.output)) {
    collectText(object.output, parts);
  }

  if (typeof object.message === 'object' && object.message !== null) {
    collectText(object.message, parts);
  }

  return parts;
}

function extractAnswer(payload: unknown) {
  const parts = collectText(payload);
  return parts.filter((part, index) => parts.indexOf(part) === index).join('\n').trim();
}

function getStreamDelta(payload: OpenAIStreamChunk) {
  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }

  if (payload.type === 'response.output_text.delta' && typeof payload.delta === 'string') {
    return payload.delta;
  }

  if (!payload.type && typeof payload.delta === 'string') {
    return payload.delta;
  }

  return '';
}

async function createAgentContext(request: AgentRequest) {
  const safety = checkAgentRequestSafety(request);

  if (!safety.allowed) {
    throw new Error(safety.reason ?? 'Agent request was rejected.');
  }

  const memory = await loadMemoryContext();
  const model = resolveModelProfile(request.modelMode ?? 'fast');
  const tools = getAvailableTools();

  return {
    conversationId: request.conversationId ?? null,
    memory,
    model,
    tools,
  };
}

function createOpenAIRequestBody(request: AgentRequest, instructions: string, maxOutputTokens: number, stream = false) {
  const model = resolveModelProfile(request.modelMode ?? 'fast');

  return {
    model: model.model,
    instructions,
    input: normalizeMessages(request.messages),
    reasoning: { effort: 'minimal' },
    text: { verbosity: 'low' },
    max_output_tokens: maxOutputTokens,
    store: false,
    stream,
  };
}

export async function runAgent(request: AgentRequest): Promise<AgentResponse> {
  const context = await createAgentContext(request);
  const runId = await recordAgentRunStart(request, context);
  const instructions = buildSystemPrompt(context.memory);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${getOpenAIKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createOpenAIRequestBody(request, instructions, context.model.maxOutputTokens)),
    });

    clearTimeout(timeoutId);
    const payload = await response.json().catch(() => ({})) as OpenAIResponsePayload;

    if (!response.ok) {
      throw new Error(payload.error?.message ?? 'OpenAI request failed.');
    }

    const answer = extractAnswer(payload);

    if (!answer) {
      throw new Error('OpenAI returned an empty answer.');
    }

    const agentResponse: AgentResponse = {
      answer,
      conversationId: request.conversationId ?? null,
      model: context.model.model,
      modelMode: context.model.modelMode,
      provider: context.model.provider,
      usedTools: [],
    };

    await recordAgentRunSuccess(runId, agentResponse);
    return agentResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    await recordAgentRunError(runId, error);
    throw error;
  }
}

export async function streamAgent(request: AgentRequest, onDelta: StreamDeltaHandler): Promise<AgentResponse> {
  const context = await createAgentContext(request);
  const runId = await recordAgentRunStart(request, context);
  const instructions = buildSystemPrompt(context.memory);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  let answer = '';

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${getOpenAIKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createOpenAIRequestBody(request, instructions, context.model.maxOutputTokens, true)),
    });

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => ({})) as OpenAIResponsePayload;
      throw new Error(payload.error?.message ?? 'OpenAI stream request failed.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        const dataLines = event
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim());

        for (const data of dataLines) {
          if (!data || data === '[DONE]') {
            continue;
          }

          const payload = JSON.parse(data) as OpenAIStreamChunk;
          const delta = getStreamDelta(payload);

          if (delta) {
            answer += delta;
            await onDelta(delta);
          }
        }
      }
    }

    clearTimeout(timeoutId);
    const cleanAnswer = answer.trim();

    if (!cleanAnswer) {
      throw new Error('OpenAI stream returned an empty answer.');
    }

    const agentResponse: AgentResponse = {
      answer: cleanAnswer,
      conversationId: request.conversationId ?? null,
      model: context.model.model,
      modelMode: context.model.modelMode,
      provider: context.model.provider,
      usedTools: [],
    };

    await recordAgentRunSuccess(runId, agentResponse);
    return agentResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    await recordAgentRunError(runId, error);
    throw error;
  }
}
