import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

type AgentHeaderProps = {
  appName: string;
  points: number;
};

export function AgentHeader({ appName, points }: AgentHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.menuButton}>
        <View style={styles.menuLine} />
        <View style={[styles.menuLine, styles.menuLineShort]} />
      </View>

      <Text style={styles.appName}>{appName}</Text>

      <View style={styles.pointsPill}>
        <Text style={styles.sparkle}>✧</Text>
        <Text style={styles.points}>{points}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 54,
    height: 48,
    justifyContent: 'center',
    gap: 9,
  },
  menuLine: {
    width: 31,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#3f4654',
  },
  menuLineShort: {
    width: 25,
  },
  appName: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 42,
    lineHeight: 50,
    fontWeight: '500',
    color: agentTheme.colors.text,
    fontFamily: 'serif',
  },
  pointsPill: {
    minWidth: 118,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: agentTheme.colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  sparkle: {
    fontSize: 34,
    lineHeight: 36,
    color: agentTheme.colors.text,
  },
  points: {
    fontSize: 29,
    fontWeight: '800',
    color: agentTheme.colors.text,
  },
});
