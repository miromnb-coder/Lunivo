import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

type QuickActionButtonProps = {
  icon: string;
  label: string;
};

export function QuickActionButton({ icon, label }: QuickActionButtonProps) {
  return (
    <View style={styles.button}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 118,
    height: 114,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: agentTheme.colors.surface,
    shadowColor: agentTheme.colors.shadow,
    shadowOpacity: 0.26,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  icon: {
    minHeight: 38,
    fontSize: 34,
    lineHeight: 38,
    color: agentTheme.colors.softText,
  },
  label: {
    marginTop: 13,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    color: '#111111',
  },
});
