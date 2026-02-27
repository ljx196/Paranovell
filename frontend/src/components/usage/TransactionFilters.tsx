import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { TransactionFilter, TransactionFilterType } from '../../types';

interface TransactionFiltersProps {
  filter: TransactionFilter;
  onFilterChange: (filter: Partial<TransactionFilter>) => void;
}

const TYPE_OPTIONS: { label: string; value: TransactionFilterType }[] = [
  { label: '全部', value: 'all' },
  { label: '充值', value: 'recharge' },
  { label: '消费', value: 'consumption' },
  { label: '赠送/奖励', value: 'gift_referral' },
];

const DAYS_OPTIONS: { label: string; value: number }[] = [
  { label: '最近7天', value: 7 },
  { label: '最近30天', value: 30 },
  { label: '最近90天', value: 90 },
  { label: '最近180天', value: 180 },
];

function DropdownFilter<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (val: T) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const currentLabel = options.find((o) => o.value === value)?.label || label;

  return (
    <View style={styles.filterWrapper}>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={[styles.filterBtn, { backgroundColor: colors.bgTertiary }]}
        accessibilityLabel={label}
      >
        <Text style={[styles.filterText, { color: colors.textSecondary }]}>{currentLabel}</Text>
        <Text style={[styles.filterArrow, { color: colors.textSecondary }]}> ▾</Text>
      </TouchableOpacity>

      {open && (
        <>
          {/* Backdrop */}
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
          />
          {/* Dropdown */}
          <View style={[styles.dropdown, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <TouchableOpacity
                  key={String(option.value)}
                  style={[styles.option, isSelected && { backgroundColor: colors.bgTertiary }]}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Text style={[styles.check, { color: colors.accent }]}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

export default function TransactionFilters({ filter, onFilterChange }: TransactionFiltersProps) {
  return (
    <View style={styles.container}>
      <DropdownFilter
        label="类型"
        options={TYPE_OPTIONS}
        value={filter.type}
        onChange={(type) => onFilterChange({ type })}
      />
      <DropdownFilter
        label="时间"
        options={DAYS_OPTIONS}
        value={filter.days}
        onChange={(days) => onFilterChange({ days })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    zIndex: 100,
  },
  filterWrapper: {
    position: 'relative',
    zIndex: 100,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 13,
  },
  filterArrow: {
    fontSize: 13,
  },
  backdrop: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 160,
    overflow: 'hidden',
    zIndex: 100,
    // @ts-ignore
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 14,
  },
  check: {
    fontSize: 14,
    fontWeight: '600',
  },
});
