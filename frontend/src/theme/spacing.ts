/**
 * GenNovel Design System - Spacing System
 * Base unit: 4px
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const padding = {
  compact: { vertical: 8, horizontal: 12 },
  normal: { vertical: 12, horizontal: 16 },
  relaxed: { vertical: 16, horizontal: 20 },
} as const;

export const messagePadding = {
  desktop: { horizontal: 48, vertical: 24 },
  mobile: { horizontal: 16, vertical: 24 },
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const layout = {
  sidebarWidth: 260,
  contentMaxWidth: 768,
  headerHeight: 48,
  inputAreaHeight: 80,
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Layout = typeof layout;
