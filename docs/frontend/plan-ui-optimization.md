# GenNovel 前端 UI 优化计划

> 日期: 2025-02-27
> 完成日期: 2026-02-27
> 状态: **全部完成 ✅**
> 设计语言: [`design-language-modern-minimal.md`](./design-language-modern-minimal.md)
> 技术规范: [`design-system.md`](./design-system.md)
> 变更日志: [`changelog-ui-optimization.md`](./changelog-ui-optimization.md)
> 范围: 用户端页面（不含管理后台）

---

## 一、优化范围

### 包含的页面

| 页面 | 文件 | 说明 |
|------|------|------|
| 登录 | `app/login.tsx` | 认证入口 |
| 注册 | `app/register.tsx` | 新用户注册 |
| 忘记密码 | `app/forgot-password.tsx` | 密码重置 |
| 邮箱验证 | `app/verify-email.tsx` | 注册后验证 |
| 聊天 | `app/chat.tsx` | 核心功能页 |
| 消息 | `app/messages.tsx` | 系统通知 |
| 设置 | `app/settings.tsx` | 个人资料 + 用量账单 |

### 包含的组件

| 分类 | 组件 |
|------|------|
| 基础 UI | Button, Input, Card |
| 布局 | Header, AuthLayout, UserMenu |
| 聊天 | ChatInput, MessageBubble, Sidebar, TypingIndicator |
| 消息 | MessageCard, MessageDetailModal, NotificationDropdown, MessageTabs |
| 用量 | BalanceCard, TransactionItem, PeriodSelector, TransactionFilters |
| 设置 | SettingsSideTabs, ProfileContent |

### 不包含

- 管理后台（独立系统，React + Ant Design）
- `app/demo.tsx`（开发测试页）

---

## 二、优化目标

| 目标 | 衡量标准 | 状态 |
|------|----------|------|
| 设计语言一致 | 全部页面符合 Modern Minimal 规范检查清单 | ✅ |
| 零硬编码值 | 颜色、间距、字号全部走 theme tokens | ✅ |
| 五态完整 | 每个可交互元素具备 default/hover/focus/active/disabled | ✅ |
| 图标统一 | 零 emoji 图标，全部使用 Lucide SVG | ✅ |
| 字段级反馈 | 表单错误精确到字段，不使用通用提示 | ✅ |
| 无障碍基线 | accessibilityLabel + accessibilityRole 覆盖率 100% | ✅ |

---

## 三、执行阶段

### Phase 0: 基础设施 ✅

为后续所有页面优化提供基础支撑。

**0.1 新增语义色**

文件: `src/theme/colors.ts`

```
dark:  error #EF4444 / success #22C55E / warning #F59E0B + 对应 Light 透明背景
light: error #DC2626 / success #16A34A / warning #D97706 + 对应 Light 透明背景
```

**0.2 安装 Lucide 图标库**

```bash
npx expo install lucide-react-native
```

**0.3 Button 组件增强**

文件: `src/components/ui/Button.tsx`

- [x] hover 状态: web 端 Pressable hovered → accent-hover 背景
- [x] focus-visible: 2px accent outline, offset 2px
- [x] active/pressed: scale(0.985)
- [x] disabled: opacity 0.6 + cursor not-allowed (web)
- [x] 添加 accessibilityRole="button" + accessibilityState

**0.4 Input 组件改造**

文件: `src/components/ui/Input.tsx`

- [x] 新增 `variant` prop: `underline`(底部线条, 默认) / `outlined`(全包围, 向后兼容)
- [x] underline 模式: 透明背景 + 底部 1.5px 线条
- [x] focus 时线条变为 accent 色
- [x] error 时线条变为 error 色 + error 图标
- [x] disabled 样式: dashed 底线 + lower opacity
- [x] 添加 accessibilityRole="text" + error 区域 accessibilityRole="alert"

**0.5 Card 组件 — 无变更**

Card 仍保留用于需要视觉聚合的场景（BalanceCard、弹出层等），不做改动。

---

### Phase 1: 认证页 (登录 / 注册 / 忘记密码 / 邮箱验证) ✅

**1.1 AuthLayout 改造**

文件: `src/components/layout/AuthLayout.tsx`

- [x] 去掉 Card 包裹，表单直接呈现于背景上
- [x] Logo 改造: icon(40x40) + wordmark(24px) 水平排列 + slogan
- [x] 底部新增版权页脚
- [x] 容器宽度 maxWidth: 360px（从 400px 收窄）

**1.2 login.tsx**

文件: `app/login.tsx`

- [x] Input 改用 underline variant + 显式 label
- [x] 密码框添加 Eye/EyeOff 可见性切换
- [x] 错误提示: 全局 banner → 字段级（邮箱/密码各自报错）
- [x] 错误色: 硬编码 #EF4444 → colors.error
- [x] 按钮间距: marginTop 8 → spacing.lg (16)
- [x] 底部链接: 居中排列 + | 分隔 + hover 背景 + 文字分隔线 "或"
- [x] 链接触摸区域: 添加 padding 8x12，满足 44px 最小目标
- [x] accessibilityRole: 链接添加 "link"

**1.3 register.tsx**

文件: `app/register.tsx`

- [x] 同 login 的 Input/错误/链接改造
- [x] 密码确认: onChange 实时校验，匹配时显示 success 状态
- [x] 密码要求: 输入框下方 hint "至少 8 位字符"
- [x] 选填字段: 邀请码 label 标注 "(选填)"
- [x] 注册成功: 添加 3s 倒计时自动跳转到登录页

**1.4 forgot-password.tsx**

文件: `app/forgot-password.tsx`

- [x] 同 login 的 Input/错误/链接改造
- [x] 发送成功: 显示确认信息 + 倒计时重发

**1.5 verify-email.tsx**

文件: `app/verify-email.tsx`

- [x] 状态展示: loading / success / error 三态，使用 Lucide icon
- [x] 按钮样式对齐新规范

---

### Phase 2: 聊天页 ✅

**2.1 Sidebar**

文件: `src/components/chat/Sidebar.tsx`

- [x] emoji 替换: ‹ → `<ChevronLeft />`，logo "G" 保留但加 accessibilityLabel
- [x] 会话项 hover: 添加 bgTertiary 背景 (web)
- [x] 会话项 active: 左侧 3px accent 色条
- [x] 硬编码 spacing → theme tokens (padding, gap, marginBottom)
- [x] 硬编码 typography → theme tokens (fontSize, fontWeight)
- [x] 折叠按钮 accessibilityLabel="折叠侧边栏"

**2.2 Header**

文件: `src/components/layout/Header.tsx`

- [x] emoji 替换: ☰ → `<Menu />`, 🌙/☀️ → `<Moon />`/`<Sun />`
- [x] 按钮 hover: bgTertiary 背景 + transition 0.15s
- [x] 标题 accessibilityRole="header"
- [x] 硬编码 spacing → theme tokens

**2.3 ChatInput**

文件: `src/components/chat/ChatInput.tsx`

- [x] 触摸目标: 按钮区域 36x36 → 44x44
- [x] 发送按钮: hover 背景 + cursor pointer
- [x] 硬编码 spacing → theme tokens
- [x] 硬编码 '#FFFFFF' — 保留（无 theme token 对应白色常量）
- [x] accessibilityLabel: 输入框、附件按钮、发送按钮

**2.4 MessageBubble**

文件: `src/components/chat/MessageBubble.tsx`

- [x] AI 消息对比度: light 模式添加 bgTertiary 背景
- [x] 图片响应式: 添加 maxWidth: '100%' 防溢出
- [x] 图片 accessibilityLabel
- [x] 关闭按钮: ✕ emoji → `<X />`
- [x] 关闭按钮定位: responsive (mobile: 16, desktop: 40)
- [x] 长文本: 添加 word-break 防 URL 溢出
- [x] 硬编码 spacing → theme tokens

**2.5 chat.tsx 主页面**

文件: `app/chat.tsx`

- [x] tablet 响应式: sidebar 判断从 `!isMobile` → `isDesktop`
- [x] 硬编码 padding → messagePadding theme token
- [x] 空状态字号 → typography.bodyLarge
- [x] loading 添加 accessibilityLabel + accessibilityRole

---

### Phase 3: 布局组件 ✅

**3.1 UserMenu**

文件: `src/components/layout/UserMenu.tsx`

- [x] 触发器: ⋯ emoji → `<MoreHorizontal />`
- [x] 登出项: 文字改为 error 色，表明破坏性操作
- [x] 登出确认: 添加确认弹窗
- [x] 菜单项: 添加 accessibilityRole="menuitem"

**3.2 NotificationDropdown**

文件: `src/components/message/NotificationDropdown.tsx`

- [x] 铃铛图标: emoji → Lucide `<Bell />`
- [x] 已读/未读区分: 未读添加左侧 accent 色条 + 背景色
- [x] 宽度: 320px 硬编码 → responsive min(320px, 90vw)
- [x] 添加 loading skeleton

---

### Phase 4: 设置页 ✅

**4.1 settings.tsx**

文件: `app/settings.tsx`

- [x] 桌面端布局: absolute 定位 → flex row（tabs 130px + content flex:1）
- [x] innerContainer maxWidth: 768 → 960（桌面）/ 768（移动）
- [x] 硬编码 paddingHorizontal → spacing.lg / spacing.xl
- [x] 底部间距 → spacing['2xl']

**4.2 SettingsSideTabs**

文件: `src/components/settings/SettingsSideTabs.tsx`

- [x] 图标: emoji 👤📊📋💳 → Lucide User, BarChart3, Receipt, CreditCard
- [x] 定位: position absolute hack → flex 布局（由 settings.tsx flex row 接管）
- [x] 交互: TouchableOpacity → Pressable + hover bgTertiary
- [x] active 状态: 左侧 3px accent 色条 + fontWeight 600
- [x] ARIA: role="tablist" / role="tab" / accessibilityState selected
- [x] 键盘导航: 方向键循环切换 tab（vertical ↑↓, horizontal ←→）

**4.3 ProfileContent**

文件: `src/components/settings/ProfileContent.tsx`

- [x] 只读字段（邮箱、邀请码）: View + Text 模拟 → Input variant="underline" editable={false}
- [x] 昵称输入: 添加 variant="underline"
- [x] 语义色: #EF4444/#10B981 → colors.error/colors.success
- [x] 头像响应式: mobile 80px / desktop 100px + 显式 borderRadius
- [x] 账户操作项: TouchableOpacity → Pressable + hover bgTertiary + Lucide 图标 + ChevronRight
- [x] 退出登录: 内联确认面板（取消/退出按钮）+ errorLight 背景
- [x] 间距统一: 硬编码 marginBottom/marginVertical → spacing tokens

---

### Phase 5: 消息页 ✅

**5.1 messages.tsx**

文件: `app/messages.tsx`

- [x] 统计栏: 添加 bottom-border 与内容区分隔
- [x] 统计栏: 新增 "全部已读" 按钮（CheckCheck 图标 + hover + loading 状态）
- [x] 空状态: 📭 emoji → `<Inbox size={48} />` Lucide 图标
- [x] 加载提示: 纯文本 → ActivityIndicator spinner + 文字
- [x] 硬编码 padding/margin → spacing tokens
- [x] TouchableOpacity → 移除（不再使用）
- [x] Button import → 移除（不再使用）

**5.2 MessageCard**

文件: `src/components/message/MessageCard.tsx`

- [x] 类型图标: emoji 👤📢📊 → Lucide User, Megaphone, BarChart3
- [x] 交互: TouchableOpacity → Pressable + hover bgTertiary 背景
- [x] 硬编码 padding/margin/gap → spacing tokens

---

### Phase 6: 用量页 ✅

**6.1 usage.tsx**

文件: `app/usage.tsx`

- [x] 交易空状态: 📋 emoji → `<ClipboardList size={48} />` Lucide 图标
- [x] 充值按钮: TouchableOpacity → Pressable + hover accentHover + disabled cursor not-allowed + bgTertiary 灰化
- [x] API 失败: 新增 retry 面板（RefreshCw 图标 + "重试" 按钮 + hover）
- [x] 加载更多: TouchableOpacity → Pressable + hover bgTertiary
- [x] 硬编码 padding/margin → spacing tokens
- [x] 底部间距 → spacing['2xl']

**6.2 BalanceCard**

文件: `src/components/usage/BalanceCard.tsx`

- [x] "去充值" 箭头: `→` 字符 → `<ArrowRight size={14} />` Lucide 图标
- [x] 去充值: TouchableOpacity → Pressable + hover bgTertiary
- [x] 低余额双重提示: AlertTriangle 图标 + errorLight 背景 + 文字（≤500 "严重不足" / ≤1000 "余额不足"）
- [x] 硬编码 spacing/borderRadius/padding → theme tokens

**6.3 TransactionItem**

文件: `src/components/usage/TransactionItem.tsx`

- [x] 类型图标: emoji 💰🔥🎁🤝↩️ → Lucide Wallet, Flame, Gift, Users, RotateCcw
- [x] 金额前缀: 收入 "+"，支出 "-"（已有，保持不变）
- [x] 展开详情: 点击展开交易ID/时间/描述 + ChevronDown/ChevronUp 指示器
- [x] 交互: 静态 View → Pressable + hover bgTertiary
- [x] 硬编码 spacing → theme tokens

---

## 四、依赖关系

```
Phase 0 (基础设施)         ✅
    ├── Phase 1 (认证页)     ✅
    ├── Phase 2 (聊天页)     ✅
    ├── Phase 3 (布局组件)   ✅
    ├── Phase 4 (设置页)     ✅
    ├── Phase 5 (消息页)     ✅
    └── Phase 6 (用量页)     ✅
```

---

## 五、验收标准

每个 Phase 完成后，对照 [`design-language-modern-minimal.md` 第十四章检查清单](./design-language-modern-minimal.md) 逐项确认：

- 视觉: 去容器化、底部线条输入框、永久 label、Lucide icon、theme tokens
- 交互: 五态完整、hover 150ms、cursor pointer、pressed scale
- 反馈: 字段级错误、loading 状态、破坏性确认
- 响应式: 375px / 768px / 1024px+ 无溢出
- 无障碍: 对比度 4.5:1、focus-visible、触摸目标 44px、accessibilityLabel

---

## 六、文档体系

```
docs/frontend/
├── design-language-modern-minimal.md   ← 设计语言（风格 + 全局规范）
├── design-system.md                    ← 技术规范（颜色/间距/组件实现）
├── plan-ui-optimization.md             ← 本文档（优化执行计划）
├── changelog-ui-optimization.md        ← 优化变更日志（所有改动明细）
├── tech-messages.md                    ← 消息页技术设计
├── tech-account-balance.md             ← 账户余额技术设计
├── tech-settings.md                    ← 设置页技术设计
├── tech-admin-panel.md                 ← 管理后台技术设计（不参与优化）
├── uiux-admin-panel.md                 ← 管理后台 UIUX（不参与优化）
└── demos/
    └── login-modern-minimal.html       ← 登录页设计 Demo
```
