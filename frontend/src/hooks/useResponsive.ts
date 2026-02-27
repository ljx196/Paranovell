/**
 * GenNovel - Responsive Hook
 * Provides responsive breakpoint utilities
 */

import { useWindowDimensions } from 'react-native';
import { layout } from '../theme/spacing';

interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

export function useResponsive(): ResponsiveState {
  const { width, height } = useWindowDimensions();

  const isMobile = width < layout.mobileBreakpoint;
  const isTablet = width >= layout.mobileBreakpoint && width < layout.tabletBreakpoint;
  const isDesktop = width >= layout.tabletBreakpoint;

  const breakpoint = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
  };
}

export function useMessagePadding() {
  const { isMobile } = useResponsive();
  return isMobile ? layout.mobileBreakpoint : 48;
}
