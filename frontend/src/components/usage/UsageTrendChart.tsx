import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import PeriodSelector from './PeriodSelector';
import PricingInfo from './PricingInfo';
import type { DailyUsageExtended, PricingInfo as PricingInfoType } from '../../types';

interface UsageTrendChartProps {
  data: DailyUsageExtended[];
  period: number;
  onPeriodChange: (days: number) => void;
  pricing: PricingInfoType | null;
  isLoading: boolean;
}

const CHART_HEIGHT = 200;
const PAD = { top: 20, right: 16, bottom: 30, left: 16 };

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function UsageTrendChart({
  data, period, onPeriodChange, pricing, isLoading,
}: UsageTrendChartProps) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const chartW = containerWidth - PAD.left - PAD.right;
  const chartH = CHART_HEIGHT - PAD.top - PAD.bottom;

  const values = data.map((d) => d.points_consumed);
  const maxVal = Math.max(...values, 1);

  const getX = (i: number) => {
    if (data.length <= 1) return PAD.left + chartW / 2;
    return PAD.left + (i / (data.length - 1)) * chartW;
  };
  const getY = (val: number) => PAD.top + chartH - (val / maxVal) * chartH;

  // Build SVG paths
  let linePath = '';
  let areaPath = '';
  const points: { x: number; y: number; val: number; date: string }[] = [];

  if (data.length > 0 && containerWidth > 0) {
    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.points_consumed);
      points.push({ x, y, val: d.points_consumed, date: d.date });
      if (i === 0) {
        linePath = `M ${x},${y}`;
        areaPath = `M ${x},${y}`;
      } else {
        linePath += ` L ${x},${y}`;
        areaPath += ` L ${x},${y}`;
      }
    });
    // Close area path
    const lastX = getX(data.length - 1);
    const firstX = getX(0);
    const bottom = PAD.top + chartH;
    areaPath += ` L ${lastX},${bottom} L ${firstX},${bottom} Z`;
  }

  // Reference lines (3 horizontal)
  const refLines = [0.25, 0.5, 0.75].map((ratio) => PAD.top + chartH * (1 - ratio));

  // X-axis labels: show max ~7 labels
  const labelStep = Math.max(1, Math.floor(data.length / 7));
  const xLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);

  return (
    <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>用量趋势</Text>
        <PeriodSelector value={period} onChange={onPeriodChange} />
      </View>

      <View style={styles.chartContainer} onLayout={onLayout}>
        {data.length === 0 ? (
          <View style={styles.emptyChart}>
            <Text style={{ fontSize: 32 }}>📊</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>暂无用量数据</Text>
          </View>
        ) : containerWidth > 0 ? (
          <Svg width={containerWidth} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.chartLine} stopOpacity="0.15" />
                <Stop offset="1" stopColor={colors.chartLine} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Reference lines */}
            {refLines.map((y, i) => (
              <Line
                key={i}
                x1={PAD.left}
                y1={y}
                x2={containerWidth - PAD.right}
                y2={y}
                stroke={colors.chartGrid}
                strokeDasharray="4 4"
                opacity={0.5}
              />
            ))}

            {/* Area fill */}
            {areaPath && (
              <Path d={areaPath} fill="url(#fillGradient)" />
            )}

            {/* Line */}
            {linePath && (
              <Path
                d={linePath}
                stroke={colors.chartLine}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {points.map((p, i) => (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={colors.chartLine}
                stroke={colors.bgSecondary}
                strokeWidth={2}
              />
            ))}

            {/* X-axis labels */}
            <G>
              {xLabels.map((d) => {
                const idx = data.indexOf(d);
                const x = getX(idx);
                return (
                  <SvgText
                    key={d.date}
                    x={x}
                    y={CHART_HEIGHT - 8}
                    textAnchor="middle"
                    fill={colors.textMuted}
                    fontSize={11}
                  >
                    {formatShortDate(d.date)}
                  </SvgText>
                );
              })}
            </G>
          </Svg>
        ) : null}
      </View>

      <PricingInfo pricing={pricing} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  chartContainer: {
    height: CHART_HEIGHT,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyChart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
});
