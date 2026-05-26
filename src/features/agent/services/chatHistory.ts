import { supabase } from '../../../lib/supabase';
import type { AgentChatMessage } from '../types/agent';
import type { ConversationSummary } from '../types/conversation';

type ConversationRow = {
  id: string;
  title: string | null;
  updated_at: string | null;
  last_message_at: string | null;
};

type MessageRow = {
  id: string;
  role: AgentChatMessage['role'];
  content: string;
};

function getTextInitials(value?: string | null) {
  const cleanValue = value?.trim();

  if (!cleanValue) {
    return null;
  }

  const emailName = cleanValue.includes('@') ? cleanValue.split('@')[0] : cleanValue;
  const parts = emailName
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0]?.slice(0, 2).toUpperCase() ?? null;
}

export async function getCurrentUserInitials() {
  if (!supabase) {
    return 'MS';
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return 'MS';
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name,email')
    .eq('id', user.id)
    .maybeSingle();

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const metadataName =
    typeof metadata?.display_name === 'string'
      ? metadata.display_name
      : typeof metadata?.full_name === 'string'
        ? metadata.full_name
        : typeof metadata?.name === 'string'
          ? metadata.name
          : null;

  return (
    getTextInitials(profile?.display_name) ??
    getTextInitials(metadataName) ??
    getTextInitials(profile?.email) ??
    getTextInitials(user.email) ??
    'MS'
  );
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('id,title,updated_at,last_message_at')
    .order('last_message_at', { ascending: false })
    .limit(30);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ConversationRow[]).map((conversation) => ({
    id: conversation.id,
    title: conversation.title?.trim() || 'New chat',
    updatedAt: conversation.last_message_at ?? conversation.updated_at ?? '',
  }));
}

export async function fetchConversationMessages(conversationId: string): Promise<AgentChatMessage[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id,role,content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as MessageRow[]).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
  }));
}
