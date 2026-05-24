import { StyleSheet, View } from 'react-native';

import { QuickActionButton } from './QuickActionButton';

const quickActions = [
  { icon: '□', label: 'Explain' },
  { icon: '?', label: 'Quiz me' },
  { icon: '▦', label: 'Study plan' },
];

export function QuickActions() {
  return (
    <View style={styles.row}>
      {quickActions.map((action) => (
        <QuickActionButton key={action.label} icon={action.icon} label={action.label} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 82,
  },
});
