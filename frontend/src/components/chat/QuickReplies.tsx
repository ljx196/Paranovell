import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme';

interface QuickReplyItem {
  id: number;
  content: string;
}

interface QuickRepliesProps {
  items: QuickReplyItem[];
  onSelect: (content: string) => void;
}

export function QuickReplies({ items, onSelect }: QuickRepliesProps) {
  const { colors, spacing, borderRadius, typography } = useTheme();
  const [pressedId, setPressedId] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <View
      style={{
        width: '100%',
        maxWidth: 808,
        alignSelf: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xs,
        gap: spacing.xs,
      }}
    >
      {items.map((item) => {
        const isPressed = pressedId === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.content)}
            onPressIn={() => setPressedId(item.id)}
            onPressOut={() => setPressedId(null)}
            onHoverIn={() => setPressedId(item.id)}
            onHoverOut={() => setPressedId(null)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isPressed ? colors.bgTertiary : colors.bgSecondary,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: isPressed ? colors.inputFocusBorder : colors.border,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
            }}
            accessibilityRole="button"
            accessibilityLabel={item.content}
          >
            <View
              style={{
                width: 2,
                alignSelf: 'stretch',
                backgroundColor: colors.accent,
                borderRadius: 1,
                marginRight: spacing.sm,
              }}
            />
            <Text
              style={{
                fontSize: typography.auxiliary.fontSize,
                color: isPressed ? colors.textPrimary : colors.textSecondary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {item.content}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
