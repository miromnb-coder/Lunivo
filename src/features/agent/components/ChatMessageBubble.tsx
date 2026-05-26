import { marked } from 'marked';
import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';
import type { ChatMessage } from './ChatMessageList';

type ChatMessageBubbleProps = {
  message: ChatMessage;
};

type InlinePart = {
  bold: boolean;
  text: string;
};

type MarkdownBlock =
  | {
      children: InlinePart[];
      type: 'paragraph';
    }
  | {
      items: InlinePart[][];
      ordered: boolean;
      type: 'list';
    };

function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ bold: false, text: text.slice(lastIndex, match.index) });
    }

    parts.push({ bold: true, text: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ bold: false, text: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ bold: false, text }];
}

function getTokenText(token: marked.Tokens.Generic) {
  if (typeof token.text === 'string') {
    return token.text.trim();
  }

  if (typeof token.raw === 'string') {
    return token.raw.trim();
  }

  return '';
}

function parseMarkdown(content: string): MarkdownBlock[] {
  const tokens = marked.lexer(content, {
    gfm: true,
  }) as marked.Tokens.Generic[];

  const blocks: MarkdownBlock[] = [];

  tokens.forEach((token) => {
    if (token.type === 'space') {
      return;
    }

    if (token.type === 'list' && Array.isArray(token.items)) {
      const items = token.items
        .map((item: marked.Tokens.Generic) => parseInline(getTokenText(item)))
        .filter((item: InlinePart[]) => item.some((part) => part.text.trim().length > 0));

      if (items.length > 0) {
        blocks.push({
          items,
          ordered: Boolean(token.ordered),
          type: 'list',
        });
      }

      return;
    }

    const text = getTokenText(token);

    if (text) {
      blocks.push({
        children: parseInline(text),
        type: 'paragraph',
      });
    }
  });

  return blocks;
}

function InlineText({ parts }: { parts: InlinePart[] }) {
  return (
    <Text allowFontScaling={false} selectable style={styles.assistantText}>
      {parts.map((part, index) => (
        <Text key={`${part.text}-${index}`} style={part.bold ? styles.boldText : undefined}>
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

function AssistantMarkdown({ content }: { content: string }) {
  const blocks = parseMarkdown(content);

  return (
    <View style={styles.markdownContent}>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'list') {
          return (
            <View key={`list-${blockIndex}`} style={styles.listBlock}>
              {block.items.map((item, itemIndex) => (
                <View key={`list-${blockIndex}-${itemIndex}`} style={styles.listItem}>
                  <Text allowFontScaling={false} selectable style={styles.listMarker}>
                    {block.ordered ? `${itemIndex + 1}.` : '•'}
                  </Text>
                  <View style={styles.listItemContent}>
                    <InlineText parts={item} />
                  </View>
                </View>
              ))}
            </View>
          );
        }

        return (
          <View key={`paragraph-${blockIndex}`} style={styles.paragraphBlock}>
            <InlineText parts={block.children} />
          </View>
        );
      })}
    </View>
  );
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={[styles.row, styles.userRow]}>
        <View style={[styles.bubble, styles.userBubble]}>
          <Text allowFontScaling={false} selectable style={[styles.messageText, styles.userText]}>
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
        <AssistantMarkdown content={message.content} />
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
  markdownContent: {
    width: '100%',
  },
  paragraphBlock: {
    marginBottom: 10,
  },
  listBlock: {
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  listMarker: {
    width: 18,
    color: agentTheme.colors.text,
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '600',
  },
  listItemContent: {
    flex: 1,
  },
  assistantText: {
    color: agentTheme.colors.text,
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.18,
  },
  boldText: {
    fontWeight: '800',
  },
});