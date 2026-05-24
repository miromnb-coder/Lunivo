import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { agentTheme } from '../src/features/agent/constants/agentTheme';
import { AgentHomeScreen } from '../src/features/agent/screens/AgentHomeScreen';
import { LunivoEmailAuthScreen } from '../src/features/auth/screens/LunivoEmailAuthScreen';
import { LunivoWelcomeScreen } from '../src/features/auth/screens/LunivoWelcomeScreen';
import { supabase } from '../src/lib/supabase';

type StartView = 'welcome' | 'email' | 'app';

export default function HomeScreen() {
  const [startView, setStartView] = useState<StartView>('welcome');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsCheckingSession(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setStartView(data.session ? 'app' : 'welcome');
      setIsCheckingSession(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (isCheckingSession) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={agentTheme.colors.text} />
      </View>
    );
  }

  if (startView === 'app') {
    return <AgentHomeScreen />;
  }

  if (startView === 'email') {
    return <LunivoEmailAuthScreen onBack={() => setStartView('welcome')} onContinue={() => setStartView('app')} />;
  }

  return <LunivoWelcomeScreen onContinue={() => setStartView('email')} onEmailContinue={() => setStartView('email')} />;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: agentTheme.colors.background,
  },
});
