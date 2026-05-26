import { CirclePlus, Search, SquarePen } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { agentTheme } from '../constants/agentTheme';
import type { ConversationSummary } from '../types/conversation';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const ICON_COLOR = agentTheme.colors.text;
const SECTION_COLOR = agentTheme.colors.mutedText;

type MenuIconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type MenuIcon = ComponentType<MenuIconProps>;

type MenuRowProps = {
  icon: MenuIcon;
  iconSize?: number;
  label: string;
  onPress?: () => void;
};

type SideMenuProps = {
  avatarInitials: string;
  conversations: ConversationSummary[];
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
};

function FourSquaresIcon({ color = ICON_COLOR, size = 31, strokeWidth = 1.85 }: MenuIconProps) {
  const gap = size * 0.18;
  const squareSize = (size - gap) / 2;
  const borderRadius = squareSize * 0.22;

  return (
    <View style={{ width: size, height: size, justifyContent: 'space-between' }}>
      {[0, 1].map((row) => (
        <View key={row} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[0, 1].map((column) => (
            <View
              key={column}
              style={{
                width: squareSize,
                height: squareSize,
                borderRadius,
                borderWidth: strokeWidth,
                borderColor: color,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function MenuRow({ icon: Icon, iconSize = 31, label, onPress }: MenuRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
    >
      <View style={styles.menuIconSlot}>
        <Icon color={ICON_COLOR} size={iconSize} strokeWidth={1.85} />
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
              <Search color={ICON_COLOR} size={31} strokeWidth={1.85} />
            </Pressable>
            <Pressable accessibilityLabel="Profile" accessibilityRole="button" style={styles.avatar}>
              <Text allowFontScaling={false} style={styles.avatarText}>
                {avatarInitials}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.primaryRows}>
          <MenuRow icon={SquarePen} label="New chat" onPress={onNewChat} />
          <MenuRow icon={FourSquaresIcon} label="Library" />
        </View>

        <SectionLabel>SPACES</SectionLabel>
        <View style={styles.sectionRows}>
          <MenuRow icon={CirclePlus} iconSize={33} label="New space" />
        </View>

        <SectionLabel>RECENT</SectionLabel>
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
    paddingTop: 0,
    paddingBottom: 42,
  },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  logo: {
    color: agentTheme.colors.text,
    fontFamily: serifFont,
    fontSize: 37,
    fontWeight: '700',
    letterSpacing: -0.75,
    lineHeight: 46,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  iconButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b1a29b',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.25,
  },
  primaryRows: {
    marginBottom: 10,
  },
  sectionLabel: {
    color: SECTION_COLOR,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 4.7,
    marginLeft: 10,
    marginTop: 18,
    marginBottom: 14,
  },
  sectionRows: {
    marginBottom: 22,
  },
  menuRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 14,
  },
  menuIconSlot: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 28,
  },
  menuRowText: {
    color: agentTheme.colors.text,
    flex: 1,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  chatRows: {
    marginBottom: 18,
  },
  chatRow: {
    minHeight: 51,
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 14,
  },
  chatRowText: {
    color: agentTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.22,
  },
  emptyChatsText: {
    color: agentTheme.colors.mutedText,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.16,
    marginLeft: 10,
    marginBottom: 6,
  },
  pressed: {
    opacity: 0.58,
  },
});