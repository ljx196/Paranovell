# GenNovel 前端 iOS/Android 迁移计划

> 文档创建日期：2026-03-01
> 最后更新：2026-03-01
> 适用范围：`frontend/` 代码库（Expo 54 + React Native 0.81.5）
> 目标：将现有 Web 端应用适配至 iOS 与 Android 原生平台

---

## 一、核心策略：共享逻辑，隔离 UI

### 1.1 为什么不用"一份代码 + Platform.select 补丁"

传统做法是在一个文件里用 `Platform.select` / `Platform.OS === 'web'` 做条件分支。这种方式的问题：

- **改原生代码必须回归 Web**：逻辑耦合在同一文件，任何修改都可能影响已稳定的 Web 端
- **可读性崩塌**：随着三端差异积累，组件内充斥 `Platform.OS` 判断，难以维护
- **测试成本高**：每次改动需三端全部回归

### 1.2 正确做法：按平台拆分文件

Expo/Metro bundler 原生支持按平台后缀自动选择文件，**零配置**：

```
组件文件名解析优先级（以 iOS 为例）：
  ChatInput.ios.tsx  >  ChatInput.native.tsx  >  ChatInput.tsx

Web 平台：
  ChatInput.web.tsx  >  ChatInput.tsx
```

导入方无需感知拆分，写法完全不变：

```typescript
// 不管哪个平台，import 路径一样
import { ChatInput } from '../components/chat/ChatInput';
// Metro 根据目标平台自动选择 .web.tsx 或 .native.tsx
```

### 1.3 分层架构

```
┌──────────────────────────────────────────────────────────────┐
│                     100% 共享层（不拆分）                      │
│                                                              │
│  状态管理   src/store/*.ts          (Zustand + AsyncStorage) │
│  API 层    src/services/api.ts     (fetch 调用)              │
│  类型定义   src/types/index.ts     (TypeScript 接口)          │
│  工具函数   src/utils/*.ts         (timeFormat, errors)       │
│  主题常量   src/theme/colors.ts, spacing.ts, typography.ts   │
│  路由结构   app/*.tsx              (Expo Router 页面)          │
│  Hook      src/hooks/*.ts         (useResponsive)            │
│                                                              │
│  → 这些代码三端完全一致，修改不会影响任何平台                     │
├──────────────────────────────────────────────────────────────┤
│                  按平台拆分层（各写各的）                        │
│                                                              │
│  ChatInput.web.tsx           ← Web 现有代码不动                │
│  ChatInput.native.tsx        ← iOS/Android 新写               │
│  ChatInput.shared.ts         ← 提取共享 props/逻辑（可选）      │
│                                                              │
│  → 改 native 文件时 Web 不会被加载，物理隔离                    │
│  → 改 web 文件时原生不受影响                                   │
├──────────────────────────────────────────────────────────────┤
│               小差异层（保持单文件 + Platform.select）           │
│                                                              │
│  MessageCard.tsx   → 1 行 hovered 改 pressed                  │
│  PeriodSelector.tsx → 1 行 hovered 改 pressed                 │
│                                                              │
│  → 差异 ≤ 2 行，不值得拆文件                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 二、技术栈兼容性评估

### 2.1 兼容性总览

| 技术 | 版本 | iOS/Android 兼容性 | 是否需要改动 |
|------|------|-------------------|-------------|
| Expo | 54.0.33 | 原生支持 | 否 |
| React Native | 0.81.5 | 原生支持 | 否 |
| Expo Router | 6.0.23 | 原生导航支持 | 否 |
| Zustand | 5.0.11 | 完全兼容 | 否 |
| AsyncStorage | 2.2.0 | 完全兼容 | 否 |
| NativeWind | 4.2.1 | 原生支持 | 少量清理 |
| lucide-react-native | 0.575.0 | 完全兼容 | 否 |
| react-native-svg | 15.12.1 | 完全兼容 | 否 |
| @shopify/flash-list | 2.2.1 | 完全兼容 | 否 |
| react-native-safe-area-context | 5.6.2 | 已安装但未使用 | 需接入 |
| react-native-screens | 4.20.0 | 完全兼容 | 否 |

### 2.2 已兼容部分（无需任何改动）

- **数据持久化**：全部使用 `AsyncStorage`，无 `localStorage` / `sessionStorage`
- **状态管理**：Zustand + `createJSONStorage(() => AsyncStorage)` 模式正确
- **API 层**：纯 `fetch` 调用，跨平台兼容
- **主题上下文**：`ThemeContext.tsx` 已有 `Platform.OS === 'web'` 守卫
- **字体系统**：`typography.ts` 按 `Platform.OS` 设置不同字体族
- **图标系统**：`lucide-react-native` + `react-native-svg` 原生兼容
- **高性能列表**：`@shopify/flash-list` 原生优化

---

## 三、全量文件分类清单

### 3.1 Category A：完全共享（35+ 文件，不做任何修改）

这些文件使用的全部是标准 RN 组件和跨平台 API，三端表现一致：

#### 状态管理层（6 文件）— 100% 共享

| 文件 | 说明 |
|------|------|
| `src/store/useAuthStore.ts` | 认证状态（JWT + AsyncStorage 持久化） |
| `src/store/useChatStore.ts` | 聊天状态（会话列表、消息） |
| `src/store/useBalanceStore.ts` | 余额/交易/充值状态 |
| `src/store/useMessageStore.ts` | 系统消息状态 |
| `src/store/useThemeStore.ts` | 主题偏好持久化 |
| `src/store/index.ts` | 导出 |

#### API 与服务层（1 文件）— 100% 共享

| 文件 | 说明 |
|------|------|
| `src/services/api.ts` | ApiClient 类，纯 fetch API |

#### 类型定义（1 文件）— 100% 共享

| 文件 | 说明 |
|------|------|
| `src/types/index.ts` | 全部 TypeScript 接口 |

#### 工具函数（2 文件）— 100% 共享

| 文件 | 说明 |
|------|------|
| `src/utils/timeFormat.ts` | 日期格式化 |
| `src/utils/errorMessages.ts` | 错误提示映射 |

#### 主题常量（4 文件）— 100% 共享

| 文件 | 说明 |
|------|------|
| `src/theme/colors.ts` | darkColors / lightColors 对象 |
| `src/theme/spacing.ts` | 间距、布局常量 |
| `src/theme/typography.ts` | 字体大小（已有 Platform 判断） |
| `src/theme/ThemeContext.tsx` | ThemeProvider（document 操作已有 Platform 守卫） |

#### Hooks（1 文件）— 100% 共享

| 文件 | 说明 |
|------|------|
| `src/hooks/useResponsive.ts` | 使用 `useWindowDimensions`，跨平台 |

#### UI 基础组件（6 文件）— 100% 共享

| 文件 | 说明 | 验证理由 |
|------|------|---------|
| `src/components/ui/Avatar.tsx` | 头像 | 仅 View/Text/Image |
| `src/components/ui/Card.tsx` | 卡片容器 | 仅 View |
| `src/components/ui/UnreadBadge.tsx` | 未读数徽标 | 仅 View/Text |
| `src/components/chat/TypingIndicator.tsx` | 打字动画 | Animated API |
| `src/components/chat/LoadMoreIndicator.tsx` | 加载更多 | Animated/View/Text |
| `src/components/chat/QuickReplies.tsx` | 快捷回复 | Pressable/View/Text |

#### 消息组件（3 文件）— 100% 共享

| 文件 | 说明 | 验证理由 |
|------|------|---------|
| `src/components/message/MessageDetailModal.tsx` | 消息详情弹窗 | Modal/ScrollView/TouchableOpacity |
| `src/components/message/MessageSkeleton.tsx` | 加载骨架 | Animated/View |
| `src/components/message/MessageTabs.tsx` | 消息分类标签 | TouchableOpacity/ScrollView |

#### 使用/余额组件（9 文件）— 100% 共享

| 文件 | 说明 | 验证理由 |
|------|------|---------|
| `src/components/usage/CustomAmount.tsx` | 自定义金额 | TextInput/View/Text |
| `src/components/usage/PaymentMethodSelector.tsx` | 支付方式 | TouchableOpacity/View |
| `src/components/usage/PricingInfo.tsx` | 定价表 | View/Text |
| `src/components/usage/LowBalanceModal.tsx` | 余额不足弹窗 | Modal/TouchableOpacity |
| `src/components/usage/RechargePresets.tsx` | 充值预设 | Pressable/View |
| `src/components/usage/RechargeNotes.tsx` | 充值说明 | View/Text |
| `src/components/usage/UsageSkeleton.tsx` | 加载骨架 | Animated/View |
| `src/components/usage/UsageTrendChart.tsx` | 趋势图表 | react-native-svg（跨平台） |
| `src/components/usage/ConversationRanking.tsx` | 会话排名 | View/Text |

#### 布局组件（2 文件）— 100% 共享

| 文件 | 说明 | 验证理由 |
|------|------|---------|
| `src/components/layout/BalanceDisplay.tsx` | 余额展示 | TouchableOpacity/Text |
| `src/components/layout/AuthLayout.tsx` | 认证页布局 | KeyboardAvoidingView/ScrollView |

#### 页面文件（6 文件）— 100% 共享

| 文件 | 说明 | 验证理由 |
|------|------|---------|
| `app/index.tsx` | 认证跳转 | 纯导航逻辑 |
| `app/verify-email.tsx` | 邮箱验证 | 标准 RN 组件 |
| `app/forgot-password.tsx` | 密码重置 | 标准 RN 组件 |
| `app/profile.tsx` | 个人资料 | 重定向页面 |
| `app/messages.tsx` | 系统消息 | 标准 RN 组件 |
| `app/demo.tsx` | 演示页 | 标准 RN 组件 |

---

### 3.2 Category B：需要平台拆分（11 个组件）

这些组件存在显著的平台差异，需要拆成 `.web.tsx` + `.native.tsx`，Web 现有代码原封不动。

#### B-01: `ChatInput` — 聊天输入框

**当前文件**：`src/components/chat/ChatInput.tsx`（282 行）

| 维度 | Web 端 | Native 端 |
|------|--------|-----------|
| 高度自适应 | DOM `scrollHeight` 计算（60-69 行） | `onContentSizeChange` 回调 |
| 键盘发送 | Enter 发送，Shift+Enter 换行（99 行） | 软键盘自带发送按钮或独立按钮 |
| 阴影 | `boxShadow` 内联（127 行） | `shadowColor`/`elevation`（已在 StyleSheet 中） |
| 输入框样式 | `outlineStyle: 'none'`、`resize: 'none'`（242-244 行） | 不需要 |
| 按钮反馈 | `state.hovered`（174, 202 行） | `pressed` 状态 |
| 鼠标指针 | `cursor: 'pointer'`（264, 272 行） | 不需要 |

**拆分方案**：

```
ChatInput.tsx          → 重命名为 ChatInput.web.tsx（不改一行）
ChatInput.native.tsx   → 新写，使用 onContentSizeChange + pressed
ChatInput.shared.ts    → 提取共享部分：
                          - ChatInputProps 接口
                          - LINE_HEIGHT, MAX_LINES, MAX_INPUT_HEIGHT 常量
                          - useInputLogic() hook（value/send/expand 状态管理）
```

**shared 代码内容**：

```typescript
// ChatInput.shared.ts
export interface ChatInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSend?: () => void;
  expanded?: boolean;
  onExpand?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const LINE_HEIGHT = 22;
export const MAX_LINES = 5;
export const MAX_INPUT_HEIGHT = MAX_LINES * LINE_HEIGHT;

export function useInputLogic(props: ChatInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(LINE_HEIGHT);

  const inputValue = props.value !== undefined ? props.value : internalValue;
  const canSend = !props.disabled && !!inputValue.trim();

  const handleChange = (text: string) => { ... };
  const handleSend = () => { ... };
  const handleArrowPress = () => { ... };

  return { inputValue, isFocused, inputHeight, canSend,
           setIsFocused, setInputHeight, handleChange, handleSend, handleArrowPress };
}
```

---

#### B-02: `UserMenu` — 用户菜单

**当前文件**：`src/components/layout/UserMenu.tsx`

| 维度 | Web 端 | Native 端 |
|------|--------|-----------|
| 点击外部关闭 | `document.addEventListener('mousedown')`（58-67 行） | `<Modal transparent>` + 透明 Pressable 背景层 |
| 菜单触发 | `state.hovered` 背景色（119-123 行） | `pressed` 状态 |
| 菜单项反馈 | `state.hovered`（167, 196-200 行） | `pressed` 状态 |
| 阴影 | `boxShadow`（268 行） | `elevation` / `shadowColor` |

**拆分方案**：

```
UserMenu.tsx         → 重命名为 UserMenu.web.tsx
UserMenu.native.tsx  → 新写：Modal 弹出菜单 + pressed 反馈
UserMenu.shared.ts   → 提取共享部分：
                        - Props 接口
                        - 菜单项定义（label/icon/action 数组）
                        - 登出确认逻辑
```

---

#### B-03: `NotificationDropdown` — 通知下拉

**当前文件**：`src/components/message/NotificationDropdown.tsx`

| 维度 | Web 端 | Native 端 |
|------|--------|-----------|
| 触发方式 | `onMouseEnter` hover 预览（37-57 行） | 点击铃铛 → 跳转 `/messages` 或 Modal 底部弹窗 |
| 下拉面板 | 绝对定位 `top: '100%'`（117 行起） | 完全不同的 UI（全屏 Modal 或导航跳转） |
| 尺寸 | `width: 320`、`maxWidth: '90vw'` | `useWindowDimensions()` 百分比 |
| 列表项 | `state.hovered`（170-174 行） | `pressed` 状态 |
| 阴影 | `boxShadow`（256 行） | `elevation` |

**拆分方案**：

```
NotificationDropdown.tsx         → 重命名为 NotificationDropdown.web.tsx
NotificationDropdown.native.tsx  → 新写：点击跳转或 Modal 弹窗
NotificationDropdown.shared.ts   → 提取共享部分：
                                    - Props 接口
                                    - 未读数获取逻辑
                                    - 消息列表 fetch 逻辑
                                    - 铃铛图标 + 徽标渲染
```

---

#### B-04: `MessageBubble` — 消息气泡

**当前文件**：`src/components/chat/MessageBubble.tsx`

| 维度 | Web 端 | Native 端 |
|------|--------|-----------|
| 图片缩放提示 | `onHoverIn/onHoverOut` + zoom 指示器（42-83 行） | 长按提示或直接点击放大 |
| 鼠标指针 | `cursor: 'zoom-in'`（54 行） | 不需要 |
| 文字换行 | `whiteSpace: 'pre-wrap'`、`wordBreak`（231-232 行） | RN Text 自动换行 |
| 图片查看 | Modal 内静态图片 | pinch-to-zoom（Phase 4 增强） |

**拆分方案**：

```
MessageBubble.tsx         → 重命名为 MessageBubble.web.tsx
MessageBubble.native.tsx  → 新写：去掉 hover，加 onLongPress 菜单
MessageBubble.shared.ts   → 提取共享部分：
                             - Props 接口（Message 类型）
                             - 消息内容解析逻辑
                             - 图片尺寸计算
                             - 时间戳格式化
```

---

#### B-05: `Sidebar` — 侧边栏

**当前文件**：`src/components/chat/Sidebar.tsx`

| 维度 | Web 端 | Native 端 |
|------|--------|-----------|
| 呈现方式 | 固定 260px 侧栏 | Drawer 抽屉 / 全屏 Modal |
| 会话项反馈 | `state.hovered`（88-91, 123-130 行） | `pressed` 状态 |
| 阴影 | `boxShadow`（163 行） | `elevation` |
| 关闭方式 | 折叠按钮 | 左滑手势 / 点击遮罩 |

**拆分方案**：

```
Sidebar.tsx         → 重命名为 Sidebar.web.tsx
Sidebar.native.tsx  → 新写：Drawer 或全屏列表
Sidebar.shared.ts   → 提取共享部分：
                       - SidebarProps 接口
                       - 会话列表渲染逻辑
                       - 新建会话/选择会话回调
```

---

#### B-06: `Header` — 顶部栏

**当前文件**：`src/components/layout/Header.tsx`

| 维度 | Web 端 | Native 端 |
|------|--------|-----------|
| 按钮反馈 | `state.hovered`（47-51, 73-77 行） | `pressed` 状态 |
| 安全区域 | 无需处理 | `useSafeAreaInsets().top` 顶部间距 |

**拆分方案**：

```
Header.tsx         → 重命名为 Header.web.tsx
Header.native.tsx  → 新写：加 SafeArea padding + pressed 反馈
Header.shared.ts   → 提取共享部分：
                      - HeaderProps 接口
                      - 标题/返回按钮/主题切换逻辑
```

---

#### B-07: `Button` — 通用按钮

**当前文件**：`src/components/ui/Button.tsx`

| 维度 | Web 端 | Native 端 |
|------|--------|-----------|
| 交互反馈 | `state.hovered` 多处（112-155 行） | `pressed` 状态 |
| 禁用光标 | `cursor: 'not-allowed'`（150 行） | 不需要（原生灰显即可） |
| 焦点样式 | `outlineStyle: 'none'`（154 行） | 不需要 |

**拆分方案**：

```
Button.tsx         → 重命名为 Button.web.tsx
Button.native.tsx  → 新写：pressed 反馈 + 44px 最小触摸目标
Button.shared.ts   → 提取共享部分：
                      - ButtonProps 接口（variant/size/disabled/loading）
                      - variant 颜色映射逻辑
                      - ActivityIndicator 渲染
```

---

#### B-08: `Input` — 文本输入框

**当前文件**：`src/components/ui/Input.tsx`

| 维度 | Web 端 | Native 端 |
|------|--------|-----------|
| 焦点样式 | `outlineStyle: 'none'`（81 行） | 不需要 |

**拆分方案**：差异只有 1 行，但考虑到作为基础组件被广泛使用，拆分后可独立演进原生输入体验（如键盘类型、返回键行为等）。

```
Input.tsx         → 重命名为 Input.web.tsx
Input.native.tsx  → 新写：原生 TextInput 样式 + 键盘适配
```

---

#### B-09: `ProfileContent` — 个人设置

**当前文件**：`src/components/settings/ProfileContent.tsx`

| 维度 | Web 端 | Native 端 |
|------|--------|-----------|
| 列表项反馈 | `state.hovered` 多处（171, 194, 215, 247, 262 行） | `pressed` 状态 |

**拆分方案**：

```
ProfileContent.tsx         → 重命名为 ProfileContent.web.tsx
ProfileContent.native.tsx  → 新写：pressed 反馈
ProfileContent.shared.ts   → 提取共享部分：
                              - 表单字段定义
                              - 保存/加载逻辑
```

---

#### B-10: `SettingsSideTabs` — 设置页标签

**当前文件**：`src/components/settings/SettingsSideTabs.tsx`

| 维度 | Web 端 | Native 端 |
|------|--------|-----------|
| 键盘导航 | `onKeyDown` 方向键切换（26-45, 57-58 行） | 不需要 |
| 标签反馈 | `state.hovered`（73 行） | `pressed` 状态 |

**拆分方案**：

```
SettingsSideTabs.tsx         → 重命名为 SettingsSideTabs.web.tsx
SettingsSideTabs.native.tsx  → 新写：去掉键盘导航 + pressed 反馈
```

---

#### B-11: `TransactionFilters` — 交易筛选

**当前文件**：`src/components/usage/TransactionFilters.tsx`

| 维度 | Web 端 | Native 端 |
|------|--------|-----------|
| 阴影 | `boxShadow`（150 行） | `elevation` / `shadowColor` |

**拆分方案**：差异只有阴影，但下拉选择器在原生端交互完全不同（ActionSheet / Picker），建议拆分。

```
TransactionFilters.tsx         → 重命名为 TransactionFilters.web.tsx
TransactionFilters.native.tsx  → 新写：原生 Picker + elevation 阴影
```

---

### 3.3 Category C：小差异，保持单文件 + Platform.select（5 文件）

这些文件只需改 1-2 行，不值得拆文件：

#### C-01: `app/chat.tsx`

**问题**：滚动条宽度测量使用 RNW 内部 API（139-144 行）

```typescript
// 现有代码（已有 Platform 守卫）：
if (Platform.OS === 'web') {
  const scrollEl = (scrollViewRef.current as any)?._node ?? ...;
  setScrollbarWidth(scrollEl.offsetWidth - scrollEl.clientWidth);
}
```

**修复**：已有守卫，只需在 else 分支显式置 0（或保持默认 0）。无需拆分。

#### C-02: `app/login.tsx` & `app/register.tsx`

**问题**：Pressable 按钮 `state.hovered`（各 1-2 处）

**修复**：`state.hovered` → `pressed`（单行替换），或加 Platform.select：

```typescript
style={({ pressed }) => ({
  backgroundColor: pressed ? 'rgba(...)' : 'transparent',
})}
```

#### C-03: `app/usage.tsx`

**问题**：充值按钮 `cursor` 属性（315 行）

**修复**：已用 `@ts-ignore`，原生自动忽略。可选加 `Platform.select` 清理。

#### C-04: `src/components/message/MessageCard.tsx`

**问题**：`state.hovered` 背景色（47 行）

**修复**：改为 `pressed` 状态（1 行）。

#### C-05: `src/components/usage/BalanceCard.tsx`

**问题**：充值链接 `state.hovered`（56 行）

**修复**：改为 `pressed` 状态（1 行）。

#### C-06: `src/components/usage/TransactionItem.tsx`

**问题**：卡片 `state.hovered` 背景色（70 行）

**修复**：改为 `pressed` 状态（1 行）。

#### C-07: `src/components/usage/PeriodSelector.tsx`

**问题**：按钮 `state.hovered`（38 行）

**修复**：改为 `pressed` 状态（1 行）。

---

### 3.4 分类汇总

```
文件总数统计：

Category A（完全共享）     35+ 文件    → 0 改动量
Category B（平台拆分）     11 个组件   → 重命名 .web.tsx + 新写 .native.tsx
Category C（小差异修补）    7 个文件    → 每个改 1-2 行

共享代码占比：约 75%
需要新写的原生代码：约 11 个 .native.tsx 文件
```

---

## 四、迁移前：全局基础设施（CRITICAL）

在拆分组件之前，先完成全局基础设施搭建，这些改动对 Web 无影响：

### 4.1 SafeAreaView 全局接入

- **涉及文件**：`app/_layout.tsx`
- **改动**：包裹 `<SafeAreaProvider>`
- **影响**：Web 端 SafeAreaProvider 自动降级为无操作，不影响现有行为

### 4.2 KeyboardAvoidingView

- **涉及文件**：`app/chat.tsx`、`app/login.tsx`、`app/register.tsx`、`app/forgot-password.tsx`
- **改动**：外层包裹 `KeyboardAvoidingView`
- **影响**：Web 端 KeyboardAvoidingView 自动降级为普通 View，不影响现有行为

### 4.3 跨平台工具函数

新建 `src/utils/platform.ts`，供所有组件使用：

```typescript
import { Platform } from 'react-native';

/** 仅在 Web 端应用的样式 */
export const webOnly = (styles: object) =>
  Platform.OS === 'web' ? styles : {};

/** 跨平台阴影 */
export function shadow(offsetY: number, radius: number, opacity: number) {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation: Math.round(radius / 2) },
    web: { boxShadow: `0 ${offsetY}px ${radius}px rgba(0,0,0,${opacity})` },
  });
}
```

---

## 五、迁移执行计划

### Phase 1：基础可运行（2-3 天）

**目标**：应用在 iOS/Android 模拟器无崩溃启动，核心页面可浏览

| 任务 | 说明 |
|------|------|
| 环境搭建 | iOS (Xcode/EAS) + Android (Android Studio/EAS) 构建环境 |
| SafeAreaProvider 接入 | `_layout.tsx` 全局包裹 |
| KeyboardAvoidingView 接入 | 聊天页 + 认证页 |
| 工具函数 `platform.ts` | `webOnly()`、`shadow()` |
| Category C 全部修复 | 7 文件各改 1-2 行（hovered → pressed） |
| 首次三端启动验证 | 确认无崩溃，页面可导航 |

**验收标准**：

- [ ] iOS 模拟器无崩溃启动
- [ ] Android 模拟器无崩溃启动
- [ ] 刘海屏 / 底部横条无 UI 遮挡
- [ ] 键盘弹起不遮挡输入框
- [ ] Web 端行为完全不变

---

### Phase 2：核心组件拆分（5-7 天）

**目标**：逐个拆分 Category B 组件，每完成一个即可独立验证

拆分优先级（按用户操作频率排序）：

| 优先级 | 组件 | 预估工时 | 说明 |
|--------|------|---------|------|
| P0 | ChatInput | 1 天 | 核心交互，DOM → onContentSizeChange |
| P0 | Button | 0.5 天 | 基础组件，被广泛依赖 |
| P0 | Input | 0.5 天 | 基础组件，被广泛依赖 |
| P0 | Header | 0.5 天 | 每页都用，SafeArea 适配 |
| P1 | Sidebar | 1 天 | 导航核心，Drawer 改造 |
| P1 | UserMenu | 0.5 天 | document API → Modal |
| P1 | MessageBubble | 1 天 | 消息展示核心，hover → longPress |
| P1 | NotificationDropdown | 1 天 | 整体 UX 重做（跳转 /messages） |
| P2 | ProfileContent | 0.5 天 | hover → pressed |
| P2 | SettingsSideTabs | 0.5 天 | 去键盘导航 + pressed |
| P2 | TransactionFilters | 0.5 天 | 原生 Picker + elevation |

**每个组件的拆分流程**：

```
1. 现有 Xxx.tsx → 重命名为 Xxx.web.tsx（git mv，保留 git 历史）
2. 提取共享逻辑到 Xxx.shared.ts（如有）
3. 新建 Xxx.native.tsx，导入 shared，编写原生 UI
4. 验证原生端功能正常
5. 验证 Web 端行为不变（import 路径未改，Metro 自动选 .web.tsx）
```

**验收标准**：

- [ ] 所有 11 个组件完成拆分
- [ ] 每个组件原生端功能正常
- [ ] Web 端零回归（重命名 .web.tsx 后 Metro 自动选中）
- [ ] `npx tsc --noEmit` 类型检查通过

---

### Phase 3：构建与发布配置（2-3 天）

| 任务 | 说明 |
|------|------|
| iOS 签名配置 | Development + Distribution 证书 |
| Android keystore 配置 | Debug + Release 签名 |
| EAS Build 配置 | `eas.json` 三环境（development/preview/production） |
| 应用图标与闪屏 | iOS/Android 各尺寸资源适配 |
| 状态栏/导航栏 | 深色模式下的颜色适配 |
| `EXPO_PUBLIC_API_URL` | 移动端 API 地址配置（非 localhost） |
| 真机测试 | iPhone + Android 真机全流程验证 |

---

### Phase 4：体验增强（2-3 天，可选）

| 任务 | 组件 | 说明 |
|------|------|------|
| 图片 pinch-to-zoom | MessageBubble.native | react-native-reanimated |
| 消息长按菜单 | MessageBubble.native | 复制/转发 |
| 会话左滑删除 | Sidebar.native | react-native-gesture-handler |
| 推送通知 | 新增模块 | expo-notifications |
| 触觉反馈 | Button.native | expo-haptics |
| 横屏适配 | 全局 | app.json `orientation: "default"` |

---

## 六、拆分后的目录结构

```
src/components/
├── chat/
│   ├── ChatInput.web.tsx          ← Web（原代码不动）
│   ├── ChatInput.native.tsx       ← iOS + Android
│   ├── ChatInput.shared.ts        ← 共享 Props/逻辑
│   ├── Sidebar.web.tsx
│   ├── Sidebar.native.tsx
│   ├── Sidebar.shared.ts
│   ├── MessageBubble.web.tsx
│   ├── MessageBubble.native.tsx
│   ├── MessageBubble.shared.ts
│   ├── QuickReplies.tsx           ← 完全共享，不拆
│   ├── TypingIndicator.tsx        ← 完全共享
│   └── LoadMoreIndicator.tsx      ← 完全共享
│
├── layout/
│   ├── Header.web.tsx
│   ├── Header.native.tsx
│   ├── Header.shared.ts
│   ├── UserMenu.web.tsx
│   ├── UserMenu.native.tsx
│   ├── UserMenu.shared.ts
│   ├── AuthLayout.tsx             ← 完全共享
│   └── BalanceDisplay.tsx         ← 完全共享
│
├── message/
│   ├── NotificationDropdown.web.tsx
│   ├── NotificationDropdown.native.tsx
│   ├── NotificationDropdown.shared.ts
│   ├── MessageCard.tsx            ← Category C（改 1 行）
│   ├── MessageDetailModal.tsx     ← 完全共享
│   ├── MessageSkeleton.tsx        ← 完全共享
│   └── MessageTabs.tsx            ← 完全共享
│
├── settings/
│   ├── ProfileContent.web.tsx
│   ├── ProfileContent.native.tsx
│   ├── SettingsSideTabs.web.tsx
│   ├── SettingsSideTabs.native.tsx
│   └── ...shared.ts
│
├── usage/
│   ├── TransactionFilters.web.tsx
│   ├── TransactionFilters.native.tsx
│   ├── BalanceCard.tsx            ← Category C（改 1 行）
│   ├── TransactionItem.tsx        ← Category C（改 1 行）
│   ├── PeriodSelector.tsx         ← Category C（改 1 行）
│   ├── UsageTrendChart.tsx        ← 完全共享
│   ├── ConversationRanking.tsx    ← 完全共享
│   └── ...（其余完全共享）
│
└── ui/
    ├── Button.web.tsx
    ├── Button.native.tsx
    ├── Button.shared.ts
    ├── Input.web.tsx
    ├── Input.native.tsx
    ├── Avatar.tsx                 ← 完全共享
    ├── Card.tsx                   ← 完全共享
    └── UnreadBadge.tsx            ← 完全共享
```

---

## 七、新增依赖评估

| 包名 | 用途 | 阶段 |
|------|------|------|
| `expo-keyboard-controller` | 键盘适配（更优于 KeyboardAvoidingView） | Phase 1 |
| `react-native-gesture-handler` | 左滑删除、pinch-to-zoom | Phase 4 |
| `react-native-reanimated` | 高性能手势动画 | Phase 4 |
| `expo-navigation-bar` | Android 底部导航栏颜色 | Phase 3 |
| `expo-haptics` | 触觉反馈 | Phase 4 |
| `expo-notifications` | 推送通知 | Phase 4 |

---

## 八、构建环境要求

### iOS

| 项目 | 要求 |
|------|------|
| macOS | 必须（Xcode 仅支持 macOS） |
| Xcode | 16.0+ |
| CocoaPods | 最新版 |
| Apple Developer 账号 | $99/年（上架必须） |

### Android

| 项目 | 要求 |
|------|------|
| Android Studio | 最新版（Koala+） |
| JDK | 17+ |
| Android SDK | API 35+ |
| Google Play 开发者账号 | $25 一次性（上架必须） |

### 替代方案：EAS Build（推荐）

无需本地配置 Xcode/Android Studio，云端构建：

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
eas build --platform android
```

---

## 九、风险与注意事项

| 风险 | 等级 | 应对措施 |
|------|------|---------|
| `.web.tsx` 重命名后 Metro 不识别 | 低 | Metro 原生支持，但需验证 `metro.config.js` 中 `resolver.sourceExts` 包含 `web.tsx` |
| NativeWind 在原生平台的样式差异 | 中 | 真机逐页验证，.native.tsx 中用 StyleSheet 替代复杂 Tailwind |
| 共享 Hook 引用了平台特定类型 | 低 | `.shared.ts` 中只用纯 TS 类型，不引入 RN 组件 |
| iOS 审核被拒 | 中 | 提前检查 Apple 审核指南（登录方式、隐私政策） |
| API 地址切换 | 低 | 移动端配置 `EXPO_PUBLIC_API_URL`（非 localhost） |

---

## 十、工时汇总

| 阶段 | 内容 | 工时 |
|------|------|------|
| Phase 1 | 基础设施 + Category C 修复 | 2-3 天 |
| Phase 2 | 11 个组件平台拆分 | 5-7 天 |
| Phase 3 | 构建配置与真机测试 | 2-3 天 |
| Phase 4 | 体验增强（可选） | 2-3 天 |
| **总计** | | **11-16 个工作日** |

> 以上基于 1 名熟练 React Native 开发者全职投入估算。
> Phase 1-2 为必做项（7-10 天），Phase 3 上架必须，Phase 4 按业务优先级。
> **核心优势**：Phase 2 的拆分工作完全不影响 Web 端，可安心并行迭代。

---

## 十一、多端开发测试流程

### 11.1 硬件条件与平台覆盖方案

假设开发者持有 **Windows 台式机 + iOS 实体手机**（无 Mac、无 Android 实体机）：

| 平台 | 测试方式 | 本地构建 | 说明 |
|------|---------|---------|------|
| Web | Windows 浏览器 | 能 | `npx expo start --web` 直接运行 |
| Android | Windows 上 Android 模拟器 | 能 | Android Studio AVD |
| iOS | 实体 iPhone + EAS 云构建 | **不能本地构建**（需 Mac） | EAS Build 云端产出安装包 |

> **核心结论**：不需要购买 Mac。iOS 通过 EAS 云构建解决，Android 用模拟器。

### 11.2 环境搭建（一次性）

#### Android 模拟器（Windows 本地，约 1 小时）

```bash
# 1. 安装 Android Studio
#    下载：https://developer.android.com/studio

# 2. 打开 Android Studio → SDK Manager
#    安装：Android SDK Platform 35、Build-Tools、Emulator、HAXM

# 3. AVD Manager → 创建模拟器
#    推荐：Pixel 7, API 35, x86_64 镜像

# 4. 设置 Windows 环境变量
#    ANDROID_HOME = C:\Users\<用户名>\AppData\Local\Android\Sdk
#    PATH 追加 %ANDROID_HOME%\platform-tools

# 5. 验证
adb devices
# 能看到模拟器设备列表即成功
```

#### iOS EAS 云构建（约 30 分钟）

```bash
# 1. 安装 EAS CLI
npm install -g eas-cli

# 2. 注册/登录 Expo 账号
eas login

# 3. 项目初始化
cd frontend
eas build:configure
# 自动生成 eas.json 配置文件

# 4. 构建 Development Client（首次约 10-15 分钟）
eas build --platform ios --profile development
# 首次需在终端中配置 Apple Developer 账号
# EAS 自动引导创建证书和描述文件

# 5. 构建完成后
#    → 终端输出安装链接（或二维码）
#    → iPhone 上打开链接安装
#    → 设置 → 通用 → VPN与设备管理 → 信任开发者证书
```

### 11.3 EAS Build 定价与免费额度

| 方案 | 月费 | 构建次数 | 队列优先级 | 构建超时 | 并发数 |
|------|------|---------|-----------|---------|--------|
| **Free** | $0 | iOS 15 次 + Android 15 次 | 低优先级（排队 5-20 分钟） | 45 分钟 | 1 |
| Starter | $19 | $45 构建额度，超出按量 | 高优先级 | 2 小时 | 1 |
| Production | $199 | $225 构建额度 | 高优先级 | 2 小时 | 2 |

**开发阶段用免费档完全够用。** 日常改 `.tsx` 代码走热更新，不消耗构建次数。只有以下场景才需要重新构建：

| 场景 | 是否需要重新 `eas build` |
|------|------------------------|
| 改 `.tsx` / `.ts` 代码、样式、逻辑 | **不需要**，热更新即时生效 |
| 新增页面、修改路由 | **不需要** |
| `npm install` 纯 JS 包 | **不需要** |
| 安装含原生代码的包（如 `expo-haptics`） | **需要** |
| 改 `app.json`（图标、权限、scheme 等） | **需要** |
| 正式发布到 App Store / Play Store | **需要**（production profile） |

> 开发阶段一个月预计构建 3-5 次，远低于 15 次上限。
> 上架阶段建议升 Starter（$19/月），用 1-2 个月后可退订。

### 11.4 日常开发流程

#### 启动 Dev Server（一条命令服务三端）

```bash
cd frontend
npx expo start

# 控制台输出：
# › Metro waiting on exp://192.168.x.x:8081
# › Press a │ open Android (模拟器)
# › Press w │ open web (浏览器)
# ›
# › Scan the QR code above to open in Expo Go or
# › your development build on your phone
```

#### 三端同时连接

```
Windows 台式机
  │
  ├─ 终端: npx expo start         (Dev Server，只需启动一次)
  │
  ├─ 浏览器: 按 W                  → Web 端打开
  │          改代码 → 浏览器自动刷新
  │
  ├─ Android 模拟器: 按 A           → 模拟器自动安装并启动
  │          改代码 → 模拟器自动刷新
  │
  └─ iPhone (同一 WiFi 局域网):
             打开已安装的 Dev Client → 扫码连接
             改代码 → iPhone 自动刷新
```

**改一行代码，三端同时刷新，不需要重新构建。**

#### 单平台专注开发

当只开发某个平台的 `.native.tsx` 或 `.web.tsx` 时：

```bash
# 只启动 Android（不关心 Web 和 iOS）
npx expo start --android

# 只启动 Web（不关心原生端）
npx expo start --web

# 全部启动（默认）
npx expo start
```

### 11.5 测试策略

#### 按修改范围确定测试范围

| 修改的文件类型 | 需要测试的平台 | 原因 |
|--------------|---------------|------|
| `*.shared.ts` | 三端全测 | 共享逻辑，影响所有平台 |
| `*.web.tsx` | 仅 Web | 物理隔离，原生端不会加载 |
| `*.native.tsx` | Android + iOS | `.native.tsx` 被两个原生平台共用 |
| `*.ios.tsx` | 仅 iOS | 仅 iOS 加载 |
| `*.android.tsx` | 仅 Android | 仅 Android 加载 |
| `*.tsx`（无后缀，Category A） | 三端全测 | 三端共享的组件 |
| `*.tsx`（无后缀，Category C） | 三端全测 | 虽然只改了 1 行，但三端共用 |
| `src/store/*.ts` | 三端全测 | 状态逻辑共享 |
| `src/services/api.ts` | 三端全测 | API 层共享 |

**这正是分层隔离的核心价值**：改 `.web.tsx` 不需要测 Android，改 `.native.tsx` 不需要测 Web。

#### 每个组件拆分后的验证清单

```
□ Web 端
  □ 页面正常渲染（布局、颜色、间距）
  □ 交互正常（hover 效果、点击、输入）
  □ 控制台无 warning / error

□ Android 模拟器
  □ 页面正常渲染
  □ 触摸反馈正常（pressed 状态）
  □ 键盘弹起不遮挡内容
  □ 不同屏幕尺寸（Pixel 7 + 小屏模拟器）

□ iOS 实体机
  □ SafeArea 正常（刘海/底部横条不遮挡）
  □ 页面正常渲染
  □ 触摸反馈正常
  □ 键盘弹起不遮挡内容
```

### 11.6 调试工具

| 工具 | 平台 | 用途 |
|------|------|------|
| Chrome DevTools | Web | `npx expo start --web` → F12 |
| React Native Debugger | Android / iOS | `npx expo start` → 摇晃设备 → Debug |
| Flipper | Android / iOS | 网络请求、布局检查、性能分析 |
| Android Studio Logcat | Android | 原生崩溃日志、系统日志 |
| `console.log` | 三端 | 输出到 Dev Server 终端（最简单） |
| React DevTools | 三端 | 组件树、状态检查 |

#### 快速调试命令

```bash
# 查看 Android 实时日志
adb logcat | grep -i "ReactNative"

# 清除 Metro 缓存（遇到奇怪问题时）
npx expo start --clear

# TypeScript 类型检查（不启动应用）
npx tsc --noEmit

# 运行单元测试
npm test
```

### 11.7 典型开发场景示例

#### 场景：开发 ChatInput.native.tsx

```
1. 新建 ChatInput.native.tsx，编写原生版本
2. 终端运行 npx expo start
3. 按 A → Android 模拟器打开，验证输入框
4. iPhone 扫码连接 → 验证 iOS 上的表现
5. 按 W → 浏览器打开，确认 Web 端仍然用的是 ChatInput.web.tsx
   （Web 端应该和之前完全一样，因为 .web.tsx 没改过）
6. 满意后 git add ChatInput.native.tsx && git commit
```

#### 场景：修改 useChatStore.ts（共享层）

```
1. 修改 store 逻辑
2. 三端同时连着 Dev Server，都会自动刷新
3. 三端分别验证功能正常
4. 因为是共享层，必须三端都测过才能提交
```

#### 场景：修复 Sidebar.web.tsx 的一个 Web-only bug

```
1. 修改 Sidebar.web.tsx
2. 只需在浏览器中验证
3. Android 模拟器和 iPhone 完全不受影响（它们用的是 Sidebar.native.tsx）
4. 无需测试原生端
```
