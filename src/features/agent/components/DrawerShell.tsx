import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { agentTheme } from '../constants/agentTheme';
import { SideMenu } from './SideMenu';

type DrawerControls = {
  closeDrawer: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  toggleDrawer: () => void;
};

type DrawerShellProps = {
  children: (controls: DrawerControls) => ReactNode;
};

const OPEN_SPRING = {
  damping: 24,
  mass: 0.9,
  stiffness: 190,
};

function clamp(value: number, min: number, max: number) {
  'worklet';

  return Math.min(Math.max(value, min), max);
}

export function DrawerShell({ children }: DrawerShellProps) {
  const { width } = useWindowDimensions();
  const openDistance = width;
  const progress = useSharedValue(0);
  const gestureStartProgress = useSharedValue(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const setOpenState = useCallback((open: boolean) => {
    setIsDrawerOpen(open);
  }, []);

  const openDrawer = useCallback(() => {
    Keyboard.dismiss();
    setIsDrawerOpen(true);
    progress.value = withSpring(1, OPEN_SPRING);
  }, [progress]);

  const closeDrawer = useCallback(() => {
    progress.value = withSpring(0, OPEN_SPRING, (finished) => {
      if (finished) {
        runOnJS(setOpenState)(false);
      }
    });
  }, [progress, setOpenState]);

  const toggleDrawer = useCallback(() => {
    if (isDrawerOpen) {
      closeDrawer();
      return;
    }

    openDrawer();
  }, [closeDrawer, isDrawerOpen, openDrawer]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onStart(() => {
      gestureStartProgress.value = progress.value;
    })
    .onUpdate((event) => {
      const nextProgress = gestureStartProgress.value + event.translationX / openDistance;
      progress.value = clamp(nextProgress, 0, 1);

      if (progress.value > 0.02) {
        runOnJS(setOpenState)(true);
      }
    })
    .onEnd((event) => {
      const shouldOpen = event.velocityX > 650 || (event.velocityX > -650 && progress.value > 0.42);
      progress.value = withSpring(shouldOpen ? 1 : 0, OPEN_SPRING, (finished) => {
        if (finished) {
          runOnJS(setOpenState)(shouldOpen);
        }
      });
    });

  const mainScreenStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(progress.value, [0, 1], [0, 34], Extrapolation.CLAMP);
    const scale = interpolate(progress.value, [0, 1], [1, 0.945], Extrapolation.CLAMP);

    return {
      borderRadius,
      transform: [{ translateX: progress.value * openDistance }, { scale }],
    };
  });

  const mainShadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(progress.value, [0, 1], [0, 0.24], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.shell}>
        <SideMenu />

        <Animated.View style={[styles.mainScreen, mainScreenStyle, mainShadowStyle]}>
          {children({ closeDrawer, isDrawerOpen, openDrawer, toggleDrawer })}

          {isDrawerOpen ? (
            <Pressable
              accessibilityLabel="Close menu"
              accessibilityRole="button"
              onPress={closeDrawer}
              style={styles.closeLayer}
            />
          ) : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: agentTheme.colors.background,
  },
  mainScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: agentTheme.colors.background,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: -18, height: 18 },
    shadowRadius: 36,
    elevation: 14,
  },
  closeLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
