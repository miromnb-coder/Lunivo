import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

export function ChatThinkingBubble() {
  return (
    <View style={styles.row}>
      <View style={styles.container}>
        <Text allowFontScaling={false} style={styles.label}>
          Lunivo
        </Text>
        <View style={styles.thinkingBubble}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotMuted]} />
          <View style={[styles.dot, styles.dotSoft]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 14,
  },
  container: {
    maxWidth: '82%',
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  label: {
    marginBottom: 7,
    color: agentTheme.colors.mutedText,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: -0.08,
  },
  thinkingBubble: {
    height: 34,
    minWidth: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(104,103,117,0.72)',
  },
  dotMuted: {
    opacity: 0.58,
  },
  dotSoft: {
    opacity: 0.34,
  },
});
