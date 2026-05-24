import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

export function HeroMessage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Good evening,{`\n`}let’s study smarter.</Text>
      <Text style={styles.subtitle}>
        I’m here to help you focus, learn faster,{`\n`}and stay on track.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 184,
  },
  title: {
    maxWidth: 620,
    textAlign: 'center',
    fontSize: 48,
    lineHeight: 57,
    fontWeight: '500',
    color: '#696979',
    fontFamily: 'serif',
  },
  subtitle: {
    marginTop: 26,
    textAlign: 'center',
    fontSize: 25,
    lineHeight: 36,
    fontWeight: '600',
    color: agentTheme.colors.mutedText,
  },
});
