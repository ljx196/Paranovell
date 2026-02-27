# 统一设置页 — 前端技术方案

> 将"个人资料"和"用量/账单"整合到 `/settings` 页面，通过子导航切换；同步修复多个 UI/交互 bug。

---

## 1. 功能概述

### 1.1 设置页整合

将原本独立的 `profile.tsx`（个人资料）和 `usage.tsx`（用量统计）整合到统一的 `/settings` 页面，通过子导航 Tab 切换四个子页面：

| Tab Key | 标签 | 图标 | 内容来源 |
|---------|------|------|----------|
| `profile` | 个人资料 | 👤 | ProfileContent（从 profile.tsx 提取） |
| `overview` | 用量概览 | 📊 | OverviewContent（复用 usage.tsx） |
| `transactions` | 交易记录 | 📋 | TransactionsContent（复用 usage.tsx） |
| `recharge` | 充值 | 💳 | RechargeContent（复用 usage.tsx） |

### 1.2 同步修改

- Header 移除 BalanceDisplay 余额展示
- UserMenu 移除"个人资料"菜单项（已整合进设置）
- `profile.tsx` 改为重定向到 `/settings?tab=profile`
- TransactionsContent、RechargeContent 添加 Card 边框
- Sidebar Logo 点击跳转到聊天主页
- BalanceCard "去充值"始终显示

### 1.3 Bug 修复

- 下拉选择器（PeriodSelector、TransactionFilters）居中显示 → 改为相对定位
- NotificationDropdown hover/click 行为修正
- MessageDetailModal 跨页面重复弹出 bug
- 通知悬浮窗消息列表与 footer 重叠

---

## 2. 文件清单

### 2.1 新增文件

| 文件路径 | 说明 |
|----------|------|
| `app/settings.tsx` | 统一设置页，含 Sidebar + Header + SettingsSideTabs + 内容切换 |
| `src/components/settings/SettingsSideTabs.tsx` | 设置子导航组件，支持 vertical/horizontal 布局 |
| `src/components/settings/ProfileContent.tsx` | 个人资料内容组件（头像、邮箱、昵称、邀请码、保存、账户操作） |
| `src/components/settings/index.ts` | barrel 导出 |

### 2.2 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `app/usage.tsx` | 导出 OverviewContent/TransactionsContent/RechargeContent；Card 包裹交易记录和充值；Sidebar 传入 userName/userPlan/onLogout |
| `app/profile.tsx` | 替换为重定向到 `/settings?tab=profile` |
| `app/messages.tsx` | 修复 params.id useEffect 重复触发 bug；Header 恢复默认图标 |
| `src/components/layout/Header.tsx` | 移除 BalanceDisplay import 和 JSX |
| `src/components/layout/UserMenu.tsx` | 移除"个人资料"菜单项 |
| `src/components/chat/Sidebar.tsx` | Logo 改为 TouchableOpacity，点击跳转 `/chat` |
| `src/components/usage/BalanceCard.tsx` | "去充值"始终显示（移除 balance <= 1000 条件） |
| `src/components/usage/PeriodSelector.tsx` | Modal 居中弹窗 → position:absolute 相对定位下拉 |
| `src/components/usage/TransactionFilters.tsx` | 同上，DropdownFilter 改为相对定位 |
| `src/components/message/NotificationDropdown.tsx` | hover 显示悬浮窗 + click 跳转 /messages + 全部已读按钮 + 列表 overflow 修复 |

---

## 3. 组件设计

### 3.1 SettingsSideTabs

基于 `UsageSideTabs` 模式创建，扩展支持 `profile` Tab。

```typescript
type SettingsTab = 'profile' | 'overview' | 'transactions' | 'recharge';

interface SettingsSideTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  layout: 'vertical' | 'horizontal';  // desktop vs mobile
}
```

- Desktop/Tablet: `vertical` 布局，绝对定位在内容区左侧
- Mobile: `horizontal` 布局，水平排列在内容区顶部

### 3.2 ProfileContent

从 `profile.tsx` 提取的纯内容组件，不含页面 Shell（无全局 ScrollView/Header）。

- 头像展示（Avatar）
- 邮箱（只读）、昵称（可编辑）、邀请码（只读）
- 保存更改按钮
- 账户操作：返回聊天、修改密码、退出登录
- 外层使用 Card 组件包裹

### 3.3 settings.tsx 页面结构

```
Root (flexDirection: 'row')
├── Sidebar (conversations, userName, userPlan, onLogout)
└── Main
    ├── Header (title="设置")
    └── ScrollView
        └── innerContainer (maxWidth: 768)
            ├── SettingsSideTabs (vertical | horizontal)
            ├── ProfileContent | OverviewContent | TransactionsContent | RechargeContent
            └── Bottom spacing
```

**状态同步**: 本地 `activeTab` state 与 `useBalanceStore.activeTab` 双向同步，确保 BalanceCard "去充值" 点击能正确切换到 recharge Tab。

---

## 4. Bug 修复详情

### 4.1 下拉选择器居中弹窗

**问题**: PeriodSelector 和 TransactionFilters 使用 `<Modal>` + `justifyContent: 'center'` 实现下拉，导致选项列表居中显示在屏幕中央，与触发按钮分离。

**修复**: 移除 Modal，改为 `position: 'absolute'` 相对于触发按钮定位，加 `position: 'fixed'` 全屏透明 backdrop 捕获外部点击关闭。

### 4.2 NotificationDropdown 交互

**问题**: 铃铛图标的 hover 和 click 行为混乱——click 会弹出悬浮窗而非跳转。

**修复**:
- `onMouseEnter/onMouseLeave`: hover 时显示/隐藏消息预览悬浮窗（Web only）
- `onPress`: 始终跳转到 `/messages`，`setIsOpen(false)` 关闭悬浮窗
- 悬浮窗 header 增加"全部已读"按钮，调用 `markAllAsRead()`
- `messagesList` 增加 `overflow: 'hidden'` 防止内容与 footer 重叠

### 4.3 MessageDetailModal 跨页面弹出

**问题**: 从通知悬浮窗点击消息跳转 `/messages?id=X`，消息详情 Modal 打开后关闭，但 URL 中 `?id=X` 参数保留。之后在其他页面 hover 铃铛触发 `fetchMessages()` → 更新 store `messages` 数组 → `messages.tsx` 的 useEffect 监听 `[params.id, messages]` 重新触发 → 再次调用 `openDetailModal` → `<Modal>` 是全局覆盖层，在任意页面弹出。

**修复**:
- 使用 `useRef` 记录已处理的 `params.id`，同一 ID 不重复触发
- 打开 modal 后立即 `router.setParams({ id: undefined })` 清除 URL 参数

### 4.4 Sidebar 用户卡片不一致

**问题**: `settings.tsx` 和 `usage.tsx` 的 Sidebar 未传入 `userName`/`userPlan`/`onLogout`，显示默认值 "User"/"Free"。

**修复**: 从 `useAuthStore` 取 `user` 信息，传入 `userName={user?.nickname || user?.email || '用户'}` 和 `userPlan="免费版"`。

---

## 5. 导航变更

| 入口 | 变更前 | 变更后 |
|------|--------|--------|
| UserMenu → 个人资料 | 跳转 `/profile` | 已移除（整合进设置） |
| UserMenu → 设置 | 跳转 `/settings` | 不变 |
| `/profile` URL | 独立个人资料页 | 重定向到 `/settings?tab=profile` |
| `/settings` URL | 不存在 | 统一设置页，支持 `?tab=profile\|overview\|transactions\|recharge` |
| `/usage` URL | 独立用量页 | 保留（仍可直接访问） |
| Sidebar Logo | 无点击行为 | 跳转 `/chat` |
| Header 铃铛 click | 弹出悬浮窗 | 跳转 `/messages` |
| Header 铃铛 hover | 弹出悬浮窗 | 不变 |
| Header 余额展示 | 显示 BalanceDisplay | 已移除 |

---

*最后更新：2026-02-06*
