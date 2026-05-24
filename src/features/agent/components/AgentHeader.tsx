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
      <View style={styles.leftSide}>
        <Feather name="menu" size={29} color="#3f4654" />
      </View>

      <Text allowFontScaling={false} numberOfLines={1} style={styles.appName}>
        {appName}
      </Text>

      <View style={styles.rightSide}>
        <View style={styles.pointsPill}>
          <Ionicons name="sparkles-outline" size={25} color={agentTheme.colors.text} />
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
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSide: {
    width: 92,
    height: 68,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rightSide: {
    width: 126,
    height: 68,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  appName: {
    position: 'absolute',
    left: 118,
    right: 142,
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '400',
    color: agentTheme.colors.text,
    fontFamily: 'Georgia',
  },
  pointsPill: {
    width: 108,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: agentTheme.colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  points: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    color: agentTheme.colors.text,
  },
});
