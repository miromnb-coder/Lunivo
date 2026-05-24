import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';
import type { ChatMessage } from './ChatMessageList';

type ChatMessageBubbleProps = {
  message: ChatMessage;
};

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={[styles.row, styles.userRow]}>
        <View style={[styles.bubble, styles.userBubble]}>
          <Text allowFontScaling={false} style={[styles.messageText, styles.userText]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  if (!message.content.trim()) {
    return null;
  }

  return (
    <View style={[styles.row, styles.assistantRow]}>
      <View style={[styles.bubble, styles.assistantBubble]}>
        <Text allowFontScaling={false} style={styles.assistantLabel}>
          Lunivo
        </Text>
        <Text allowFontScaling={false} style={[styles.messageText, styles.assistantText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 14,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
  },
  userBubble: {
    borderRadius: 24,
    paddingHorizontal: 17,
    paddingVertical: 13,
    backgroundColor: '#fbfbfa',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.055)',
    shadowColor: '#9a9aa3',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  assistantBubble: {
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  assistantLabel: {
    marginBottom: 6,
    color: agentTheme.colors.mutedText,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: -0.08,
  },
  messageText: {
    fontSize: 16.5,
    lineHeight: 22,
    letterSpacing: -0.18,
  },
  userText: {
    color: agentTheme.colors.text,
    fontWeight: '500',
  },
  assistantText: {
    color: agentTheme.colors.text,
    fontWeight: '500',
  },
});
