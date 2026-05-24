import Markdown from 'react-native-markdown-display';
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
        <Markdown mergeStyle={false} style={markdownStyles}>
          {message.content}
        </Markdown>
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
});

const markdownStyles = StyleSheet.create({
  body: {
    color: agentTheme.colors.text,
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.18,
  },
  text: {
    color: agentTheme.colors.text,
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.18,
  },
  strong: {
    color: agentTheme.colors.text,
    fontWeight: '800',
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
  },
  bullet_list: {
    marginTop: 2,
    marginBottom: 10,
  },
  ordered_list: {
    marginTop: 2,
    marginBottom: 10,
  },
  list_item: {
    marginBottom: 4,
  },
  bullet_list_icon: {
    color: agentTheme.colors.text,
    fontSize: 16.5,
    lineHeight: 22,
    marginRight: 6,
  },
  ordered_list_icon: {
    color: agentTheme.colors.text,
    fontSize: 16.5,
    lineHeight: 22,
    marginRight: 6,
  },
  bullet_list_content: {
    flex: 1,
  },
  ordered_list_content: {
    flex: 1,
  },
  heading1: {
    color: agentTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 8,
  },
  heading2: {
    color: agentTheme.colors.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 8,
  },
  heading3: {
    color: agentTheme.colors.text,
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 7,
  },
  code_inline: {
    color: agentTheme.colors.text,
    backgroundColor: 'rgba(31,36,48,0.06)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontSize: 15.5,
  },
});
