import { formatErrorMessage } from '../../utils/errorMessages';

describe('formatErrorMessage', () => {
  // Email validation errors
  test('maps email format error', () => {
    expect(formatErrorMessage('Email must be a valid email')).toBe('请输入有效的邮箱地址');
  });

  test('maps email required error', () => {
    expect(formatErrorMessage('Email is required')).toBe('请输入邮箱地址');
  });

  // Password validation errors
  test('maps password required error', () => {
    expect(formatErrorMessage('Password is required')).toBe('请输入密码');
  });

  test('maps password min length error', () => {
    expect(formatErrorMessage('Password must be at least min 8 characters')).toBe('密码至少需要8个字符');
  });

  test('maps password max length error', () => {
    expect(formatErrorMessage('Password exceeds max length')).toBe('密码长度不能超过128个字符');
  });

  // Generic validation errors
  test('maps required field error', () => {
    expect(formatErrorMessage('field is required')).toBe('请填写必填字段');
  });

  test('maps field validation error', () => {
    expect(formatErrorMessage('Field validation failed')).toBe('输入格式不正确');
  });

  // Auth errors
  test('maps invalid credentials error', () => {
    expect(formatErrorMessage('invalid credentials')).toBe('邮箱或密码错误');
  });

  test('maps user not found error', () => {
    expect(formatErrorMessage('user not found')).toBe('用户不存在');
  });

  test('maps email already exists error', () => {
    expect(formatErrorMessage('email already exists')).toBe('该邮箱已被注册');
  });

  test('maps email registered error', () => {
    expect(formatErrorMessage('email already registered')).toBe('该邮箱已被注册');
  });

  test('maps invalid password error', () => {
    expect(formatErrorMessage('invalid password')).toBe('密码错误');
  });

  test('maps account disabled error', () => {
    expect(formatErrorMessage('account disabled')).toBe('账户已被禁用');
  });

  test('maps email not verified error', () => {
    expect(formatErrorMessage('email not verified')).toBe('邮箱未验证，请先验证邮箱');
  });

  test('maps token expired error', () => {
    expect(formatErrorMessage('token expired')).toBe('验证已过期，请重新操作');
  });

  test('maps token invalid error', () => {
    expect(formatErrorMessage('token invalid')).toBe('验证链接无效');
  });

  // Network errors
  test('maps network error', () => {
    expect(formatErrorMessage('network error')).toBe('网络连接失败，请检查网络');
  });

  test('maps fetch error', () => {
    expect(formatErrorMessage('fetch failed')).toBe('网络请求失败，请稍后重试');
  });

  test('maps timeout error', () => {
    expect(formatErrorMessage('request timeout')).toBe('请求超时，请稍后重试');
  });

  // Server errors
  test('maps 500 server error', () => {
    expect(formatErrorMessage('500 Internal Server Error')).toBe('服务器错误，请稍后重试');
  });

  test('maps 502 bad gateway error', () => {
    expect(formatErrorMessage('502 Bad Gateway')).toBe('服务器暂时不可用');
  });

  test('maps 503 service unavailable error', () => {
    expect(formatErrorMessage('503 Service Unavailable')).toBe('服务暂时不可用');
  });

  // Error object input
  test('handles Error object', () => {
    expect(formatErrorMessage(new Error('network error'))).toBe('网络连接失败，请检查网络');
  });

  // Object with .message property
  test('handles object with message property', () => {
    expect(formatErrorMessage({ message: 'token expired' })).toBe('验证已过期，请重新操作');
  });

  // Unknown/null/undefined → default
  test('returns default for null', () => {
    expect(formatErrorMessage(null)).toBe('操作失败，请稍后重试');
  });

  test('returns default for undefined', () => {
    expect(formatErrorMessage(undefined)).toBe('操作失败，请稍后重试');
  });

  test('returns default for number', () => {
    expect(formatErrorMessage(42)).toBe('操作失败，请稍后重试');
  });

  // Empty string → default
  test('returns default for empty string', () => {
    expect(formatErrorMessage('')).toBe('操作失败，请稍后重试');
  });

  test('returns default for whitespace string', () => {
    expect(formatErrorMessage('   ')).toBe('操作失败，请稍后重试');
  });

  // Chinese passthrough
  test('passes through Chinese error message', () => {
    expect(formatErrorMessage('自定义中文错误')).toBe('自定义中文错误');
  });

  // Unmatched English → default
  test('returns default for unmatched English', () => {
    expect(formatErrorMessage('some random english error')).toBe('操作失败，请稍后重试');
  });
});
