import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface UsageSkeletonProps {
  variant: 'overview' | 'transactions' | 'recharge';
}

function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: any }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width: width as any, height, backgroundColor: colors.border, borderRadius: 4, opacity },
        style,
      ]}
    />
  );
}

function OverviewSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 16 }}>
      {/* Balance card */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <SkeletonBlock width={80} height={14} />
        <SkeletonBlock width={160} height={36} style={{ marginTop: 8 }} />
        <View style={[styles.statsRow, { marginTop: 20 }]}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.statItem, { backgroundColor: colors.bgTertiary }]}>
              <SkeletonBlock width={50} height={12} />
              <SkeletonBlock width={60} height={16} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Chart card */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <View style={styles.chartHeader}>
          <SkeletonBlock width={80} height={16} />
          <SkeletonBlock width={60} height={28} />
        </View>
        <SkeletonBlock width="100%" height={200} style={{ marginTop: 12, borderRadius: 8 }} />
      </View>

      {/* Ranking card */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <SkeletonBlock width={120} height={16} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.rankingRow, { marginTop: 12 }]}>
            <SkeletonBlock width={24} height={14} />
            <SkeletonBlock width={100} height={14} />
            <SkeletonBlock width={80} height={6} />
            <SkeletonBlock width={60} height={13} />
          </View>
        ))}
      </View>
    </View>
  );
}

function TransactionsSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {/* Filters */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <SkeletonBlock width={70} height={36} style={{ borderRadius: 8 }} />
        <SkeletonBlock width={90} height={36} style={{ borderRadius: 8 }} />
      </View>

      {/* Items */}
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <SkeletonBlock width={40} height={40} style={{ borderRadius: 8 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <SkeletonBlock width={80} height={15} />
              <SkeletonBlock width={70} height={15} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <SkeletonBlock width={140} height={13} />
              <SkeletonBlock width={80} height={12} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function RechargeSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 24 }}>
      {/* Balance display */}
      <View>
        <SkeletonBlock width={60} height={14} />
        <SkeletonBlock width={120} height={24} style={{ marginTop: 4 }} />
      </View>

      {/* Presets */}
      <View>
        <SkeletonBlock width={100} height={16} style={{ marginBottom: 12 }} />
        <View style={styles.presetsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.presetItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <SkeletonBlock width={50} height={18} />
              <SkeletonBlock width={60} height={13} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Custom input */}
      <View>
        <SkeletonBlock width={80} height={16} style={{ marginBottom: 12 }} />
        <SkeletonBlock width="100%" height={48} style={{ borderRadius: 12 }} />
      </View>

      {/* Button */}
      <SkeletonBlock width="100%" height={48} style={{ borderRadius: 8 }} />
    </View>
  );
}

export default function UsageSkeleton({ variant }: UsageSkeletonProps) {
  switch (variant) {
    case 'overview':
      return <OverviewSkeleton />;
    case 'transactions':
      return <TransactionsSkeleton />;
    case 'recharge':
      return <RechargeSkeleton />;
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetItem: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 80,
    justifyContent: 'center',
  },
});
