import { formatRelativeTime, formatDateTime, formatDate } from '../../utils/timeFormat';

describe('formatRelativeTime', () => {
  test('returns "刚刚" for less than 60 seconds ago', () => {
    const now = new Date();
    const dateStr = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(formatRelativeTime(dateStr)).toBe('刚刚');
  });

  test('returns "X分钟前" for less than 60 minutes ago', () => {
    const now = new Date();
    const dateStr = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(dateStr)).toBe('5分钟前');
  });

  test('returns "1分钟前" for exactly 60 seconds ago', () => {
    const now = new Date();
    const dateStr = new Date(now.getTime() - 60 * 1000).toISOString();
    expect(formatRelativeTime(dateStr)).toBe('1分钟前');
  });

  test('returns "X小时前" for less than 24 hours ago', () => {
    const now = new Date();
    const dateStr = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(dateStr)).toBe('3小时前');
  });

  test('returns "1小时前" for exactly 60 minutes ago', () => {
    const now = new Date();
    const dateStr = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(dateStr)).toBe('1小时前');
  });

  test('returns "X天前" for less than 7 days ago', () => {
    const now = new Date();
    const dateStr = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(dateStr)).toBe('3天前');
  });

  test('returns "1天前" for exactly 24 hours ago', () => {
    const now = new Date();
    const dateStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(dateStr)).toBe('1天前');
  });

  test('returns formatted date for 7+ days ago', () => {
    const dateStr = '2024-01-15T10:30:00Z';
    expect(formatRelativeTime(dateStr)).toBe('2024-01-15');
  });

  test('returns formatted date for old dates', () => {
    const dateStr = '2023-06-20T08:00:00Z';
    expect(formatRelativeTime(dateStr)).toBe('2023-06-20');
  });
});

describe('formatDateTime', () => {
  test('formats date and time correctly', () => {
    // Use a local time to avoid timezone issues
    const date = new Date(2025, 1, 27, 14, 30); // Feb 27, 2025 14:30 local
    expect(formatDateTime(date.toISOString())).toBe('2025-02-27 14:30');
  });

  test('pads single digit month and day', () => {
    const date = new Date(2025, 0, 5, 9, 5); // Jan 5, 2025 09:05 local
    expect(formatDateTime(date.toISOString())).toBe('2025-01-05 09:05');
  });
});

describe('formatDate', () => {
  test('formats date correctly', () => {
    const date = new Date(2025, 1, 27); // Feb 27, 2025 local
    expect(formatDate(date.toISOString())).toBe('2025-02-27');
  });

  test('pads single digit month and day', () => {
    const date = new Date(2025, 0, 5); // Jan 5, 2025 local
    expect(formatDate(date.toISOString())).toBe('2025-01-05');
  });
});
