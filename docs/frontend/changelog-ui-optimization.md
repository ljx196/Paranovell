# GenNovel UI 优化变更日志

> 关联计划: [`plan-ui-optimization.md`](./plan-ui-optimization.md)
> 设计语言: [`design-language-modern-minimal.md`](./design-language-modern-minimal.md)
> 完成日期: 2026-02-27

---

## 变更概览

| 维度 | 改动量 |
|------|--------|
| 涉及文件 | 22 个（7 页面 + 15 组件） |
| Emoji → Lucide 替换 | 37 个图标 |
| TouchableOpacity → Pressable | 12 处 |
| 硬编码值 → spacing tokens | ~80 处 |
| 新增无障碍属性 | accessibilityRole/Label/State ~30 处 |
| 新增交互功能 | 键盘导航、展开详情、内联确认、retry 面板 |

---

## Phase 0: 基础设施

### `src/theme/colors.ts`
- 新增 dark/light 语义色: `error`, `errorLight`, `success`, `successLight`, `warning`, `warningLight`

### `src/components/ui/Button.tsx`
- `TouchableOpacity` → `Pressable`
- 新增 hover 态 (web): accent-hover 背景
- 新增 focus-visible: 2px accent outline, offset 2px
- 新增 pressed 态: `scale(0.985)` transform
- disabled 态: `opacity: 0.6` + `cursor: not-allowed` (web)
- 添加 `accessibilityRole="button"` + `accessibilityState`

### `src/components/ui/Input.tsx`
- 新增 `variant` prop: `'underline' | 'outlined'`（默认 outlined 保持向后兼容）
- underline 模式: 透明背景 + 底部 1.5px 线条，focus → accent 色，error → error 色
- TextInput 添加 `accessibilityRole="text"`
- error Text 添加 `accessibilityRole="alert"`

---

## Phase 1: 认证页

### `src/components/layout/AuthLayout.tsx`
- 去掉 Card 包裹，表单直接呈现于背景上
- Logo: icon(40x40) + wordmark(24px) 水平排列 + slogan 副标题
- 底部新增版权页脚
- maxWidth: 400px → 360px

### `app/login.tsx`
- Input 改用 `variant="underline"` + 显式 label
- 密码框添加 Eye/EyeOff 可见性切换（Lucide 图标）
- 错误提示: 全局 banner → 字段级（emailError / passwordError）
- 硬编码 `#EF4444` → `colors.error`
- 底部链接: 居中排列 + `|` 分隔 + hover 背景 + 文字分隔线 "或"
- 链接触摸区域 padding 8x12（满足 44px 最小目标）
- 链接添加 `accessibilityRole="link"`

### `app/register.tsx`
- 同 login 的 Input/错误/链接改造
- 密码确认: onChange 实时校验，匹配时 success 状态
- 密码要求 hint: "至少 8 位字符"
- 邀请码 label 标注 "(选填)"
- 注册成功: 3s 倒计时自动跳转登录页

### `app/forgot-password.tsx`
- 同 login 的 Input/错误/链接改造
- 发送成功: 确认信息 + 倒计时重发

### `app/verify-email.tsx`
- 状态展示: loading / success / error 三态，使用 Lucide CheckCircle/XCircle
- 按钮样式对齐新规范

---

## Phase 2: 聊天页

### `src/components/chat/Sidebar.tsx`
- emoji 替换: `‹` → `<ChevronLeft />`，`+` → `<Plus />`
- 会话项 hover: bgTertiary 背景 (web Pressable)
- 会话项 active: 左侧 3px accent 色条
- 折叠按钮 `accessibilityLabel="折叠侧边栏"`
- 硬编码 spacing/typography → theme tokens

### `src/components/layout/Header.tsx`
- emoji 替换: `☰` → `<Menu />`，`🌙`/`☀️` → `<Moon />`/`<Sun />`
- 按钮 hover: bgTertiary 背景
- 标题 `accessibilityRole="header"`
- 硬编码 spacing → theme tokens

### `src/components/chat/ChatInput.tsx`
- 触摸目标: 按钮区域 36x36 → 44x44
- 发送按钮: hover 态 accentHover 背景 + cursor pointer
- `accessibilityLabel`: 输入框 "消息输入框"、附件 "添加附件"、发送 "发送消息"
- 硬编码 spacing → tokens:
  - container: `padding: 16` → `spacing.lg`, `paddingBottom: 24` → `spacing.xl`
  - inputBox: `paddingHorizontal: 12` → `spacing.md`, `paddingVertical: 16` → `spacing.lg`, `gap: 8` → `spacing.sm`
  - hint: `marginTop: 12` → `spacing.md`

### `src/components/chat/MessageBubble.tsx`
- AI 消息 light 模式: 添加 bgTertiary 背景增强对比度
- 图片: `maxWidth: '100%'` 防溢出 + accessibilityLabel
- 关闭按钮: `✕` emoji → `<X />` Lucide
- 关闭按钮定位: responsive (mobile: 16px, desktop: 40px)
- 长文本: word-break 防 URL 溢出
- 硬编码 spacing → theme tokens

### `app/chat.tsx`
- tablet 响应式: sidebar 判断 `!isMobile` → `isDesktop`
- 硬编码 padding → `messagePadding` theme token
- 空状态字号 → `typography.bodyLarge`
- loading 添加 `accessibilityLabel` + `accessibilityRole`

---

## Phase 3: 布局组件

### `src/components/layout/UserMenu.tsx`
- 触发器: `⋯` emoji → `<MoreHorizontal />` Lucide
- 登出项: 文字改为 `colors.error` 色
- 登出确认: 内联确认面板（取消按钮 + 退出按钮）
- 菜单项: 添加 `accessibilityRole="menuitem"`

### `src/components/message/NotificationDropdown.tsx`
- 铃铛: emoji → `<Bell />` Lucide
- 未读消息: 左侧 accent 色条 + 背景色区分
- 宽度: 320px 硬编码 → responsive min(320px, 90vw)
- 新增 loading skeleton 骨架屏

---

## Phase 4: 设置页

### `app/settings.tsx`
- 桌面端布局重构: `position: absolute` hack → `flexDirection: 'row'`
  - tabs 在左（固定 130px），content 在右（`flex: 1, maxWidth: 768`）
  - 新增 `desktopRow` + `tabContent` 样式
- `innerContainer`: 移除 `position: 'relative'`，maxWidth 动态（mobile 768 / desktop 960）
- 硬编码 `paddingHorizontal: 16/24` → `spacing.lg / spacing.xl`
- 底部 `height: 32` → `spacing['2xl']`
- 解构 `spacing` from `useTheme()`

### `src/components/settings/SettingsSideTabs.tsx`（全面重写）
- 图标: emoji `👤📊📋💳` → Lucide `User, BarChart3, Receipt, CreditCard`
- 交互: `TouchableOpacity` → `Pressable` + hover bgTertiary
- active 状态: `fontWeight: '600'` + vertical 左侧 3px accent 竖条
- 移除 `position: 'absolute', right: '100%'` hack（由父级 flex row 接管）
- vertical: `width: 130, flexShrink: 0`
- ARIA: 容器 `accessibilityRole="tablist"`，每个 tab `accessibilityRole="tab"` + `accessibilityState={{ selected }}`
- Web 键盘导航: `onKeyDown` 监听方向键（vertical ↑↓, horizontal ←→），循环切换
- gap → `spacing.xs`

### `src/components/settings/ProfileContent.tsx`（现代化改造）
- 只读字段（邮箱、邀请码）: `View + Text` 模拟 → `<Input variant="underline" editable={false} />`
- 昵称 Input: 添加 `variant="underline"` 统一风格
- 语义色: `#EF4444` → `colors.error`，`#10B981` → `colors.success`
- 头像响应式: `useResponsive()` → mobile 80px / desktop 100px + 显式 `borderRadius: avatarSize / 2`
- 账户操作项: `TouchableOpacity` → `Pressable` + hover bgTertiary
  - 每项添加左侧 Lucide 图标: 返回聊天 `MessageSquare` / 修改密码 `Lock` / 退出登录 `LogOut`
  - 普通项右侧 `ChevronRight` 箭头
  - 退出项: error 颜色 + hover errorLight 背景（无 ChevronRight）
- 退出确认: 内联确认面板
  - errorLight 背景 + "确定退出登录？" 提示
  - 取消按钮: bordered + hover bgTertiary
  - 退出按钮: error 背景 + 白字 + hover opacity 0.9
- 所有硬编码 margin → spacing tokens

---

## Phase 5: 消息页

### `app/messages.tsx`
- 统计栏: 添加 `borderBottomWidth: 1` + `borderBottomColor: colors.border` 分隔线
- 统计栏: 改为 `flexDirection: 'row'` + `justifyContent: 'space-between'`
- 新增 "全部已读" 按钮:
  - `<CheckCheck />` Lucide 图标 + accent 文字
  - Pressable + hover bgTertiary
  - 仅 `unreadCount > 0` 时显示
  - loading 状态: ActivityIndicator spinner
- 空状态: `📭` emoji → `<Inbox size={48} />` Lucide 图标
- 加载状态: 纯 Text → `ActivityIndicator` spinner + 文字
- 加载更多: 纯 Text → ActivityIndicator + 文字横排
- 移除 `TouchableOpacity` 和 `Button` import（不再使用）
- 硬编码 padding/margin → spacing tokens

### `src/components/message/MessageCard.tsx`
- 类型图标: emoji `👤📢📊` → Lucide `User, Megaphone, BarChart3`
- 图标映射: `Record<MessageType, string>` → `Record<MessageType, typeof User>`（组件引用）
- 交互: `TouchableOpacity` → `Pressable` + hover bgTertiary 背景
- 硬编码 `padding: 16, marginBottom: 8, gap: 12` → `spacing.lg, spacing.sm, spacing.md`

---

## Phase 6: 用量页

### `app/usage.tsx`
- 交易空状态: `📋` emoji → `<ClipboardList size={48} />` Lucide 图标
- Overview 加载失败: 新增 retry 面板
  - `<RefreshCw />` 图标 + "加载失败" / "请检查网络后重试" 文字
  - "重试" 按钮: Pressable + hover accentHover
  - `hasError` state + `handleRetry` async 函数
- 充值按钮: `TouchableOpacity` → `Pressable`
  - enabled: hover accentHover 背景
  - disabled: bgTertiary 灰化 + `cursor: 'not-allowed'` (web) + textMuted 文字色
- 加载更多: `TouchableOpacity` → `Pressable` + hover bgTertiary + accent 文字色
- 硬编码 `paddingHorizontal: 16/24` → `spacing.lg / spacing.xl`
- 硬编码 `paddingVertical: 16` → `spacing.lg`
- 硬编码 `height: 32` → `spacing['2xl']`

### `src/components/usage/BalanceCard.tsx`
- "去充值" 链接: `→` 字符 → `<ArrowRight size={14} />` Lucide 图标
- "去充值": `TouchableOpacity` → `Pressable` + hover bgTertiary
- 低余额双重提示（新增）:
  - `balance ≤ 1000`: 新增 warningRow — `<AlertTriangle />` 图标 + errorLight 背景 + "余额不足，建议充值"
  - `balance ≤ 500`: 文字变为 "余额严重不足，请及时充值"（pulse 动画保持不变）
- 硬编码值 → tokens:
  - `borderRadius: 12` → `borderRadius.lg`
  - `padding: 20` → `spacing.xl`
  - `marginBottom: 16` → `spacing.lg`
  - `gap: 12` → `spacing.md`
  - `marginTop: 20` → `spacing.xl`
  - stat items: `borderRadius: 8` → `borderRadius.md`, `padding: 12` → `spacing.md`

### `src/components/usage/TransactionItem.tsx`
- 类型图标: emoji `💰🔥🎁🤝↩️` → Lucide `Wallet, Flame, Gift, Users, RotateCcw`
- 图标映射重构:
  - `TX_CONFIG.icon: string` → `TX_CONFIG.Icon: typeof Wallet`（组件引用）
  - 新增 `ICON_COLORS` Record 用于 Lucide strokeColor
- 展开详情（新增）:
  - 点击整行展开/收起（`expanded` state）
  - 展开区域: 交易ID、时间、完整描述（带 borderTop 分隔线）
  - 右侧 `ChevronDown` / `ChevronUp` 指示器
  - 描述 `numberOfLines`: 收起时 1 行，展开时不限
- 交互: 静态 `View` → `Pressable` + hover bgTertiary
- 硬编码值 → tokens:
  - `padding: 16` → `spacing.lg`
  - `marginBottom: 8` → `spacing.sm`
  - `gap: 12` → `spacing.md`
  - `borderRadius: 12` → `borderRadius.lg`
  - icon container: `borderRadius: 8` → `borderRadius.md`

---

## Lucide 图标清单

全部使用 `lucide-react-native` 包，以下为本次优化中使用的图标汇总：

| 图标 | 使用位置 |
|------|----------|
| `ArrowRight` | BalanceCard 去充值 |
| `ArrowUp` | ChatInput 发送 |
| `AlertTriangle` | BalanceCard 低余额警告 |
| `BarChart3` | SettingsSideTabs 用量概览、MessageCard usage 类型 |
| `Bell` | NotificationDropdown 铃铛、UserMenu 消息菜单项 |
| `CheckCheck` | messages.tsx 全部已读按钮 |
| `CheckCircle` | verify-email 成功状态 |
| `ChevronDown` | TransactionItem 收起指示器 |
| `ChevronLeft` | Sidebar 折叠按钮 |
| `ChevronRight` | ProfileContent 操作项箭头 |
| `ChevronUp` | TransactionItem 展开指示器 |
| `ClipboardList` | usage.tsx 交易空状态 |
| `CreditCard` | SettingsSideTabs 充值 |
| `Eye` / `EyeOff` | login/register 密码可见性 |
| `Flame` | TransactionItem 对话消费 |
| `Gift` | TransactionItem 赠送 |
| `Inbox` | messages.tsx 消息空状态 |
| `Lock` | ProfileContent 修改密码 |
| `LogOut` | ProfileContent/UserMenu 退出登录 |
| `Megaphone` | MessageCard notice 类型 |
| `Menu` | Header 菜单按钮 |
| `MessageSquare` | ProfileContent 返回聊天 |
| `Moon` / `Sun` | Header/AuthLayout 主题切换 |
| `MoreHorizontal` | UserMenu 触发器 |
| `Paperclip` | ChatInput 附件按钮 |
| `Plus` | Sidebar 新建会话 |
| `Receipt` | SettingsSideTabs 交易记录 |
| `RefreshCw` | usage.tsx retry 面板 |
| `RotateCcw` | TransactionItem 退款 |
| `Settings` | UserMenu 设置菜单项 |
| `User` | SettingsSideTabs 个人资料、MessageCard account 类型 |
| `Users` | TransactionItem 邀请奖励 |
| `Wallet` | TransactionItem 充值 |
| `X` | MessageBubble 关闭按钮 |
| `XCircle` | verify-email 错误状态 |
