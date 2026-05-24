import { Feather } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInput as TextInputType,
  View,
} from 'react-native';

import { agentTheme } from '../constants/agentTheme';

export function ChatComposer() {
  const inputRef = useRef<TextInputType>(null);
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const canSend = message.trim().length > 0;

  function focusInput() {
    inputRef.current?.focus();
  }

  function handleSend() {
    if (!canSend) {
      return;
    }

    console.log('Send message:', message.trim());
    setMessage('');
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={focusInput}
        style={[styles.composer, isFocused && styles.composerFocused]}
      >
        <TextInput
          ref={inputRef}
          allowFontScaling={false}
          multiline={isFocused}
          onBlur={() => setIsFocused(false)}
          onChangeText={setMessage}
          onFocus={() => setIsFocused(true)}
          placeholder="Ask anything about your studies"
          placeholderTextColor="#a6a7af"
          returnKeyType="default"
          style={[styles.input, isFocused && styles.inputFocused]}
          textAlignVertical={isFocused ? 'top' : 'center'}
          value={message}
        />

        <View style={[styles.actionsRow, isFocused && styles.actionsRowFocused]}>
          <Pressable onPress={() => {}} style={styles.iconButton}>
            <Feather name="plus" size={32} color="#3b3e48" />
          </Pressable>

          {isFocused ? (
            <View style={styles.rightActions}>
              <Pressable onPress={() => {}} style={styles.iconButton}>
                <Feather name="mic" size={27} color="#242936" />
              </Pressable>

              <Pressable
                disabled={!canSend}
                onPress={handleSend}
                style={[styles.sendButton, canSend && styles.sendButtonActive]}
              >
                <Feather
                  name="arrow-up"
                  size={29}
                  color={canSend ? '#ffffff' : '#aaaab2'}
                />
              </Pressable>
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 44,
  },
  composer: {
    minHeight: 72,
    borderRadius: 999,
    backgroundColor: agentTheme.colors.surface,
    paddingLeft: 13,
    paddingRight: 20,
    shadowColor: agentTheme.colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  composerFocused: {
    minHeight: 128,
    borderRadius: 30,
    paddingTop: 22,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 18,
  },
  input: {
    height: 72,
    marginLeft: 78,
    padding: 0,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '500',
    color: agentTheme.colors.text,
  },
  inputFocused: {
    height: 44,
    marginLeft: 0,
    marginRight: 0,
    fontSize: 22,
    lineHeight: 28,
  },
  actionsRow: {
    position: 'absolute',
    left: 13,
    top: 8,
    height: 56,
    justifyContent: 'center',
  },
  actionsRowFocused: {
    position: 'relative',
    left: 0,
    top: 0,
    height: 58,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: agentTheme.colors.surface,
    borderWidth: 1,
    borderColor: '#f0f0f2',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sendButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#ececef',
    borderWidth: 1,
    borderColor: '#e3e3e7',
  },
  sendButtonActive: {
    backgroundColor: agentTheme.colors.text,
    borderColor: agentTheme.colors.text,
  },
});
