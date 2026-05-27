import { CalendarDays, Info, Sparkles, X } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { agentTheme } from '../../constants/agentTheme';
import { CREDIT_HISTORY, CURRENT_CREDITS, DAILY_REFRESH_CREDITS, ICON_COLOR } from './meSheetData';
import { styles } from './meSheetStyles';

type CreditMetricIcon = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

function CreditMetricRow({
  Icon,
  label,
  subtitle,
  value,
  withInfo = false,
}: {
  Icon: CreditMetricIcon;
  label: string;
  subtitle: string;
  value: string;
  withInfo?: boolean;
}) {
  return (
    <View style={styles.creditMetricRow}>
      <View style={styles.creditMetricIconSlot}>
        <Icon color={ICON_COLOR} size={25} strokeWidth={1.85} />
      </View>
      <View style={styles.creditMetricTextBlock}>
        <View style={styles.creditMetricLabelRow}>
          <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9} style={styles.creditMetricLabel}>
            {label}
          </Text>
          {withInfo ? <Info color="rgba(31,36,48,0.46)" size={17} strokeWidth={1.9} /> : null}
        </View>
        <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9} style={styles.creditMetricSubtitle}>
          {subtitle}
        </Text>
      </View>
      <Text allowFontScaling={false} style={styles.creditMetricValue}>
        {value}
      </Text>
    </View>
  );
}

type MeSheetCreditsViewProps = {
  onClose: () => void;
  onOpenUpgrade: () => void;
};

export function MeSheetCreditsView({ onClose, onOpenUpgrade }: MeSheetCreditsViewProps) {
  return (
    <View style={styles.creditsContent}>
      <View style={styles.creditsHeader}>
        <Pressable
          accessibilityLabel="Close credits"
          accessibilityRole="button"
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          onPress={onClose}
          style={({ pressed }) => [styles.creditsCloseButton, pressed && styles.pressed]}
        >
          <X color={agentTheme.colors.text} size={28} strokeWidth={1.9} />
        </Pressable>
        <Text allowFontScaling={false} style={styles.creditsTitle}>
          Credits
        </Text>
      </View>

      <ScrollView bounces={false} contentContainerStyle={styles.creditsScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.creditsCard}>
          <View style={styles.creditsPlanHeader}>
            <Text allowFontScaling={false} style={styles.creditsPlanTitle}>
              Free
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onOpenUpgrade}
              style={({ pressed }) => [styles.upgradeButton, pressed && styles.pressed]}
            >
              <Text allowFontScaling={false} style={styles.upgradeButtonText}>
                Upgrade
              </Text>
            </Pressable>
          </View>

          <View style={styles.creditsWideDivider} />
          <CreditMetricRow Icon={Sparkles} label="Credits" subtitle="Available credits" value={`${CURRENT_CREDITS}`} withInfo />
          <View style={styles.creditsWideDivider} />
          <CreditMetricRow
            Icon={CalendarDays}
            label="Daily refresh credits"
            subtitle={`Refresh to ${DAILY_REFRESH_CREDITS} at 06:00 every day`}
            value={`${DAILY_REFRESH_CREDITS}`}
          />
        </View>

        {CREDIT_HISTORY.map((item) => (
          <View key={`${item.date}-${item.value}`} style={styles.historyGroup}>
            <Text allowFontScaling={false} style={styles.historyDate}>
              {item.date}
            </Text>
            <View style={styles.historyItem}>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.historyTitle}>
                {item.title}
              </Text>
              <Text allowFontScaling={false} style={styles.historyValue}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
