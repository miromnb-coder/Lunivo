import { useCallback, useEffect, useRef, useState } from 'react';

import { lunivoHaptics } from '../../../shared/haptics/lunivoHaptics';
import { agentConfig } from '../constants/agentConfig';
import { sendMessageToAgent, streamMessageToAgent } from '../services/agentClient';
import {
  fetchConversationMessages,
  getOrCreateConversation,
  saveAssistantMessage,
  saveUserMessage,
  touchConversationUpdatedAt,
} from '../services/conversationRepository';
import type { AgentChatMessage } from '../types/agent';
import type { LunivoAttachment } from '../types/attachment';

function createMessageId(role: AgentChatMessage['role']) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAgentErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return `I could not connect to Lunivo AI right now.\n\n${message}`;
}

type UseAgentChatInput = {
  onConversationChanged?: () => void;
  onHeroVisibilityChange?: (visible: boolean, duration?: number) => void;
  onBeforeChatReset?: () => void;
  onBeforeConversationSelect?: () => void;
  onBeforeSend?: () => void;
};

export function useAgentChat({
  onBeforeChatReset,
  onBeforeConversationSelect,
  onBeforeSend,
  onConversationChanged,
  onHeroVisibilityChange,
}: UseAgentChatInput = {}) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<LunivoAttachment[]>([]);
  const [streamScrollKey, setStreamScrollKey] = useState(0);
  const sendRunRef = useRef(0);
  const streamAbortControllerRef = useRef<AbortController | null>(null);

  const hasMessages = messages.length > 0 || isThinking;

  function addAttachments(attachments: LunivoAttachment[]) {
    setSelectedAttachments((currentAttachments) => {
      const existingIds = new Set(currentAttachments.map((attachment) => attachment.id));
      const nextAttachments = attachments.filter((attachment) => !existingIds.has(attachment.id));
      return [...currentAttachments, ...nextAttachments].slice(0, agentConfig.maxSelectedAttachments);
    });
  }

  function removeAttachment(attachmentId: string) {
    lunivoHaptics.selectConversation();
    setSelectedAttachments((currentAttachments) =>
      currentAttachments.filter((attachment) => attachment.id !== attachmentId),
    );
  }

  const startNewChat = useCallback(() => {
    sendRunRef.current += 1;
    streamAbortControllerRef.current?.abort();
    streamAbortControllerRef.current = null;
    onBeforeChatReset?.();
    setSelectedAttachments([]);
    setActiveConversationId(null);
    setMessage('');
    setMessages([]);
    setIsThinking(false);
    setStreamScrollKey(0);
    onHeroVisibilityChange?.(true, 180);
  }, [onBeforeChatReset, onHeroVisibilityChange]);

  const selectConversation = useCallback(
    async (conversationId: string) => {
      sendRunRef.current += 1;
      streamAbortControllerRef.current?.abort();
      streamAbortControllerRef.current = null;
      onBeforeConversationSelect?.();
      setSelectedAttachments([]);
      setActiveConversationId(conversationId);
      setMessage('');
      setIsThinking(false);
      onHeroVisibilityChange?.(false, 160);

      try {
        const nextMessages = await fetchConversationMessages(conversationId);
        setMessages(nextMessages);
      } catch (error) {
        lunivoHaptics.error();
        setMessages([
          {
            id: createMessageId('assistant'),
            role: 'assistant',
            content: createAgentErrorMessage(error),
          },
        ]);
      }
    },
    [onBeforeConversationSelect, onHeroVisibilityChange],
  );

  const sendMessage = useCallback(async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isThinking) {
      return;
    }

    onBeforeSend?.();
    const attachmentsForMessage = selectedAttachments;
    const messageForAI = attachmentsForMessage.length > 0
      ? `${trimmedMessage}\n\n${agentConfig.attachmentNote}`
      : trimmedMessage;
    lunivoHaptics.sendMessage();
    streamAbortControllerRef.current?.abort();

    const userMessage: AgentChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: trimmedMessage,
    };

    const assistantMessageId = createMessageId('assistant');
    const assistantMessage: AgentChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    const nextMessages = [...messages, userMessage];
    const messagesForAI = [...messages, { ...userMessage, content: messageForAI }];
    const runId = sendRunRef.current + 1;
    const abortController = new AbortController();
    let streamedAnswer = '';
    let savedConversationId = activeConversationId;
    let canSaveConversation = false;

    sendRunRef.current = runId;
    streamAbortControllerRef.current = abortController;

    setMessages([...nextMessages, assistantMessage]);
    setMessage('');
    setSelectedAttachments([]);
    setIsThinking(true);
    setStreamScrollKey((currentKey) => currentKey + 1);
    onHeroVisibilityChange?.(false, 160);

    try {
      try {
        savedConversationId = await getOrCreateConversation({
          conversationId: activeConversationId,
          firstMessage: trimmedMessage,
          modelMode: agentConfig.defaultModelMode,
        });

        if (sendRunRef.current !== runId) {
          return;
        }

        canSaveConversation = true;
        setActiveConversationId(savedConversationId);
        await saveUserMessage({
          content: trimmedMessage,
          conversationId: savedConversationId,
          model: agentConfig.defaultModel,
        });
        onConversationChanged?.();
      } catch {
        // AI should still work even if saving the conversation fails.
        canSaveConversation = false;
      }

      await streamMessageToAgent({
        conversationId: savedConversationId,
        messages: messagesForAI,
        signal: abortController.signal,
        onDelta: (delta) => {
          if (sendRunRef.current !== runId) {
            return;
          }

          streamedAnswer += delta;
          setIsThinking(false);
          setMessages((currentMessages) =>
            currentMessages.map((currentMessage) =>
              currentMessage.id === assistantMessageId
                ? { ...currentMessage, content: `${currentMessage.content}${delta}` }
                : currentMessage,
            ),
          );
          setStreamScrollKey((currentKey) => currentKey + 1);
        },
      });

      if (sendRunRef.current !== runId) {
        return;
      }

      if (!streamedAnswer.trim()) {
        throw new Error('Lunivo stream returned an empty answer.');
      }

      lunivoHaptics.messageComplete();

      if (canSaveConversation && savedConversationId) {
        try {
          await saveAssistantMessage({
            content: streamedAnswer,
            conversationId: savedConversationId,
            model: agentConfig.defaultModel,
          });
          await touchConversationUpdatedAt(savedConversationId);
          onConversationChanged?.();
        } catch {
          // Keep the finished AI answer visible even if history saving fails.
        }
      }
    } catch (streamError) {
      if (sendRunRef.current !== runId || abortController.signal.aborted) {
        return;
      }

      try {
        const { answer, conversationId } = await sendMessageToAgent({
          conversationId: savedConversationId,
          messages: messagesForAI,
          modelMode: agentConfig.defaultModelMode,
        });

        if (sendRunRef.current !== runId) {
          return;
        }

        if (conversationId) {
          savedConversationId = conversationId;
          setActiveConversationId(conversationId);
        }

        setMessages((currentMessages) =>
          currentMessages.map((currentMessage) =>
            currentMessage.id === assistantMessageId
              ? { ...currentMessage, content: answer }
              : currentMessage,
          ),
        );
        setStreamScrollKey((currentKey) => currentKey + 1);
        lunivoHaptics.messageComplete();

        if (canSaveConversation && savedConversationId) {
          try {
            await saveAssistantMessage({
              content: answer,
              conversationId: savedConversationId,
              model: agentConfig.defaultModel,
            });
            await touchConversationUpdatedAt(savedConversationId);
          } catch {
            // Keep the fallback answer visible even if history saving fails.
          }
        }

        onConversationChanged?.();
      } catch (fallbackError) {
        if (sendRunRef.current !== runId) {
          return;
        }

        lunivoHaptics.error();
        setMessages((currentMessages) =>
          currentMessages.map((currentMessage) =>
            currentMessage.id === assistantMessageId
              ? { ...currentMessage, content: createAgentErrorMessage(fallbackError) }
              : currentMessage,
          ),
        );
      }
    } finally {
      if (sendRunRef.current === runId) {
        streamAbortControllerRef.current = null;
        setIsThinking(false);
      }
    }
  }, [activeConversationId, isThinking, message, messages, onBeforeSend, onConversationChanged, onHeroVisibilityChange, selectedAttachments]);

  useEffect(() => {
    return () => {
      sendRunRef.current += 1;
      streamAbortControllerRef.current?.abort();
    };
  }, []);

  return {
    activeConversationId,
    addAttachments,
    hasMessages,
    isThinking,
    message,
    messages,
    removeAttachment,
    selectedAttachments,
    selectConversation,
    sendMessage,
    setMessage,
    startNewChat,
    streamScrollKey,
  };
}
