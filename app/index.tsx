import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { hasSupabaseConfig } from '@/lib/supabase';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Lunivo</Text>
        <Text style={styles.title}>Henkilökohtainen AI-opiskeluagentti</Text>
        <Text style={styles.description}>
          Tämä on Lunivon ensimmäinen Expo SDK 54 + React Native + TypeScript -pohja.
        </Text>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Supabase</Text>
          <Text style={styles.statusText}>
            {hasSupabaseConfig ? 'Ympäristömuuttujat löytyvät' : 'Odottaa .env-asetuksia'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f7fb',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  eyebrow: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#5b4bff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#171923',
  },
  description: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    color: '#4a5568',
  },
  statusBox: {
    marginTop: 24,
    borderRadius: 18,
    backgroundColor: '#f1f3ff',
    padding: 16,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5b4bff',
    textTransform: 'uppercase',
  },
  statusText: {
    marginTop: 6,
    fontSize: 15,
    color: '#2d3748',
  },
});
