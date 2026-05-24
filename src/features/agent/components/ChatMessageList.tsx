import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ChatMessageBubble } from './ChatMessageBubble';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ChatMessageListProps = {
  messages: ChatMessage[];
  bottomInset?: number;
};

export function ChatMessageList({ messages, bottomInset = 190 }: ChatMessageListProps) {
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeoutId);
  }, [messages.length, bottomInset]);

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      keyboardDismissMode="none"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <View style={styles.messagesStack}>
        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}
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
    paddingTop: 28,
  },
  messagesStack: {
    width: '100%',
  },
});
