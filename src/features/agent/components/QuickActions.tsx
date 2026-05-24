import { StyleSheet, View } from 'react-native';

import { QuickActionButton } from './QuickActionButton';

const quickActions = [
  { iconName: 'book-outline', label: 'Explain' },
  { iconName: 'help-circle-outline', label: 'Quiz me' },
  { iconName: 'calendar-outline', label: 'Study plan' },
] as const;

export function QuickActions() {
  return (
    <View style={styles.container}>
      {quickActions.map((action) => (
        <QuickActionButton key={action.label} iconName={action.iconName} label={action.label} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 42,
  },
});
