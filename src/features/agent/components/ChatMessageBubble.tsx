import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

import { agentTheme } from '../constants/agentTheme';
import type { ChatMessage } from './ChatMessageList';

type ChatMessageBubbleProps = {
  message: ChatMessage;
};

const MESSAGE_SELECTION_COLOR = 'rgba(177,162,155,0.45)';

function cleanMessageText(content: string) {
  return content.replace(/\*\*(.*?)\*\*/g, '$1').trim();
}

function SelectableMessageText({ content, style }: { content: string; style: StyleProp<TextStyle> }) {
  return (
    <TextInput
      allowFontScaling={false}
      contextMenuHidden={false}
      multiline={true}
      readOnly={true}
      scrollEnabled={false}
      selectionColor={MESSAGE_SELECTION_COLOR}
      style={[styles.selectableTextInput, style]}
      value={content}
    />
  );
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={[styles.row, styles.userRow]}>
        <View style={[styles.bubble, styles.userBubble]}>
          <SelectableMessageText content={message.content} style={styles.userText} />
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
        <SelectableMessageText content={cleanMessageText(message.content)} style={styles.assistantText} />
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
  selectableTextInput: {
    minWidth: 1,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    textAlignVertical: 'top',
  },
  userText: {
    color: agentTheme.colors.text,
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.18,
  },
  assistantText: {
    color: agentTheme.colors.text,
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.18,
  },
});