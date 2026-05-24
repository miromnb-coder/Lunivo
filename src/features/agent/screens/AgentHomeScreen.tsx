import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';

import { AgentHeader } from '../components/AgentHeader';
import { ChatComposer } from '../components/ChatComposer';
import { ChatMessageList, type ChatMessage } from '../components/ChatMessageList';
import { DrawerShell } from '../components/DrawerShell';
import { HeroMessage } from '../components/HeroMessage';
import { QuickActions } from '../components/QuickActions';
import { agentTheme } from '../constants/agentTheme';
import {
  fetchConversationMessages,
  fetchConversations,
  getCurrentUserInitials,
  type ConversationSummary,
} from '../services/chatHistory';
import { sendMessageToAgent } from '../services/sendMessageToAgent';
import { streamMessageToAgent } from '../services/streamMessageToAgent';

const CLOSED_COMPOSER_BOTTOM = 38;
const KEYBOARD_GAP = 8;
const CLOSED_MESSAGE_BOTTOM_GAP = 260;
const KEYBOARD_MESSAGE_BOTTOM_GAP = 34;
const MESSAGE_LIST_TOP_INSET = 28;
const DEFAULT_COMPOSER_HEIGHT = 66;

function createMessageId(role: ChatMessage['role']) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAgentErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return `I could not connect to Lunivo AI right now.\n\n${message}`;
}

export function AgentHomeScreen() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [avatarInitials, setAvatarInitials] = useState('MS');
  const [composerHeight, setComposerHeight] = useState(DEFAULT_COMPOSER_HEIGHT);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [streamScrollKey, setStreamScrollKey] = useState(0);
  const sendRunRef = useRef(0);
  const streamAbortControllerRef = useRef<AbortController | null>(null);
  const composerBottom = useRef(new Animated.Value(CLOSED_COMPOSER_BOTTOM)).current;
  const heroOpacity = useRef(new Animated.Value(1)).current;
  const heroTranslateY = useRef(new Animated.Value(0)).current;

  const hasMessages = messages.length > 0 || isThinking;
  const messageListBottomInset = keyboardOpen
    ? keyboardHeight + KEYBOARD_GAP + composerHeight + KEYBOARD_MESSAGE_BOTTOM_GAP
    : CLOSED_MESSAGE_BOTTOM_GAP;

  const loadMenuData = useCallback(async () => {
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

  const animateHero = useCallback(
    (visible: boolean, duration = 220) => {
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: visible ? 1 : 0,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroTranslateY, {
          toValue: visible ? 0 : -18,
          duration: duration + 20,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [heroOpacity, heroTranslateY],
  );

  const closeComposerPosition = useCallback(
    (duration = 220) => {
      setKeyboardOpen(false);
      setKeyboardHeight(0);

      Animated.timing(composerBottom, {
        toValue: CLOSED_COMPOSER_BOTTOM,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      animateHero(!hasMessages, duration);
    },
    [animateHero, composerBottom, hasMessages],
  );

  function dismissComposer() {
    Keyboard.dismiss();
    closeComposerPosition(180);
  }

  function handleComposerBlur() {
    closeComposerPosition(180);
  }

  const handleNewChat = useCallback(() => {
    sendRunRef.current += 1;
    streamAbortControllerRef.current?.abort();
    streamAbortControllerRef.current = null;
    Keyboard.dismiss();
    setActiveConversationId(null);
    setMessage('');
    setMessages([]);
    setIsThinking(false);
    setStreamScrollKey(0);
    animateHero(true, 180);
  }, [animateHero]);

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      sendRunRef.current += 1;
      streamAbortControllerRef.current?.abort();
      streamAbortControllerRef.current = null;
      Keyboard.dismiss();
      setActiveConversationId(conversationId);
      setMessage('');
      setIsThinking(false);
      animateHero(false, 160);

      try {
        const nextMessages = await fetchConversationMessages(conversationId);
        setMessages(nextMessages);
      } catch (error) {
        setMessages([
          {
            id: createMessageId('assistant'),
            role: 'assistant',
            content: createAgentErrorMessage(error),
          },
        ]);
      }
    },
    [animateHero],
  );

  async function handleSend() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isThinking) {
      return;
    }

    streamAbortControllerRef.current?.abort();

    const userMessage: ChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: trimmedMessage,
    };

    const assistantMessageId = createMessageId('assistant');
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    const nextMessages = [...messages, userMessage];
    const runId = sendRunRef.current + 1;
    const abortController = new AbortController();
    let streamedAnswer = '';

    sendRunRef.current = runId;
    streamAbortControllerRef.current = abortController;

    setMessages([...nextMessages, assistantMessage]);
    setMessage('');
    setIsThinking(true);
    setStreamScrollKey((currentKey) => currentKey + 1);
    animateHero(false, 160);

    try {
      await streamMessageToAgent({
        conversationId: activeConversationId,
        messages: nextMessages,
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

      loadMenuData();
    } catch (streamError) {
      if (sendRunRef.current !== runId || abortController.signal.aborted) {
        return;
      }

      try {
        const { answer, conversationId } = await sendMessageToAgent({
          conversationId: activeConversationId,
          messages: nextMessages,
          modelMode: 'fast',
        });

        if (sendRunRef.current !== runId) {
          return;
        }

        if (conversationId) {
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
        loadMenuData();
      } catch (fallbackError) {
        if (sendRunRef.current !== runId) {
          return;
        }

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
  }

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  useEffect(() => {
    return () => {
      sendRunRef.current += 1;
      streamAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextKeyboardHeight = event.endCoordinates.height;
      setKeyboardOpen(true);
      setKeyboardHeight(nextKeyboardHeight);
      const nextBottom = Math.max(CLOSED_COMPOSER_BOTTOM, nextKeyboardHeight + KEYBOARD_GAP);

      Animated.timing(composerBottom, {
        toValue: nextBottom,
        duration: event.duration ?? 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      animateHero(false, 160);
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      closeComposerPosition(event.duration ?? 220);
    });

    const didHideSub = Keyboard.addListener('keyboardDidHide', () => {
      closeComposerPosition(160);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      didHideSub.remove();
    };
  }, [animateHero, closeComposerPosition, composerBottom]);

  useEffect(() => {
    if (keyboardOpen) {
      return;
    }

    animateHero(!hasMessages, 220);
  }, [animateHero, hasMessages, keyboardOpen]);

  return (
    <DrawerShell
      avatarInitials={avatarInitials}
      conversations={conversations}
      onNewChat={handleNewChat}
      onSelectConversation={handleSelectConversation}
    >
      {({ openDrawer }) => (
        <SafeAreaView style={styles.screen}>
          {keyboardOpen ? <Pressable onPress={dismissComposer} style={styles.dismissLayer} /> : null}

          <View style={styles.content}>
            <AgentHeader appName="Lunivo" onMenuPress={openDrawer} points={263} />

            {hasMessages ? (
              <ChatMessageList
                messages={messages}
                bottomInset={messageListBottomInset}
                scrollKey={streamScrollKey}
                thinking={isThinking}
                topInset={MESSAGE_LIST_TOP_INSET}
              />
            ) : null}

            <Animated.View
              pointerEvents={hasMessages ? 'none' : 'box-none'}
              style={[
                hasMessages ? styles.heroContentOverlay : styles.startContent,
                {
                  opacity: heroOpacity,
                  transform: [{ translateY: heroTranslateY }],
                },
              ]}
            >
              <HeroMessage />
              <QuickActions />
            </Animated.View>
          </View>

          <Animated.View
            pointerEvents="box-none"
            style={[styles.composerWrap, { bottom: composerBottom }]}
          >
            <ChatComposer
              value={message}
              onBlur={handleComposerBlur}
              onChangeText={setMessage}
              onHeightChange={setComposerHeight}
              onSend={handleSend}
            />
          </Animated.View>
        </SafeAreaView>
      )}
    </DrawerShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: agentTheme.colors.background,
  },
  dismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    zIndex: 0,
  },
  startContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 104,
  },
  heroContentOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 18,
    paddingTop: 104,
  },
  composerWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 2,
  },
});