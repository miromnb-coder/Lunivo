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

const FALLBACK_MEMORY_CONTEXT = {
  instructions: [],
  memories: [],
};

type AgentRunId = string | null;

type OpenAIResponsePayload = {
  output?: unknown;
  output_text?: unknown;
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
};

type OpenAIStreamChunk = {
  type?: string;
  delta?: unknown;
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
  response?: OpenAIResponsePayload & {
    status?: string;
    incomplete_details?: {
      reason?: string;
    };
  };
};

type ParsedSseEvent = {
  eventName: string | null;
  data: string;
};

class AgentRuntimeError extends Error {
  status: number;

  code: string;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = 'AgentRuntimeError';
    this.code = options?.code ?? 'agent_error';
    this.status = options?.status ?? 500;
  }
}

function getOpenAIKey() {
  const apiKey = Deno.env.get('OPENAI_API_KEY')?.trim();

  if (!apiKey) {
    throw new AgentRuntimeError('OPENAI_API_KEY is not configured.', {
      code: 'missing_openai_api_key',
      status: 500,
    });
  }

  return apiKey;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function toErrorMessage(error: unknown, fallback = 'Unknown error.') {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

function normalizeThrownError(error: unknown, fallback: string) {
  if (error instanceof AgentRuntimeError) {
    return error;
  }

  if (isAbortError(error)) {
    return new AgentRuntimeError('Lunivo AI request timed out. Please try again.', {
      code: 'openai_timeout',
      status: 504,
    });
  }

  return new AgentRuntimeError(toErrorMessage(error, fallback), {
    code: 'agent_request_failed',
    status: 500,
  });
}

function normalizeMessages(messages: AgentMessage[]): AgentMessage[] {
  return messages
    .filter((message) => {
      const hasValidRole = message.role === 'user' || message.role === 'assistant';
      const hasContent = typeof message.content === 'string' && message.content.trim().length > 0;

      return hasValidRole && hasContent;
    })
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

function extractAnswer(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = collectText(payload.output);
  const uniqueParts = parts.filter((part, index) => parts.indexOf(part) === index);

  return uniqueParts.join('\n').trim();
}

function getOpenAIErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const body = payload as OpenAIResponsePayload;

  return body.error?.message?.trim() || fallback;
}

async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function parseSseEvent(rawEvent: string): ParsedSseEvent | null {
  const cleanEvent = rawEvent.replace(/\r/g, '').trim();

  if (!cleanEvent) {
    return null;
  }

  let eventName: string | null = null;
  const dataLines: string[] = [];

  for (const line of cleanEvent.split('\n')) {
    if (!line || line.startsWith(':')) {
      continue;
    }

    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  return {
    eventName,
    data: dataLines.join('\n'),
  };
}

function getStreamDelta(event: ParsedSseEvent, payload: OpenAIStreamChunk) {
  if (payload.error?.message) {
    throw new AgentRuntimeError(payload.error.message, {
      code: payload.error.code ?? 'openai_stream_error',
      status: 502,
    });
  }

  if (payload.type === 'error') {
    throw new AgentRuntimeError(payload.error?.message ?? 'OpenAI stream failed.', {
      code: payload.error?.code ?? 'openai_stream_error',
      status: 502,
    });
  }

  if (payload.type === 'response.failed') {
    throw new AgentRuntimeError(payload.response?.error?.message ?? 'OpenAI response failed.', {
      code: payload.response?.error?.code ?? 'openai_response_failed',
      status: 502,
    });
  }

  if (payload.type === 'response.incomplete') {
    throw new AgentRuntimeError(
      payload.response?.incomplete_details?.reason
        ? `OpenAI response was incomplete: ${payload.response.incomplete_details.reason}.`
        : 'OpenAI response was incomplete.',
      {
        code: 'openai_response_incomplete',
        status: 502,
      },
    );
  }

  const isOutputTextDelta =
    event.eventName === 'response.output_text.delta' ||
    payload.type === 'response.output_text.delta';

  if (isOutputTextDelta && typeof payload.delta === 'string') {
    return payload.delta;
  }

  // Compatibility fallback for simple delta streams without event/type metadata.
  // Important: do not accept `text` or `output_text` here, because those can contain
  // the full final answer and would duplicate the already streamed response.
  if (!event.eventName && !payload.type && typeof payload.delta === 'string') {
    return payload.delta;
  }

  return '';
}

async function safeLoadMemoryContext() {
  try {
    return await loadMemoryContext();
  } catch (error) {
    console.error('[lunivo-agent] Failed to load memory context:', error);
    return FALLBACK_MEMORY_CONTEXT;
  }
}

function safeGetAvailableTools() {
  try {
    return getAvailableTools();
  } catch (error) {
    console.error('[lunivo-agent] Failed to load tools:', error);
    return [];
  }
}

async function createAgentContext(request: AgentRequest) {
  const safety = checkAgentRequestSafety(request);

  if (!safety.allowed) {
    throw new AgentRuntimeError(safety.reason ?? 'Agent request was rejected.', {
      code: 'agent_request_rejected',
      status: 400,
    });
  }

  const model = resolveModelProfile(request.modelMode ?? 'fast');
  const memory = await safeLoadMemoryContext();
  const tools = safeGetAvailableTools();

  return {
    conversationId: request.conversationId ?? null,
    memory,
    model,
    tools,
  };
}

async function safeRecordAgentRunStart(
  request: AgentRequest,
  context: Awaited<ReturnType<typeof createAgentContext>>,
): Promise<AgentRunId> {
  try {
    return await recordAgentRunStart(request, context);
  } catch (error) {
    console.error('[lunivo-agent] Failed to record run start:', error);
    return null;
  }
}

async function safeRecordAgentRunSuccess(runId: AgentRunId, response: AgentResponse) {
  try {
    await recordAgentRunSuccess(runId, response);
  } catch (error) {
    console.error('[lunivo-agent] Failed to record run success:', error);
  }
}

async function safeRecordAgentRunError(runId: AgentRunId, error: unknown) {
  try {
    await recordAgentRunError(runId, error);
  } catch (recordError) {
    console.error('[lunivo-agent] Failed to record run error:', recordError);
  }
}

function createOpenAIRequestBody({
  instructions,
  maxOutputTokens,
  messages,
  model,
  stream,
}: {
  instructions: string;
  maxOutputTokens: number;
  messages: AgentMessage[];
  model: string;
  stream?: boolean;
}) {
  const input = normalizeMessages(messages);

  if (input.length === 0) {
    throw new AgentRuntimeError('No valid messages were provided.', {
      code: 'empty_normalized_messages',
      status: 400,
    });
  }

  return {
    model,
    instructions,
    input,
    reasoning: {
      effort: 'minimal',
    },
    text: {
      verbosity: 'low',
    },
    max_output_tokens: maxOutputTokens,
    store: false,
    stream: Boolean(stream),
  };
}

function createAgentResponse({
  answer,
  request,
  context,
}: {
  answer: string;
  request: AgentRequest;
  context: Awaited<ReturnType<typeof createAgentContext>>;
}): AgentResponse {
  return {
    answer,
    conversationId: request.conversationId ?? null,
    model: context.model.model,
    modelMode: context.model.modelMode,
    provider: context.model.provider,
    usedTools: [],
  };
}

async function fetchOpenAIResponse({
  body,
  signal,
}: {
  body: unknown;
  signal: AbortSignal;
}) {
  return fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${getOpenAIKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function runAgent(request: AgentRequest): Promise<AgentResponse> {
  const context = await createAgentContext(request);
  const runId = await safeRecordAgentRunStart(request, context);
  const instructions = buildSystemPrompt(context.memory);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const body = createOpenAIRequestBody({
      instructions,
      maxOutputTokens: context.model.maxOutputTokens,
      messages: request.messages,
      model: context.model.model,
      stream: false,
    });

    const response = await fetchOpenAIResponse({
      body,
      signal: controller.signal,
    });

    const payload = await readJsonSafely(response) as OpenAIResponsePayload | null;

    if (!response.ok) {
      throw new AgentRuntimeError(
        getOpenAIErrorMessage(payload, 'OpenAI request failed.'),
        {
          code: 'openai_request_failed',
          status: response.status,
        },
      );
    }

    if (!payload) {
      throw new AgentRuntimeError('OpenAI returned an invalid response.', {
        code: 'invalid_openai_response',
        status: 502,
      });
    }

    const answer = extractAnswer(payload);

    if (!answer) {
      throw new AgentRuntimeError('OpenAI returned an empty answer.', {
        code: 'empty_openai_answer',
        status: 502,
      });
    }

    const agentResponse = createAgentResponse({
      answer,
      context,
      request,
    });

    await safeRecordAgentRunSuccess(runId, agentResponse);
    return agentResponse;
  } catch (error) {
    const normalizedError = normalizeThrownError(error, 'Lunivo agent request failed.');
    await safeRecordAgentRunError(runId, normalizedError);
    throw normalizedError;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function streamAgent(
  request: AgentRequest,
  onDelta: StreamDeltaHandler,
): Promise<AgentResponse> {
  const context = await createAgentContext(request);
  const runId = await safeRecordAgentRunStart(request, context);
  const instructions = buildSystemPrompt(context.memory);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  let answer = '';

  try {
    const body = createOpenAIRequestBody({
      instructions,
      maxOutputTokens: context.model.maxOutputTokens,
      messages: request.messages,
      model: context.model.model,
      stream: true,
    });

    const response = await fetchOpenAIResponse({
      body,
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      const payload = await readJsonSafely(response);
      throw new AgentRuntimeError(
        getOpenAIErrorMessage(payload, 'OpenAI stream request failed.'),
        {
          code: 'openai_stream_request_failed',
          status: response.status,
        },
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    async function processRawEvent(rawEvent: string) {
      const event = parseSseEvent(rawEvent);

      if (!event || !event.data || event.data === '[DONE]') {
        return;
      }

      let payload: OpenAIStreamChunk;

      try {
        payload = JSON.parse(event.data) as OpenAIStreamChunk;
      } catch {
        throw new AgentRuntimeError('OpenAI stream returned invalid JSON.', {
          code: 'invalid_openai_stream_json',
          status: 502,
        });
      }

      const delta = getStreamDelta(event, payload);

      if (!delta) {
        return;
      }

      answer += delta;
      await onDelta(delta);
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const rawEvents = buffer.split('\n\n');
      buffer = rawEvents.pop() ?? '';

      for (const rawEvent of rawEvents) {
        await processRawEvent(rawEvent);
      }
    }

    const trailingText = `${buffer}${decoder.decode()}`.trim();

    if (trailingText) {
      await processRawEvent(trailingText);
    }

    const cleanAnswer = answer.trim();

    if (!cleanAnswer) {
      throw new AgentRuntimeError('OpenAI stream returned an empty answer.', {
        code: 'empty_openai_stream_answer',
        status: 502,
      });
    }

    const agentResponse = createAgentResponse({
      answer: cleanAnswer,
      context,
      request,
    });

    await safeRecordAgentRunSuccess(runId, agentResponse);
    return agentResponse;
  } catch (error) {
    const normalizedError = normalizeThrownError(error, 'Lunivo stream request failed.');
    await safeRecordAgentRunError(runId, normalizedError);
    throw normalizedError;
  } finally {
    clearTimeout(timeoutId);
  }
}
