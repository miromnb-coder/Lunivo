import { ChevronRight } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR } from './meSheetData';
import { styles } from './meSheetStyles';

export type MeSheetIconComponent = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type MeSheetRowProps = {
  Icon: MeSheetIconComponent;
  label: string;
  onPress?: () => void;
  value?: string;
};

export function MeSheetRow({ Icon, label, onPress, value }: MeSheetRowProps) {
  const hasValue = Boolean(value);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.iconSlot}>
        <Icon color={ICON_COLOR} size={23} strokeWidth={1.75} />
      </View>
      <Text
        allowFontScaling={false}
        numberOfLines={hasValue ? 1 : 2}
        style={[styles.rowLabel, hasValue ? styles.rowLabelWithValue : styles.rowLabelAction]}
      >
        {label}
      </Text>
      {value ? (
        <Text allowFontScaling={false} numberOfLines={1} style={styles.rowValue}>
          {value}
        </Text>
      ) : null}
      <ChevronRight color="rgba(31,36,48,0.45)" size={18} strokeWidth={2} />
    </Pressable>
  );
}
