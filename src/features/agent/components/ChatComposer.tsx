import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputContentSizeChangeEventData,
  type TextInput as TextInputType,
  type ViewStyle,
  View,
} from 'react-native';

import { agentTheme } from '../constants/agentTheme';
import type { LunivoAttachment } from '../types/attachment';

const COMPOSER_ICON_COLOR = 'rgba(15,17,21,0.84)';
const DISABLED_ICON_COLOR = 'rgba(110,113,124,0.42)';

const INPUT_LINE_HEIGHT = 22;
const MIN_INPUT_HEIGHT = INPUT_LINE_HEIGHT;
const MAX_INPUT_HEIGHT = 112;
const ESTIMATED_CHARACTER_WIDTH = 8.4;
const HEIGHT_REPORT_THRESHOLD = 6;

const IDLE_COMPOSER_HEIGHT = 66;
const ACTIVE_COMPOSER_MIN_HEIGHT = 112;
const ATTACHMENT_PREVIEW_HEIGHT = 68;

type ChatComposerProps = {
  value: string;
  attachments?: LunivoAttachment[];
  style?: StyleProp<ViewStyle>;
  onBlur?: () => void;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
  onHeightChange?: (height: number) => void;
  onOpenPlusMenu?: () => void;
  onRemoveAttachment?: (attachmentId: string) => void;
  onSend?: () => void;
};

function estimateWrappedInputHeight(text: string, inputWidth: number) {
  if (!text.trim()) {
    return MIN_INPUT_HEIGHT;
  }

  if (inputWidth <= 0) {
    return Math.max(MIN_INPUT_HEIGHT, text.split('\n').length * INPUT_LINE_HEIGHT);
  }

  const charactersPerLine = Math.max(10, Math.floor(inputWidth / ESTIMATED_CHARACTER_WIDTH));

  return text.split('\n').reduce((height, line) => {
    const lineCount = Math.max(1, Math.ceil(line.length / charactersPerLine));
    return height + lineCount * INPUT_LINE_HEIGHT;
  }, 0);
}

export function ChatComposer({
  value,
  attachments = [],
  style,
  onBlur,
  onChangeText,
  onFocus,
  onHeightChange,
  onOpenPlusMenu,
  onRemoveAttachment,
  onSend,
}: ChatComposerProps) {
  const inputRef = useRef<TextInputType>(null);
  const transition = useRef(new Animated.Value(0)).current;
  const lastReportedHeightRef = useRef(0);

  const [focused, setFocused] = useState(false);
  const [forcedActive, setForcedActive] = useState(false);
  const [measuredContentHeight, setMeasuredContentHeight] = useState(MIN_INPUT_HEIGHT);
  const [stableInputHeight, setStableInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [inputWidth, setInputWidth] = useState(0);

  const hasText = value.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const isActive = focused || forcedActive || hasAttachments;
  const canSend = hasText;

  const estimatedInputHeight = useMemo(
    () => estimateWrappedInputHeight(value, inputWidth),
    [inputWidth, value],
  );

  const rawInputHeight = Math.max(MIN_INPUT_HEIGHT, measuredContentHeight, estimatedInputHeight);
  const targetInputHeight = Math.min(rawInputHeight, MAX_INPUT_HEIGHT);
  const inputHeight = isActive ? stableInputHeight : MIN_INPUT_HEIGHT;
  const inputCanScroll = isActive && rawInputHeight > MAX_INPUT_HEIGHT;

  useEffect(() => {
    Animated.timing(transition, {
      toValue: isActive ? 1 : 0,
      duration: isActive ? 130 : 145,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isActive, transition]);

  useEffect(() => {
    if (value.length === 0) {
      setMeasuredContentHeight(MIN_INPUT_HEIGHT);
      setStableInputHeight(MIN_INPUT_HEIGHT);
      return;
    }

    setStableInputHeight((currentHeight) => {
      if (!isActive) {
        return MIN_INPUT_HEIGHT;
      }

      if (targetInputHeight > currentHeight) {
        return targetInputHeight;
      }

      if (currentHeight - targetInputHeight >= INPUT_LINE_HEIGHT) {
        return targetInputHeight;
      }

      return currentHeight;
    });
  }, [isActive, targetInputHeight, value.length]);

  useEffect(() => {
    if (!focused && !hasAttachments) {
      setForcedActive(false);
    }
  }, [focused, hasAttachments]);

  function activateComposer() {
    setForcedActive(true);
    inputRef.current?.focus();
  }

  function handleFocus() {
    setForcedActive(true);
    setFocused(true);
    onFocus?.();
  }

  function handleBlur() {
    setFocused(false);
    setForcedActive(false);
    onBlur?.();
  }

  function handleOpenPlusMenu() {
    onOpenPlusMenu?.();
  }

  function handleSend() {
    if (!canSend) {
      return;
    }

    onSend?.();
  }

  function handleContentSizeChange(event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) {
    const nextHeight = Math.max(MIN_INPUT_HEIGHT, Math.ceil(event.nativeEvent.contentSize.height));

    setMeasuredContentHeight((currentHeight) => {
      if (Math.abs(currentHeight - nextHeight) < 1) {
        return currentHeight;
      }

      return nextHeight;
    });
  }

  function handleComposerLayout(event: LayoutChangeEvent) {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);

    if (Math.abs(lastReportedHeightRef.current - nextHeight) < HEIGHT_REPORT_THRESHOLD) {
      return;
    }

    lastReportedHeightRef.current = nextHeight;
    onHeightChange?.(nextHeight);
  }

  const activeMinHeight = ACTIVE_COMPOSER_MIN_HEIGHT + (hasAttachments ? ATTACHMENT_PREVIEW_HEIGHT : 0);
  const animatedComposerStyle = {
    minHeight: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [IDLE_COMPOSER_HEIGHT, activeMinHeight],
    }),
    borderRadius: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [999, 30],
    }),
    paddingHorizontal: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 16],
    }),
    paddingTop: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 14],
    }),
    paddingBottom: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 12],
    }),
  };

  return (
    <Animated.View
      onLayout={handleComposerLayout}
      style={[styles.composer, animatedComposerStyle, style]}
    >
      <Pressable onPressIn={activateComposer} style={styles.composerPressable}>
        {hasAttachments ? (
          <ScrollView
            contentContainerStyle={styles.attachmentStripContent}
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            style={styles.attachmentStrip}
          >
            {attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentPreview}>
                <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                <Pressable
                  accessibilityLabel="Remove photo"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => onRemoveAttachment?.(attachment.id)}
                  style={({ pressed }) => [styles.removeAttachmentButton, pressed && styles.buttonPressed]}
                >
                  <Ionicons name="close-outline" size={15} color="#ffffff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={[styles.inputShell, isActive ? styles.inputShellActive : styles.inputShellIdle]}>
          <TextInput
            ref={inputRef}
            allowFontScaling={false}
            multiline
            onBlur={handleBlur}
            onChangeText={onChangeText}
            onContentSizeChange={handleContentSizeChange}
            onFocus={handleFocus}
            onLayout={(event) => setInputWidth(event.nativeEvent.layout.width)}
            placeholder="Ask anything about your studies"
            placeholderTextColor="#a6a7af"
            returnKeyType="default"
            scrollEnabled={inputCanScroll}
            style={[
              styles.input,
              isActive ? styles.inputActive : styles.inputIdle,
              { height: inputHeight },
            ]}
            textAlignVertical="top"
            value={value}
          />

          {!isActive ? (
            <View pointerEvents="box-none" style={styles.idleLeftSlot}>
              <ComposerButton accessibilityLabel="Open attachment menu" onPress={handleOpenPlusMenu} size="idle">
                <Ionicons name="add-outline" size={30} color={COMPOSER_ICON_COLOR} />
              </ComposerButton>
            </View>
          ) : null}
        </View>

        {isActive ? (
          <View style={styles.controlsRow}>
            <View style={styles.leftControls}>
              <ComposerButton accessibilityLabel="Open attachment menu" onPress={handleOpenPlusMenu}>
                <Ionicons name="add-outline" size={28} color={COMPOSER_ICON_COLOR} />
              </ComposerButton>
            </View>

            <View style={styles.rightControls}>
              <ComposerButton accessibilityLabel="Use voice" onPress={() => {}}>
                <Ionicons name="mic-outline" size={25} color={COMPOSER_ICON_COLOR} />
              </ComposerButton>

              <ComposerButton
                accessibilityLabel="Send message"
                disabled={!canSend}
                filled={canSend}
                onPress={handleSend}
                send
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={25}
                  color={canSend ? '#ffffff' : DISABLED_ICON_COLOR}
                />
              </ComposerButton>
            </View>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

type ComposerButtonProps = {
  accessibilityLabel: string;
  children: ReactNode;
  disabled?: boolean;
  filled?: boolean;
  onPress?: () => void;
  send?: boolean;
  size?: 'default' | 'idle';
};

function ComposerButton({
  accessibilityLabel,
  children,
  disabled = false,
  filled = false,
  onPress,
  send = false,
  size = 'default',
}: ComposerButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'idle' && styles.buttonIdle,
        send && styles.sendButton,
        filled && styles.buttonFilled,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  composer: {
    backgroundColor: '#fbfbfa',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.032)',
    shadowColor: '#9a9aa3',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  composerPressable: {
    flex: 1,
  },
  attachmentStrip: {
    marginBottom: 12,
  },
  attachmentStripContent: {
    gap: 10,
    paddingRight: 3,
  },
  attachmentPreview: {
    width: 58,
    height: 58,
    borderRadius: 17,
    overflow: 'visible',
    backgroundColor: '#f0efec',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    resizeMode: 'cover',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#fbfbfa',
  },
  inputShell: {
    position: 'relative',
    width: '100%',
  },
  inputShellIdle: {
    minHeight: 48,
    justifyContent: 'center',
  },
  inputShellActive: {
    minHeight: MIN_INPUT_HEIGHT,
  },
  input: {
    margin: 0,
    padding: 0,
    color: agentTheme.colors.text,
    fontSize: 17.5,
    fontWeight: '500',
    letterSpacing: -0.2,
    lineHeight: INPUT_LINE_HEIGHT,
  },
  inputIdle: {
    width: '100%',
    paddingLeft: 66,
    paddingRight: 10,
    paddingTop: 1,
    fontWeight: '400',
  },
  inputActive: {
    width: '100%',
  },
  idleLeftSlot: {
    position: 'absolute',
    left: 0,
    top: -1,
  },
  controlsRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.052)',
  },
  buttonIdle: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sendButton: {
    backgroundColor: 'rgba(17,24,39,0.065)',
    borderColor: 'rgba(17,24,39,0.052)',
  },
  buttonFilled: {
    backgroundColor: '#111111',
    borderColor: '#111111',
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(17,24,39,0.06)',
    borderColor: 'rgba(17,24,39,0.045)',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: {
    opacity: 0.62,
    transform: [{ scale: 0.97 }],
  },
});
