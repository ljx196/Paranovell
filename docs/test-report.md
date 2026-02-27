# GenNovelWeb 测试报告

> 生成日期：2026-02-27
> 测试框架：Jest 30.2 + ts-jest（前端）、Go testing（后端）
> 总测试数：**351**　通过：**351**　失败：**0**

---

## 一、总览

| 端 | 测试套件 | 测试用例 | 通过率 | 目标覆盖率 | 实际覆盖率（语句） |
|---|---------|---------|--------|-----------|------------------|
| 前端 | 11 | 220 | 100% | ≥90% | **94.64%** |
| 后端 | 3 packages | 131 | 100% | ≥90%（utils/middleware） | utils 90.5%、middleware 100% |
| **合计** | — | **351** | **100%** | — | — |

---

## 二、前端测试详情

### 2.1 执行命令

```bash
cd frontend && npx jest --coverage
```

### 2.2 测试文件清单

| # | 测试文件 | 测试数 | 状态 | 覆盖模块 |
|---|---------|--------|------|---------|
| 1 | `src/__tests__/utils/errorMessages.test.ts` | 29 | PASS | `src/utils/errorMessages.ts` |
| 2 | `src/__tests__/utils/timeFormat.test.ts` | 11 | PASS | `src/utils/timeFormat.ts` |
| 3 | `src/__tests__/store/useAuthStore.test.ts` | 10 | PASS | `src/store/useAuthStore.ts` |
| 4 | `src/__tests__/store/useBalanceStore.test.ts` | 45 | PASS | `src/store/useBalanceStore.ts` |
| 5 | `src/__tests__/store/useMessageStore.test.ts` | 25 | PASS | `src/store/useMessageStore.ts` |
| 6 | `src/__tests__/store/useChatStore.test.ts` | 16 | PASS | `src/store/useChatStore.ts` |
| 7 | `src/__tests__/store/useThemeStore.test.ts` | 8 | PASS | `src/store/useThemeStore.ts` |
| 8 | `src/__tests__/services/api.test.ts` | 35 | PASS | `src/services/api.ts` |
| 9 | `src/__tests__/hooks/useResponsive.test.ts` | 10 | PASS | `src/hooks/useResponsive.ts` |
| 10 | `src/__tests__/theme/constants.test.ts` | 17 | PASS | `src/theme/colors.ts` `spacing.ts` `typography.ts` |
| 11 | `src/__tests__/store.test.ts`（原有） | 14 | PASS | `src/store/useAuthStore.ts` `useChatStore.ts` |

### 2.3 覆盖率明细

| 目录 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 | 行覆盖率 | 未覆盖行 |
|-----|-----------|-----------|-----------|---------|---------|
| **All files** | **94.64%** | **84.57%** | **90.17%** | **94.24%** | — |
| `hooks/` | 100% | 100% | 100% | 100% | — |
| `utils/` | 100% | 100% | 100% | 100% | — |
| `theme/` | 100% | 100% | 100% | 100% | — |
| `store/useAuthStore.ts` | 93.75% | 100% | 91.66% | 93.75% | 71 |
| `store/useBalanceStore.ts` | 96.15% | 83.67% | 100% | 95.91% | 176,261,319-320 |
| `store/useChatStore.ts` | 100% | 87.5% | 100% | 100% | — |
| `store/useMessageStore.ts` | 98.46% | 87.09% | 100% | 98.33% | 110 |
| `store/useThemeStore.ts` | 100% | 75% | 100% | 100% | — |
| `services/api.ts` | 86.44% | 76.19% | 72.97% | 84.9% | 73,111,219,243-247,272-307 |

### 2.4 测试分类说明

#### 工具函数（`utils/`）— 40 tests，100% 覆盖

- **errorMessages**：29 个用例，覆盖 20+ 错误模式（邮箱、密码、认证、网络、服务器）、Error 对象、含 `.message` 属性的对象、null/undefined/空字符串、中文透传、不匹配英文兜底
- **timeFormat**：11 个用例，覆盖 `formatRelativeTime`（刚刚/分钟/小时/天/日期）、`formatDateTime`、`formatDate` 及边界值

#### 状态管理（`store/`）— 104 tests，97.26% 覆盖

- **useAuthStore**（10）：初始状态、setUser/setTokens/logout/setLoading/initialize 及超时行为
- **useBalanceStore**（45）：fetchBalance 成功/失败、fetchTransactions 分页/筛选/刷新/hasMore、loadMoreTransactions 追加/守卫、setTransactionFilter 重置触发、fetchDailyUsage 自定义天数/空响应、setUsagePeriod 联动、fetchConversationRanking 刷新/分页、loadMoreRanking 守卫、fetchRechargeConfig 成功/失败、createRechargeOrder 返回/loading 管理、pollOrderStatus 成功/取消/超时、fetchPricing、setActiveTab 切换触发、setShowLowBalanceModal、initOverview 并行调用/失败兜底、reset
- **useMessageStore**（25）：fetchMessages 成功/刷新/筛选/空响应、loadMoreMessages 追加/守卫、fetchUnreadCount、markAsRead 标记/跳过已读/未找到/不低于零/失败抛出、markAllAsRead、setActiveTab 切换触发、openDetailModal 自动标已读/closeDetailModal、reset
- **useChatStore**（16）：setConversations/addConversation 置顶/removeConversation 清当前/setCurrentConversation/setMessages/addMessage 新会话/updateMessage 不影响其他/setLoading/setSending/clearChat
- **useThemeStore**（8）：初始 dark/setMode/toggleMode 双向/double toggle/setHydrated

#### API 服务（`services/`）— 35 tests，86.44% 覆盖

- URL 构造、Bearer 注入、skipAuth 跳过、无 token 兼容
- 401 刷新重试成功/刷新失败登出/无 refreshToken 登出
- 错误处理（带消息/无消息 fallback）
- 端点验证：register/login/logout/verifyEmail/forgotPassword/resetPassword/getProfile/updateProfile/changePassword/deleteAccount/getMessages/markMessageAsRead/markAllMessagesAsRead/getUnreadCount/getBalance/checkBalance/getTransactions/getRechargeConfig/createRechargeOrder/getOrderStatus/getPricing/getDailyUsageExtended/getConversationRanking

#### Hooks（`hooks/`）— 10 tests，100% 覆盖

- useResponsive：mobile(<768)/tablet(768-1024)/desktop(≥1024) 边界值 767/768/1023/1024、互斥校验、width/height 透传
- useMessagePadding：mobile 返回 768、desktop 返回 48

#### 主题常量（`theme/`）— 17 tests，100% 覆盖

- darkColors/lightColors 键集一致性、必需键存在性、颜色值非空
- spacing/layout/borderRadius/padding/messagePadding 值校验
- fontSize/fontWeight/lineHeight/typography 计算值校验

### 2.5 测试基础设施

| 文件 | 作用 |
|-----|------|
| `jest.config.js` | testMatch 扩展 `.tsx`、moduleNameMapper 映射 AsyncStorage、setupFiles |
| `src/__mocks__/setup.ts` | 全局 mock：expo-router、react-native（Dimensions/useWindowDimensions/Platform）、fetch |
| `src/__mocks__/async-storage.ts` | AsyncStorage 内存实现，支持 Zustand persist |
| `src/__mocks__/expo-router.ts` | router/useRouter/useLocalSearchParams/Redirect/Link mock |

### 2.6 TypeScript 校验

```bash
cd frontend && npx tsc --noEmit  # 通过，无错误
```

---

## 三、后端测试详情

### 3.1 执行命令

```bash
cd bff && go test ./internal/utils/... ./internal/middleware/... ./internal/handler/... -v -cover
```

### 3.2 测试文件清单

| # | 测试文件 | 测试数 | 状态 | 覆盖模块 |
|---|---------|--------|------|---------|
| 1 | `internal/utils/password_test.go` | 10 | PASS | password.go |
| 2 | `internal/utils/jwt_test.go` | 13 | PASS | jwt.go |
| 3 | `internal/utils/response_test.go` | 11 | PASS | response.go |
| 4 | `internal/middleware/auth_test.go` | 8 | PASS | auth.go |
| 5 | `internal/middleware/admin_test.go` | 5 | PASS | admin.go |
| 6 | `internal/middleware/cors_test.go` | 4 | PASS | cors.go |
| 7 | `internal/middleware/ratelimit_test.go` | 8 | PASS | ratelimit.go |
| 8 | `internal/handler/auth_handler_test.go` | 16 | PASS | auth_handler.go |
| 9 | `internal/handler/balance_handler_test.go` | 9 | PASS | balance_handler.go |
| 10 | `internal/handler/user_handler_test.go` | 10 | PASS | user_handler.go |
| 11 | `internal/handler/message_handler_test.go` | 10 | PASS | message_handler.go |
| 12 | `internal/handler/chat_handler_test.go` | 6 | PASS | chat_handler.go |
| 13 | `internal/handler/recharge_handler_test.go` | 6 | PASS | recharge_handler.go |
| 14 | `internal/handler/usage_handler_test.go` | 5 | PASS | usage_handler.go |
| 15 | `internal/handler/admin_handlers_test.go` | 11 | PASS | admin_*_handler.go |
| 16 | `internal/handler/handler_test.go` | 3 | PASS | handler.go |

### 3.3 覆盖率明细

| 包 | 覆盖率 | 说明 |
|---|--------|------|
| `internal/utils` | **90.5%** | 纯函数，bcrypt/jwt/response 全覆盖 |
| `internal/middleware` | **100%** | auth/admin/cors/ratelimit 全覆盖 |
| `internal/handler` | 20.6% | 输入验证和鉴权路径覆盖；业务逻辑依赖 DB 未覆盖 |

### 3.4 测试分类说明

#### 工具函数（`internal/utils/`）— 34 tests

- **password**（10）：HashPassword 非空/不同于明文/盐值随机、CheckPassword 正确/错误、GenerateInviteCode 长度≤8/大写字母数字/唯一性、GenerateRandomToken 非空/唯一性
- **jwt**（13）：InitJWT 初始化、GenerateTokenPair 双 token/正确 claims/Subject 区分/未初始化报错、ValidateToken 有效/过期(ErrExpiredToken)/篡改(ErrInvalidToken)/空串/未初始化、ValidateRefreshToken 有效/access 拒绝/过期
- **response**（11）：Success/SuccessMessage/BadRequest/Unauthorized/Forbidden/NotFound/Conflict/InternalError/Error 自定义码、使用 httptest+gin.TestMode

#### 中间件（`internal/middleware/`）— 25 tests

- **auth**（8）：缺 Header(401 "请先登录")/格式错误(401 "无效的认证格式")/无效 token(401)/过期 token(401 "Token 已过期")/refresh 类型拒绝(401 "无效的 Token 类型")/有效 token 设置上下文/空 Bearer 值
- **admin**（5）：admin 角色通过/super_admin 通过/user 拒绝(403 "无管理权限")/无角色拒绝/未知角色拒绝
- **cors**（4）：OPTIONS 预检 204+CORS 头/普通请求带 CORS 头/验证具体头部值/OPTIONS 不到达 handler
- **ratelimit**（8）：限流内通过/超限 429/窗口重置/不同 IP 独立/allow 方法新 IP/allow 超限/cleanup 清理

#### 处理器（`internal/handler/`）— 72 tests

> 策略：Handler 依赖 DB service 层，测试聚焦**请求解析、参数校验、鉴权守卫**，不启动数据库。

- **auth_handler**（16）：Register 空体/缺邮箱/无效邮箱/缺密码/密码过短/有效格式、Login 空体/缺邮箱/缺密码/有效格式、RefreshToken 空体/缺 token/无效 token/有效 token、Logout 成功
- **balance_handler**（9）：GetBalance/CheckBalance/GetTransactions 无鉴权 401、有鉴权但 service nil、无效参数 400、有效参数
- **user_handler**（10）：GetProfile/UpdateProfile/ChangePassword/DeleteAccount 无鉴权 401、有效 body 解析、无效字段 400
- **message_handler**（10）：ListMessages/GetMessage/MarkAsRead/GetUnreadCount 无鉴权 401、无效 ID 400、有效参数
- **chat_handler**（6）：ListConversations/GetMessages 200、CreateConversation/DeleteConversation/SendMessage/WebSocket 501
- **recharge_handler**（6）：GetRechargeConfig/CreateRechargeOrder/GetOrderStatus 无鉴权 401、缺 body 400、PaymentCallback 缺 body 400
- **usage_handler**（5）：GetUsageSummary/GetDailyUsage/GetUsageDetail 无鉴权 401、有鉴权默认天数
- **admin_handlers**（11）：DashboardStats/GetUsers 无鉴权 401/user 角色 403/admin 角色通过、GetUserDetail/GetAuditLogDetail 无效 ID 400、UpdateUserStatus/AdjustBalance 鉴权检查

### 3.5 Go vet 校验

```bash
cd bff && go vet ./...  # 通过，无警告
```

---

## 四、测试范围说明

### 4.1 已覆盖

| 层 | 模块 | 测试类型 |
|---|------|---------|
| 前端 | Zustand stores（5 个） | 状态管理单元测试，含 API mock |
| 前端 | ApiClient 服务 | fetch mock 测试，覆盖鉴权/重试/错误处理 |
| 前端 | 工具函数 | 纯函数单元测试 |
| 前端 | Hooks | mock Dimensions 的断点测试 |
| 前端 | 主题常量 | 值校验、一致性校验 |
| 后端 | utils（password/jwt/response） | 纯函数单元测试 |
| 后端 | middleware（auth/admin/cors/ratelimit） | httptest HTTP 测试 |
| 后端 | handler（12 个处理器文件） | 输入验证 + 鉴权守卫 HTTP 测试 |

### 4.2 未覆盖（按计划排除）

| 模块 | 原因 |
|------|------|
| 前端 `.tsx` 组件渲染 | 计划范围外（需 React 渲染环境） |
| 前端 `ThemeContext.tsx` | JSX 组件，需 babel-preset-expo 支持 |
| 后端 `service/` 层 | 依赖 PostgreSQL 数据库连接 |
| 后端 `cmd/`、`config/`、`database/`、`model/` | 基础设施代码，非业务逻辑 |
| 管理后台面板 | 计划范围外 |

### 4.3 Handler 覆盖率说明

后端 handler 覆盖率 20.6% 的原因：handler 函数在通过输入验证后立即调用 service 层，而 service 层需要真实数据库连接。在无 DB 的测试环境下，只能覆盖到**请求解析 → 参数校验 → 鉴权检查**这条路径。要提升 handler 覆盖率，需引入 service 接口 mock 或集成测试数据库。

---

## 五、运行指南

### 前端

```bash
# 运行全部测试
cd frontend && npx jest

# 运行带覆盖率
cd frontend && npx jest --coverage

# 运行单个测试文件
cd frontend && npx jest src/__tests__/store/useBalanceStore.test.ts

# TypeScript 类型检查
cd frontend && npx tsc --noEmit
```

### 后端

```bash
# 运行全部测试
cd bff && go test ./... -v

# 运行带覆盖率
cd bff && go test ./internal/utils/... ./internal/middleware/... ./internal/handler/... -cover

# 运行单个包
cd bff && go test ./internal/utils/... -v

# Go 代码检查
cd bff && go vet ./...
```

---

## 六、测试文件目录结构

```
frontend/
├── jest.config.js                          # Jest 配置
├── src/
│   ├── __mocks__/
│   │   ├── setup.ts                        # 全局 mock（expo-router, RN, fetch）
│   │   ├── async-storage.ts                # AsyncStorage mock
│   │   └── expo-router.ts                  # expo-router mock
│   └── __tests__/
│       ├── utils/
│       │   ├── errorMessages.test.ts       # 29 tests
│       │   └── timeFormat.test.ts          # 11 tests
│       ├── store/
│       │   ├── useAuthStore.test.ts        # 10 tests
│       │   ├── useBalanceStore.test.ts     # 45 tests
│       │   ├── useMessageStore.test.ts     # 25 tests
│       │   ├── useChatStore.test.ts        # 16 tests
│       │   └── useThemeStore.test.ts       #  8 tests
│       ├── services/
│       │   └── api.test.ts                 # 35 tests
│       ├── hooks/
│       │   └── useResponsive.test.ts       # 10 tests
│       ├── theme/
│       │   └── constants.test.ts           # 17 tests
│       └── store.test.ts                   # 14 tests（原有）

bff/internal/
├── utils/
│   ├── password_test.go                    # 10 tests
│   ├── jwt_test.go                         # 13 tests
│   └── response_test.go                    # 11 tests
├── middleware/
│   ├── auth_test.go                        #  8 tests
│   ├── admin_test.go                       #  5 tests
│   ├── cors_test.go                        #  4 tests
│   └── ratelimit_test.go                   #  8 tests
└── handler/
    ├── handler_test.go                     #  3 tests（原有，已修正）
    ├── auth_handler_test.go                # 16 tests
    ├── balance_handler_test.go             #  9 tests
    ├── user_handler_test.go                # 10 tests
    ├── message_handler_test.go             # 10 tests
    ├── chat_handler_test.go                #  6 tests
    ├── recharge_handler_test.go            #  6 tests
    ├── usage_handler_test.go               #  5 tests
    └── admin_handlers_test.go              # 11 tests
```
