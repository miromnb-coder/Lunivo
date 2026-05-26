import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const HORIZONTAL_PADDING = 26;
const CARD_GAP = 18;
const MENU_ICON_COLOR = 'rgba(31,36,48,0.92)';
const ACTIVE_COLOR = '#1f2430';
const CHIP_BORDER = 'rgba(31,36,48,0.09)';
const PLACEHOLDER_BACKGROUND = 'rgba(255,255,255,0.28)';
const PLACEHOLDER_BORDER = 'rgba(31,36,48,0.02)';

type LibraryScreenProps = {
  onMenuPress?: () => void;
};

function HeaderMenuIcon() {
  return (
    <View style={styles.menuIcon}>
      <View style={[styles.menuLine, styles.menuLineTop]} />
      <View style={[styles.menuLine, styles.menuLineBottom]} />
    </View>
  );
}

function FilterChip({ active = false, label }: { active?: boolean; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.filterChip, active && styles.activeFilterChip, pressed && styles.pressed]}
    >
      <Text allowFontScaling={false} style={[styles.filterText, active && styles.activeFilterText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function LibraryScreen({ onMenuPress }: LibraryScreenProps) {
  const { width } = useWindowDimensions();
  const placeholderWidth = (width - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Open menu"
          accessibilityRole="button"
          hitSlop={{ top: 18, right: 22, bottom: 18, left: 14 }}
          onPress={onMenuPress}
          style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
        >
          <HeaderMenuIcon />
        </Pressable>

        <Text allowFontScaling={false} pointerEvents="none" style={styles.title}>
          Library
        </Text>

        <Pressable
          accessibilityLabel="Library options"
          accessibilityRole="button"
          style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}
        >
          <Text allowFontScaling={false} style={styles.optionsText}>
            ...
          </Text>
        </Pressable>
      </View>

      <View style={styles.filtersRow}>
        <FilterChip active label="All" />
        <FilterChip label="Images" />
        <FilterChip label="Notes" />
        <FilterChip label="Files" />
      </View>

      <View style={styles.placeholderRow}>
        <View style={[styles.placeholderCard, { width: placeholderWidth }]} />
        <View style={[styles.placeholderCard, { width: placeholderWidth }]} />
      </View>

      <View style={styles.emptyState}>
        <Text allowFontScaling={false} style={styles.emptyTitle}>
          Create and organize{`\n`}your study content
        </Text>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}>
          <Text allowFontScaling={false} style={styles.createButtonText}>
            Create
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    backgroundColor: agentTheme.colors.background,
  },
  header: {
    height: 78,
    marginTop: -6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 58,
    height: 56,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  menuIcon: {
    width: 31,
    height: 22,
    justifyContent: 'center',
    gap: 8,
  },
  menuLine: {
    height: 3.1,
    borderRadius: 999,
    backgroundColor: MENU_ICON_COLOR,
  },
  menuLineTop: {
    width: 29,
  },
  menuLineBottom: {
    width: 20,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: agentTheme.colors.text,
    fontFamily: serifFont,
    fontSize: 28.5,
    fontWeight: '600',
    lineHeight: 35,
    letterSpacing: -0.36,
    textAlign: 'center',
  },
  optionsButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(31,36,48,0.035)',
  },
  optionsText: {
    marginTop: -6,
    color: agentTheme.colors.text,
    fontSize: 25,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  filterChip: {
    height: 37,
    minWidth: 72,
    paddingHorizontal: 17,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: CHIP_BORDER,
  },
  activeFilterChip: {
    backgroundColor: ACTIVE_COLOR,
    borderColor: ACTIVE_COLOR,
  },
  filterText: {
    color: agentTheme.colors.text,
    fontFamily: serifFont,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  activeFilterText: {
    color: '#fff',
  },
  placeholderRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginTop: 28,
  },
  placeholderCard: {
    height: 210,
    borderRadius: 22,
    backgroundColor: PLACEHOLDER_BACKGROUND,
    borderWidth: 1,
    borderColor: PLACEHOLDER_BORDER,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 132,
  },
  emptyTitle: {
    color: agentTheme.colors.text,
    fontFamily: serifFont,
    fontSize: 24.5,
    lineHeight: 33,
    fontWeight: '400',
    letterSpacing: -0.35,
    textAlign: 'center',
  },
  createButton: {
    minWidth: 132,
    height: 49,
    marginTop: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACTIVE_COLOR,
    shadowColor: '#171923',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  createButtonText: {
    color: '#fff',
    fontFamily: serifFont,
    fontSize: 18.5,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
  pressed: {
    opacity: 0.62,
  },
});