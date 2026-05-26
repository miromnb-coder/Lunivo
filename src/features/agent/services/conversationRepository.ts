import {
  fetchConversationMessages as fetchStoredConversationMessages,
  fetchConversations as fetchStoredConversations,
  getCurrentUserInitials as getStoredCurrentUserInitials,
} from './chatHistory';
import {
  getOrCreateConversation as getOrCreateStoredConversation,
  saveAssistantMessage as saveStoredAssistantMessage,
  saveUserMessage as saveStoredUserMessage,
  touchConversationUpdatedAt as touchStoredConversationUpdatedAt,
} from './conversationStorage';
import type { AgentChatMessage, AgentModelMode } from '../types/agent';
import type { ConversationSummary } from '../types/conversation';

export type ConversationIdInput = {
  conversationId?: string | null;
  firstMessage: string;
  modelMode?: AgentModelMode;
};

export type SaveConversationMessageInput = {
  content: string;
  conversationId: string;
  model?: string | null;
};

export async function getCurrentUserInitials() {
  return getStoredCurrentUserInitials();
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  return fetchStoredConversations();
}

export async function fetchConversationMessages(conversationId: string): Promise<AgentChatMessage[]> {
  return fetchStoredConversationMessages(conversationId);
}

export async function getOrCreateConversation(input: ConversationIdInput) {
  return getOrCreateStoredConversation(input);
}

export async function saveUserMessage(input: SaveConversationMessageInput) {
  return saveStoredUserMessage(input);
}

export async function saveAssistantMessage(input: SaveConversationMessageInput) {
  return saveStoredAssistantMessage(input);
}

export async function touchConversationUpdatedAt(conversationId: string) {
  return touchStoredConversationUpdatedAt(conversationId);
}
