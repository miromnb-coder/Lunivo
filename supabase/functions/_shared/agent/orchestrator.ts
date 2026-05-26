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

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_MESSAGES_TO_SEND = 24;

type OpenAIChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

type OpenAIStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
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
      content: message.content.trim(),
    }));
}

function createOpenAIMessages(systemPrompt: string, messages: AgentMessage[]): OpenAIChatMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...normalizeMessages(messages),
  ];
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

async function callOpenAIChat(request: AgentRequest): Promise<AgentResponse> {
  const context = await createAgentContext(request);
  const runId = await recordAgentRunStart(request, context);
  const systemPrompt = buildSystemPrompt(context.memory);

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getOpenAIKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: context.model.model,
        messages: createOpenAIMessages(systemPrompt, request.messages),
      }),
    });

    const payload = await response.json() as OpenAIChatCompletionResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message ?? 'OpenAI request failed.');
    }

    const answer = payload.choices?.[0]?.message?.content?.trim();

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
    await recordAgentRunError(runId, error);
    throw error;
  }
}

async function callOpenAIChatStream(request: AgentRequest, onDelta: StreamDeltaHandler): Promise<AgentResponse> {
  const context = await createAgentContext(request);
  const runId = await recordAgentRunStart(request, context);
  const systemPrompt = buildSystemPrompt(context.memory);
  let answer = '';

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getOpenAIKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: context.model.model,
        messages: createOpenAIMessages(systemPrompt, request.messages),
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => null) as OpenAIChatCompletionResponse | null;
      throw new Error(payload?.error?.message ?? 'OpenAI stream request failed.');
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

          if (payload.error?.message) {
            throw new Error(payload.error.message);
          }

          const delta = payload.choices?.[0]?.delta?.content ?? '';

          if (delta) {
            answer += delta;
            await onDelta(delta);
          }
        }
      }
    }

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
    await recordAgentRunError(runId, error);
    throw error;
  }
}

export async function runAgent(request: AgentRequest): Promise<AgentResponse> {
  return callOpenAIChat(request);
}

export async function streamAgent(request: AgentRequest, onDelta: StreamDeltaHandler): Promise<AgentResponse> {
  return callOpenAIChatStream(request, onDelta);
}
