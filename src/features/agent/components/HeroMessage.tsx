import { Platform, StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

export function HeroMessage() {
  return (
    <View style={styles.hero}>
      <Text allowFontScaling={false} style={styles.heroTitle}>
        Good evening,{`\n`}let’s study smarter.
      </Text>
      <Text allowFontScaling={false} style={styles.heroSubtitle}>
        I’m here to help you focus, learn faster,{`\n`}and stay on track.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    maxWidth: 370,
  },
  heroTitle: {
    color: '#686775',
    fontSize: 34,
    lineHeight: 40.5,
    letterSpacing: -1.08,
    textAlign: 'center',
    fontFamily: serifFont,
  },
  heroSubtitle: {
    marginTop: 15,
    color: agentTheme.colors.mutedText,
    fontSize: 15.8,
    lineHeight: 22.5,
    letterSpacing: -0.14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
