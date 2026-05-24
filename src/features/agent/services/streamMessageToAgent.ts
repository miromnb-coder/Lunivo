import { supabase } from '../../../lib/supabase';
import type { ChatMessage } from '../components/ChatMessageList';

type AgentModelMode = 'auto' | 'fast' | 'smart';

type StreamMessageToAgentInput = {
  conversationId?: string | null;
  messages: ChatMessage[];
  modelMode?: AgentModelMode;
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
};

type StreamEvent = {
  data: string;
  eventName: string;
};

const LUNIVO_STREAM_FUNCTION_NAME = 'lunivo-chat-stream';
const LUNIVO_STREAM_MODEL_MODE: AgentModelMode = 'fast';

function getSupabaseConfig() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Supabase is not configured. Check your Expo environment variables.');
  }

  return {
    supabasePublishableKey,
    supabaseUrl,
  };
}

async function getAccessToken() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check your Expo environment variables.');
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error('You need to be signed in to use Lunivo AI.');
  }

  return accessToken;
}

function parseStreamEvent(rawEvent: string): StreamEvent | null {
  const cleanEvent = rawEvent.replace(/\r/g, '').trim();

  if (!cleanEvent) {
    return null;
  }

  let eventName = 'message';
  const dataLines: string[] = [];

  cleanEvent.split('\n').forEach((line) => {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
      return;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  });

  return {
    data: dataLines.join('\n'),
    eventName,
  };
}

function getReadableStream(response: Response) {
  const body = response.body as unknown as {
    getReader?: () => {
      read: () => Promise<{ done: boolean; value?: Uint8Array }>;
      releaseLock?: () => void;
    };
  } | null;

  return body?.getReader ? body : null;
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const body = payload as { detail?: unknown; error?: unknown; message?: unknown };
  const detail = typeof body.detail === 'string' ? body.detail : null;
  const message = typeof body.error === 'string' ? body.error : typeof body.message === 'string' ? body.message : null;

  return detail ?? message ?? fallback;
}

async function getResponseError(response: Response) {
  try {
    const payload = await response.json();
    return extractErrorMessage(payload, 'Lunivo stream request failed.');
  } catch {
    try {
      return (await response.text()).trim() || 'Lunivo stream request failed.';
    } catch {
      return 'Lunivo stream request failed.';
    }
  }
}

export async function streamMessageToAgent({
  conversationId,
  messages,
  onDelta,
  signal,
}: StreamMessageToAgentInput) {
  const { supabasePublishableKey, supabaseUrl } = getSupabaseConfig();
  const accessToken = await getAccessToken();
  const response = await fetch(`${supabaseUrl}/functions/v1/${LUNIVO_STREAM_FUNCTION_NAME}`, {
    method: 'POST',
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({
      conversationId,
      modelMode: LUNIVO_STREAM_MODEL_MODE,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(await getResponseError(response));
  }

  const stream = getReadableStream(response);

  if (!stream) {
    throw new Error('Streaming is not available in this runtime.');
  }

  const reader = stream.getReader!();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      buffer += decoder.decode(value, { stream: true });
      const rawEvents = buffer.split('\n\n');
      buffer = rawEvents.pop() ?? '';

      rawEvents.forEach((rawEvent) => {
        const event = parseStreamEvent(rawEvent);

        if (!event) {
          return;
        }

        if (event.eventName === 'delta') {
          try {
            const payload = JSON.parse(event.data) as { delta?: unknown };
            const delta = typeof payload.delta === 'string' ? payload.delta : '';

            if (delta) {
              answer += delta;
              onDelta(delta);
            }
          } catch {
            // Ignore malformed stream chunks.
          }
        }

        if (event.eventName === 'error') {
          try {
            const payload = JSON.parse(event.data) as { message?: unknown };
            throw new Error(typeof payload.message === 'string' ? payload.message : 'Lunivo stream failed.');
          } catch (error) {
            if (error instanceof Error) {
              throw error;
            }
          }
        }
      });
    }

    if (buffer.trim()) {
      const event = parseStreamEvent(buffer);

      if (event?.eventName === 'delta') {
        const payload = JSON.parse(event.data) as { delta?: unknown };
        const delta = typeof payload.delta === 'string' ? payload.delta : '';

        if (delta) {
          answer += delta;
          onDelta(delta);
        }
      }
    }
  } finally {
    reader.releaseLock?.();
  }

  return {
    answer,
    model: 'gpt-5-nano',
    modelMode: LUNIVO_STREAM_MODEL_MODE,
    provider: 'openai',
  };
}
