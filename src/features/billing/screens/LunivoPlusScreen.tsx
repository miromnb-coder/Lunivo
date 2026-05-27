import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Folder,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import type { ComponentType, ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { agentTheme } from '../../agent/constants/agentTheme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const ACCENT = '#000000';
const BACKGROUND = agentTheme.colors.background;
const CARD_BACKGROUND = 'rgba(255,255,255,0.58)';
const BORDER_COLOR = 'rgba(0,0,0,0.07)';
const MUTED = agentTheme.colors.mutedText;

type LunivoPlusScreenProps = {
  onClose: () => void;
  visible: boolean;
};

type IconComponent = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

function CircleIcon({ children }: { children: ReactNode }) {
  return <View style={styles.circleIcon}>{children}</View>;
}

function CheckRow({ children }: { children: string }) {
  return (
    <View style={styles.checkRow}>
      <View style={styles.checkCircle}>
        <Check color="#ffffff" size={10.5} strokeWidth={3} />
      </View>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.checkText}>
        {children}
      </Text>
    </View>
  );
}

function BenefitRow({ Icon, title, subtitle }: { Icon: IconComponent; title: string; subtitle: string }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.benefitRow, pressed && styles.pressed]}>
      <CircleIcon>
        <Icon color={ACCENT} size={23} strokeWidth={1.65} />
      </CircleIcon>
      <View style={styles.benefitTextBlock}>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.benefitTitle}>
          {title}
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.benefitSubtitle}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight color="rgba(0,0,0,0.52)" size={21} strokeWidth={1.9} />
    </Pressable>
  );
}

export function LunivoPlusScreen({ onClose, visible }: LunivoPlusScreenProps) {
  if (!visible) {
    return null;
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Close Lunivo Plus"
            accessibilityRole="button"
            hitSlop={{ top: 14, right: 14, bottom: 14, left: 14 }}
            onPress={onClose}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <ArrowLeft color={ACCENT} size={29} strokeWidth={1.85} />
          </Pressable>
          <Text allowFontScaling={false} style={styles.headerTitle}>
            Lunivo Plus
          </Text>
        </View>

        <View style={styles.hero}>
          <Text allowFontScaling={false} style={styles.heroTitle}>
            Study with{`\n`}more power.
          </Text>
          <Text allowFontScaling={false} style={styles.heroSubtitle}>
            Deeper focus, more credits,{`\n`}and smarter tools to reach your goals.
          </Text>
        </View>

        <View style={styles.planRow}>
          <View style={styles.freeCard}>
            <Text allowFontScaling={false} style={styles.planTitle}>
              Free
            </Text>
            <Text allowFontScaling={false} style={styles.planSubtitle}>
              Current plan
            </Text>
            <View style={styles.planDivider} />
            <CircleIcon>
              <Sparkles color={ACCENT} size={22} strokeWidth={1.55} />
            </CircleIcon>
            <Text allowFontScaling={false} style={styles.freeCreditsNumber}>
              150
            </Text>
            <Text allowFontScaling={false} style={styles.creditsLabel}>
              daily credits
            </Text>
            <View style={styles.planDivider} />
            <Text allowFontScaling={false} style={styles.freePrice}>
              €0 <Text style={styles.priceUnit}>/ month</Text>
            </Text>
          </View>

          <View style={styles.plusCard}>
            <View style={styles.recommendedPill}>
              <Text allowFontScaling={false} style={styles.recommendedText}>
                Recommended
              </Text>
            </View>
            <Text allowFontScaling={false} style={styles.planTitle}>
              Plus
            </Text>
            <Text allowFontScaling={false} style={styles.planSubtitle}>
              Unlock everything
            </Text>
            <View style={styles.plusDivider} />
            <Text allowFontScaling={false} style={styles.plusCreditsNumber}>
              600
            </Text>
            <Text allowFontScaling={false} style={styles.creditsLabel}>
              daily credits
            </Text>
            <View style={styles.plusDivider} />
            <Text allowFontScaling={false} style={styles.plusPrice}>
              €6.99 <Text style={styles.priceUnit}>/ month</Text>
            </Text>
            <View style={styles.checkList}>
              <CheckRow>Priority access</CheckRow>
              <CheckRow>Advanced study tools</CheckRow>
              <CheckRow>Longer sessions</CheckRow>
            </View>
          </View>
        </View>

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}>
          <Text allowFontScaling={false} style={styles.ctaText}>
            Upgrade to Plus — €6.99/month
          </Text>
        </Pressable>

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}>
          <RotateCcw color="rgba(0,0,0,0.45)" size={18} strokeWidth={1.9} />
          <Text allowFontScaling={false} style={styles.restoreText}>
            Restore purchases
          </Text>
        </Pressable>

        <View style={styles.benefitList}>
          <BenefitRow Icon={Sparkles} title="More daily credits" subtitle="Study more without limits." />
          <BenefitRow Icon={BookOpen} title="Smarter study tools" subtitle="AI explanations, deeper insights, better results." />
          <BenefitRow Icon={Zap} title="Priority access" subtitle="Get faster responses and early access to new features." />
          <BenefitRow Icon={Folder} title="Organize everything in one place" subtitle="Notes, plans, and progress—always synced." />
        </View>

        <View style={styles.footer}>
          <LockKeyhole color="rgba(0,0,0,0.42)" size={14} strokeWidth={2} />
          <Text allowFontScaling={false} style={styles.footerText}>
            Secure payments. Cancel anytime.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
    backgroundColor: BACKGROUND,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 18,
  },
  header: {
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: -2,
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    color: ACCENT,
    fontFamily: serifFont,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '700',
    letterSpacing: -0.32,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 31,
  },
  heroTitle: {
    color: ACCENT,
    fontFamily: serifFont,
    fontSize: 43,
    lineHeight: 50,
    fontWeight: '700',
    letterSpacing: -0.9,
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 18,
    color: 'rgba(0,0,0,0.58)',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '500',
    letterSpacing: -0.18,
    textAlign: 'center',
  },
  planRow: {
    flexDirection: 'row',
    gap: 18,
  },
  freeCard: {
    flex: 1,
    minHeight: 335,
    alignItems: 'center',
    borderRadius: 22,
    paddingTop: 30,
    paddingHorizontal: 22,
    paddingBottom: 24,
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  plusCard: {
    flex: 1,
    minHeight: 335,
    borderRadius: 22,
    paddingTop: 30,
    paddingHorizontal: 26,
    paddingBottom: 20,
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1.7,
    borderColor: ACCENT,
  },
  recommendedPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    minWidth: 112,
    height: 29,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    backgroundColor: ACCENT,
  },
  recommendedText: {
    color: '#ffffff',
    fontSize: 11.7,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: -0.05,
  },
  planTitle: {
    color: ACCENT,
    fontFamily: serifFont,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '700',
    letterSpacing: -0.35,
    alignSelf: 'center',
  },
  planSubtitle: {
    marginTop: 5,
    color: 'rgba(0,0,0,0.56)',
    fontSize: 14.5,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.1,
    alignSelf: 'center',
  },
  planDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginTop: 22,
    marginBottom: 27,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  plusDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginTop: 22,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  circleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31,36,48,0.045)',
  },
  freeCreditsNumber: {
    marginTop: 20,
    color: ACCENT,
    fontSize: 45,
    lineHeight: 51,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  plusCreditsNumber: {
    color: ACCENT,
    fontSize: 49,
    lineHeight: 55,
    fontWeight: '700',
    letterSpacing: -1.3,
    textAlign: 'center',
  },
  creditsLabel: {
    marginTop: -1,
    color: 'rgba(0,0,0,0.58)',
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: -0.12,
    textAlign: 'center',
  },
  freePrice: {
    color: 'rgba(0,0,0,0.56)',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  plusPrice: {
    color: ACCENT,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  priceUnit: {
    color: 'rgba(0,0,0,0.56)',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  checkList: {
    marginTop: 8,
    gap: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: ACCENT,
  },
  checkText: {
    color: ACCENT,
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: -0.12,
  },
  ctaButton: {
    height: 66,
    marginTop: 25,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '600',
    letterSpacing: -0.35,
  },
  restoreButton: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  restoreText: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  benefitList: {
    gap: 8,
  },
  benefitRow: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingLeft: 17,
    paddingRight: 16,
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  benefitTextBlock: {
    flex: 1,
    marginLeft: 18,
    marginRight: 10,
  },
  benefitTitle: {
    color: ACCENT,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.22,
  },
  benefitSubtitle: {
    marginTop: 2,
    color: 'rgba(0,0,0,0.54)',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
  },
  footer: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  footerText: {
    color: 'rgba(0,0,0,0.47)',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.05,
  },
  pressed: {
    opacity: 0.58,
  },
});