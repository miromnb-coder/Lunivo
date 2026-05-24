import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

type QuickActionButtonProps = {
  iconName: FeatherIconName;
  label: string;
};

export function QuickActionButton({ iconName, label }: QuickActionButtonProps) {
  return (
    <View style={styles.button}>
      <Feather name={iconName} size={31} color={agentTheme.colors.softText} />
      <Text allowFontScaling={false} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 102,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: agentTheme.colors.surface,
    shadowColor: agentTheme.colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 19,
    shadowOffset: { width: 0, height: 11 },
    elevation: 6,
  },
  label: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: '#111111',
  },
});
