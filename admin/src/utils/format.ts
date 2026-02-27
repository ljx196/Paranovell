import dayjs from 'dayjs';

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function formatYuan(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export function formatPoints(amount: number): string {
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${amount.toLocaleString()}`;
}

export function formatDateTime(dateStr: string): string {
  return dayjs(dateStr).format('MM-DD HH:mm');
}

export function formatFullDateTime(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
}

export function formatChangeRate(today: number, yesterday: number): {
  text: string;
  isUp: boolean;
} {
  if (yesterday === 0) {
    return { text: today > 0 ? '+100%' : '0%', isUp: today > 0 };
  }
  const rate = ((today - yesterday) / yesterday * 100).toFixed(1);
  const isUp = parseFloat(rate) >= 0;
  return { text: `${isUp ? '↑' : '↓'} ${Math.abs(parseFloat(rate))}%`, isUp };
}

export const ACTION_LABELS: Record<string, string> = {
  'user.disable': '封禁用户',
  'user.enable': '解封用户',
  'user.reset_password': '重置密码',
  'user.adjust_balance': '手动调账',
  'order.refund': '订单退款',
  'message.broadcast': '群发公告',
  'message.delete': '删除公告',
  'config.update': '修改配置',
  'content.review': '审查对话',
  'content.delete_conversation': '删除违规对话',
  'content.scan': '内容扫描',
  'sensitive_word.create': '新增敏感词',
  'sensitive_word.update': '修改敏感词',
  'sensitive_word.delete': '删除敏感词',
};

export const ORDER_STATUS_MAP: Record<number, { text: string; variant: string }> = {
  0: { text: '待支付', variant: 'warning' },
  1: { text: '已支付', variant: 'success' },
  2: { text: '已取消', variant: 'error' },
  3: { text: '已退款', variant: 'info' },
};

export const TRANSACTION_TYPE_MAP: Record<string, { text: string; variant: string; color: string }> = {
  recharge:    { text: '充值',     variant: 'success', color: '#52c41a' },
  consumption: { text: '消费',     variant: 'error',   color: '#ff4d4f' },
  gift:        { text: '赠送',     variant: 'purple',  color: '#722ed1' },
  referral:    { text: '邀请奖励', variant: 'warning', color: '#faad14' },
  refund:      { text: '退款',     variant: 'info',    color: '#1677ff' },
};

export const MSG_TYPE_MAP: Record<string, { text: string; variant: string }> = {
  notice:  { text: '系统公告', variant: 'info' },
  account: { text: '账户通知', variant: 'warning' },
  usage:   { text: '用量提醒', variant: 'purple' },
};

export const USER_STATUS_MAP: Record<number, { text: string; variant: string }> = {
  0: { text: '封禁', variant: 'error' },
  1: { text: '正常', variant: 'success' },
};

export const AUDIT_ACTION_BADGE: Record<string, string> = {
  'user.disable': 'error',
  'user.enable': 'success',
  'user.adjust_balance': 'info',
  'user.reset_password': 'purple',
  'message.broadcast': 'success',
  'message.delete': 'error',
  'config.update': 'warning',
  'order.refund': 'info',
  'content.review': 'warning',
  'content.delete_conversation': 'error',
  'content.scan': 'info',
  'sensitive_word.create': 'success',
  'sensitive_word.update': 'warning',
  'sensitive_word.delete': 'error',
};

export const REVIEW_STATUS_MAP: Record<string, { text: string; variant: string }> = {
  pending: { text: '待审查', variant: 'warning' },
  approved: { text: '已通过', variant: 'success' },
  violated: { text: '已违规', variant: 'error' },
  dismissed: { text: '已忽略', variant: 'info' },
};

export const FLAG_TYPE_MAP: Record<string, { text: string; variant: string }> = {
  manual: { text: '手动', variant: 'warning' },
  auto: { text: '自动', variant: 'error' },
};

export const SENSITIVE_CATEGORY_MAP: Record<string, { text: string; color: string }> = {
  violence: { text: '暴力', color: '#ff4d4f' },
  porn: { text: '色情', color: '#ff85c0' },
  politics: { text: '政治', color: '#faad14' },
  ad: { text: '广告', color: '#1677ff' },
  other: { text: '其他', color: '#8c8c8c' },
};

export const REVIEW_ACTION_MAP: Record<string, string> = {
  none: '仅标记',
  delete_conversation: '删除对话',
  ban_user: '封禁用户',
};
