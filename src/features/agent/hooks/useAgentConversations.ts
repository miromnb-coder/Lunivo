import { useCallback, useEffect, useState } from 'react';

import {
  fetchConversations,
  getCurrentUserInitials,
} from '../services/conversationRepository';
import type { ConversationSummary } from '../types/conversation';

export function useAgentConversations() {
  const [avatarInitials, setAvatarInitials] = useState('MI');
  const [displayName] = useState('Miro');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  const refreshConversations = useCallback(async () => {
    try {
      const [nextInitials, nextConversations] = await Promise.all([
        getCurrentUserInitials(),
        fetchConversations(),
      ]);

      setAvatarInitials(nextInitials);
      setConversations(nextConversations);
    } catch {
      // Keep the menu usable even if history/profile loading fails.
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  return {
    avatarInitials,
    conversations,
    displayName,
    refreshConversations,
  };
}