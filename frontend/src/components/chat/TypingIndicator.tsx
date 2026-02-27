/**
 * GenNovel Design System - Typing Indicator Component
 * Animated typing dots
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { useTheme } from '../../theme';

interface TypingIndicatorProps {
  visible?: boolean;
}

function TypingDot({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          delay,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: colors.accent,
          opacity,
        },
      ]}
    />
  );
}

export function TypingIndicator({ visible = true }: TypingIndicatorProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TypingDot delay={0} />
      <TypingDot delay={200} />
      <TypingDot delay={400} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TypingIndicator;
