import { useWindowDimensions } from 'react-native';
import { useResponsive, useMessagePadding } from '../../hooks/useResponsive';

const mockUseWindowDimensions = useWindowDimensions as jest.Mock;

describe('useResponsive', () => {
  test('returns mobile for width < 768', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 375, height: 812 });
    const result = useResponsive();
    expect(result.isMobile).toBe(true);
    expect(result.isTablet).toBe(false);
    expect(result.isDesktop).toBe(false);
    expect(result.breakpoint).toBe('mobile');
  });

  test('returns mobile at boundary 767', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 767, height: 600 });
    const result = useResponsive();
    expect(result.isMobile).toBe(true);
    expect(result.isTablet).toBe(false);
    expect(result.isDesktop).toBe(false);
  });

  test('returns tablet at boundary 768', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 768, height: 1024 });
    const result = useResponsive();
    expect(result.isMobile).toBe(false);
    expect(result.isTablet).toBe(true);
    expect(result.isDesktop).toBe(false);
    expect(result.breakpoint).toBe('tablet');
  });

  test('returns tablet at boundary 1023', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 1023, height: 600 });
    const result = useResponsive();
    expect(result.isMobile).toBe(false);
    expect(result.isTablet).toBe(true);
    expect(result.isDesktop).toBe(false);
  });

  test('returns desktop at boundary 1024', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 768 });
    const result = useResponsive();
    expect(result.isMobile).toBe(false);
    expect(result.isTablet).toBe(false);
    expect(result.isDesktop).toBe(true);
    expect(result.breakpoint).toBe('desktop');
  });

  test('returns desktop for large width', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 1920, height: 1080 });
    const result = useResponsive();
    expect(result.isDesktop).toBe(true);
    expect(result.breakpoint).toBe('desktop');
  });

  test('includes width and height in result', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 500, height: 800 });
    const result = useResponsive();
    expect(result.width).toBe(500);
    expect(result.height).toBe(800);
  });

  test('exactly one breakpoint is true at any width', () => {
    for (const w of [100, 767, 768, 1023, 1024, 2000]) {
      mockUseWindowDimensions.mockReturnValue({ width: w, height: 600 });
      const result = useResponsive();
      const trueCount = [result.isMobile, result.isTablet, result.isDesktop].filter(Boolean).length;
      expect(trueCount).toBe(1);
    }
  });
});

describe('useMessagePadding', () => {
  test('returns mobile padding for small screens', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 375, height: 812 });
    expect(useMessagePadding()).toBe(768); // layout.mobileBreakpoint
  });

  test('returns desktop padding for large screens', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 768 });
    expect(useMessagePadding()).toBe(48);
  });
});
