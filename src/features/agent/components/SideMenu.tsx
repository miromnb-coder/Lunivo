import {
  BookOpen,
  ChevronDown,
  CirclePlus,
  MessageCircle,
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
import type { ConversationSummary } from '../services/chatHistory';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const ICON_COLOR = agentTheme.colors.text;
const SECTION_COLOR = agentTheme.colors.mutedText;

type MenuIcon = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type MenuRowProps = {
  icon: MenuIcon;
  label: string;
  onPress?: () => void;
};

type QuickCardProps = {
  icon: MenuIcon;
  label: string;
};

type SideMenuProps = {
  avatarInitials: string;
  conversations: ConversationSummary[];
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
};

const spaceItems: MenuRowProps[] = [
  { icon: CirclePlus, label: 'New space' },
  { icon: ChevronDown, label: 'Show more' },
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

function MenuRow({ icon: Icon, label, onPress }: MenuRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <View style={styles.menuIconSlot}>
        <Icon color={ICON_COLOR} size={23} strokeWidth={1.85} />
      </View>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.menuRowText}>
        {label}
      </Text>
    </Pressable>
  );
}

function ChatRow({ conversation, onPress }: { conversation: ConversationSummary; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chatRow, pressed && styles.pressed]}>
      <MessageCircle color={ICON_COLOR} size={21} strokeWidth={1.85} />
      <Text allowFontScaling={false} numberOfLines={1} style={styles.chatRowText}>
        {conversation.title}
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

export function SideMenu({
  avatarInitials,
  conversations,
  onNewChat,
  onSelectConversation,
}: SideMenuProps) {
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
            <Pressable accessibilityLabel="Profile" accessibilityRole="button" style={styles.avatar}>
              <Text allowFontScaling={false} style={styles.avatarText}>
                {avatarInitials}
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
          <MenuRow icon={PencilLine} label="New chat" onPress={onNewChat} />
        </View>

        <SectionLabel>SPACES</SectionLabel>
        <View style={styles.sectionRows}>
          {spaceItems.map((item) => (
            <MenuRow key={item.label} {...item} />
          ))}
        </View>

        <SectionLabel>CHATS</SectionLabel>
        <View style={styles.chatRows}>
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <ChatRow
                key={conversation.id}
                conversation={conversation}
                onPress={() => onSelectConversation(conversation.id)}
              />
            ))
          ) : (
            <Text allowFontScaling={false} style={styles.emptyChatsText}>
              Your saved chats will appear here.
            </Text>
          )}
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
  menuIconSlot: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuRowText: {
    color: agentTheme.colors.text,
    flex: 1,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.25,
  },
  chatRows: {
    marginBottom: 24,
  },
  chatRow: {
    minHeight: 42,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 21,
    paddingRight: 14,
  },
  chatRowText: {
    color: agentTheme.colors.text,
    flex: 1,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  emptyChatsText: {
    color: agentTheme.colors.mutedText,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.16,
    marginLeft: 21,
    marginBottom: 6,
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
