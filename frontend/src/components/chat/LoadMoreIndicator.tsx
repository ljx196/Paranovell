/**
 * GenNovel Design System - Load More Indicator Component
 * Shows loading spinner or "no more messages" text
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { useTheme } from '../../theme';

interface LoadMoreIndicatorProps {
  visible?: boolean;
  loading?: boolean;
  noMore?: boolean;
}

function Spinner() {
  const { colors } = useTheme();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.spinner,
        {
          borderColor: colors.border,
          borderTopColor: colors.accent,
          transform: [{ rotate: spin }],
        },
      ]}
    />
  );
}

export function LoadMoreIndicator({
  visible = false,
  loading = false,
  noMore = false,
}: LoadMoreIndicatorProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {loading && <Spinner />}
      <Text style={[styles.text, { color: colors.textMuted }]}>
        {noMore ? '没有更多消息了' : '加载更多消息...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  spinner: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 9,
  },
  text: {
    fontSize: 14,
  },
});

export default LoadMoreIndicator;
