import {
  CalendarDays,
  ChevronRight,
  Edit3,
  Flag,
  GraduationCap,
  Globe2,
  Info,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  X,
} from 'lucide-react-native';
import type { ComponentType, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
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
const CARD_BACKGROUND = 'rgba(255,255,255,0.54)';
const BORDER_COLOR = 'rgba(31,36,48,0.055)';
const DIVIDER_COLOR = 'rgba(31,36,48,0.065)';
const CURRENT_CREDITS = 263;
const DAILY_REFRESH_CREDITS = 150;

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

const CREDIT_HISTORY = [
  { date: '19 May 2026', title: 'What model do you use', value: '-22' },
  { date: '13 May 2026', title: 'Personal StudyPilot assistant', value: '-9' },
  { date: '11 May 2026', title: 'Optimize personal assistant', value: '-64' },
  { date: '2 May 2026', title: 'Plan my day', value: '-20' },
];

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

type SheetView = 'profile' | 'credits';

function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function Row({ Icon, label, onPress, value }: { Icon: IconComponent; label: string; onPress?: () => void; value?: string }) {
  const hasValue = Boolean(value);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
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

function CreditMetricRow({
  Icon,
  label,
  subtitle,
  value,
  withInfo = false,
}: {
  Icon: IconComponent;
  label: string;
  subtitle: string;
  value: string;
  withInfo?: boolean;
}) {
  return (
    <View style={styles.creditMetricRow}>
      <View style={styles.creditMetricIconSlot}>
        <Icon color={ICON_COLOR} size={25} strokeWidth={1.85} />
      </View>
      <View style={styles.creditMetricTextBlock}>
        <View style={styles.creditMetricLabelRow}>
          <Text allowFontScaling={false} style={styles.creditMetricLabel}>
            {label}
          </Text>
          {withInfo ? <Info color="rgba(31,36,48,0.46)" size={17} strokeWidth={1.9} /> : null}
        </View>
        <Text allowFontScaling={false} style={styles.creditMetricSubtitle}>
          {subtitle}
        </Text>
      </View>
      <Text allowFontScaling={false} style={styles.creditMetricValue}>
        {value}
      </Text>
    </View>
  );
}

function ProfileContent({
  displayName,
  initials,
  onOpenCredits,
}: {
  displayName: string;
  initials: string;
  onOpenCredits: () => void;
}) {
  return (
    <>
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
        <Row Icon={Star} label="Credits" value={`${CURRENT_CREDITS}`} onPress={onOpenCredits} />
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
    </>
  );
}

function CreditsContent({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.creditsContent}>
      <View style={styles.creditsHeader}>
        <Pressable
          accessibilityLabel="Close credits"
          accessibilityRole="button"
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          onPress={onClose}
          style={({ pressed }) => [styles.creditsCloseButton, pressed && styles.pressed]}
        >
          <X color={agentTheme.colors.text} size={28} strokeWidth={1.9} />
        </Pressable>
        <Text allowFontScaling={false} style={styles.creditsTitle}>
          Credits
        </Text>
      </View>

      <ScrollView bounces={false} contentContainerStyle={styles.creditsScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.creditsCard}>
          <View style={styles.creditsPlanHeader}>
            <Text allowFontScaling={false} style={styles.creditsPlanTitle}>
              Free
            </Text>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.upgradeButton, pressed && styles.pressed]}>
              <Text allowFontScaling={false} style={styles.upgradeButtonText}>
                Upgrade
              </Text>
            </Pressable>
          </View>

          <View style={styles.creditsWideDivider} />
          <CreditMetricRow Icon={Sparkles} label="Credits" subtitle="Available credits" value={`${CURRENT_CREDITS}`} withInfo />
          <View style={styles.creditsWideDivider} />
          <CreditMetricRow
            Icon={CalendarDays}
            label="Daily refresh credits"
            subtitle={`Refresh to ${DAILY_REFRESH_CREDITS} at 06:00 every day`}
            value={`${DAILY_REFRESH_CREDITS}`}
          />
        </View>

        {CREDIT_HISTORY.map((item) => (
          <View key={`${item.date}-${item.value}`} style={styles.historyGroup}>
            <Text allowFontScaling={false} style={styles.historyDate}>
              {item.date}
            </Text>
            <View style={styles.historyItem}>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.historyTitle}>
                {item.title}
              </Text>
              <Text allowFontScaling={false} style={styles.historyValue}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function MeSheet({ displayName = 'Miro', initials, onClose, visible }: MeSheetProps) {
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
          <CreditsContent onClose={closeSheet} />
        ) : (
          <ProfileContent displayName={displayName} initials={initials} onOpenCredits={openCredits} />
        )}
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
  creditsSheet: {
    paddingHorizontal: 25,
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
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
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
    backgroundColor: DIVIDER_COLOR,
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
  creditsContent: {
    flex: 1,
  },
  creditsHeader: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsCloseButton: {
    position: 'absolute',
    left: 0,
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  creditsTitle: {
    color: agentTheme.colors.text,
    fontFamily: serifFont,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.45,
    textAlign: 'center',
  },
  creditsScrollContent: {
    paddingBottom: 28,
  },
  creditsCard: {
    paddingHorizontal: 18,
    paddingTop: 21,
    paddingBottom: 16,
    borderRadius: 20,
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  creditsPlanHeader: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  creditsPlanTitle: {
    color: agentTheme.colors.text,
    fontFamily: serifFont,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '700',
    letterSpacing: -0.42,
  },
  upgradeButton: {
    minWidth: 104,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: agentTheme.colors.text,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16.5,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  creditsWideDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(31,36,48,0.1)',
  },
  creditMetricRow: {
    minHeight: 83,
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditMetricIconSlot: {
    width: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 14,
  },
  creditMetricTextBlock: {
    flex: 1,
  },
  creditMetricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditMetricLabel: {
    color: agentTheme.colors.text,
    fontFamily: serifFont,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: -0.22,
  },
  creditMetricSubtitle: {
    marginTop: 5,
    color: agentTheme.colors.mutedText,
    fontFamily: serifFont,
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  creditMetricValue: {
    color: agentTheme.colors.text,
    minWidth: 56,
    marginLeft: 12,
    textAlign: 'right',
    fontFamily: serifFont,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  historyGroup: {
    marginTop: 27,
  },
  historyDate: {
    color: agentTheme.colors.mutedText,
    marginLeft: 4,
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 1.9,
  },
  historyItem: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingLeft: 17,
    paddingRight: 18,
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  historyTitle: {
    color: agentTheme.colors.text,
    flex: 1,
    marginRight: 12,
    fontFamily: serifFont,
    fontSize: 17.5,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  historyValue: {
    color: 'rgba(31,36,48,0.66)',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.18,
  },
  pressed: {
    opacity: 0.58,
  },
});