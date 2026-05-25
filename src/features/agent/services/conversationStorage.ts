import { supabase } from '../../../lib/supabase';
import type { ChatMessage } from '../components/ChatMessageList';

type AgentModelMode = 'auto' | 'fast' | 'smart';

type ConversationIdInput = {
  conversationId?: string | null;
  firstMessage: string;
  modelMode?: AgentModelMode;
};

type SaveMessageInput = {
  content: string;
  conversationId: string;
  model?: string | null;
  role: ChatMessage['role'];
};

const MAX_TITLE_CHARS = 54;

function createConversationTitle(message: string) {
  const cleanMessage = message.replace(/\s+/g, ' ').trim();

  if (!cleanMessage) {
    return 'New chat';
  }

  if (cleanMessage.length <= MAX_TITLE_CHARS) {
    return cleanMessage;
  }

  return `${cleanMessage.slice(0, MAX_TITLE_CHARS - 1).trim()}…`;
}

async function getCurrentUserId() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check your Expo environment variables.');
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  const userId = data.user?.id;

  if (!userId) {
    throw new Error('You need to be signed in to save conversations.');
  }

  return userId;
}

export async function getOrCreateConversation({
  conversationId,
  firstMessage,
  modelMode = 'fast',
}: ConversationIdInput) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check your Expo environment variables.');
  }

  const userId = await getCurrentUserId();

  if (conversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data?.id) {
      return data.id as string;
    }
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: createConversationTitle(firstMessage),
      model_mode: modelMode,
      updated_at: now,
      last_message_at: now,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error('Conversation was not created.');
  }

  return data.id as string;
}

export async function saveUserMessage(input: Omit<SaveMessageInput, 'role'>) {
  return saveMessage({
    ...input,
    role: 'user',
  });
}

export async function saveAssistantMessage(input: Omit<SaveMessageInput, 'role'>) {
  return saveMessage({
    ...input,
    role: 'assistant',
  });
}

async function saveMessage({ content, conversationId, model, role }: SaveMessageInput) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check your Expo environment variables.');
  }

  const cleanContent = content.trim();

  if (!cleanContent) {
    return null;
  }

  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content: cleanContent,
      model: model ?? null,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id as string | undefined;
}

export async function touchConversationUpdatedAt(conversationId: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check your Expo environment variables.');
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('conversations')
    .update({
      updated_at: now,
      last_message_at: now,
    })
    .eq('id', conversationId);

  if (error) {
    throw new Error(error.message);
  }
}
