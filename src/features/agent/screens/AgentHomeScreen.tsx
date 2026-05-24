import { SafeAreaView, StyleSheet, View } from 'react-native';

import { AgentHeader } from '../components/AgentHeader';
import { ChatComposer } from '../components/ChatComposer';
import { HeroMessage } from '../components/HeroMessage';
import { QuickActions } from '../components/QuickActions';
import { agentTheme } from '../constants/agentTheme';

export function AgentHomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <AgentHeader appName="Lunivo" points={263} />
        <HeroMessage />
        <QuickActions />
      </View>
      <ChatComposer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: agentTheme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: agentTheme.spacing.screen,
  },
});
