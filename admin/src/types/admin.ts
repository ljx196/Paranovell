// ==================== 通用 ====================

export interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
}

// ==================== 认证 ====================

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface AdminUser {
  id: number;
  email: string;
  nickname: string;
  avatar_url: string;
  role: UserRole;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: number;
    email: string;
    nickname: string;
    avatar_url: string;
    role: UserRole;
  };
}

// ==================== 仪表盘 ====================

export interface DashboardStats {
  total_users: number;
  active_users: number;
  today_new_users: number;
  today_revenue: number;
  yesterday_users: number;
  yesterday_active: number;
  yesterday_new_users: number;
  yesterday_revenue: number;
}

export interface TrendItem {
  date: string;
  value: number;
}

export type TrendType = 'users' | 'revenue' | 'tokens';

export interface TrendParams {
  type: TrendType;
  days: number;
}

export interface RecentLog {
  id: number;
  admin_name: string;
  action: string;
  target_name: string;
  summary: string;
  created_at: string;
}

// ==================== 用户管理 ====================

export type UserStatus = 0 | 1;

export interface UserListItem {
  id: number;
  email: string;
  nickname: string;
  avatar_url: string;
  status: UserStatus;
  role: UserRole;
  balance: number;
  created_at: string;
}

export interface UserListParams extends PaginationParams, DateRangeParams {
  keyword?: string;
  status?: UserStatus;
}

export interface UserDetail {
  id: number;
  email: string;
  nickname: string;
  avatar_url: string;
  status: UserStatus;
  role: UserRole;
  invite_code: string;
  email_verified: boolean;
  created_at: string;
  last_active_at: string;
  balance: number;
  total_recharge: number;
  total_consumption: number;
  total_gift: number;
  recent_transactions: UserTransaction[];
}

export interface UserTransaction {
  id: number;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface UpdateStatusRequest {
  status: UserStatus;
  reason: string;
}

export type AdjustType = 'increase' | 'decrease';

export interface AdjustBalanceRequest {
  type: AdjustType;
  amount: number;
  reason: string;
}

export interface ResetPasswordRequest {
  send_email: boolean;
}

// ==================== 订单管理 ====================

export type OrderStatus = 0 | 1 | 2 | 3;

export interface OrderListItem {
  id: number;
  order_no: string;
  user_id: number;
  user_email: string;
  amount: number;
  points: number;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
  paid_at?: string;
}

export interface OrderListParams extends PaginationParams, DateRangeParams {
  status?: OrderStatus;
  payment_method?: string;
  user_email?: string;
}

export interface OrderSummary {
  total_count: number;
  paid_amount: number;
  pending_amount: number;
  cancelled_amount: number;
  refunded_amount: number;
}

// ==================== 交易流水 ====================

export type TransactionType = 'recharge' | 'consumption' | 'gift' | 'referral' | 'refund';

export interface TransactionListItem {
  id: number;
  user_id: number;
  user_email: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface TransactionListParams extends PaginationParams, DateRangeParams {
  type?: TransactionType;
  user_email?: string;
}

// ==================== 公告管理 ====================

export type MsgType = 'notice' | 'account' | 'usage';
export type AnnouncementTarget = 'all' | 'specific';

export interface AnnouncementListItem {
  id: number;
  msg_type: MsgType;
  title: string;
  content: string;
  target: AnnouncementTarget;
  recipient_count: number;
  read_rate: number;
  created_at: string;
}

export interface AnnouncementListParams extends PaginationParams {
  msg_type?: MsgType;
  start_date?: string;
  end_date?: string;
}

export interface CreateAnnouncementRequest {
  msg_type: MsgType;
  title: string;
  content: string;
  target: AnnouncementTarget;
  target_emails?: string[];
}

// ==================== 系统配置 ====================

export interface SystemConfigItem {
  key: string;
  value: string;
  value_type: 'string' | 'number' | 'bool' | 'json';
  description: string;
  updated_at: string;
}

export interface UpdateConfigsRequest {
  configs: Array<{
    key: string;
    value: string;
  }>;
}

// ==================== 操作日志 ====================

export type AuditAction =
  | 'user.disable'
  | 'user.enable'
  | 'user.reset_password'
  | 'user.adjust_balance'
  | 'order.refund'
  | 'message.broadcast'
  | 'message.delete'
  | 'config.update';

export type AuditTargetType = 'user' | 'order' | 'message' | 'config';

export interface AuditLogListItem {
  id: number;
  admin_id: number;
  admin_name: string;
  action: AuditAction;
  target_type: AuditTargetType;
  target_id: string;
  summary: string;
  ip: string;
  created_at: string;
}

export interface AuditLogDetail extends AuditLogListItem {
  detail: Record<string, unknown>;
}

export interface AuditLogListParams extends PaginationParams, DateRangeParams {
  action?: AuditAction;
  admin_name?: string;
  target_type?: AuditTargetType;
}

// ==================== 内容审查 ====================

export type ReviewStatus = 'pending' | 'approved' | 'violated' | 'dismissed';
export type FlagType = 'manual' | 'auto';
export type ReviewAction = 'none' | 'delete_conversation' | 'ban_user';
export type SensitiveCategory = 'violence' | 'porn' | 'politics' | 'ad' | 'other';

export interface ConversationReviewVO {
  id: number;
  status: ReviewStatus;
  flag_type: FlagType;
  flag_reason: string;
  created_at: string;
}

export interface ConversationListItem {
  conversation_id: string;
  title: string;
  user_id: number;
  user_email: string;
  user_nickname: string;
  model: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  review: ConversationReviewVO | null;
}

export interface ConversationListParams extends PaginationParams {
  user_id?: number;
  user_email?: string;
  review_status?: ReviewStatus;
  only_flagged?: boolean;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ConversationMessagesParams extends PaginationParams {
  user_id: number;
}

export interface FlagRequest {
  user_id: number;
  reason: string;
}

export interface ReviewRequest {
  user_id: number;
  status: ReviewStatus;
  action?: ReviewAction;
  reason?: string;
}

export interface ReviewListItem {
  id: number;
  conversation_id: string;
  user_id: number;
  user_email: string;
  status: ReviewStatus;
  flag_type: FlagType;
  flag_reason: string;
  reviewer_email?: string;
  reviewed_at?: string;
  action_taken: ReviewAction;
  created_at: string;
}

export interface ReviewListParams extends PaginationParams, DateRangeParams {
  status?: ReviewStatus;
  flag_type?: FlagType;
  user_id?: number;
}

export interface SensitiveWordItem {
  id: number;
  word: string;
  category: SensitiveCategory;
  is_enabled: boolean;
  created_by: number;
  creator_email: string;
  created_at: string;
}

export interface SensitiveWordListParams extends PaginationParams {
  category?: SensitiveCategory;
  keyword?: string;
  is_enabled?: boolean;
}

export interface BatchCreateSensitiveWordsRequest {
  words: Array<{ word: string; category?: SensitiveCategory }>;
}

export interface BatchCreateSensitiveWordsResponse {
  created: number;
  duplicates: string[];
}

export interface UpdateSensitiveWordRequest {
  word?: string;
  category?: SensitiveCategory;
  is_enabled?: boolean;
}

export interface ScanRequest {
  user_id?: number;
  days?: number;
  max_conversations?: number;
}

export interface ScanFlaggedItem {
  conversation_id: string;
  user_id: number;
  user_email: string;
  matched_words: string[];
  review_id: number;
}

export interface ScanResponse {
  scanned_conversations: number;
  scanned_messages: number;
  flagged_conversations: number;
  flagged_details: ScanFlaggedItem[];
}

// ==================== 邀请管理 ====================

export interface TopReferrerItem {
  user_id: number;
  email: string;
  nickname: string;
  referral_count: number;
  total_earned: number;
}

export interface ReferralStats {
  total_referrals: number;
  total_rewards_points: number;
  today_referrals: number;
  today_rewards_points: number;
  active_referral_rate: number;
  top_referrers: TopReferrerItem[];
}

export interface ReferralListItem {
  id: number;
  referrer_id: number;
  referrer_email: string;
  referrer_nickname: string;
  referee_id: number;
  referee_email: string;
  referee_nickname: string;
  referee_status: number;
  referee_total_consumed: number;
  signup_reward: number;
  first_recharge_reward: number;
  total_reward: number;
  created_at: string;
}

export interface ReferralListParams extends PaginationParams, DateRangeParams {
  referrer_email?: string;
  referee_email?: string;
}

export interface ReferralTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface RefereeItem {
  referee_id: number;
  email: string;
  status: number;
  registered_at: string;
  total_consumed: number;
  total_recharged: number;
  signup_reward: number;
  first_recharge_reward: number;
  reward_transactions: ReferralTransaction[];
}

export interface ReferrerInfo {
  user_id: number;
  email: string;
  nickname: string;
  invite_code: string;
  total_referrals: number;
  total_earned: number;
  signup_rewards_total: number;
  recharge_rewards_total: number;
}

export interface ReferrerDetailResponse {
  referrer: ReferrerInfo;
  referees: RefereeItem[];
  total_referees: number;
  page: number;
  page_size: number;
}
