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

function extractErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const body = payload as { detail?: unknown; error?: unknown; message?: unknown };
  const detail = typeof body.detail === 'string' ? body.detail : null;
  const message = typeof body.error === 'string' ? body.error : typeof body.message === 'string' ? body.message : null;

  return detail ?? message ?? fallback;
}

function handleStreamEvent(event: StreamEvent, onDelta: (delta: string) => void) {
  if (event.eventName === 'delta') {
    const payload = JSON.parse(event.data) as { delta?: unknown };
    const delta = typeof payload.delta === 'string' ? payload.delta : '';

    if (delta) {
      onDelta(delta);
      return delta;
    }
  }

  if (event.eventName === 'error') {
    const payload = JSON.parse(event.data) as { message?: unknown };
    throw new Error(typeof payload.message === 'string' ? payload.message : 'Lunivo stream failed.');
  }

  return '';
}

function readStreamWithXHR({
  accessToken,
  body,
  onDelta,
  signal,
  supabasePublishableKey,
  url,
}: {
  accessToken: string;
  body: string;
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
  supabasePublishableKey: string;
  url: string;
}) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let processedLength = 0;
    let buffer = '';
    let answer = '';
    let settled = false;

    function finishError(error: unknown) {
      if (settled) {
        return;
      }

      settled = true;
      reject(error instanceof Error ? error : new Error(String(error)));
    }

    function processChunk(chunk: string) {
      buffer += chunk;
      const rawEvents = buffer.split('\n\n');
      buffer = rawEvents.pop() ?? '';

      rawEvents.forEach((rawEvent) => {
        const event = parseStreamEvent(rawEvent);

        if (!event) {
          return;
        }

        try {
          const delta = handleStreamEvent(event, onDelta);
          answer += delta;
        } catch (error) {
          finishError(error);
        }
      });
    }

    const abortHandler = () => {
      xhr.abort();
      finishError(new Error('Stream was cancelled.'));
    };

    signal?.addEventListener('abort', abortHandler, { once: true });

    xhr.open('POST', url);
    xhr.setRequestHeader('apikey', supabasePublishableKey);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'text/event-stream');

    xhr.onreadystatechange = () => {
      if (settled) {
        return;
      }

      if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
        const nextText = xhr.responseText.slice(processedLength);
        processedLength = xhr.responseText.length;

        if (nextText) {
          processChunk(nextText);
        }
      }

      if (xhr.readyState === XMLHttpRequest.DONE && !settled) {
        signal?.removeEventListener('abort', abortHandler);

        if (buffer.trim()) {
          processChunk('\n\n');
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          try {
            const payload = JSON.parse(xhr.responseText);
            finishError(new Error(extractErrorMessage(payload, 'Lunivo stream request failed.')));
          } catch {
            finishError(new Error(xhr.responseText || 'Lunivo stream request failed.'));
          }
          return;
        }

        settled = true;
        resolve(answer);
      }
    };

    xhr.onerror = () => {
      signal?.removeEventListener('abort', abortHandler);
      finishError(new Error('Lunivo stream network request failed.'));
    };

    xhr.ontimeout = () => {
      signal?.removeEventListener('abort', abortHandler);
      finishError(new Error('Lunivo stream request timed out.'));
    };

    xhr.send(body);
  });
}

export async function streamMessageToAgent({
  conversationId,
  messages,
  onDelta,
  signal,
}: StreamMessageToAgentInput) {
  const { supabasePublishableKey, supabaseUrl } = getSupabaseConfig();
  const accessToken = await getAccessToken();
  const body = JSON.stringify({
    conversationId,
    modelMode: LUNIVO_STREAM_MODEL_MODE,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  });
  const url = `${supabaseUrl}/functions/v1/${LUNIVO_STREAM_FUNCTION_NAME}`;
  const answer = await readStreamWithXHR({
    accessToken,
    body,
    onDelta,
    signal,
    supabasePublishableKey,
    url,
  });

  return {
    answer,
    model: 'gpt-5-nano',
    modelMode: LUNIVO_STREAM_MODEL_MODE,
    provider: 'openai',
  };
}
