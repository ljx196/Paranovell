/**
 * GenNovel Design System - Color Constants
 * Based on docs/design-system.md
 */

export const darkColors = {
  // Background layers
  bgPrimary: '#1A1A1A',
  bgSecondary: '#262626',
  bgTertiary: '#2A2A2A',

  // Sidebar
  sidebarBg: '#141414',
  sidebarHover: '#1E1E1E',

  // Text
  textPrimary: '#EAE6DF',
  textSecondary: '#A8A29E',
  textMuted: '#6B6560',

  // Accent
  accent: '#D4836A',
  accentHover: '#E09478',

  // Border
  border: '#333333',

  // Message area
  msgUserBg: '#242424',
  msgAiBg: 'transparent',

  // Input
  inputBg: '#262626',
  inputBorder: '#3D3D3D',
  inputFocusBorder: '#4D4D4D',

  // Scrollbar
  scrollbarThumb: '#4A4A4A',
  scrollbarHover: '#5A5A5A',

  // Balance - transaction type colors
  income: '#4CAF50',
  expense: '#D4836A',
  gift: '#9C27B0',
  referral: '#FF9800',
  refund: '#2196F3',

  // Balance - status colors
  balanceLow: '#FF9800',
  balanceCritical: '#E57373',

  // Balance - chart colors
  chartLine: '#D4836A',
  chartFill: 'rgba(212,131,106,0.1)',
  chartGrid: '#333333',

  // Semantic
  error: '#EF4444',
  errorLight: 'rgba(239,68,68,0.1)',
  success: '#22C55E',
  successLight: 'rgba(34,197,94,0.1)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.1)',
};

export const lightColors = {
  // Background layers
  bgPrimary: '#F0EEEB',
  bgSecondary: '#F5F3F0',
  bgTertiary: '#E8E6E3',

  // Sidebar
  sidebarBg: '#E2DFD9',
  sidebarHover: '#D9D6D0',

  // Text
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',

  // Accent
  accent: '#C4704F',
  accentHover: '#B5614A',

  // Border
  border: '#E7E5E4',

  // Message area
  msgUserBg: '#E8E6E3',
  msgAiBg: 'transparent',

  // Input
  inputBg: '#F5F3F0',
  inputBorder: '#D6D3D1',
  inputFocusBorder: '#C4C4C4',

  // Scrollbar
  scrollbarThumb: '#C4C4C4',
  scrollbarHover: '#A0A0A0',

  // Balance - transaction type colors
  income: '#388E3C',
  expense: '#C4704F',
  gift: '#7B1FA2',
  referral: '#F57C00',
  refund: '#1976D2',

  // Balance - status colors
  balanceLow: '#F57C00',
  balanceCritical: '#E53935',

  // Balance - chart colors
  chartLine: '#C4704F',
  chartFill: 'rgba(196,112,79,0.1)',
  chartGrid: '#E7E5E4',

  // Semantic
  error: '#DC2626',
  errorLight: 'rgba(220,38,38,0.06)',
  success: '#16A34A',
  successLight: 'rgba(22,163,74,0.06)',
  warning: '#D97706',
  warningLight: 'rgba(217,119,6,0.06)',
};

export type ThemeColors = typeof darkColors;
export type ThemeMode = 'dark' | 'light';
