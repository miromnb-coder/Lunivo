import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { agentTheme } from '../../agent/constants/agentTheme';

type LunivoWelcomeScreenProps = {
  onContinue: () => void;
  onEmailContinue: () => void;
};

function GoogleIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

export function LunivoWelcomeScreen({ onContinue, onEmailContinue }: LunivoWelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text allowFontScaling={false} style={styles.wordmark}>
            L U N I V O
          </Text>
          <Text allowFontScaling={false} style={styles.title}>{'Lunivo helps you\nstudy smarter'}</Text>
          <Text allowFontScaling={false} style={styles.subtitle}>{'One place for explanations,\nquizzes, and study plans.'}</Text>
        </View>

        <View style={styles.authCard}>
          <Pressable onPress={onContinue} style={({ pressed }) => [styles.appleButton, pressed && styles.pressed]}>
            <Text allowFontScaling={false} style={styles.appleIcon}></Text>
            <Text allowFontScaling={false} style={styles.appleButtonText}>Continue with Apple</Text>
          </Pressable>

          <Pressable onPress={onContinue} style={({ pressed }) => [styles.lightButton, pressed && styles.pressed]}>
            <GoogleIcon />
            <Text allowFontScaling={false} style={styles.lightButtonText}>Continue with Google</Text>
          </Pressable>

          <Pressable onPress={onEmailContinue} style={({ pressed }) => [styles.lightButton, pressed && styles.pressed]}>
            <Ionicons name="mail-outline" size={28} color={agentTheme.colors.text} />
            <Text allowFontScaling={false} style={styles.lightButtonText}>Continue with Email</Text>
          </Pressable>

          <Pressable onPress={onEmailContinue} style={({ pressed }) => [styles.loginRow, pressed && styles.pressed]}>
            <Text allowFontScaling={false} style={styles.loginMuted}>Already have an account? </Text>
            <Text allowFontScaling={false} style={styles.loginStrong}>Log in</Text>
          </Pressable>
        </View>
      </View>
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
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 120,
  },
  wordmark: {
    color: agentTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 11,
    fontWeight: '400',
    textAlign: 'center',
    marginLeft: 11,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  title: {
    marginTop: 62,
    color: agentTheme.colors.text,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -1.25,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 24,
    color: agentTheme.colors.mutedText,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.34,
    fontWeight: '400',
    textAlign: 'center',
  },
  authCard: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 56,
    minHeight: 286,
    borderRadius: 34,
    paddingHorizontal: 26,
    paddingTop: 29,
    paddingBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: agentTheme.colors.text,
    shadowOpacity: 0.07,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  appleButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: agentTheme.colors.text,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 8,
  },
  appleIcon: {
    color: '#ffffff',
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '600',
  },
  appleButtonText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  lightButton: {
    height: 56,
    marginTop: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: agentTheme.colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  lightButtonText: {
    color: agentTheme.colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  loginRow: {
    marginTop: 22,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loginMuted: {
    color: agentTheme.colors.mutedText,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
  loginStrong: {
    color: agentTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.18,
  },
  pressed: {
    opacity: 0.64,
    transform: [{ scale: 0.995 }],
  },
});
