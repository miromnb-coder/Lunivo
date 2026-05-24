import { supabase } from '../../../lib/supabase';
import type { ChatMessage } from '../components/ChatMessageList';

type AgentModelMode = 'auto' | 'fast' | 'smart';

type LunivoChatResponse = {
  answer?: string;
  conversationId?: string;
  error?: string;
  detail?: string;
  model?: string;
  modelMode?: AgentModelMode;
  persistenceError?: string | null;
  provider?: string;
};

type SendMessageToAgentInput = {
  conversationId?: string | null;
  messages: ChatMessage[];
  modelMode?: AgentModelMode;
};

async function getFunctionErrorMessage(error: unknown) {
  const fallback = error instanceof Error ? error.message : 'Edge Function request failed.';
  const context = (error as { context?: { json?: () => Promise<unknown>; text?: () => Promise<string> } })?.context;

  if (!context) {
    return fallback;
  }

  try {
    const payload = await context.json?.();

    if (payload && typeof payload === 'object') {
      const body = payload as { detail?: unknown; error?: unknown; message?: unknown };
      const detail = typeof body.detail === 'string' ? body.detail : null;
      const message = typeof body.error === 'string' ? body.error : typeof body.message === 'string' ? body.message : null;

      return detail ?? message ?? fallback;
    }
  } catch {
    // Fall back to text below.
  }

  try {
    const text = await context.text?.();
    return text?.trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function sendMessageToAgent({
  conversationId,
  messages,
  modelMode = 'auto',
}: SendMessageToAgentInput) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check your Expo environment variables.');
  }

  const { data, error } = await supabase.functions.invoke<LunivoChatResponse>('lunivo-chat', {
    body: {
      conversationId,
      modelMode,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (data?.error) {
    throw new Error(data.detail ?? data.error);
  }

  const answer = data?.answer?.trim();

  if (!answer) {
    throw new Error('Lunivo returned an empty answer. Try sending the question again.');
  }

  return {
    answer,
    conversationId: data?.conversationId,
    model: data?.model,
    modelMode: data?.modelMode,
    persistenceError: data?.persistenceError,
    provider: data?.provider,
  };
}
