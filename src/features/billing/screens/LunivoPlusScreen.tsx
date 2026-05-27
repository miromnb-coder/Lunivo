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
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { agentTheme } from '../../agent/constants/agentTheme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const ACCENT = '#000000';
const BACKGROUND = agentTheme.colors.background;
const CARD_BACKGROUND = 'rgba(255,255,255,0.58)';
const BORDER_COLOR = 'rgba(0,0,0,0.07)';
const DIVIDER_COLOR = 'rgba(0,0,0,0.1)';

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
        <Check color="#ffffff" size={9} strokeWidth={3} />
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
        <Icon color={ACCENT} size={20} strokeWidth={1.65} />
      </CircleIcon>

      <View style={styles.benefitTextBlock}>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.benefitTitle}>
          {title}
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.benefitSubtitle}>
          {subtitle}
        </Text>
      </View>

      <ChevronRight color="rgba(0,0,0,0.52)" size={19} strokeWidth={1.9} />
    </Pressable>
  );
}

export function LunivoPlusScreen({ onClose, visible }: LunivoPlusScreenProps) {
  if (!visible) {
    return null;
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
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
              <Sparkles color={ACCENT} size={20} strokeWidth={1.55} />
            </CircleIcon>

            <Text allowFontScaling={false} style={styles.freeCreditsNumber}>
              150
            </Text>
            <Text allowFontScaling={false} style={styles.creditsLabel}>
              daily credits
            </Text>

            <View style={styles.planDivider} />

            <View style={styles.freePriceRow}>
              <Text allowFontScaling={false} style={styles.freePriceAmount}>
                €0
              </Text>
              <Text allowFontScaling={false} style={styles.freePriceUnit}>
                / month
              </Text>
            </View>
          </View>

          <View style={styles.plusCard}>
            <View style={styles.recommendedPill}>
              <Text allowFontScaling={false} style={styles.recommendedText}>
                Recommended
              </Text>
            </View>

            <Text allowFontScaling={false} style={styles.plusPlanTitle}>
              Plus
            </Text>
            <Text allowFontScaling={false} numberOfLines={1} style={styles.plusPlanSubtitle}>
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

            <View style={styles.plusPriceRow}>
              <Text allowFontScaling={false} style={styles.plusPriceAmount}>
                €6.99
              </Text>
              <Text allowFontScaling={false} style={styles.plusPriceUnit}>
                / month
              </Text>
            </View>

            <View style={styles.checkList}>
              <CheckRow>Priority access</CheckRow>
              <CheckRow>Advanced study tools</CheckRow>
              <CheckRow>Longer sessions</CheckRow>
            </View>
          </View>
        </View>

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}>
          <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.88} style={styles.ctaText}>
            Upgrade to Plus — €6.99/month
          </Text>
        </Pressable>

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}>
          <RotateCcw color="rgba(0,0,0,0.45)" size={17} strokeWidth={1.9} />
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
          <LockKeyhole color="rgba(0,0,0,0.42)" size={13} strokeWidth={2} />
          <Text allowFontScaling={false} style={styles.footerText}>
            Secure payments. Cancel anytime.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
    backgroundColor: BACKGROUND,
  },

  content: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 6,
    paddingBottom: 5,
  },

  header: {
    height: 43,
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
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.32,
  },

  hero: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 24,
  },

  heroTitle: {
    color: ACCENT,
    fontFamily: serifFont,
    fontSize: 37,
    lineHeight: 43,
    fontWeight: '700',
    letterSpacing: -0.86,
    textAlign: 'center',
  },

  heroSubtitle: {
    marginTop: 14,
    color: 'rgba(0,0,0,0.58)',
    fontSize: 15.5,
    lineHeight: 21.5,
    fontWeight: '500',
    letterSpacing: -0.18,
    textAlign: 'center',
  },

  planRow: {
    flexDirection: 'row',
    gap: 13,
  },

  freeCard: {
    flex: 1,
    height: 268,
    alignItems: 'center',
    borderRadius: 22,
    paddingTop: 25,
    paddingHorizontal: 17,
    paddingBottom: 18,
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },

  plusCard: {
    flex: 1,
    height: 268,
    borderRadius: 22,
    paddingTop: 42,
    paddingHorizontal: 17,
    paddingBottom: 15,
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1.7,
    borderColor: ACCENT,
  },

  recommendedPill: {
    position: 'absolute',
    top: 12,
    right: 11,
    minWidth: 93,
    height: 27,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: ACCENT,
  },

  recommendedText: {
    color: '#ffffff',
    fontSize: 10.8,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: -0.05,
  },

  planTitle: {
    color: ACCENT,
    fontFamily: serifFont,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.35,
    textAlign: 'center',
  },

  planSubtitle: {
    marginTop: 4,
    color: 'rgba(0,0,0,0.56)',
    fontSize: 13.5,
    lineHeight: 17,
    fontWeight: '500',
    letterSpacing: -0.1,
    textAlign: 'center',
  },

  plusPlanTitle: {
    color: ACCENT,
    fontFamily: serifFont,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.35,
  },

  plusPlanSubtitle: {
    marginTop: 4,
    color: 'rgba(0,0,0,0.56)',
    fontSize: 13.5,
    lineHeight: 17,
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  planDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginTop: 20,
    marginBottom: 21,
    backgroundColor: DIVIDER_COLOR,
  },

  plusDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginTop: 17,
    marginBottom: 11,
    backgroundColor: DIVIDER_COLOR,
  },

  circleIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31,36,48,0.045)',
  },

  freeCreditsNumber: {
    marginTop: 17,
    color: ACCENT,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -1.1,
  },

  plusCreditsNumber: {
    color: ACCENT,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -1.15,
    textAlign: 'center',
  },

  creditsLabel: {
    marginTop: -1,
    color: 'rgba(0,0,0,0.58)',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.12,
    textAlign: 'center',
  },

  freePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },

  freePriceAmount: {
    color: 'rgba(0,0,0,0.56)',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  freePriceUnit: {
    color: 'rgba(0,0,0,0.56)',
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '500',
    letterSpacing: -0.2,
  },

  plusPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  plusPriceAmount: {
    color: ACCENT,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.75,
  },

  plusPriceUnit: {
    color: 'rgba(0,0,0,0.56)',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.2,
  },

  checkList: {
    marginTop: 7,
    gap: 6,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: ACCENT,
  },

  checkText: {
    color: ACCENT,
    flex: 1,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: -0.12,
  },

  ctaButton: {
    height: 56,
    marginTop: 21,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },

  ctaText: {
    color: '#ffffff',
    fontSize: 18.5,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.35,
  },

  restoreButton: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  restoreText: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 14.5,
    lineHeight: 18,
    fontWeight: '500',
  },

  benefitList: {
    gap: 7,
  },

  benefitRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 15,
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },

  benefitTextBlock: {
    flex: 1,
    marginLeft: 14,
    marginRight: 9,
  },

  benefitTitle: {
    color: ACCENT,
    fontSize: 14.8,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: -0.18,
  },

  benefitSubtitle: {
    marginTop: 1,
    color: 'rgba(0,0,0,0.54)',
    fontSize: 11.4,
    lineHeight: 15,
    fontWeight: '400',
    letterSpacing: -0.08,
  },

  footer: {
    height: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  footerText: {
    color: 'rgba(0,0,0,0.47)',
    fontSize: 12.4,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: -0.05,
  },

  pressed: {
    opacity: 0.58,
  },
});
