import { supabase } from '../../../lib/supabase';
import type { ChatMessage } from '../components/ChatMessageList';

type AgentModelMode = 'auto' | 'fast' | 'smart';

type LunivoChatResponse = {
  answer?: string;
  error?: string;
  detail?: string;
  model?: string;
  modelMode?: AgentModelMode;
  provider?: string;
};

type SendMessageToAgentInput = {
  messages: ChatMessage[];
  modelMode?: AgentModelMode;
};

export async function sendMessageToAgent({
  messages,
  modelMode = 'auto',
}: SendMessageToAgentInput) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check your Expo environment variables.');
  }

  const { data, error } = await supabase.functions.invoke<LunivoChatResponse>('lunivo-chat', {
    body: {
      modelMode,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.error) {
    throw new Error(data.detail ?? data.error);
  }

  const answer = data?.answer?.trim();

  if (!answer) {
    throw new Error('Lunivo returned an empty answer.');
  }

  return {
    answer,
    model: data?.model,
    modelMode: data?.modelMode,
    provider: data?.provider,
  };
}
