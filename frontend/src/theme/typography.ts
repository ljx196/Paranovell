/**
 * GenNovel Design System - Typography
 */

import { Platform } from 'react-native';

export const fontFamily = Platform.select({
  ios: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif',
  android: 'Roboto, "Noto Sans SC", sans-serif',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif',
  default: 'System',
});

export const fontSize = {
  pageTitle: 24,
  sectionTitle: 18,
  bodyLarge: 16,
  body: 15,
  auxiliary: 14,
  small: 12,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
};

export const lineHeight = {
  pageTitle: 1.3,
  sectionTitle: 1.4,
  bodyLarge: 1.6,
  body: 1.8,
  auxiliary: 1.5,
  small: 1.4,
} as const;

export const typography = {
  pageTitle: {
    fontSize: fontSize.pageTitle,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.pageTitle * lineHeight.pageTitle,
  },
  sectionTitle: {
    fontSize: fontSize.sectionTitle,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.sectionTitle * lineHeight.sectionTitle,
  },
  bodyLarge: {
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.bodyLarge * lineHeight.bodyLarge,
  },
  body: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.body * lineHeight.body,
  },
  auxiliary: {
    fontSize: fontSize.auxiliary,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.auxiliary * lineHeight.auxiliary,
  },
  small: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.small * lineHeight.small,
  },
} as const;

export type Typography = typeof typography;
