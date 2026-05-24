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
import { sendMessageToAgent } from '../services/sendMessageToAgent';

const CLOSED_COMPOSER_BOTTOM = 38;
const KEYBOARD_GAP = 8;
const MESSAGE_LIST_BOTTOM_INSET = 78;
const MESSAGE_LIST_TOP_INSET = 28;

function createMessageId(role: ChatMessage['role']) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAgentErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return `I could not connect to Lunivo AI right now.\n\n${message}`;
}

export function AgentHomeScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const sendRunRef = useRef(0);
  const composerBottom = useRef(new Animated.Value(CLOSED_COMPOSER_BOTTOM)).current;
  const heroOpacity = useRef(new Animated.Value(1)).current;
  const heroTranslateY = useRef(new Animated.Value(0)).current;

  const hasMessages = messages.length > 0 || isThinking;

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

  async function handleSend() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isThinking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: trimmedMessage,
    };

    const nextMessages = [...messages, userMessage];
    const runId = sendRunRef.current + 1;
    sendRunRef.current = runId;

    setMessages(nextMessages);
    setMessage('');
    setIsThinking(true);
    animateHero(false, 160);

    try {
      const { answer } = await sendMessageToAgent({
        messages: nextMessages,
        modelMode: 'auto',
      });

      if (sendRunRef.current !== runId) {
        return;
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId('assistant'),
          role: 'assistant',
          content: answer,
        },
      ]);
    } catch (error) {
      if (sendRunRef.current !== runId) {
        return;
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId('assistant'),
          role: 'assistant',
          content: createAgentErrorMessage(error),
        },
      ]);
    } finally {
      if (sendRunRef.current === runId) {
        setIsThinking(false);
      }
    }
  }

  useEffect(() => {
    return () => {
      sendRunRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardOpen(true);
      const nextBottom = Math.max(CLOSED_COMPOSER_BOTTOM, event.endCoordinates.height + KEYBOARD_GAP);

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
    <DrawerShell>
      {({ openDrawer }) => (
        <SafeAreaView style={styles.screen}>
          {keyboardOpen ? <Pressable onPress={dismissComposer} style={styles.dismissLayer} /> : null}

          <View style={styles.content}>
            <AgentHeader appName="Lunivo" onMenuPress={openDrawer} points={263} />

            {hasMessages ? (
              <ChatMessageList
                messages={messages}
                bottomInset={MESSAGE_LIST_BOTTOM_INSET}
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