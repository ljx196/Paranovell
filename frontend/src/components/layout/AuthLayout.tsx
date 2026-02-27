/**
 * GenNovel Design System - Auth Layout Component
 * Centered layout for authentication pages
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../../theme';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  slogan?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  slogan = 'AI 驱动的小说创作平台',
}: AuthLayoutProps) {
  const { colors, typography, spacing, toggleTheme, isDark, borderRadius } = useTheme();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Theme toggle */}
      <Pressable
        onPress={toggleTheme}
        accessibilityLabel={isDark ? '切换到浅色模式' : '切换到深色模式'}
        style={[
          styles.themeToggle,
          {
            backgroundColor: colors.bgTertiary,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        {isDark ? (
          <Sun size={18} color={colors.textSecondary} />
        ) : (
          <Moon size={18} color={colors.textSecondary} />
        )}
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoRow}>
              <View style={[styles.logoIcon, { backgroundColor: colors.accent }]}>
                <Text style={styles.logoLetterText}>G</Text>
              </View>
              <Text style={[styles.logoBrandText, { color: colors.textPrimary }]}>
                GenNovel
              </Text>
            </View>
            {slogan ? (
              <Text style={[styles.slogan, { color: colors.textMuted }]}>
                {slogan}
              </Text>
            ) : null}
          </View>

          {/* Title / Subtitle */}
          <Text
            style={[
              styles.title,
              {
                color: colors.textPrimary,
                fontSize: typography.pageTitle.fontSize,
              },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                  fontSize: typography.body.fontSize,
                },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}

          {/* Form content (no Card wrapper) */}
          <View style={styles.form}>{children}</View>

          {/* Footer */}
          <Text style={[styles.footer, { color: colors.textMuted }]}>
            © 2025 GenNovel
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetterText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoBrandText: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  slogan: {
    fontSize: 13,
    marginTop: 8,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 48,
  },
});

export default AuthLayout;
