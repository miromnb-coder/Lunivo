import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { AgentChatMessage } from '../types/agent';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatThinkingBubble } from './ChatThinkingBubble';

export type ChatMessage = AgentChatMessage;

type ChatMessageListProps = {
  messages: ChatMessage[];
  bottomInset?: number;
  scrollKey?: number;
  thinking?: boolean;
  topInset?: number;
};

export function ChatMessageList({
  messages,
  bottomInset = 190,
  scrollKey = 0,
  thinking = false,
  topInset = 28,
}: ChatMessageListProps) {
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeoutId);
  }, [messages.length, thinking]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 32);

    return () => clearTimeout(timeoutId);
  }, [bottomInset, topInset]);

  useEffect(() => {
    if (scrollKey <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 24);

    return () => clearTimeout(timeoutId);
  }, [scrollKey]);

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: bottomInset,
          paddingTop: topInset,
        },
      ]}
      keyboardDismissMode="none"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <View style={styles.messagesStack}>
        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}
        {thinking ? <ChatThinkingBubble /> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
  },
  messagesStack: {
    width: '100%',
  },
});
