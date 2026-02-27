import { darkColors, lightColors } from '../../theme/colors';
import { spacing, padding, messagePadding, borderRadius, layout } from '../../theme/spacing';
import { fontSize, fontWeight, lineHeight, typography } from '../../theme/typography';

describe('theme colors', () => {
  test('darkColors and lightColors have identical key sets', () => {
    const darkKeys = Object.keys(darkColors).sort();
    const lightKeys = Object.keys(lightColors).sort();
    expect(darkKeys).toEqual(lightKeys);
  });

  test('darkColors has all required background keys', () => {
    expect(darkColors.bgPrimary).toBeDefined();
    expect(darkColors.bgSecondary).toBeDefined();
    expect(darkColors.bgTertiary).toBeDefined();
  });

  test('darkColors has all required text keys', () => {
    expect(darkColors.textPrimary).toBeDefined();
    expect(darkColors.textSecondary).toBeDefined();
    expect(darkColors.textMuted).toBeDefined();
  });

  test('darkColors has accent colors', () => {
    expect(darkColors.accent).toBeDefined();
    expect(darkColors.accentHover).toBeDefined();
  });

  test('darkColors has semantic colors', () => {
    expect(darkColors.error).toBeDefined();
    expect(darkColors.success).toBeDefined();
    expect(darkColors.warning).toBeDefined();
  });

  test('darkColors has balance colors', () => {
    expect(darkColors.income).toBeDefined();
    expect(darkColors.expense).toBeDefined();
    expect(darkColors.gift).toBeDefined();
    expect(darkColors.referral).toBeDefined();
    expect(darkColors.refund).toBeDefined();
    expect(darkColors.balanceLow).toBeDefined();
    expect(darkColors.balanceCritical).toBeDefined();
  });

  test('all color values are non-empty strings', () => {
    for (const [key, value] of Object.entries(darkColors)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
    for (const [key, value] of Object.entries(lightColors)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

describe('spacing constants', () => {
  test('spacing has correct values', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
    expect(spacing.xl).toBe(24);
    expect(spacing['2xl']).toBe(32);
    expect(spacing['3xl']).toBe(48);
  });

  test('layout has correct values', () => {
    expect(layout.sidebarWidth).toBe(260);
    expect(layout.contentMaxWidth).toBe(768);
    expect(layout.headerHeight).toBe(48);
    expect(layout.inputAreaHeight).toBe(80);
    expect(layout.mobileBreakpoint).toBe(768);
    expect(layout.tabletBreakpoint).toBe(1024);
  });

  test('borderRadius has expected values', () => {
    expect(borderRadius.sm).toBe(4);
    expect(borderRadius.md).toBe(8);
    expect(borderRadius.lg).toBe(12);
    expect(borderRadius.xl).toBe(16);
    expect(borderRadius.full).toBe(9999);
  });

  test('padding presets have correct structure', () => {
    expect(padding.compact).toEqual({ vertical: 8, horizontal: 12 });
    expect(padding.normal).toEqual({ vertical: 12, horizontal: 16 });
    expect(padding.relaxed).toEqual({ vertical: 16, horizontal: 20 });
  });

  test('messagePadding has desktop and mobile', () => {
    expect(messagePadding.desktop).toEqual({ horizontal: 48, vertical: 24 });
    expect(messagePadding.mobile).toEqual({ horizontal: 16, vertical: 24 });
  });
});

describe('typography constants', () => {
  test('fontSize has all expected sizes', () => {
    expect(fontSize.pageTitle).toBe(24);
    expect(fontSize.sectionTitle).toBe(18);
    expect(fontSize.bodyLarge).toBe(16);
    expect(fontSize.body).toBe(15);
    expect(fontSize.auxiliary).toBe(14);
    expect(fontSize.small).toBe(12);
  });

  test('fontWeight has all expected weights', () => {
    expect(fontWeight.normal).toBe('400');
    expect(fontWeight.medium).toBe('500');
    expect(fontWeight.semibold).toBe('600');
  });

  test('lineHeight has all expected values', () => {
    expect(lineHeight.pageTitle).toBe(1.3);
    expect(lineHeight.sectionTitle).toBe(1.4);
    expect(lineHeight.bodyLarge).toBe(1.6);
    expect(lineHeight.body).toBe(1.8);
    expect(lineHeight.auxiliary).toBe(1.5);
    expect(lineHeight.small).toBe(1.4);
  });

  test('typography presets have correct computed lineHeight', () => {
    expect(typography.pageTitle.lineHeight).toBeCloseTo(24 * 1.3);
    expect(typography.sectionTitle.lineHeight).toBeCloseTo(18 * 1.4);
    expect(typography.bodyLarge.lineHeight).toBeCloseTo(16 * 1.6);
    expect(typography.body.lineHeight).toBeCloseTo(15 * 1.8);
    expect(typography.auxiliary.lineHeight).toBeCloseTo(14 * 1.5);
    expect(typography.small.lineHeight).toBeCloseTo(12 * 1.4);
  });

  test('typography presets have correct fontSize and fontWeight', () => {
    expect(typography.pageTitle.fontSize).toBe(24);
    expect(typography.pageTitle.fontWeight).toBe('600');
    expect(typography.body.fontSize).toBe(15);
    expect(typography.body.fontWeight).toBe('400');
    expect(typography.small.fontWeight).toBe('500');
  });
});
