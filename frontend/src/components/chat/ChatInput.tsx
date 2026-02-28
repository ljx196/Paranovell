/**
 * GenNovel Design System - Chat Input Component
 *
 * Collapsed:  [ 回复...                    [←] ]
 * Expanded:   [ [editable text area]           ]
 *             [                            [↑] ]
 *
 * The arrow toggles between expand (←) and send (↑).
 * Auto-grows up to 5 lines, then scrolls.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { ArrowUp, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';

interface ChatInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSend?: () => void;
  expanded?: boolean;
  onExpand?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const LINE_HEIGHT = 22;
const MAX_LINES = 5;
const MAX_INPUT_HEIGHT = MAX_LINES * LINE_HEIGHT;

export function ChatInput({
  value,
  onChangeText,
  onSend,
  expanded = false,
  onExpand,
  placeholder = '回复...',
  disabled = false,
}: ChatInputProps) {
  const { colors, borderRadius, layout, typography, spacing } = useTheme();
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(LINE_HEIGHT);
  const inputRef = useRef<TextInput>(null);

  const inputValue = value !== undefined ? value : internalValue;

  // Auto-grow: measure scrollHeight on web after every value change
  const adjustHeight = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const node = inputRef.current as any;
    // React Native Web exposes the underlying DOM node
    const el: HTMLTextAreaElement | null =
      node?._node ?? node?.getHostNode?.() ?? node;
    if (!el || !('scrollHeight' in el)) return;

    // Shrink first so scrollHeight recalculates
    el.style.height = '0px';
    const scrollH = el.scrollHeight;
    const newHeight = Math.min(scrollH, MAX_INPUT_HEIGHT);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = scrollH > MAX_INPUT_HEIGHT ? 'auto' : 'hidden';
    setInputHeight(newHeight);
  }, []);

  useEffect(() => {
    if (expanded) {
      // Small delay to let DOM render
      requestAnimationFrame(adjustHeight);
    }
  }, [inputValue, expanded, adjustHeight]);

  const handleChange = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    } else {
      setInternalValue(text);
    }
  };

  const handleSend = () => {
    if (inputValue.trim() && onSend) {
      onSend();
      if (!onChangeText) {
        setInternalValue('');
      }
      setInputHeight(LINE_HEIGHT);
    }
  };

  const handleKeyPress = (e: any) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !disabled && !!inputValue.trim();

  const handleArrowPress = () => {
    if (expanded) {
      handleSend();
    } else {
      onExpand?.();
    }
  };

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }]}>
      <View style={[styles.inner, { maxWidth: layout.contentMaxWidth + 40 }]}>
        <View
          style={[
            styles.box,
            {
              backgroundColor: colors.bgSecondary,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isFocused ? colors.inputFocusBorder : colors.inputBorder,
              // @ts-ignore - web shadow
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
            },
          ]}
        >
          {expanded ? (
            <>
              {/* ====== Upper: Text Input Area ====== */}
              <View style={[styles.inputArea, { paddingHorizontal: spacing.lg }]}>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    {
                      color: colors.textPrimary,
                      fontSize: typography.bodyLarge.fontSize,
                      lineHeight: LINE_HEIGHT,
                      height: inputHeight,
                    },
                  ]}
                  value={inputValue}
                  onChangeText={handleChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={1}
                  editable={!disabled}
                  accessibilityLabel="消息输入框"
                  autoFocus
                />
              </View>

              {/* ====== Lower: Function Bar ====== */}
              <View style={[styles.funcBar, { paddingHorizontal: spacing.sm }]}>
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={handleArrowPress}
                  disabled={!canSend}
                  accessibilityLabel="发送消息"
                  // @ts-ignore
                  style={(state: any) => [
                    styles.iconBtn,
                    {
                      borderRadius: borderRadius.full,
                      backgroundColor: canSend
                        ? (state.hovered ? colors.accentHover : colors.accent)
                        : colors.bgTertiary,
                    },
                  ]}
                >
                  <ArrowUp size={16} color={canSend ? '#FFFFFF' : colors.textMuted} strokeWidth={2.5} />
                </Pressable>
              </View>
            </>
          ) : (
            /* ====== Collapsed: single row ====== */
            <Pressable
              onPress={handleArrowPress}
              style={styles.collapsedRow}
              accessibilityRole="button"
              accessibilityLabel="展开输入框"
            >
              <Text style={{ color: colors.textMuted, fontSize: typography.bodyLarge.fontSize, flex: 1 }}>
                {placeholder}
              </Text>
              <Pressable
                onPress={handleArrowPress}
                accessibilityLabel="展开输入框"
                // @ts-ignore
                style={(state: any) => [
                  styles.iconBtn,
                  {
                    borderRadius: borderRadius.full,
                    backgroundColor: state.hovered ? colors.bgTertiary : 'transparent',
                  },
                ]}
              >
                <ArrowLeft size={16} color={colors.textMuted} strokeWidth={2.5} />
              </Pressable>
            </Pressable>
          )}
        </View>

        <Text style={[styles.hint, { color: colors.textMuted, marginTop: spacing.sm }]}>
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
  box: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  /* ── Upper: input area (expanded) ── */
  inputArea: {
    paddingTop: 14,
    paddingBottom: 8,
  },
  input: {
    paddingVertical: 0,
    outlineStyle: 'none',
    // web: remove default textarea resize handle
    resize: 'none',
  } as any,

  /* ── Lower: function bar (expanded) ── */
  funcBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 6,
    paddingBottom: 10,
  },

  /* ── Collapsed row ── */
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    minHeight: 46,
    cursor: 'pointer',
  } as any,

  iconBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as any,

  hint: {
    textAlign: 'center',
    fontSize: 12,
  },
});

export default ChatInput;
