// User types
export interface User {
  id: number;
  email: string;
  nickname: string;
  avatarUrl: string;
  emailVerified: boolean;
  inviteCode: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  id: number;
  userId: number;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationEnabled: boolean;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  inviteCode?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Message types
export interface SystemMessage {
  id: number;
  userId: number;
  title: string;
  content: string;
  msgType: 'account' | 'notice' | 'usage';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

// Chat types
export interface Conversation {
  id: number;
  userId: number;
  title: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  userId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: number; // 0: sending, 1: success, 2: error
  createdAt: string;
}

// Usage types
export interface TokenUsage {
  id: number;
  userId: number;
  conversationId: number;
  messageId: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  createdAt: string;
}

export interface UsageSummary {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  conversationCount: number;
  messageCount: number;
}

export interface DailyUsage {
  date: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
}

// ==================== Balance types ====================

export interface BalanceInfo {
  balance: number;
  total_recharged: number;
  total_consumed: number;
  total_gifted: number;
}

export interface BalanceCheckResult {
  sufficient: boolean;
  balance: number;
  estimated_cost?: number;
}

// ==================== Transaction types ====================

export type TransactionType = 'recharge' | 'consumption' | 'gift' | 'referral' | 'refund';

export interface TransactionMetadata {
  payment_method?: string;
  amount_yuan?: string;
  order_no?: string;
  conversation_id?: number;
  conversation_title?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  referee_id?: number;
  recharge_points?: number;
  bonus_rate?: number;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  metadata?: TransactionMetadata;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  page_size: number;
}

export type TransactionFilterType = 'all' | 'recharge' | 'consumption' | 'gift_referral';

export interface TransactionFilter {
  type: TransactionFilterType;
  days: number;
}

// ==================== Recharge types ====================

export interface RechargePreset {
  amount_yuan: number;
  points: number;
}

export interface RechargeConfig {
  exchange_rate: number;
  min_amount_yuan: number;
  presets: RechargePreset[];
  payment_methods: string[];
}

export interface RechargeOrder {
  order_no: string;
  amount_yuan: number;
  points: number;
  payment_method: string;
  payment_url?: string;
  expire_at: string;
}

export interface OrderStatus {
  order_no: string;
  status: number;
  status_text: string;
  points: number;
  paid_at?: string;
}

// ==================== Pricing types ====================

export interface ModelPricing {
  name: string;
  display_name: string;
  input_price: number;
  output_price: number;
  unit: string;
}

export interface PricingInfo {
  models: ModelPricing[];
  exchange_rate: number;
  exchange_description: string;
}

// ==================== Usage extended types ====================

export interface ConversationUsage {
  conversation_id: number;
  title: string;
  total_points: number;
  total_tokens: number;
  message_count: number;
  last_used_at: string;
}

export interface ConversationRankingResponse {
  conversations: ConversationUsage[];
  total: number;
  page: number;
  page_size: number;
}

export interface DailyUsageExtended {
  date: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  points_consumed: number;
}
