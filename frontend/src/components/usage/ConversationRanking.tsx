import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import type { ConversationUsage } from '../../types';

interface ConversationRankingProps {
  data: ConversationUsage[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onConversationPress: (conversationId: number) => void;
}

function formatPoints(val: number): string {
  return val.toLocaleString();
}

export default function ConversationRanking({
  data, isLoading, hasMore, onLoadMore, onConversationPress,
}: ConversationRankingProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const barWidth = isMobile ? 80 : 120;

  if (isLoading && data.length === 0) return null;

  const maxPoints = data.length > 0 ? Math.max(...data.map((d) => d.total_points), 1) : 1;

  return (
    <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>会话消费排行</Text>

      {data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>💬</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            开始对话即可看到消费排行
          </Text>
        </View>
      ) : (
        <>
          {data.map((item, index) => {
            const ratio = item.total_points / maxPoints;
            const isTop3 = index < 3;
            return (
              <TouchableOpacity
                key={item.conversation_id}
                activeOpacity={0.7}
                onPress={() => onConversationPress(item.conversation_id)}
                style={[
                  styles.rankItem,
                  index < data.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                accessibilityLabel={`${item.title} ${formatPoints(item.total_points)}点`}
              >
                <Text
                  style={[
                    styles.rank,
                    { color: isTop3 ? colors.accent : colors.textMuted },
                  ]}
                >
                  {index + 1}
                </Text>
                <Text style={[styles.convTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.title || '未命名会话'}
                </Text>
                <View style={[styles.barBg, { width: barWidth, backgroundColor: colors.bgTertiary }]}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${ratio * 100}%`, backgroundColor: colors.accent },
                    ]}
                  />
                </View>
                <Text style={[styles.points, { color: colors.textSecondary }]}>
                  {formatPoints(item.total_points)}点
                </Text>
              </TouchableOpacity>
            );
          })}

          {hasMore && (
            <TouchableOpacity onPress={onLoadMore} style={styles.loadMore}>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : (
                <Text style={[styles.loadMoreText, { color: colors.textMuted }]}>查看全部</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rank: {
    width: 24,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  convTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  points: {
    width: 80,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '500',
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadMoreText: {
    fontSize: 14,
  },
});
