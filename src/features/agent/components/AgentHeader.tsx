import { Sparkles } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const MENU_ICON_COLOR = 'rgba(17,24,39,0.78)';

type AgentHeaderProps = {
  appName: string;
  onMenuPress?: () => void;
  points: number;
};

export function AgentHeader({ appName, onMenuPress, points }: AgentHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Open menu"
        accessibilityRole="button"
        hitSlop={{ top: 18, right: 22, bottom: 18, left: 14 }}
        onPress={onMenuPress}
        style={({ pressed }) => [styles.menuButton, pressed && styles.buttonPressed]}
      >
        <View style={styles.menuIcon}>
          <View style={styles.menuLineTop} />
          <View style={styles.menuLineBottom} />
        </View>
      </Pressable>

      <Text allowFontScaling={false} pointerEvents="none" style={styles.title}>
        {appName}
      </Text>

      <View style={styles.rightSlot}>
        <Pressable
          accessibilityLabel="Open credits usage"
          accessibilityRole="button"
          style={({ pressed }) => [styles.creditsBadge, pressed && styles.buttonPressed]}
        >
          <Sparkles size={17} color={agentTheme.colors.text} strokeWidth={1.85} />
          <Text allowFontScaling={false} style={styles.creditsText}>
            {points}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 82,
    paddingLeft: 13,
    paddingRight: 13,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    zIndex: 30,
    overflow: 'visible',
  },
  menuButton: {
    width: 62,
    height: 62,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 3,
  },
  menuIcon: {
    width: 31,
    height: 22,
    justifyContent: 'center',
    gap: 8,
  },
  menuLineTop: {
    width: 29,
    height: 3.2,
    borderRadius: 999,
    backgroundColor: MENU_ICON_COLOR,
  },
  menuLineBottom: {
    width: 20,
    height: 3.2,
    borderRadius: 999,
    backgroundColor: MENU_ICON_COLOR,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignSelf: 'center',
    color: agentTheme.colors.text,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '700',
    letterSpacing: -0.48,
    textAlign: 'center',
    fontFamily: serifFont,
  },
  rightSlot: {
    width: 96,
    height: 62,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 3,
  },
  creditsBadge: {
    minWidth: 78,
    height: 36,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.065)',
  },
  creditsText: {
    color: agentTheme.colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.24,
  },
  buttonPressed: {
    opacity: 0.58,
  },
});
