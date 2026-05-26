import { ChevronRight, Edit3, Flag, GraduationCap, Globe2, SlidersHorizontal, Sparkles, Star, Target } from 'lucide-react-native';
import type { ComponentType, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { lunivoHaptics } from '../../../shared/haptics/lunivoHaptics';
import { agentTheme } from '../constants/agentTheme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const AVATAR_COLOR = '#b1a29b';
const ICON_COLOR = agentTheme.colors.text;
const SHEET_BACKGROUND = '#fffefc';

const CLOSE_DISTANCE = 88;
const CLOSE_VELOCITY = 0.85;
const DRAG_ACTIVATION_DISTANCE = 7;
const HIDDEN_SHEET_HEIGHT_RATIO = 0.86;
const HIDDEN_SHEET_EXTRA_OFFSET = 90;

const OPEN_SPRING_CONFIG = {
  damping: 25,
  stiffness: 230,
  mass: 0.9,
  overshootClamping: true,
  restDisplacementThreshold: 0.5,
  restSpeedThreshold: 0.5,
  useNativeDriver: true,
} as const;

type IconComponent = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type MeSheetProps = {
  displayName?: string;
  initials: string;
  onClose: () => void;
  visible: boolean;
};

function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function Row({ Icon, label, value }: { Icon: IconComponent; label: string; value?: string }) {
  const hasValue = Boolean(value);

  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.iconSlot}>
        <Icon color={ICON_COLOR} size={23} strokeWidth={1.75} />
      </View>
      <Text
        allowFontScaling={false}
        numberOfLines={hasValue ? 1 : 2}
        style={[styles.rowLabel, hasValue ? styles.rowLabelWithValue : styles.rowLabelAction]}
      >
        {label}
      </Text>
      {value ? (
        <Text allowFontScaling={false} numberOfLines={1} style={styles.rowValue}>
          {value}
        </Text>
      ) : null}
      <ChevronRight color="rgba(31,36,48,0.45)" size={18} strokeWidth={2} />
    </Pressable>
  );
}

export function MeSheet({ displayName = 'Miro', initials, onClose, visible }: MeSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const dragTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      lunivoHaptics.openDrawer();
      dragTranslateY.setValue(0);

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
      }
    });
  }, [dragTranslateY, progress, visible]);

  const closeSheet = useCallback(() => {
    lunivoHaptics.closeDrawer();
    onClose();
  }, [onClose]);

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
          {
            paddingBottom: Math.max(insets.bottom + 8, 24),
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.dragHandle} />

        <View style={styles.headerArea}>
          <View style={styles.avatar}>
            <Text allowFontScaling={false} style={styles.avatarText}>
              {initials}
            </Text>
          </View>
          <Text
            adjustsFontSizeToFit
            allowFontScaling={false}
            minimumFontScale={0.78}
            numberOfLines={1}
            style={styles.name}
          >
            {displayName}
          </Text>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Your study profile
          </Text>
        </View>

        <Card>
          <Row Icon={Target} label="Focus" value="Biology, Writing, Planning" />
          <Divider />
          <Row Icon={Globe2} label="Language" value="Finnish / English" />
          <Divider />
          <Row Icon={Sparkles} label="Style" value="Calm and clear" />
          <Divider />
          <Row Icon={Star} label="Credits" value="263" />
          <Divider />
          <Row Icon={Flag} label="Goals" value="Stay consistent, learn faster" />
        </Card>

        <Text allowFontScaling={false} style={styles.sectionLabel}>
          QUICK ACTIONS
        </Text>

        <Card>
          <Row Icon={Edit3} label="Edit profile" />
          <Divider />
          <Row Icon={SlidersHorizontal} label="Preferences" />
          <Divider />
          <Row Icon={GraduationCap} label="Study settings" />
        </Card>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111111',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '86%',
    paddingTop: 14,
    paddingHorizontal: 30,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: SHEET_BACKGROUND,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 20,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 41,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(31,36,48,0.2)',
  },
  headerArea: {
    alignItems: 'center',
    paddingTop: 27,
    paddingBottom: 24,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AVATAR_COLOR,
  },
  avatarText: {
    color: '#fff',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.35,
  },
  name: {
    maxWidth: '88%',
    marginTop: 15,
    color: agentTheme.colors.text,
    fontFamily: serifFont,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    color: agentTheme.colors.mutedText,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.12,
  },
  card: {
    overflow: 'hidden',
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.54)',
    borderWidth: 1,
    borderColor: 'rgba(31,36,48,0.055)',
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 15,
  },
  iconSlot: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 13,
  },
  rowLabel: {
    color: agentTheme.colors.text,
    fontSize: 14.5,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: -0.12,
  },
  rowLabelWithValue: {
    width: 88,
  },
  rowLabelAction: {
    flex: 1,
  },
  rowValue: {
    color: 'rgba(31,36,48,0.74)',
    flex: 1,
    marginRight: 9,
    textAlign: 'right',
    fontSize: 14.5,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 63,
    backgroundColor: 'rgba(31,36,48,0.065)',
  },
  sectionLabel: {
    color: agentTheme.colors.mutedText,
    marginTop: 23,
    marginLeft: 18,
    marginBottom: 14,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 4,
  },
  pressed: {
    opacity: 0.58,
  },
});