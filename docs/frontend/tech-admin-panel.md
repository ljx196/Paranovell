# 管理后台 — 前端技术方案

> 基于 PRD（docs/prd/admin-panel.md）和 UI/UX 设计稿（docs/frontend/uiux-admin-panel.md），采用独立管理端前端（React + Ant Design + Vite），共享 BFF（Go/Gin）的 `/api/admin/*` 路由组。
>
> 可交互 Demo：`docs/frontend/demo-admin-panel.html`

---

## 1. 技术架构概述

### 1.1 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | React | 19.x | UI 构建 |
| 构建 | Vite | 7.x | 开发/构建工具 |
| 语言 | TypeScript | 5.x | 类型安全 |
| UI 库 | Ant Design | 5.x | 管理后台组件库（Table、Form、Modal 等） |
| 图表 | @ant-design/charts | 2.x | 基于 G2 的 React 图表组件 |
| 路由 | React Router | 7.x | SPA 路由 |
| 状态管理 | Zustand | 5.x | 轻量 Store，与用户端保持一致 |
| HTTP | axios | 1.x | API 请求 |
| 样式 | CSS Modules + Ant Design Token | - | 组件级样式隔离 |
| 代码规范 | ESLint + Prettier | - | 代码质量 |

### 1.2 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Page Layer                                  │
│  src/pages/                                                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Dashboard / Users / UserDetail / Orders / Transactions /     │    │
│  │ Announcements / Configs / AuditLogs / Login                  │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Component Layer                               │
│  src/components/                                                     │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────────┐ │
│  │AdminLayout │ │StatCard  │ │FilterBar  │ │Modals               │ │
│  │(Sidebar+   │ │ChartCard │ │DataTable  │ │(AdjustBalance/Ban/  │ │
│  │ Header)    │ │RecentLogs│ │StatusBadge│ │ Announce/LogDetail) │ │
│  └─────┬─────┘ └────┬─────┘ └─────┬─────┘ └──────────┬──────────┘ │
└────────┼────────────┼─────────────┼──────────────────┼─────────────┘
         │            │             │                  │
         ▼            ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Store Layer                                  │
│  src/store/                                                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ useAdminStore.ts                                               │  │
│  │ auth / dashboard / users / orders / transactions /             │  │
│  │ announcements / configs / auditLogs / loading states           │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Service Layer                                 │
│  src/services/adminApi.ts                                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ login / getDashboardStats / getDashboardTrends /               │  │
│  │ getUsers / getUserDetail / updateUserStatus /                  │  │
│  │ adjustBalance / resetPassword / getOrders / getOrdersSummary / │  │
│  │ getTransactions / getAnnouncements / createAnnouncement /      │  │
│  │ deleteAnnouncement / getConfigs / updateConfigs /              │  │
│  │ getAuditLogs / getAuditLogDetail                               │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
                                ▼
                        BFF API (Go/Gin)
                        /api/admin/*
```

### 1.3 项目文件结构

```
admin/                                  # 独立管理端项目（与 frontend/ 平级）
├── public/
│   └── index.html
├── src/
│   ├── pages/                          # 页面组件
│   │   ├── Login.tsx                   # 登录页
│   │   ├── Dashboard.tsx               # 仪表盘
│   │   ├── Users.tsx                   # 用户列表
│   │   ├── UserDetail.tsx              # 用户详情
│   │   ├── Orders.tsx                  # 订单管理
│   │   ├── Transactions.tsx            # 交易流水
│   │   ├── Announcements.tsx           # 公告管理
│   │   ├── Configs.tsx                 # 系统配置
│   │   └── AuditLogs.tsx              # 操作日志
│   │
│   ├── components/                     # 通用组件
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx         # Sidebar + Header + Content 布局壳
│   │   │   ├── Sidebar.tsx             # 侧边栏导航
│   │   │   └── AdminHeader.tsx         # 顶栏（面包屑 + 退出）
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx            # 仪表盘指标卡片
│   │   │   ├── ChartCard.tsx           # 趋势图卡片（柱状图）
│   │   │   └── RecentLogs.tsx          # 最近操作卡片
│   │   │
│   │   ├── shared/
│   │   │   ├── FilterBar.tsx           # 通用筛选栏
│   │   │   ├── DataTable.tsx           # 通用数据表格（含分页）
│   │   │   └── StatusBadge.tsx         # 状态 Badge
│   │   │
│   │   └── modals/
│   │       ├── AdjustBalanceModal.tsx  # 调账弹窗
│   │       ├── BanUserModal.tsx        # 封禁用户弹窗
│   │       ├── ResetPasswordModal.tsx  # 重置密码弹窗
│   │       ├── AnnounceModal.tsx       # 发送公告弹窗
│   │       └── LogDetailModal.tsx      # 日志详情弹窗
│   │
│   ├── services/
│   │   └── adminApi.ts                 # 管理端 API 客户端（axios 封装）
│   │
│   ├── store/
│   │   └── useAdminStore.ts            # 管理端 Zustand Store
│   │
│   ├── types/
│   │   └── admin.ts                    # 管理端 TypeScript 类型定义
│   │
│   ├── styles/
│   │   └── theme.ts                    # 管理后台 Ant Design 主题 Token 配置
│   │
│   ├── router/
│   │   ├── index.tsx                   # 路由配置
│   │   └── AuthGuard.tsx               # 认证守卫组件
│   │
│   ├── utils/
│   │   └── format.ts                   # 格式化工具（金额、日期、百分比等）
│   │
│   ├── App.tsx                         # 根组件（ConfigProvider + RouterProvider）
│   └── main.tsx                        # 入口文件
│
├── package.json
├── tsconfig.json
├── vite.config.ts                      # Vite 构建配置
└── .env                                # 环境变量（API_BASE_URL）
```

### 1.4 与用户端的关系

```
GenNovelWeb/
├── frontend/                # 用户端（Expo/RN）端口 :8081
├── admin/                   # 管理端（React/Vite）端口 :3001
├── bff/                     # BFF（Go/Gin）端口 :8080
│   ├── /api/v1/*            # 用户端 API（AuthMiddleware）
│   └── /api/admin/*         # 管理端 API（AuthMiddleware + AdminMiddleware）
└── docs/                    # 共享文档
```

- 管理端和用户端代码完全隔离，各自独立安装依赖、启动、构建
- 共享同一个 BFF 服务，通过不同路由前缀区分
- 登录接口复用 `/api/v1/auth/login`，管理端登录后检查 `role` 字段

### 1.5 依赖安装

```bash
# 创建管理端项目
cd admin
npm create vite@latest . -- --template react-ts

# 核心依赖
npm install react-router-dom zustand axios antd @ant-design/icons @ant-design/charts dayjs

# 开发依赖
npm install -D @types/react @types/react-dom
```

| 包名 | 说明 |
|------|------|
| `antd` | UI 组件库，Table/Form/Modal/Button/Tag 等开箱即用 |
| `@ant-design/icons` | 图标库 |
| `@ant-design/charts` | 基于 G2 的柱状/折线图组件 |
| `react-router-dom` | SPA 路由 |
| `zustand` | 状态管理，与用户端模式一致 |
| `axios` | HTTP 请求封装 |
| `dayjs` | 日期处理（Ant Design 5 内置依赖） |

---

## 2. 类型定义

**文件：`src/types/admin.ts`**

```typescript
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
  token: string;
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
  today_active: number;
  today_new_users: number;
  today_revenue_yuan: number;
  yesterday_active: number;
  yesterday_new_users: number;
  yesterday_revenue_yuan: number;
}

export interface TrendItem {
  date: string;
  value: number;
}

export type TrendType = 'users' | 'revenue' | 'tokens';

export interface TrendParams {
  type: TrendType;
  days: number;  // 7 | 30 | 90
}

export interface RecentLog {
  id: number;
  admin_email: string;
  action: string;
  action_label: string;
  target: string;
  summary: string;
  created_at: string;
}

// ==================== 用户管理 ====================

export type UserStatus = 0 | 1;  // 0=封禁 1=正常

export interface UserListItem {
  id: number;
  email: string;
  nickname: string;
  avatar_url: string;
  status: UserStatus;
  role: UserRole;
  balance: number;
  created_at: string;
  last_active_at?: string;
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
  last_active_at?: string;
  balance: {
    balance: number;
    total_recharged: number;
    total_consumed: number;
    total_gifted: number;
  };
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

export type OrderStatus = 0 | 1 | 2 | 3;  // 0=待支付 1=已支付 2=已取消 3=已退款

export interface OrderListItem {
  id: number;
  order_no: string;
  user_id: number;
  user_email: string;
  amount_yuan: number;
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
  target_count: number;
  read_count: number;
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
  config_key: string;
  config_value: unknown;
  description: string;
  updated_by: number;
  updated_at: string;
}

export interface UpdateConfigsRequest {
  configs: Array<{
    config_key: string;
    config_value: unknown;
  }>;
}

// 前端配置表单模型（方便表单绑定）
export interface ConfigFormValues {
  'registration.enabled': boolean;
  'registration.invite_only': boolean;
  'registration.gift_points': number;
  'referral.referrer_reward': number;
  'referral.referee_reward': number;
  'balance.low_threshold': number;
  'recharge.rate': number;
  'recharge.min_amount': number;
  'recharge.presets': Array<{ yuan: number; points: number }>;
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
  admin_email: string;
  action: AuditAction;
  action_label: string;
  target_type: AuditTargetType;
  target_id: string;
  summary: string;
  ip_address: string;
  created_at: string;
}

export interface AuditLogDetail extends AuditLogListItem {
  detail: Record<string, unknown>;
}

export interface AuditLogListParams extends PaginationParams, DateRangeParams {
  action?: AuditAction;
  admin_id?: number;
  target_type?: AuditTargetType;
}
```

---

## 3. API Service

**文件：`src/services/adminApi.ts`**

基于 axios 封装，统一处理 token 注入、错误码、401 跳转登录。

```typescript
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  LoginRequest, LoginResponse,
  DashboardStats, TrendParams, TrendItem, RecentLog,
  UserListParams, UserListItem, UserDetail,
  UpdateStatusRequest, AdjustBalanceRequest, ResetPasswordRequest,
  OrderListParams, OrderListItem, OrderSummary,
  TransactionListParams, TransactionListItem,
  AnnouncementListParams, AnnouncementListItem, CreateAnnouncementRequest,
  SystemConfigItem, UpdateConfigsRequest,
  AuditLogListParams, AuditLogListItem, AuditLogDetail,
  PaginatedResponse,
} from '../types/admin';

const TOKEN_KEY = 'admin_token';

class AdminApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    // 请求拦截：注入 token
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 响应拦截：统一提取 data，处理 401
    this.client.interceptors.response.use(
      (response) => {
        const body = response.data;
        if (body.code !== 0) {
          return Promise.reject(new Error(body.message || '请求失败'));
        }
        return body.data;
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          window.location.href = '/admin/login';
        }
        if (error.response?.status === 403) {
          return Promise.reject(new Error('无管理权限'));
        }
        return Promise.reject(error);
      },
    );
  }

  // ==================== 认证 ====================

  /** 登录（复用用户端登录接口） */
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.client.post('/api/v1/auth/login', data);
  }

  /** 保存 token */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /** 清除 token */
  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  /** 获取已存储的 token */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // ==================== 仪表盘 ====================

  /** 仪表盘统计指标 */
  async getDashboardStats(): Promise<DashboardStats> {
    return this.client.get('/api/admin/dashboard/stats');
  }

  /** 仪表盘趋势数据 */
  async getDashboardTrends(params: TrendParams): Promise<{ items: TrendItem[] }> {
    return this.client.get('/api/admin/dashboard/trends', { params });
  }

  /** 仪表盘最近操作日志 */
  async getRecentLogs(limit: number = 10): Promise<RecentLog[]> {
    return this.client.get('/api/admin/dashboard/recent-logs', { params: { limit } });
  }

  // ==================== 用户管理 ====================

  /** 用户列表 */
  async getUsers(params?: UserListParams): Promise<PaginatedResponse<UserListItem>> {
    return this.client.get('/api/admin/users', { params });
  }

  /** 用户详情 */
  async getUserDetail(id: number): Promise<UserDetail> {
    return this.client.get(`/api/admin/users/${id}`);
  }

  /** 封禁/解封用户 */
  async updateUserStatus(id: number, data: UpdateStatusRequest): Promise<void> {
    return this.client.put(`/api/admin/users/${id}/status`, data);
  }

  /** 手动调账 */
  async adjustBalance(id: number, data: AdjustBalanceRequest): Promise<void> {
    return this.client.post(`/api/admin/users/${id}/adjust-balance`, data);
  }

  /** 重置密码 */
  async resetPassword(id: number, data: ResetPasswordRequest): Promise<void> {
    return this.client.post(`/api/admin/users/${id}/reset-password`, data);
  }

  // ==================== 订单管理 ====================

  /** 订单列表 */
  async getOrders(params?: OrderListParams): Promise<PaginatedResponse<OrderListItem>> {
    return this.client.get('/api/admin/orders', { params });
  }

  /** 订单统计概要 */
  async getOrdersSummary(params?: OrderListParams): Promise<OrderSummary> {
    return this.client.get('/api/admin/orders/summary', { params });
  }

  // ==================== 交易流水 ====================

  /** 交易列表 */
  async getTransactions(params?: TransactionListParams): Promise<PaginatedResponse<TransactionListItem>> {
    return this.client.get('/api/admin/transactions', { params });
  }

  // ==================== 公告管理 ====================

  /** 公告列表 */
  async getAnnouncements(params?: AnnouncementListParams): Promise<PaginatedResponse<AnnouncementListItem>> {
    return this.client.get('/api/admin/announcements', { params });
  }

  /** 发送公告 */
  async createAnnouncement(data: CreateAnnouncementRequest): Promise<void> {
    return this.client.post('/api/admin/announcements', data);
  }

  /** 删除公告 */
  async deleteAnnouncement(id: number): Promise<void> {
    return this.client.delete(`/api/admin/announcements/${id}`);
  }

  // ==================== 系统配置 ====================

  /** 获取所有配置 */
  async getConfigs(): Promise<{ items: SystemConfigItem[] }> {
    return this.client.get('/api/admin/configs');
  }

  /** 批量更新配置 */
  async updateConfigs(data: UpdateConfigsRequest): Promise<void> {
    return this.client.put('/api/admin/configs', data);
  }

  // ==================== 操作日志 ====================

  /** 操作日志列表 */
  async getAuditLogs(params?: AuditLogListParams): Promise<PaginatedResponse<AuditLogListItem>> {
    return this.client.get('/api/admin/audit-logs', { params });
  }

  /** 日志详情 */
  async getAuditLogDetail(id: number): Promise<AuditLogDetail> {
    return this.client.get(`/api/admin/audit-logs/${id}`);
  }
}

export const adminApi = new AdminApiClient();
```

---

## 4. 主题配置

**文件：`src/styles/theme.ts`**

使用 Ant Design 5 的 ConfigProvider Token 覆盖全局主题，对齐 UIUX 设计稿色彩系统。

```typescript
import type { ThemeConfig } from 'antd';

/** 管理后台 Ant Design 主题 Token */
export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorError: '#ff4d4f',
    colorWarning: '#faad14',
    colorInfo: '#1677ff',
    borderRadius: 6,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Table: {
      headerBg: '#fafafa',
      headerColor: '#888',
      rowHoverBg: '#fafafa',
      borderColor: '#f5f5f5',
      headerBorderRadius: 0,
    },
    Button: {
      borderRadius: 6,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Card: {
      borderRadiusLG: 10,
    },
  },
};

/** 管理后台色彩常量（用于自定义组件） */
export const adminColors = {
  // 背景
  bgPage: '#f0f2f5',
  bgCard: '#ffffff',
  bgSection: '#fafafa',

  // 文字
  textPrimary: '#111',
  textRegular: '#333',
  textSecondary: '#666',
  textMuted: '#999',
  textLight: '#bbb',

  // 边框
  border: '#e8e8e8',
  borderLight: '#f0f0f0',
  borderLighter: '#f5f5f5',

  // 状态色
  success: '#52c41a',
  danger: '#ff4d4f',
  warning: '#faad14',
  info: '#1677ff',
  purple: '#722ed1',

  // 侧边栏
  sidebarBg: '#001529',
  sidebarText: 'rgba(255,255,255,0.65)',
  sidebarTextActive: '#ffffff',
  sidebarItemActive: '#1677ff',

  // 统计卡片图标背景
  statCardIcons: {
    users: { bg: 'rgba(22,119,255,0.1)', color: '#1677ff' },
    active: { bg: 'rgba(82,196,26,0.1)', color: '#52c41a' },
    newUsers: { bg: 'rgba(250,173,20,0.1)', color: '#faad14' },
    revenue: { bg: 'rgba(245,34,45,0.1)', color: '#f5222d' },
  },

  // 图表渐变
  chartGradients: {
    users: ['#1677ff', '#69b1ff'],
    revenue: ['#52c41a', '#95de64'],
    tokens: ['#fa8c16', '#ffc069'],
  },
} as const;
```

---

## 5. 状态管理

**文件：`src/store/useAdminStore.ts`**

遵循 Zustand `create<State>((set, get) => ({ ...initialState, ...actions }))` 模式，与用户端 `useBalanceStore` 保持一致。

按功能模块分 slice，统一在一个 Store 中管理（管理后台页面间数据关联较少，也可后续拆分为多个 Store）。

```typescript
import { create } from 'zustand';
import { adminApi } from '../services/adminApi';
import type {
  AdminUser, DashboardStats, TrendItem, TrendType, RecentLog,
  UserListItem, UserListParams, UserDetail,
  OrderListItem, OrderListParams, OrderSummary,
  TransactionListItem, TransactionListParams,
  AnnouncementListItem, AnnouncementListParams, CreateAnnouncementRequest,
  SystemConfigItem, ConfigFormValues, UpdateConfigsRequest,
  AuditLogListItem, AuditLogListParams, AuditLogDetail,
  AdjustBalanceRequest, UpdateStatusRequest,
} from '../types/admin';

interface AdminState {
  // ====== 认证 ======
  currentUser: AdminUser | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => boolean;

  // ====== 仪表盘 ======
  dashboardStats: DashboardStats | null;
  trendData: Record<TrendType, TrendItem[]>;
  trendDays: Record<TrendType, number>;
  recentLogs: RecentLog[];
  isDashboardLoading: boolean;

  fetchDashboardStats: () => Promise<void>;
  fetchTrends: (type: TrendType, days?: number) => Promise<void>;
  setTrendDays: (type: TrendType, days: number) => void;
  fetchRecentLogs: () => Promise<void>;
  initDashboard: () => Promise<void>;

  // ====== 用户管理 ======
  users: UserListItem[];
  userTotal: number;
  userParams: UserListParams;
  userDetail: UserDetail | null;
  isUsersLoading: boolean;
  isUserDetailLoading: boolean;

  fetchUsers: (params?: Partial<UserListParams>) => Promise<void>;
  fetchUserDetail: (id: number) => Promise<void>;
  updateUserStatus: (id: number, data: UpdateStatusRequest) => Promise<void>;
  adjustBalance: (id: number, data: AdjustBalanceRequest) => Promise<void>;
  resetPassword: (id: number) => Promise<void>;

  // ====== 订单管理 ======
  orders: OrderListItem[];
  orderTotal: number;
  orderParams: OrderListParams;
  orderSummary: OrderSummary | null;
  isOrdersLoading: boolean;

  fetchOrders: (params?: Partial<OrderListParams>) => Promise<void>;
  fetchOrderSummary: () => Promise<void>;

  // ====== 交易流水 ======
  transactions: TransactionListItem[];
  transactionTotal: number;
  transactionParams: TransactionListParams;
  isTransactionsLoading: boolean;

  fetchTransactions: (params?: Partial<TransactionListParams>) => Promise<void>;

  // ====== 公告管理 ======
  announcements: AnnouncementListItem[];
  announcementTotal: number;
  announcementParams: AnnouncementListParams;
  isAnnouncementsLoading: boolean;

  fetchAnnouncements: (params?: Partial<AnnouncementListParams>) => Promise<void>;
  createAnnouncement: (data: CreateAnnouncementRequest) => Promise<void>;
  deleteAnnouncement: (id: number) => Promise<void>;

  // ====== 系统配置 ======
  configs: SystemConfigItem[];
  isConfigsLoading: boolean;
  isConfigsSaving: boolean;

  fetchConfigs: () => Promise<void>;
  updateConfigs: (data: UpdateConfigsRequest) => Promise<void>;

  // ====== 操作日志 ======
  auditLogs: AuditLogListItem[];
  auditLogTotal: number;
  auditLogParams: AuditLogListParams;
  auditLogDetail: AuditLogDetail | null;
  isAuditLogsLoading: boolean;

  fetchAuditLogs: (params?: Partial<AuditLogListParams>) => Promise<void>;
  fetchAuditLogDetail: (id: number) => Promise<void>;
}

const DEFAULT_PAGE_SIZE = 20;

export const useAdminStore = create<AdminState>((set, get) => ({
  // ==================== 认证 ====================

  currentUser: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const result = await adminApi.login({ email, password });
    const { user, token } = result;

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new Error('无管理权限，仅管理员可登录');
    }

    adminApi.setToken(token);
    set({
      currentUser: { ...user, token },
      isAuthenticated: true,
    });
  },

  logout: () => {
    adminApi.clearToken();
    set({ currentUser: null, isAuthenticated: false });
  },

  restoreSession: () => {
    const token = adminApi.getToken();
    if (!token) return false;
    // token 存在则认为已登录，后续 API 调用若 401 会自动跳转登录
    // 实际用户信息可从 JWT 解析或首次 API 调用获取
    set({ isAuthenticated: true });
    return true;
  },

  // ==================== 仪表盘 ====================

  dashboardStats: null,
  trendData: { users: [], revenue: [], tokens: [] },
  trendDays: { users: 30, revenue: 30, tokens: 30 },
  recentLogs: [],
  isDashboardLoading: false,

  fetchDashboardStats: async () => {
    try {
      const data = await adminApi.getDashboardStats();
      set({ dashboardStats: data });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  },

  fetchTrends: async (type, days) => {
    const period = days || get().trendDays[type];
    try {
      const result = await adminApi.getDashboardTrends({ type, days: period });
      set((state) => ({
        trendData: { ...state.trendData, [type]: result.items || [] },
      }));
    } catch (error) {
      console.error(`Failed to fetch ${type} trends:`, error);
    }
  },

  setTrendDays: (type, days) => {
    set((state) => ({
      trendDays: { ...state.trendDays, [type]: days },
    }));
    get().fetchTrends(type, days);
  },

  fetchRecentLogs: async () => {
    try {
      const data = await adminApi.getRecentLogs(5);
      set({ recentLogs: data });
    } catch (error) {
      console.error('Failed to fetch recent logs:', error);
    }
  },

  initDashboard: async () => {
    set({ isDashboardLoading: true });
    try {
      await Promise.all([
        get().fetchDashboardStats(),
        get().fetchTrends('users'),
        get().fetchTrends('revenue'),
        get().fetchTrends('tokens'),
        get().fetchRecentLogs(),
      ]);
    } finally {
      set({ isDashboardLoading: false });
    }
  },

  // ==================== 用户管理 ====================

  users: [],
  userTotal: 0,
  userParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  userDetail: null,
  isUsersLoading: false,
  isUserDetailLoading: false,

  fetchUsers: async (params) => {
    const merged = { ...get().userParams, ...params };
    set({ isUsersLoading: true, userParams: merged });
    try {
      const result = await adminApi.getUsers(merged);
      set({ users: result.items || [], userTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  fetchUserDetail: async (id) => {
    set({ isUserDetailLoading: true, userDetail: null });
    try {
      const data = await adminApi.getUserDetail(id);
      set({ userDetail: data });
    } catch (error) {
      console.error('Failed to fetch user detail:', error);
    } finally {
      set({ isUserDetailLoading: false });
    }
  },

  updateUserStatus: async (id, data) => {
    await adminApi.updateUserStatus(id, data);
  },

  adjustBalance: async (id, data) => {
    await adminApi.adjustBalance(id, data);
  },

  resetPassword: async (id) => {
    await adminApi.resetPassword(id, { send_email: true });
  },

  // ==================== 订单管理 ====================

  orders: [],
  orderTotal: 0,
  orderParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  orderSummary: null,
  isOrdersLoading: false,

  fetchOrders: async (params) => {
    const merged = { ...get().orderParams, ...params };
    set({ isOrdersLoading: true, orderParams: merged });
    try {
      const result = await adminApi.getOrders(merged);
      set({ orders: result.items || [], orderTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      set({ isOrdersLoading: false });
    }
  },

  fetchOrderSummary: async () => {
    try {
      const data = await adminApi.getOrdersSummary();
      set({ orderSummary: data });
    } catch (error) {
      console.error('Failed to fetch order summary:', error);
    }
  },

  // ==================== 交易流水 ====================

  transactions: [],
  transactionTotal: 0,
  transactionParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  isTransactionsLoading: false,

  fetchTransactions: async (params) => {
    const merged = { ...get().transactionParams, ...params };
    set({ isTransactionsLoading: true, transactionParams: merged });
    try {
      const result = await adminApi.getTransactions(merged);
      set({ transactions: result.items || [], transactionTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      set({ isTransactionsLoading: false });
    }
  },

  // ==================== 公告管理 ====================

  announcements: [],
  announcementTotal: 0,
  announcementParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  isAnnouncementsLoading: false,

  fetchAnnouncements: async (params) => {
    const merged = { ...get().announcementParams, ...params };
    set({ isAnnouncementsLoading: true, announcementParams: merged });
    try {
      const result = await adminApi.getAnnouncements(merged);
      set({ announcements: result.items || [], announcementTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      set({ isAnnouncementsLoading: false });
    }
  },

  createAnnouncement: async (data) => {
    await adminApi.createAnnouncement(data);
  },

  deleteAnnouncement: async (id) => {
    await adminApi.deleteAnnouncement(id);
  },

  // ==================== 系统配置 ====================

  configs: [],
  isConfigsLoading: false,
  isConfigsSaving: false,

  fetchConfigs: async () => {
    set({ isConfigsLoading: true });
    try {
      const result = await adminApi.getConfigs();
      set({ configs: result.items || [] });
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      set({ isConfigsLoading: false });
    }
  },

  updateConfigs: async (data) => {
    set({ isConfigsSaving: true });
    try {
      await adminApi.updateConfigs(data);
    } finally {
      set({ isConfigsSaving: false });
    }
  },

  // ==================== 操作日志 ====================

  auditLogs: [],
  auditLogTotal: 0,
  auditLogParams: { page: 1, page_size: DEFAULT_PAGE_SIZE },
  auditLogDetail: null,
  isAuditLogsLoading: false,

  fetchAuditLogs: async (params) => {
    const merged = { ...get().auditLogParams, ...params };
    set({ isAuditLogsLoading: true, auditLogParams: merged });
    try {
      const result = await adminApi.getAuditLogs(merged);
      set({ auditLogs: result.items || [], auditLogTotal: result.total });
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      set({ isAuditLogsLoading: false });
    }
  },

  fetchAuditLogDetail: async (id) => {
    try {
      const data = await adminApi.getAuditLogDetail(id);
      set({ auditLogDetail: data });
    } catch (error) {
      console.error('Failed to fetch audit log detail:', error);
    }
  },
}));
```

---

## 6. 路由配置

### 6.1 路由表

**文件：`src/router/index.tsx`**

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import AuthGuard from './AuthGuard';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import UserDetail from '../pages/UserDetail';
import Orders from '../pages/Orders';
import Transactions from '../pages/Transactions';
import Announcements from '../pages/Announcements';
import Configs from '../pages/Configs';
import AuditLogs from '../pages/AuditLogs';

export const router = createBrowserRouter([
  {
    path: '/admin/login',
    element: <Login />,
  },
  {
    path: '/admin',
    element: (
      <AuthGuard>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'users', element: <Users /> },
      { path: 'users/:id', element: <UserDetail /> },
      { path: 'orders', element: <Orders /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'announcements', element: <Announcements /> },
      { path: 'configs', element: <Configs /> },
      { path: 'audit-logs', element: <AuditLogs /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/admin/login" replace />,
  },
]);
```

### 6.2 认证守卫

**文件：`src/router/AuthGuard.tsx`**

```typescript
import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, restoreSession } = useAdminStore();

  // 尝试从 localStorage 恢复会话
  if (!isAuthenticated && !restoreSession()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
```

### 6.3 路由表与侧边栏映射

| 路由 | 页面 | 侧边栏 key | 面包屑 |
|------|------|-----------|--------|
| `/admin/login` | Login | — | — |
| `/admin/dashboard` | Dashboard | `dashboard` | 管理后台 / 仪表盘 |
| `/admin/users` | Users | `users` | 管理后台 / 用户管理 |
| `/admin/users/:id` | UserDetail | `users` | 管理后台 / 用户管理 / 用户详情 |
| `/admin/orders` | Orders | `orders` | 管理后台 / 订单管理 |
| `/admin/transactions` | Transactions | `transactions` | 管理后台 / 交易流水 |
| `/admin/announcements` | Announcements | `announcements` | 管理后台 / 公告管理 |
| `/admin/configs` | Configs | `configs` | 管理后台 / 系统配置 |
| `/admin/audit-logs` | AuditLogs | `audit-logs` | 管理后台 / 操作日志 |

---

## 7. 入口与根组件

### 7.1 入口文件

**文件：`src/main.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 7.2 根组件

**文件：`src/App.tsx`**

```typescript
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './router';
import { adminTheme } from './styles/theme';

export default function App() {
  return (
    <ConfigProvider theme={adminTheme} locale={zhCN}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}
```

### 7.3 Vite 配置

**文件：`vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
```

> 开发模式下 Vite 代理 `/api` 到 BFF，生产环境通过 Nginx 反向代理。

---

## 8. 布局组件

### 8.1 AdminLayout

**文件：`src/components/layout/AdminLayout.tsx`**

整体布局壳：左侧 Sidebar (220px) + 右侧 Header (56px) + Content。

```typescript
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import { adminColors } from '../../styles/theme';

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AdminHeader />
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            background: adminColors.bgPage,
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
```

### 8.2 Sidebar

**文件：`src/components/layout/Sidebar.tsx`**

```typescript
interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;  // Ant Design Icon
  path: string;
}

const menuItems: MenuItem[] = [
  { key: 'dashboard',      label: '仪表盘', icon: <DashboardOutlined />, path: '/admin/dashboard' },
  { key: 'users',          label: '用户管理', icon: <UserOutlined />,     path: '/admin/users' },
  { key: 'orders',         label: '订单管理', icon: <ShoppingOutlined />, path: '/admin/orders' },
  { key: 'transactions',   label: '交易流水', icon: <SwapOutlined />,     path: '/admin/transactions' },
  { key: 'announcements',  label: '公告管理', icon: <SoundOutlined />,    path: '/admin/announcements' },
  { key: 'configs',        label: '系统配置', icon: <SettingOutlined />,   path: '/admin/configs' },
  { key: 'audit-logs',     label: '操作日志', icon: <AuditOutlined />,    path: '/admin/audit-logs' },
];
```

规格：

| 属性 | 值 |
|------|-----|
| 宽度 | 220px |
| 背景 | `#001529` |
| Logo 区高度 | 56px |
| 菜单项 padding | `10px 20px` |
| 选中态背景 | `#1677ff`，左边框 3px 白色 |
| 底部用户区 | 头像 32×32 + 用户名 + 角色标签 |

通过 `useLocation()` 获取当前路径，匹配 `menuItems[].path` 设置选中态。

### 8.3 AdminHeader

**文件：`src/components/layout/AdminHeader.tsx`**

```typescript
interface BreadcrumbItem {
  label: string;
  path?: string;
}
```

规格：

| 属性 | 值 |
|------|-----|
| 高度 | 56px |
| 背景 | `#fff` |
| 下边框 | `1px solid #e8e8e8` |
| 面包屑 | 根据当前路由动态生成（useLocation + menuItems 映射） |
| 右侧 | "退出登录" 按钮，点击调用 `store.logout()` + `navigate('/admin/login')` |

---

## 9. 页面设计

### 9.1 Login（登录页）

**文件：`src/pages/Login.tsx`**

```
布局:
  全屏居中，背景渐变 #001529 → #003a70
  登录卡片: 400px, borderRadius: 12px, padding: 40px
  表单: 邮箱 + 密码 + 登录按钮

逻辑:
  1. 调用 store.login(email, password)
  2. 若 role 非 admin → message.error('无管理权限')
  3. 成功 → navigate('/admin/dashboard')
```

使用 Ant Design `Form`、`Input`、`Button` 组件，自动校验。

### 9.2 Dashboard（仪表盘）

**文件：`src/pages/Dashboard.tsx`**

```
布局:
  ├── 统计指标行: 4 × StatCard (grid 4列, gap 16px)
  ├── 趋势图行 1: ChartCard(用户增长) + ChartCard(收入趋势) (grid 2列)
  └── 趋势图行 2: ChartCard(Token消耗) + RecentLogs (grid 2列)

数据加载:
  useEffect → store.initDashboard()
```

#### StatCard 组件

```typescript
interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;             // 如 '¥'
  yesterdayValue: number;       // 用于计算变化率
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}
```

变化率计算：`((today - yesterday) / yesterday * 100).toFixed(1) + '%'`
上涨显示 ↑ 绿色（`#52c41a`），下跌显示 ↓ 红色（`#ff4d4f`）。

#### ChartCard 组件

```typescript
interface ChartCardProps {
  title: string;
  data: TrendItem[];
  days: number;
  onDaysChange: (days: number) => void;
  color: [string, string];     // 渐变色 [start, end]
  isLoading?: boolean;
}
```

图表使用 `@ant-design/charts` 的 `Column` 组件（柱状图），配置：

```typescript
const chartConfig = {
  data,
  xField: 'date',
  yField: 'value',
  color: `l(90) 0:${color[0]} 1:${color[1]}`,
  columnStyle: { radius: [4, 4, 0, 0] },
  height: 200,
  xAxis: { label: { formatter: (v: string) => dayjs(v).format('MM/DD') } },
};
```

时间切换标签：[7天] [30天] [90天]，选中态蓝底白字。

#### RecentLogs 组件

```typescript
interface RecentLogsProps {
  logs: RecentLog[];
  onViewAll: () => void;   // → navigate('/admin/audit-logs')
}
```

每行：状态圆点（按 action 类型着色） + 操作描述 + 时间。

### 9.3 Users（用户列表）

**文件：`src/pages/Users.tsx`**

```
布局:
  ├── page-header: "用户管理"
  ├── FilterBar: [关键词] [状态下拉] [注册时间] [搜索]
  └── Ant Design Table
      列: ID | 邮箱 | 昵称 | 余额(点) | 状态(Badge) | 注册时间 | 最后活跃 | 操作([详情])
      分页: Ant Design Pagination
```

使用 Ant Design `Table` 组件：

```typescript
const columns: ColumnsType<UserListItem> = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '邮箱', dataIndex: 'email' },
  { title: '昵称', dataIndex: 'nickname' },
  { title: '余额(点)', dataIndex: 'balance', render: (v) => v.toLocaleString() },
  { title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v} /> },
  { title: '注册时间', dataIndex: 'created_at', render: formatDateTime },
  { title: '操作', render: (_, record) => <Button onClick={() => navigate(`/admin/users/${record.id}`)}>详情</Button> },
];
```

筛选项：

| 筛选项 | Ant Design 组件 | 参数 |
|--------|----------------|------|
| 关键词 | `Input.Search` | `keyword` |
| 状态 | `Select` | `status`: 全部 / 正常(1) / 封禁(0) |
| 注册时间 | `DatePicker.RangePicker` | `start_date`, `end_date` |

### 9.4 UserDetail（用户详情）

**文件：`src/pages/UserDetail.tsx`**

```
布局:
  ├── 返回链接: "← 返回用户列表"
  ├── page-header: "用户详情 #N"
  ├── Card: 基本信息 (2列 grid: 邮箱/昵称/邀请码/验证 + 状态/角色/注册/活跃)
  ├── Card: 账户余额 (大数字 + 累计充值/消费/赠送 + [调账]按钮)
  ├── Card: 最近交易 (mini Table + [查看全部交易→])
  └── Card: 操作 ([重置密码] + [封禁用户])

数据加载:
  useEffect → store.fetchUserDetail(id)     // id 从 useParams 获取

弹窗:
  - AdjustBalanceModal: 调账
  - BanUserModal: 封禁/解封
  - ResetPasswordModal (Ant Design Modal.confirm): 重置密码
```

操作流程：

```
点击 [调账]
  → 打开 AdjustBalanceModal
  → 填写类型(增加/扣除) + 金额 + 原因
  → 确认 → store.adjustBalance(id, data)
  → 成功 → message.success + 关闭弹窗 + store.fetchUserDetail(id) 刷新
```

### 9.5 Orders（订单管理）

**文件：`src/pages/Orders.tsx`**

```
布局:
  ├── page-header: "订单管理"
  ├── FilterBar: [状态] [支付方式] [日期] [用户邮箱] [搜索]
  ├── summary-bar: 总计 N 单 | 已支付 ¥X | 待支付 ¥X | 已取消 ¥X | 已退款 ¥X
  └── Table
      列: 订单号 | 用户 | 金额(¥) | 点数 | 支付方式 | 状态(Badge) | 创建时间 | 支付时间

数据加载:
  useEffect → Promise.all([store.fetchOrders(), store.fetchOrderSummary()])
```

订单状态 Badge 映射：

| status | 显示 | Badge 类型 |
|--------|------|-----------|
| 0 | 待支付 | warning |
| 1 | 已支付 | success |
| 2 | 已取消 | error |
| 3 | 已退款 | info |

### 9.6 Transactions（交易流水）

**文件：`src/pages/Transactions.tsx`**

```
布局:
  ├── page-header: "交易流水"
  ├── FilterBar: [类型] [日期] [用户邮箱] [搜索]
  └── Table
      列: ID | 用户 | 类型(Badge) | 金额(带色) | 余额(后) | 描述 | 时间
```

金额列着色规则：

| 交易类型 | 金额颜色 | Badge 样式 |
|----------|---------|-----------|
| recharge | `#52c41a` (+) | success |
| consumption | `#ff4d4f` (-) | error |
| gift | `#722ed1` (+) | purple |
| referral | `#faad14` (+) | warning |
| refund | `#1677ff` (+) | info |

### 9.7 Announcements（公告管理）

**文件：`src/pages/Announcements.tsx`**

```
布局:
  ├── page-header: "公告管理"  +  [+ 发送新公告] 按钮
  ├── FilterBar: [类型] [日期] [搜索]
  └── Table
      列: ID | 类型(Badge) | 标题 | 发送对象 | 触达人数 | 已读率(%) | 发送时间 | 操作([删除])

弹窗:
  - AnnounceModal: 发送公告
  - Ant Design Modal.confirm: 删除确认
```

发送公告流程：

```
点击 [+ 发送新公告]
  → 打开 AnnounceModal
  → 填写消息类型(Radio) + 发送对象(Radio) + [邮箱列表] + 标题 + 内容
  → 若 target='all' → 二次确认 "确定向全部用户发送？"
  → 确认 → store.createAnnouncement(data)
  → 成功 → message.success + 关闭弹窗 + store.fetchAnnouncements() 刷新
```

### 9.8 Configs（系统配置）

**文件：`src/pages/Configs.tsx`**

```
布局:
  ├── page-header: "系统配置"  +  [保存全部修改] 按钮
  ├── Card: 注册设置 (Switch开放注册 + Switch仅邀请码 + Input赠送积分)
  ├── Card: 邀请奖励 (Input邀请人奖励 + Input被邀请人奖励)
  ├── Card: 余额预警 (Input低余额阈值)
  └── Card: 充值设置 (Input兑换比率 + Input最低金额 + 套餐Tag列表)

数据加载:
  useEffect → store.fetchConfigs()
  将 configs[] 转为 ConfigFormValues 对象供表单绑定

保存:
  点击 [保存全部修改] → 收集所有变更 → store.updateConfigs(data) → message.success
```

使用 Ant Design `Form` 绑定配置值，`Switch` 用于布尔配置，`InputNumber` 用于数值配置。

配置项 → 表单映射：

| config_key | 组件 | 说明 |
|------------|------|------|
| `registration.enabled` | Switch | 开放注册 |
| `registration.invite_only` | Switch | 仅邀请码注册 |
| `registration.gift_points` | InputNumber | 新用户赠送积分 |
| `referral.referrer_reward` | InputNumber | 邀请人奖励 |
| `referral.referee_reward` | InputNumber | 被邀请人奖励 |
| `balance.low_threshold` | InputNumber | 低余额阈值 |
| `recharge.rate` | InputNumber | 兑换比率 |
| `recharge.min_amount` | InputNumber | 最低充值金额 |
| `recharge.presets` | Tag 列表 + 编辑弹窗 | 充值套餐 |

### 9.9 AuditLogs（操作日志）

**文件：`src/pages/AuditLogs.tsx`**

```
布局:
  ├── page-header: "操作日志"
  ├── FilterBar: [操作类型] [操作人] [日期] [搜索]
  └── Table
      列: ID | 操作人 | 操作类型(Badge) | 操作对象 | 摘要 | IP | 时间 | 操作([详情])

弹窗:
  - LogDetailModal: 日志详情 (2列基本信息 + JSON 代码块)
```

操作类型 Badge 映射：

| action | 显示文本 | Badge 样式 |
|--------|---------|-----------|
| `user.disable` | 封禁用户 | error |
| `user.enable` | 解封用户 | success |
| `user.adjust_balance` | 手动调账 | info |
| `user.reset_password` | 重置密码 | purple |
| `message.broadcast` | 群发公告 | success |
| `message.delete` | 删除公告 | error |
| `config.update` | 修改配置 | warning |
| `order.refund` | 订单退款 | info |

---

## 10. 通用组件设计

### 10.1 FilterBar

通用筛选栏，支持下拉、输入、日期范围、搜索按钮。

```typescript
interface FilterItem {
  type: 'select' | 'input' | 'dateRange';
  key: string;
  placeholder: string;
  options?: Array<{ label: string; value: string | number }>;  // type=select
  width?: number;
}

interface FilterBarProps {
  items: FilterItem[];
  onSearch: (values: Record<string, unknown>) => void;
}
```

每个页面传入不同的 `items` 配置，FilterBar 统一渲染 Ant Design `Select` / `Input` / `DatePicker.RangePicker`。

### 10.2 StatusBadge

通用状态标签。

```typescript
type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'purple';

interface StatusBadgeProps {
  text: string;
  variant: BadgeVariant;
}
```

使用 Ant Design `Tag` 组件，颜色映射：

| variant | 背景 | 文字 | 边框 |
|---------|------|------|------|
| success | `#f6ffed` | `#52c41a` | `#b7eb8f` |
| error | `#fff2f0` | `#ff4d4f` | `#ffccc7` |
| warning | `#fffbe6` | `#faad14` | `#ffe58f` |
| info | `#e6f4ff` | `#1677ff` | `#91caff` |
| purple | `#f9f0ff` | `#722ed1` | `#d3adf7` |

### 10.3 DataTable 辅助

不单独封装 DataTable 组件，直接使用 Ant Design `Table` + `Pagination`。在每个页面中配置 `columns` 和 `dataSource`。

统一配置：

```typescript
const tableProps = {
  size: 'middle' as const,
  rowKey: 'id',
  loading: isLoading,
  pagination: {
    current: params.page,
    pageSize: params.page_size,
    total: total,
    showTotal: (total: number) => `共 ${total.toLocaleString()} 条`,
    onChange: (page: number, pageSize: number) => fetchData({ page, page_size: pageSize }),
  },
};
```

---

## 11. 弹窗组件设计

### 11.1 AdjustBalanceModal（调账弹窗）

```typescript
interface AdjustBalanceModalProps {
  open: boolean;
  userId: number;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}
```

表单字段：

| 字段 | 组件 | 校验 |
|------|------|------|
| type | Radio.Group: 增加积分 / 扣除积分 | 必选 |
| amount | InputNumber | 必填, > 0, 扣除时 ≤ currentBalance |
| reason | Input.TextArea | 必填, 最少 2 字符 |

### 11.2 BanUserModal（封禁弹窗）

```typescript
interface BanUserModalProps {
  open: boolean;
  userId: number;
  userEmail: string;
  currentStatus: UserStatus;
  onClose: () => void;
  onSuccess: () => void;
}
```

- 封禁时：标题 "确认封禁用户"，红色确认按钮，reason 必填
- 解封时：标题 "确认解封用户"，蓝色确认按钮，reason 可选

### 11.3 ResetPasswordModal

使用 Ant Design `Modal.confirm` 实现：

```typescript
Modal.confirm({
  title: '确认重置密码',
  content: `将为用户 ${email} 生成随机密码并通过邮件发送。用户的当前密码将立即失效。`,
  okText: '确认重置',
  cancelText: '取消',
  onOk: () => store.resetPassword(id),
});
```

### 11.4 AnnounceModal（发送公告弹窗）

```typescript
interface AnnounceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

表单字段：

| 字段 | 组件 | 校验 |
|------|------|------|
| msg_type | Radio.Group: 系统公告 / 账户通知 / 用量提醒 | 必选 |
| target | Radio.Group: 全部用户 / 指定用户 | 必选 |
| target_emails | Input.TextArea (仅 target='specific') | 逗号分隔邮箱 |
| title | Input | 必填, ≤ 100 字符 |
| content | Input.TextArea | 必填, ≤ 2000 字符 |

提交逻辑：

```
if (target === 'all') {
  Modal.confirm({
    title: '二次确认',
    content: '确定向全部用户发送此公告吗？此操作不可撤回。',
    okButtonProps: { danger: true },
    onOk: () => submitAnnouncement(),
  });
} else {
  submitAnnouncement();
}
```

### 11.5 LogDetailModal（日志详情弹窗）

```typescript
interface LogDetailModalProps {
  open: boolean;
  log: AuditLogDetail | null;
  onClose: () => void;
}
```

布局：

- 上半部：2列 grid，操作人/操作时间/操作类型/IP/操作对象
- 下半部：代码块，`JSON.stringify(log.detail, null, 2)`，等宽字体，`#f6f8fa` 背景

---

## 12. 工具函数

**文件：`src/utils/format.ts`**

```typescript
import dayjs from 'dayjs';

/** 金额千分位 */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/** 人民币金额 */
export function formatYuan(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

/** 带符号的点数 */
export function formatPoints(amount: number): string {
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${amount.toLocaleString()}`;
}

/** 日期时间 MM-DD HH:mm */
export function formatDateTime(dateStr: string): string {
  return dayjs(dateStr).format('MM-DD HH:mm');
}

/** 完整日期时间 */
export function formatFullDateTime(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
}

/** 百分比变化率 */
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

/** 操作类型中文标签 */
export const ACTION_LABELS: Record<string, string> = {
  'user.disable': '封禁用户',
  'user.enable': '解封用户',
  'user.reset_password': '重置密码',
  'user.adjust_balance': '手动调账',
  'order.refund': '订单退款',
  'message.broadcast': '群发公告',
  'message.delete': '删除公告',
  'config.update': '修改配置',
};

/** 订单状态标签 */
export const ORDER_STATUS_MAP: Record<number, { text: string; variant: string }> = {
  0: { text: '待支付', variant: 'warning' },
  1: { text: '已支付', variant: 'success' },
  2: { text: '已取消', variant: 'error' },
  3: { text: '已退款', variant: 'info' },
};

/** 交易类型标签 */
export const TRANSACTION_TYPE_MAP: Record<string, { text: string; variant: string; color: string }> = {
  recharge:    { text: '充值',     variant: 'success', color: '#52c41a' },
  consumption: { text: '消费',     variant: 'error',   color: '#ff4d4f' },
  gift:        { text: '赠送',     variant: 'purple',  color: '#722ed1' },
  referral:    { text: '邀请奖励', variant: 'warning', color: '#faad14' },
  refund:      { text: '退款',     variant: 'info',    color: '#1677ff' },
};

/** 消息类型标签 */
export const MSG_TYPE_MAP: Record<string, { text: string; variant: string }> = {
  notice:  { text: '系统公告', variant: 'info' },
  account: { text: '账户通知', variant: 'warning' },
  usage:   { text: '用量提醒', variant: 'purple' },
};

/** 用户状态标签 */
export const USER_STATUS_MAP: Record<number, { text: string; variant: string }> = {
  0: { text: '封禁', variant: 'error' },
  1: { text: '正常', variant: 'success' },
};
```

---

## 13. 开发任务拆分

### Phase 1: 项目初始化 (0.5 天) ✅

- [x] 创建 `admin/` 项目目录，`npm create vite . -- --template react-ts`
- [x] 安装依赖：`antd @ant-design/icons @ant-design/charts react-router-dom zustand axios dayjs`
- [x] 配置 `vite.config.ts`（端口 3001 + API 代理）
- [x] 配置 `tsconfig.json`（path alias `@/` → `src/`）
- [x] 创建 `src/types/admin.ts` — 全部类型定义
- [x] 创建 `src/styles/theme.ts` — Ant Design 主题 Token + 颜色常量
- [x] 创建 `src/utils/format.ts` — 格式化工具函数

### Phase 2: API + Store + Auth (1 天) ✅

- [x] 创建 `src/services/adminApi.ts` — 全部 18 个 API 方法
- [x] 创建 `src/store/useAdminStore.ts` — 完整 Store（所有 slice）
- [x] 创建 `src/router/index.tsx` — 路由配置
- [x] 创建 `src/router/AuthGuard.tsx` — 认证守卫
- [x] 创建 `src/App.tsx` — 根组件（ConfigProvider + Router）
- [x] 创建 `src/main.tsx` — 入口文件
- [x] 创建 `src/pages/Login.tsx` — 登录页（含 role 检查）

### Phase 3: 布局 + 仪表盘 (1 天) ✅

- [x] 创建 `src/components/layout/AdminLayout.tsx` — 整体布局壳
- [x] 创建 `src/components/layout/Sidebar.tsx` — 侧边栏导航
- [x] 创建 `src/components/layout/AdminHeader.tsx` — 顶栏面包屑
- [x] 创建 `src/components/dashboard/StatCard.tsx` — 指标卡片
- [x] 创建 `src/components/dashboard/ChartCard.tsx` — 趋势图卡片
- [x] 创建 `src/components/dashboard/RecentLogs.tsx` — 最近操作
- [x] 创建 `src/pages/Dashboard.tsx` — 仪表盘页面组装

### Phase 4: 通用组件 + 用户管理 (1 天) ✅

- [x] 创建 `src/components/shared/FilterBar.tsx` — 通用筛选栏
- [x] 创建 `src/components/shared/StatusBadge.tsx` — 状态 Badge
- [x] 创建 `src/components/modals/AdjustBalanceModal.tsx` — 调账弹窗
- [x] 创建 `src/components/modals/BanUserModal.tsx` — 封禁弹窗
- [x] 创建 `src/pages/Users.tsx` — 用户列表页
- [x] 创建 `src/pages/UserDetail.tsx` — 用户详情页

### Phase 5: 财务管理 (0.5 天) ✅

- [x] 创建 `src/pages/Orders.tsx` — 订单管理页（含 summary-bar）
- [x] 创建 `src/pages/Transactions.tsx` — 交易流水页

### Phase 6: 公告 + 配置 (0.5 天) ✅

- [x] 创建 `src/components/modals/AnnounceModal.tsx` — 发送公告弹窗
- [x] 创建 `src/pages/Announcements.tsx` — 公告管理页
- [x] 创建 `src/pages/Configs.tsx` — 系统配置页

### Phase 7: 操作日志 (0.5 天) ✅

- [x] 创建 `src/components/modals/LogDetailModal.tsx` — 日志详情弹窗
- [x] 创建 `src/pages/AuditLogs.tsx` — 操作日志页

### Phase 8: 联调与优化 (1 天) ✅

- [x] TypeScript 编译检查通过 (`npx tsc --noEmit` 零错误)
- [x] 开发服务器启动正常 (`npx vite` :3001)
- [x] 生产构建成功 (`npx vite build`)
- [x] 类型定义与后端 API 响应对齐（修正字段名差异）
- [x] 登录认证流程联调（access_token + role 检查）

---

## 14. 与后端对接备注

### 14.1 BFF 新增内容

| 变更 | 说明 |
|------|------|
| `users` 表加 `role` 字段 | `ALTER TABLE ... ADD COLUMN role VARCHAR(20) DEFAULT 'user'` |
| JWT Claims 加 `role` 字段 | Token 签发时写入角色 |
| AdminMiddleware | 检查 JWT 中 role 为 admin/super_admin |
| `/api/admin/*` 路由组 | 所有 18 个管理端接口（详见 PRD 第 6 节） |
| `admin_audit_logs` 表 | 管理操作审计日志 |
| `system_configs` 表 | 运行时配置 |

### 14.2 CORS 配置

BFF 需允许来自管理端的跨域请求（开发环境 `localhost:3001`）：

```go
// router.go
adminRouter := r.Group("/api/admin")
adminRouter.Use(AuthMiddleware(), AdminMiddleware())
// ... admin routes

// CORS middleware 需包含 :3001 Origin
```

### 14.3 API 响应格式

管理端 API 统一使用与用户端相同的响应格式：

```json
{
  "code": 0,
  "data": { ... },
  "message": ""
}
```

`code = 0` 表示成功，其余为错误码。

---

## 15. 注意事项

### 15.1 与用户端的差异

| 方面 | 用户端 | 管理端 |
|------|--------|--------|
| 框架 | Expo/RN | React (Web only) |
| UI 库 | NativeWind + 自定义组件 | Ant Design 5 |
| 路由 | Expo Router（文件式） | React Router（配置式） |
| 样式 | `useTheme()` + StyleSheet | Ant Design Token + CSS Modules |
| HTTP | 自定义 `ApiClient` | axios 封装 |
| 主题 | 深色/浅色双主题 | 仅浅色主题 |

### 15.2 安全注意

- 所有 `/api/admin/*` 请求必须携带有效 JWT 且 role 为 admin
- 前端 `AuthGuard` 仅为 UX 层面的拦截，真正的安全由 BFF AdminMiddleware 保证
- Token 存储在 `localStorage`，生产环境建议改用 `httpOnly cookie`
- 敏感操作（封禁、调账、群发）必须通过二次确认弹窗

### 15.3 性能注意

- 列表页使用服务端分页，每页 20 条
- 仪表盘 5 个请求并行加载（`Promise.all`）
- 趋势图数据按需加载（切换天数时重新请求）
- Ant Design Table 使用 `virtual` 属性在大数据量时开启虚拟滚动

### 15.4 后续迭代

- P1 页面：数据报表、内容审查、邀请管理、登录日志
- 响应式适配（Tablet、Sidebar 折叠）
- 表格列排序
- 数据导出（CSV/Excel）
- WebSocket 实时通知

---

*文档版本：1.0*
*创建日期：2026-02-07*
*最后更新：2026-02-07*
*作者：Claude*
