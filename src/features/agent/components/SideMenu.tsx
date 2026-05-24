import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CirclePlus,
  Folder,
  PencilLine,
  Search,
  Settings,
  Target,
  UsersRound,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { agentTheme } from '../constants/agentTheme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const ICON_COLOR = agentTheme.colors.text;
const SECTION_COLOR = '#8d8da1';

type MenuIcon = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type MenuRowProps = {
  icon: MenuIcon;
  label: string;
  selected?: boolean;
};

type QuickCardProps = {
  icon: MenuIcon;
  label: string;
};

const learnItems: MenuRowProps[] = [
  { icon: PencilLine, label: 'New chat' },
  { icon: Search, label: 'Search' },
  { icon: BookOpen, label: 'Explain' },
  { icon: CircleHelp, label: 'Quiz' },
  { icon: CalendarDays, label: 'Study Plan' },
];

const spaceItems: MenuRowProps[] = [
  { icon: CirclePlus, label: 'New space' },
  { icon: Folder, label: 'Lunivo', selected: true },
  { icon: Folder, label: 'Exam Week' },
  { icon: Folder, label: 'Math' },
  { icon: Folder, label: 'Biology' },
  { icon: ChevronDown, label: 'Show more' },
];

const recentItems = [
  'Biology test',
  'History essay',
  'English vocabulary',
  'Chemistry formulas',
  'Algebra practice',
];

function QuickCard({ icon: Icon, label }: QuickCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
      <Icon color={ICON_COLOR} size={25} strokeWidth={1.85} />
      <Text allowFontScaling={false} style={styles.quickCardText}>
        {label}
      </Text>
    </Pressable>
  );
}

function MenuRow({ icon: Icon, label, selected = false }: MenuRowProps) {
  return (
    <Pressable style={({ pressed }) => [styles.menuRow, selected && styles.selectedRow, pressed && styles.pressed]}>
      <View style={styles.menuIconSlot}>
        <Icon color={ICON_COLOR} size={23} strokeWidth={1.85} />
      </View>
      <Text allowFontScaling={false} style={styles.menuRowText}>
        {label}
      </Text>
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text allowFontScaling={false} style={styles.sectionLabel}>
      {children}
    </Text>
  );
}

export function SideMenu() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text allowFontScaling={false} style={styles.logo}>
            Lunivo
          </Text>

          <View style={styles.headerActions}>
            <Pressable accessibilityLabel="Search" accessibilityRole="button" style={styles.iconButton}>
              <Search color={ICON_COLOR} size={27} strokeWidth={1.9} />
            </Pressable>
            <Pressable accessibilityLabel="Open profile" accessibilityRole="button" style={styles.avatar}>
              <Text allowFontScaling={false} style={styles.avatarText}>
                MS
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.quickCardsRow}>
          <QuickCard icon={Target} label="Focus" />
          <QuickCard icon={BookOpen} label="Library" />
          <QuickCard icon={UsersRound} label="Spaces" />
        </View>

        <SectionLabel>LEARN</SectionLabel>
        <View style={styles.sectionRows}>
          {learnItems.map((item) => (
            <MenuRow key={item.label} {...item} />
          ))}
        </View>

        <SectionLabel>SPACES</SectionLabel>
        <View style={styles.sectionRows}>
          {spaceItems.map((item) => (
            <MenuRow key={item.label} {...item} />
          ))}
        </View>

        <SectionLabel>RECENT</SectionLabel>
        <View style={styles.recentList}>
          {recentItems.map((item) => (
            <Pressable key={item} style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.recentText}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Pressable accessibilityLabel="Open settings" accessibilityRole="button" style={styles.settingsButton}>
        <Settings color={ICON_COLOR} size={27} strokeWidth={1.9} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: agentTheme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 34,
    paddingTop: 22,
    paddingBottom: 120,
  },
  header: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: agentTheme.colors.text,
    fontFamily: serifFont,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 44,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8885a5',
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  quickCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 28,
  },
  quickCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(31,36,48,0.065)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: agentTheme.colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 2,
  },
  quickCardText: {
    color: agentTheme.colors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  sectionLabel: {
    color: SECTION_COLOR,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 2.7,
    marginLeft: 8,
    marginBottom: 12,
  },
  sectionRows: {
    marginBottom: 24,
  },
  menuRow: {
    minHeight: 46,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 14,
  },
  selectedRow: {
    backgroundColor: 'rgba(31,36,48,0.045)',
  },
  menuIconSlot: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuRowText: {
    color: agentTheme.colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.25,
  },
  recentList: {
    paddingLeft: 74,
    gap: 17,
  },
  recentRow: {
    minHeight: 24,
    justifyContent: 'center',
  },
  recentText: {
    color: agentTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  settingsButton: {
    position: 'absolute',
    right: 36,
    bottom: 38,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.58,
  },
});
