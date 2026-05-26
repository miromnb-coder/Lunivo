import { useCallback, useEffect, useState } from 'react';

import {
  fetchConversations,
  getCurrentUserProfile,
} from '../services/conversationRepository';
import type { ConversationSummary } from '../types/conversation';

export function useAgentConversations() {
  const [avatarInitials, setAvatarInitials] = useState('MI');
  const [displayName, setDisplayName] = useState('Miro');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  const refreshConversations = useCallback(async () => {
    try {
      const [nextProfile, nextConversations] = await Promise.all([
        getCurrentUserProfile(),
        fetchConversations(),
      ]);

      setAvatarInitials(nextProfile.initials);
      setDisplayName(nextProfile.displayName);
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