import { StyleSheet, View } from 'react-native';

import { QuickActionButton } from './QuickActionButton';

const quickActions = [
  { iconName: 'book-open', label: 'Explain' },
  { iconName: 'help-circle', label: 'Quiz me' },
  { iconName: 'calendar', label: 'Study plan' },
] as const;

export function QuickActions() {
  return (
    <View style={styles.row}>
      {quickActions.map((action) => (
        <QuickActionButton key={action.label} iconName={action.iconName} label={action.label} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 72,
  },
});
