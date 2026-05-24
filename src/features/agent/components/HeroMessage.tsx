import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

export function HeroMessage() {
  return (
    <View style={styles.container}>
      <Text allowFontScaling={false} style={styles.title}>
        Good evening,{`\n`}let’s study smarter.
      </Text>
      <Text allowFontScaling={false} style={styles.subtitle}>
        I’m here to help you focus, learn faster,{`\n`}and stay on track.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 118,
  },
  title: {
    width: 360,
    textAlign: 'center',
    fontSize: 35,
    lineHeight: 43,
    fontWeight: '400',
    color: '#696979',
    fontFamily: 'Georgia',
  },
  subtitle: {
    marginTop: 21,
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '600',
    color: agentTheme.colors.mutedText,
  },
});
