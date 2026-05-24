import { Ionicons } from '@expo/vector-icons';
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
        <View style={styles.menuIcon}>
          <View style={styles.menuLine} />
          <View style={[styles.menuLine, styles.menuLineShort]} />
        </View>
      </View>

      <Text allowFontScaling={false} style={styles.appName}>
        {appName}
      </Text>

      <View style={styles.rightSide}>
        <View style={styles.pointsPill}>
          <Ionicons name="sparkles-outline" size={23} color={agentTheme.colors.text} />
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
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftSide: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 84,
    height: 66,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  menuIcon: {
    height: 25,
    justifyContent: 'center',
    gap: 8,
  },
  menuLine: {
    width: 29,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#3f4654',
  },
  menuLineShort: {
    width: 23,
  },
  rightSide: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 118,
    height: 66,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  appName: {
    width: '100%',
    textAlign: 'center',
    fontSize: 31,
    lineHeight: 39,
    fontWeight: '400',
    color: agentTheme.colors.text,
    fontFamily: 'Georgia',
    zIndex: 1,
  },
  pointsPill: {
    width: 104,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: agentTheme.colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  points: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: agentTheme.colors.text,
  },
});
