import { useState } from 'react';

import { AgentHomeScreen } from '../src/features/agent/screens/AgentHomeScreen';
import { LunivoEmailAuthScreen } from '../src/features/auth/screens/LunivoEmailAuthScreen';
import { LunivoWelcomeScreen } from '../src/features/auth/screens/LunivoWelcomeScreen';

type StartView = 'welcome' | 'email' | 'app';

export default function HomeScreen() {
  const [startView, setStartView] = useState<StartView>('welcome');

  if (startView === 'app') {
    return <AgentHomeScreen />;
  }

  if (startView === 'email') {
    return <LunivoEmailAuthScreen onBack={() => setStartView('welcome')} onContinue={() => setStartView('app')} />;
  }

  return <LunivoWelcomeScreen onContinue={() => setStartView('email')} onEmailContinue={() => setStartView('email')} />;
}
