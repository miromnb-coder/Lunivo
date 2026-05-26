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

import { lunivoHaptics } from '../../../shared/haptics/lunivoHaptics';
import { AgentHeader } from '../components/AgentHeader';
import { ChatComposer } from '../components/ChatComposer';
import { ChatMessageList } from '../components/ChatMessageList';
import { DrawerShell } from '../components/DrawerShell';
import { HeroMessage } from '../components/HeroMessage';
import { LunivoPlusSheet } from '../components/LunivoPlusSheet';
import { QuickActions } from '../components/QuickActions';
import { agentLayoutConfig } from '../constants/agentConfig';
import { agentTheme } from '../constants/agentTheme';
import { useAgentChat } from '../hooks/useAgentChat';
import { useAgentConversations } from '../hooks/useAgentConversations';
import type { LunivoAttachment } from '../types/attachment';
import { LibraryScreen } from './LibraryScreen';

const CLOSED_COMPOSER_BOTTOM = agentLayoutConfig.closedComposerBottom;
const KEYBOARD_GAP = agentLayoutConfig.keyboardGap;
const CLOSED_MESSAGE_BOTTOM_GAP = agentLayoutConfig.closedMessageBottomGap;
const KEYBOARD_MESSAGE_BOTTOM_GAP = agentLayoutConfig.keyboardMessageBottomGap;
const MESSAGE_LIST_TOP_INSET = agentLayoutConfig.messageListTopInset;
const DEFAULT_COMPOSER_HEIGHT = agentLayoutConfig.defaultComposerHeight;

type ActiveView = 'chat' | 'library';

export function AgentHomeScreen() {
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [composerHeight, setComposerHeight] = useState(DEFAULT_COMPOSER_HEIGHT);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [plusSheetVisible, setPlusSheetVisible] = useState(false);
  const composerBottom = useRef(new Animated.Value(CLOSED_COMPOSER_BOTTOM)).current;
  const heroOpacity = useRef(new Animated.Value(1)).current;
  const heroTranslateY = useRef(new Animated.Value(0)).current;

  const { avatarInitials, conversations, refreshConversations } = useAgentConversations();

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

  const closeActiveOverlays = useCallback(() => {
    Keyboard.dismiss();
    setPlusSheetVisible(false);
  }, []);

  const hidePlusSheet = useCallback(() => {
    setPlusSheetVisible(false);
  }, []);

  const chat = useAgentChat({
    onBeforeChatReset: closeActiveOverlays,
    onBeforeConversationSelect: closeActiveOverlays,
    onBeforeSend: hidePlusSheet,
    onConversationChanged: refreshConversations,
    onHeroVisibilityChange: animateHero,
  });

  const hasMessages = chat.hasMessages;
  const isLibraryView = activeView === 'library';
  const messageListBottomInset = keyboardOpen
    ? keyboardHeight + KEYBOARD_GAP + composerHeight + KEYBOARD_MESSAGE_BOTTOM_GAP
    : CLOSED_MESSAGE_BOTTOM_GAP;

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

  const openChatView = useCallback(() => {
    setActiveView('chat');
  }, []);

  const openLibraryView = useCallback(() => {
    closeActiveOverlays();
    closeComposerPosition(180);
    setActiveView('library');
  }, [closeActiveOverlays, closeComposerPosition]);

  const handleNewChat = useCallback(() => {
    openChatView();
    chat.startNewChat();
  }, [chat, openChatView]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      openChatView();
      chat.selectConversation(conversationId);
    },
    [chat, openChatView],
  );

  function dismissComposer() {
    Keyboard.dismiss();
    closeComposerPosition(180);
  }

  function handleComposerBlur() {
    closeComposerPosition(180);
  }

  function handleOpenPlusMenu() {
    Keyboard.dismiss();
    lunivoHaptics.openDrawer();
    setPlusSheetVisible(true);
  }

  function handleClosePlusMenu() {
    setPlusSheetVisible(false);
  }

  function handleAddPhotos(photos: LunivoAttachment[]) {
    chat.addAttachments(photos);
  }

  function handleSelectPlusPrompt(prompt: string) {
    chat.setMessage((currentMessage) => {
      if (!currentMessage.trim()) {
        return prompt;
      }

      return `${prompt}${currentMessage}`;
    });
  }

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setPlusSheetVisible(false);
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
    if (keyboardOpen || isLibraryView) {
      return;
    }

    animateHero(!hasMessages, 220);
  }, [animateHero, hasMessages, isLibraryView, keyboardOpen]);

  return (
    <DrawerShell
      avatarInitials={avatarInitials}
      conversations={conversations}
      gesturesEnabled={!plusSheetVisible}
      onNewChat={handleNewChat}
      onOpenLibrary={openLibraryView}
      onSelectConversation={handleSelectConversation}
    >
      {({ openDrawer }) => (
        <SafeAreaView style={styles.screen}>
          {keyboardOpen ? <Pressable onPress={dismissComposer} style={styles.dismissLayer} /> : null}

          {isLibraryView ? (
            <LibraryScreen onMenuPress={openDrawer} />
          ) : (
            <>
              <View style={styles.content}>
                <AgentHeader appName="Lunivo" onMenuPress={openDrawer} points={263} />

                {hasMessages ? (
                  <ChatMessageList
                    messages={chat.messages}
                    bottomInset={messageListBottomInset}
                    scrollKey={chat.streamScrollKey}
                    thinking={chat.isThinking}
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
                  attachments={chat.selectedAttachments}
                  value={chat.message}
                  onBlur={handleComposerBlur}
                  onChangeText={chat.setMessage}
                  onHeightChange={setComposerHeight}
                  onOpenPlusMenu={handleOpenPlusMenu}
                  onRemoveAttachment={chat.removeAttachment}
                  onSend={chat.sendMessage}
                />
              </Animated.View>

              <LunivoPlusSheet
                visible={plusSheetVisible}
                onAddPhotos={handleAddPhotos}
                onClose={handleClosePlusMenu}
                onSelectPrompt={handleSelectPlusPrompt}
              />
            </>
          )}
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