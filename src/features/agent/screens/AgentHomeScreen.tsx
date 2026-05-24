import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { HeroMessage } from '../components/HeroMessage';
import { QuickActions } from '../components/QuickActions';
import { agentTheme } from '../constants/agentTheme';

const CLOSED_COMPOSER_BOTTOM = 38;
const KEYBOARD_GAP = 8;
const MESSAGE_LIST_BOTTOM_GAP = 8;
const MESSAGE_LIST_TOP_INSET = 28;
const TEMPORARY_RESPONSE_DELAY_MS = 900;

export function AgentHomeScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [composerHeight, setComposerHeight] = useState(66);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composerBottom = useRef(new Animated.Value(CLOSED_COMPOSER_BOTTOM)).current;
  const heroOpacity = useRef(new Animated.Value(1)).current;
  const heroTranslateY = useRef(new Animated.Value(0)).current;

  const hasMessages = messages.length > 0 || isThinking;
  const messageListBottomInset = useMemo(
    () => composerHeight + MESSAGE_LIST_BOTTOM_GAP,
    [composerHeight],
  );

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

  function handleSend() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isThinking) {
      return;
    }

    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${Date.now()}-user`,
        role: 'user',
        content: trimmedMessage,
      },
    ]);
    setMessage('');
    setIsThinking(true);
    animateHero(false, 160);

    responseTimeoutRef.current = setTimeout(() => {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content:
            'I can help with that. Soon this will be connected to the real Lunivo AI study agent.',
        },
      ]);
      setIsThinking(false);
      responseTimeoutRef.current = null;
    }, TEMPORARY_RESPONSE_DELAY_MS);
  }

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
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
    <SafeAreaView style={styles.screen}>
      {keyboardOpen ? <Pressable onPress={dismissComposer} style={styles.dismissLayer} /> : null}

      <View style={styles.content}>
        <AgentHeader appName="Lunivo" points={263} />

        {hasMessages ? (
          <ChatMessageList
            messages={messages}
            bottomInset={messageListBottomInset}
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
