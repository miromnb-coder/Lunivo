import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { lunivoHaptics } from '../../../../shared/haptics/lunivoHaptics';
import {
  CLOSE_DISTANCE,
  CLOSE_VELOCITY,
  DRAG_ACTIVATION_DISTANCE,
  HIDDEN_SHEET_EXTRA_OFFSET,
  HIDDEN_SHEET_HEIGHT_RATIO,
  OPEN_SPRING_CONFIG,
} from './meSheetData';
import { MeSheetCreditsView } from './MeSheetCreditsView';
import { MeSheetProfileView } from './MeSheetProfileView';
import { styles } from './meSheetStyles';

type MeSheetProps = {
  displayName?: string;
  initials: string;
  onClose: () => void;
  onOpenUpgrade: () => void;
  visible: boolean;
};

type SheetView = 'profile' | 'credits';

export function MeSheet({ displayName = 'Miro', initials, onClose, onOpenUpgrade, visible }: MeSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const [activeView, setActiveView] = useState<SheetView>('profile');

  useEffect(() => {
    if (visible) {
      lunivoHaptics.openDrawer();
      dragTranslateY.setValue(0);
      setActiveView('profile');

      Animated.spring(progress, {
        toValue: 1,
        ...OPEN_SPRING_CONFIG,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 175,
      easing: Easing.bezier(0.36, 0, 0.2, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        dragTranslateY.setValue(0);
        setActiveView('profile');
      }
    });
  }, [dragTranslateY, progress, visible]);

  const closeSheet = useCallback(() => {
    lunivoHaptics.closeDrawer();
    onClose();
  }, [onClose]);

  const openCredits = useCallback(() => {
    lunivoHaptics.selection();
    setActiveView('credits');
  }, []);

  const openUpgrade = useCallback(() => {
    lunivoHaptics.selection();
    onOpenUpgrade();
  }, [onOpenUpgrade]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, gesture) => {
          const isPullingDown = gesture.dy > DRAG_ACTIVATION_DISTANCE;
          const isMostlyVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2;

          return visible && isPullingDown && isMostlyVertical;
        },
        onMoveShouldSetPanResponder: (_, gesture) => {
          const isPullingDown = gesture.dy > DRAG_ACTIVATION_DISTANCE;
          const isMostlyVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2;

          return visible && isPullingDown && isMostlyVertical;
        },
        onPanResponderMove: (_, gesture) => {
          dragTranslateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldClose = gesture.dy > CLOSE_DISTANCE || gesture.vy > CLOSE_VELOCITY;

          if (shouldClose) {
            closeSheet();
            return;
          }

          Animated.spring(dragTranslateY, {
            toValue: 0,
            tension: 95,
            friction: 13,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragTranslateY, {
            toValue: 0,
            tension: 95,
            friction: 13,
            useNativeDriver: true,
          }).start();
        },
      }),
    [closeSheet, dragTranslateY, visible],
  );

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.48],
  });
  const hiddenTranslateY = height * HIDDEN_SHEET_HEIGHT_RATIO + HIDDEN_SHEET_EXTRA_OFFSET;
  const baseTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [hiddenTranslateY, 0],
  });
  const sheetTranslateY = Animated.add(baseTranslateY, dragTranslateY);

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
        <Pressable accessibilityLabel="Close profile" accessibilityRole="button" onPress={closeSheet} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sheet,
          activeView === 'credits' && styles.creditsSheet,
          {
            paddingBottom: Math.max(insets.bottom + 8, 24),
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.dragHandle} />
        {activeView === 'credits' ? (
          <MeSheetCreditsView onClose={closeSheet} onOpenUpgrade={openUpgrade} />
        ) : (
          <MeSheetProfileView displayName={displayName} initials={initials} onOpenCredits={openCredits} />
        )}
      </Animated.View>
    </View>
  );
}
