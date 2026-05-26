import * as Clipboard from 'expo-clipboard';
import { Copy } from 'lucide-react-native';
import { marked } from 'marked';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

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

function formatActionTime(date: Date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `Tänään ${hours}.${minutes}`;
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

function UserMessageActionOverlay({
  content,
  onClose,
  visible,
}: {
  content: string;
  onClose: () => void;
  visible: boolean;
}) {
  const [openedAt] = useState(() => new Date());

  async function copyMessage() {
    await Clipboard.setStringAsync(content);
    onClose();
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable style={styles.overlayBackdrop} onPress={onClose}>
        <View style={styles.overlayContent} pointerEvents="box-none">
          <View style={styles.previewBubble}>
            <Text allowFontScaling={false} style={styles.previewText}>
              {content}
            </Text>
          </View>

          <View style={styles.actionCard}>
            <Text allowFontScaling={false} style={styles.actionTimeText}>
              {formatActionTime(openedAt)}
            </Text>
            <View style={styles.actionDivider} />
            <Pressable onPress={copyMessage} style={({ pressed }) => [styles.copyAction, pressed && styles.copyActionPressed]}>
              <Text allowFontScaling={false} style={styles.copyActionText}>
                Kopioi
              </Text>
              <Copy color={agentTheme.colors.text} size={22} strokeWidth={1.9} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const [actionOverlayVisible, setActionOverlayVisible] = useState(false);
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <>
        <View style={[styles.row, styles.userRow]}>
          <Pressable
            delayLongPress={220}
            onLongPress={() => setActionOverlayVisible(true)}
            style={({ pressed }) => [styles.bubble, styles.userBubble, pressed && styles.userBubblePressed]}
          >
            <Text allowFontScaling={false} style={[styles.messageText, styles.userText]}>
              {message.content}
            </Text>
          </Pressable>
        </View>

        <UserMessageActionOverlay
          content={message.content}
          onClose={() => setActionOverlayVisible(false)}
          visible={actionOverlayVisible}
        />
      </>
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
  userBubblePressed: {
    opacity: 0.78,
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
  overlayBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: 'rgba(31,36,48,0.18)',
  },
  overlayContent: {
    width: '100%',
    alignItems: 'center',
  },
  previewBubble: {
    width: '86%',
    maxWidth: 390,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: '#fbfbfa',
    shadowColor: '#5b5f6b',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  previewText: {
    color: agentTheme.colors.text,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  actionCard: {
    width: '76%',
    maxWidth: 340,
    marginTop: 14,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(251,251,250,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.075)',
  },
  actionTimeText: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 9,
    color: agentTheme.colors.mutedText,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(17,24,39,0.14)',
  },
  copyAction: {
    minHeight: 54,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyActionPressed: {
    backgroundColor: 'rgba(17,24,39,0.04)',
  },
  copyActionText: {
    color: agentTheme.colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.22,
  },
});