/**
 * 错误信息映射工具
 * 将后端技术性错误转换为用户友好的中文提示
 */

// 错误信息映射表
const errorPatterns: Array<{ pattern: RegExp; message: string }> = [
  // 邮箱验证错误
  { pattern: /Email.*email/i, message: '请输入有效的邮箱地址' },
  { pattern: /Email.*required/i, message: '请输入邮箱地址' },

  // 密码验证错误
  { pattern: /Password.*required/i, message: '请输入密码' },
  { pattern: /Password.*min/i, message: '密码至少需要8个字符' },
  { pattern: /Password.*max/i, message: '密码长度不能超过128个字符' },

  // 通用验证错误
  { pattern: /required/i, message: '请填写必填字段' },
  { pattern: /Field validation/i, message: '输入格式不正确' },

  // 认证错误
  { pattern: /invalid.*credentials/i, message: '邮箱或密码错误' },
  { pattern: /user.*not.*found/i, message: '用户不存在' },
  { pattern: /email.*already.*exists/i, message: '该邮箱已被注册' },
  { pattern: /email.*registered/i, message: '该邮箱已被注册' },
  { pattern: /invalid.*password/i, message: '密码错误' },
  { pattern: /account.*disabled/i, message: '账户已被禁用' },
  { pattern: /email.*not.*verified/i, message: '邮箱未验证，请先验证邮箱' },
  { pattern: /token.*expired/i, message: '验证已过期，请重新操作' },
  { pattern: /token.*invalid/i, message: '验证链接无效' },

  // 网络错误
  { pattern: /network/i, message: '网络连接失败，请检查网络' },
  { pattern: /fetch/i, message: '网络请求失败，请稍后重试' },
  { pattern: /timeout/i, message: '请求超时，请稍后重试' },

  // 服务器错误
  { pattern: /500|internal.*server/i, message: '服务器错误，请稍后重试' },
  { pattern: /502|bad.*gateway/i, message: '服务器暂时不可用' },
  { pattern: /503|service.*unavailable/i, message: '服务暂时不可用' },
];

/**
 * 将错误信息转换为用户友好的中文提示
 * @param error 原始错误信息
 * @returns 用户友好的错误提示
 */
export function formatErrorMessage(error: string | Error | unknown): string {
  // 获取错误字符串
  let errorStr = '';
  if (typeof error === 'string') {
    errorStr = error;
  } else if (error instanceof Error) {
    errorStr = error.message;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorStr = String((error as any).message);
  } else {
    return '操作失败，请稍后重试';
  }

  // 空错误
  if (!errorStr || errorStr.trim() === '') {
    return '操作失败，请稍后重试';
  }

  // 匹配错误模式
  for (const { pattern, message } of errorPatterns) {
    if (pattern.test(errorStr)) {
      return message;
    }
  }

  // 如果错误信息本身是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(errorStr)) {
    return errorStr;
  }

  // 默认错误
  return '操作失败，请稍后重试';
}
