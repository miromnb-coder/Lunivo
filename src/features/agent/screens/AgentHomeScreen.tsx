import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, SafeAreaView, StyleSheet, View } from 'react-native';

import { AgentHeader } from '../components/AgentHeader';
import { ChatComposer } from '../components/ChatComposer';
import { HeroMessage } from '../components/HeroMessage';
import { QuickActions } from '../components/QuickActions';
import { agentTheme } from '../constants/agentTheme';

const CLOSED_COMPOSER_BOTTOM = 44;
const KEYBOARD_GAP = 18;

export function AgentHomeScreen() {
  const [message, setMessage] = useState('');
  const [composerHeight, setComposerHeight] = useState(72);
  const composerBottom = useRef(new Animated.Value(CLOSED_COMPOSER_BOTTOM)).current;
  const heroOpacity = useRef(new Animated.Value(1)).current;
  const heroTranslateY = useRef(new Animated.Value(0)).current;

  function handleSend() {
    if (!message.trim()) {
      return;
    }

    console.log('Send message:', message.trim());
    setMessage('');
  }

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextBottom = Math.max(CLOSED_COMPOSER_BOTTOM, event.endCoordinates.height + KEYBOARD_GAP);

      Animated.parallel([
        Animated.timing(composerBottom, {
          toValue: nextBottom,
          duration: event.duration ?? 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(heroOpacity, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroTranslateY, {
          toValue: -18,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      Animated.parallel([
        Animated.timing(composerBottom, {
          toValue: CLOSED_COMPOSER_BOTTOM,
          duration: event.duration ?? 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroTranslateY, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [composerBottom, heroOpacity, heroTranslateY]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <AgentHeader appName="Lunivo" points={263} />
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.heroContent,
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
  content: {
    flex: 1,
    paddingHorizontal: agentTheme.spacing.screen,
  },
  heroContent: {
    flex: 1,
  },
  composerWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
  },
});
