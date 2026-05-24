import { Feather, Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

type AgentHeaderProps = {
  appName: string;
  points: number;
};

export function AgentHeader({ appName, points }: AgentHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        <Feather name="menu" size={31} color="#3f4654" />
      </View>

      <Text allowFontScaling={false} style={styles.appName}>
        {appName}
      </Text>

      <View style={[styles.headerSide, styles.rightSide]}>
        <View style={styles.pointsPill}>
          <Ionicons name="sparkles-outline" size={29} color={agentTheme.colors.text} />
          <Text allowFontScaling={false} style={styles.points}>
            {points}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: {
    width: 128,
    height: 72,
    justifyContent: 'center',
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  appName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '500',
    color: agentTheme.colors.text,
    fontFamily: 'Georgia',
  },
  pointsPill: {
    width: 116,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: agentTheme.colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  points: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: agentTheme.colors.text,
  },
});
