import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

type AgentHeaderProps = {
  appName: string;
  points: number;
};

function PointsSparkleIcon() {
  return (
    <View style={styles.sparkleIcon}>
      <Text allowFontScaling={false} style={styles.sparkleSymbol}>
        ✧
      </Text>
      <Text allowFontScaling={false} style={styles.sparklePlus}>
        +
      </Text>
    </View>
  );
}

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
          <PointsSparkleIcon />
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
    width: 112,
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
    width: 96,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e4e4e8',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  sparkleIcon: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleSymbol: {
    marginTop: -2,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '400',
    color: agentTheme.colors.text,
  },
  sparklePlus: {
    position: 'absolute',
    right: 0,
    top: -1,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: agentTheme.colors.text,
  },
  points: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    color: agentTheme.colors.text,
  },
});
