import { ChevronRight, Edit3, Flag, GraduationCap, Globe2, SlidersHorizontal, Sparkles, Star, Target } from 'lucide-react-native';
import type { ComponentType, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const AVATAR_COLOR = '#b1a29b';
const ICON_COLOR = agentTheme.colors.text;

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
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Pressable accessibilityLabel="Close profile" accessibilityRole="button" onPress={onClose} style={styles.backdrop} />

      <View style={styles.sheet}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.48)',
  },
  sheet: {
    height: '86%',
    paddingTop: 14,
    paddingHorizontal: 30,
    paddingBottom: 24,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: '#fffefc',
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