/**
 * GenNovel Message System - MessageSkeleton Component
 * Loading placeholder for message list
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme';

interface MessageSkeletonProps {
  count?: number;
}

function SkeletonItem() {
  const { colors, borderRadius } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSecondary,
          borderRadius: borderRadius.lg,
        },
      ]}
    >
      {/* Icon skeleton */}
      <Animated.View
        style={[
          styles.iconSkeleton,
          {
            backgroundColor: colors.bgTertiary,
            borderRadius: borderRadius.md,
            opacity,
          },
        ]}
      />

      {/* Content skeleton */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.titleSkeleton,
            {
              backgroundColor: colors.bgTertiary,
              borderRadius: borderRadius.sm,
              opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.previewSkeleton,
            {
              backgroundColor: colors.bgTertiary,
              borderRadius: borderRadius.sm,
              opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.timeSkeleton,
            {
              backgroundColor: colors.bgTertiary,
              borderRadius: borderRadius.sm,
              opacity,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function MessageSkeleton({ count = 3 }: MessageSkeletonProps) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  container: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    alignItems: 'flex-start',
    gap: 12,
  },
  iconSkeleton: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  titleSkeleton: {
    height: 16,
    width: '70%',
  },
  previewSkeleton: {
    height: 14,
    width: '90%',
  },
  timeSkeleton: {
    height: 12,
    width: '30%',
    marginTop: 4,
  },
});

export default MessageSkeleton;
