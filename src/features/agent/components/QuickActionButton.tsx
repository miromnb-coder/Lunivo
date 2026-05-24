import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

type QuickActionButtonProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
};

export function QuickActionButton({ iconName, label }: QuickActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
    >
      <Ionicons name={iconName} size={23} color="#858690" />
      <Text allowFontScaling={false} numberOfLines={1} style={styles.actionText}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: 104,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: agentTheme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.045)',
    shadowColor: '#9a9aa3',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  actionPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  actionText: {
    marginTop: 7,
    maxWidth: 88,
    color: agentTheme.colors.text,
    fontSize: 14.5,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: -0.18,
    textAlign: 'center',
  },
});
