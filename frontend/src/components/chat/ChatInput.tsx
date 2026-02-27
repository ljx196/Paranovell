/**
 * GenNovel Design System - Chat Input Component
 * Input with attachment button and send button
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import { Paperclip, ArrowUp } from 'lucide-react-native';
import { useTheme } from '../../theme';

interface ChatInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSend?: () => void;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const MIN_INPUT_HEIGHT = 24;
const MAX_INPUT_HEIGHT = 200;

export function ChatInput({
  value,
  onChangeText,
  onSend,
  onAttach,
  placeholder = '输入你的创意想法...',
  disabled = false,
}: ChatInputProps) {
  const { colors, borderRadius, layout, typography, spacing } = useTheme();
  const [internalValue, setInternalValue] = useState('');
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);

  const inputValue = value !== undefined ? value : internalValue;

  const handleChange = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    } else {
      setInternalValue(text);
    }
    // Reset height when text is cleared
    if (!text) {
      setInputHeight(MIN_INPUT_HEIGHT);
    }
  };

  const handleContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const newHeight = e.nativeEvent.contentSize.height;
      setInputHeight(Math.min(Math.max(newHeight, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT));
    },
    []
  );

  const handleSend = () => {
    if (inputValue.trim() && onSend) {
      onSend();
      if (!onChangeText) {
        setInternalValue('');
      }
      setInputHeight(MIN_INPUT_HEIGHT);
    }
  };

  const isMultiline = inputHeight > MIN_INPUT_HEIGHT + 10;
  const canSend = !disabled && !!inputValue.trim();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, padding: spacing.lg, paddingBottom: spacing.xl }]}>
      <View style={[styles.inner, { maxWidth: layout.contentMaxWidth }]}>
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: colors.bgSecondary,
              borderRadius: 24,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.lg,
              gap: spacing.sm,
              // @ts-ignore - web shadow
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
            },
          ]}
        >
          <Pressable
            onPress={onAttach}
            disabled={disabled}
            accessibilityLabel="添加附件"
            // @ts-ignore - hovered is web-only
            style={(state: any) => [
              styles.sideButton,
              isMultiline && styles.sideButtonBottom,
              {
                borderRadius: borderRadius.md,
                backgroundColor: state.hovered && !disabled ? colors.bgTertiary : 'transparent',
              },
            ]}
          >
            <Paperclip size={18} color={colors.textMuted} />
          </Pressable>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                fontSize: typography.body.fontSize,
                height: inputHeight,
              },
            ]}
            value={inputValue}
            onChangeText={handleChange}
            onContentSizeChange={handleContentSizeChange}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
            editable={!disabled}
            accessibilityLabel="消息输入框"
          />

          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            accessibilityLabel="发送消息"
            // @ts-ignore - hovered is web-only
            style={(state: any) => [
              styles.sideButton,
              styles.sendButton,
              isMultiline && styles.sideButtonBottom,
              {
                borderRadius: borderRadius.md,
                backgroundColor: canSend
                  ? (state.hovered ? colors.accentHover : colors.accent)
                  : colors.bgTertiary,
                opacity: canSend ? 1 : 0.5,
              },
            ]}
          >
            <ArrowUp size={18} color={canSend ? '#FFFFFF' : colors.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.hint, { color: colors.textMuted, marginTop: spacing.md }]}>
          GenNovel 可能会出错，请核实重要信息
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    // Shadow for iOS/Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  sideButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
  } as any,
  sideButtonBottom: {
    alignSelf: 'flex-end',
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    textAlignVertical: 'center',
    outlineStyle: 'none',
    lineHeight: 24,
  } as any,
  sendButton: {
    width: 44,
    height: 44,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
  },
});

export default ChatInput;
