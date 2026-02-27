import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function RechargeNotes() {
  const { colors } = useTheme();

  const notes = [
    '充值后点数立即到账，不可退款',
    '点数永不过期',
    '如遇问题请联系客服',
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      <Text style={[styles.title, { color: colors.textMuted }]}>充值说明</Text>
      {notes.map((note, i) => (
        <Text key={i} style={[styles.note, { color: colors.textMuted }]}>
          · {note}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
  },
});
