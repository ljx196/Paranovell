# GenNovel 设计语言 — Modern Minimal

> 版本: v1.0
> 日期: 2025-02-27
> 状态: 已确认
> 参考 Demo: `docs/demos/login-modern-minimal.html`

本文档定义 GenNovel 全站的视觉风格与交互范式。所有页面必须遵循此设计语言，确保体验一致性。

---

## 一、设计哲学

### 核心关键词

**轻量 · 透气 · 克制 · 精确**

### 五条铁律

| # | 原则 | 说明 | 反例 |
|---|------|------|------|
| 1 | **去容器化** | 减少 Card/Box 包裹，内容直接呈现于背景之上 | 不要给每个区块都套 Card |
| 2 | **线条优于边框** | 用单侧线条（bottom-border）代替全包围边框 | 不要用圆角全包围输入框 |
| 3 | **留白即设计** | 用充裕间距创造层次，而非边框和阴影 | 不要靠加 border 区分区块 |
| 4 | **状态要明确** | 每个可交互元素必须有 default/hover/focus/active/disabled 五态 | 不要只靠 opacity 表达状态 |
| 5 | **信息要精确** | 错误提示到字段级，标签始终可见 | 不要用通用 "请填写所有字段" |

---

## 二、布局范式

### 2.1 页面类型与布局模式

| 页面类型 | 布局模式 | 容器宽度 | 示例 |
|----------|----------|----------|------|
| **认证页** (登录/注册/忘记密码) | 单列居中 | max-width: 360px | login, register |
| **内容页** (聊天) | 侧边栏 + 主区域 | sidebar: 260px, content: 768px | chat |
| **设置页** (配置/资料) | tabs + 内容 | max-width: 600px | settings |
| **列表页** (消息/账单) | 顶部筛选 + 列表 | max-width: 768px | messages, usage |

### 2.2 垂直节奏

页面内各区块的间距遵循统一的垂直节奏：

```
Logo / 页面标题区
    ↕ 56px (3xl + sm)      — 品牌区与内容区的分隔
表单 / 主内容区
    ↕ 28px (xl + xs)       — 表单字段间距
操作按钮
    ↕ 32px (2xl)           — 按钮与分隔线
分隔线 / 辅助信息
    ↕ 32px (2xl)           — 辅助区
页脚
    ↕ 48px (3xl)           — 页脚留白
```

### 2.3 去容器化原则

**旧模式（避免）：**
```
背景 → Card 包裹 → 内容
```

**新模式（推荐）：**
```
背景 → 内容直接呈现（用间距和线条创造层次）
```

适用场景：
- 认证页表单：去掉 Card，表单直接居中于背景
- 设置页表单：去掉 Card，用 section 标题 + 分割线组织
- 消息列表：去掉 Card 包裹，用 bottom-border 分隔条目

**例外 — 仍需 Card 的场景：**
- 数据统计卡片（BalanceCard）— 需要视觉聚合
- 弹出层 / 下拉菜单 — 需要与背景分离
- 对话消息气泡 — 已有独立背景色区分

---

## 三、输入框规范

### 3.1 底部线条输入框（默认）

取代全包围圆角输入框，用底部线条表达输入区域：

```
状态          线条颜色               线条粗细
─────────────────────────────────────────────
default       var(--input-border)    1.5px
focus         var(--accent)          1.5px
error         var(--error)           1.5px
disabled      var(--border)          1px (dashed)
```

**关键样式：**
```css
.form-input {
  width: 100%;
  padding: 12px 0;                          /* 纵向留白，横向贴边 */
  font-size: 15px;
  color: var(--text-primary);
  background: transparent;                   /* 透明背景 */
  border: none;
  border-bottom: 1.5px solid var(--input-border);
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-input:focus {
  border-bottom-color: var(--accent);        /* 聚焦时 accent 色 */
}
```

### 3.2 始终可见的 Label

**不再依赖 placeholder 充当 label。** 每个输入框上方必须有永久可见的标签：

```
邮箱                    ← label: 13px, font-weight 500, text-secondary
name@example.com        ← placeholder: text-muted, 仅做格式提示
─────────────────       ← bottom border
```

**Label 样式：**
```css
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}
```

### 3.3 密码输入框

必须包含可见性切换按钮：

```
密码                    ← label
●●●●●●●●        👁     ← 输入内容 + eye icon (右对齐)
─────────────────       ← bottom border
```

Eye icon 规范：
- 位置：输入框右侧，垂直居中
- 尺寸：18x18
- 颜色：`text-muted`，hover 时 `text-secondary`
- 图标：Lucide `Eye` / `EyeOff`

### 3.4 字段级错误提示

每个字段独立报错，不使用全局错误 banner：

```
邮箱
name@example.com
─────────────────
⚠ 请输入邮箱地址          ← error: 13px, color: var(--error), margin-top: 6px
```

错误提示规范：
- 图标 + 文字，左对齐
- 图标：Lucide `AlertCircle`，14x14
- 颜色：`var(--error)` — 新增语义色 `#EF4444`(dark) / `#DC2626`(light)
- 出现/消失：无动画，即时显示
- 输入时自动清除对应字段错误

---

## 四、按钮规范

### 4.1 五态定义

所有按钮必须实现以下五种状态：

| 状态 | 视觉表现 | 触发方式 |
|------|----------|----------|
| **default** | accent 背景，白色文字 | 默认 |
| **hover** | accent-hover 背景 | 鼠标悬停 |
| **focus-visible** | 2px accent outline, offset 2px | Tab 键聚焦 |
| **active/pressed** | `transform: scale(0.985)` | 点击按下 |
| **disabled** | opacity 0.6 + `cursor: not-allowed` | disabled prop |

```css
.btn-primary {
  padding: 14px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.btn-primary:hover {
  background: var(--accent-hover);
}
.btn-primary:active {
  transform: scale(0.985);
}
.btn-primary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### 4.2 按钮圆角

统一使用 `8px`（borderRadius.md）。不再使用 16px 大圆角，与底部线条输入框的直线感保持协调。

---

## 五、链接与文字按钮

### 5.1 链接样式

链接不使用下划线，通过颜色 + hover 背景区分：

```css
.link {
  color: var(--text-secondary);           /* 非 accent，更克制 */
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  text-decoration: none;
}
.link:hover {
  color: var(--accent);
  background: rgba(212, 131, 106, 0.08);  /* accent 8% 透明叠加 */
}
.link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### 5.2 链接组排列

多个链接水平排列时，用 `|` 分隔符居中：

```
创建账户  |  忘记密码?
```

分隔符样式：`color: var(--border)`, `margin: 0 4px`

---

## 六、分隔线

### 6.1 文字分隔线

用于区分主操作与备选操作（如 "或" 分隔登录与注册入口）：

```
──────────── 或 ────────────
```

```css
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 32px 0;
  color: var(--text-muted);
  font-size: 13px;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}
```

### 6.2 纯线分隔

用于列表项之间、section 之间：

```css
.separator {
  height: 1px;
  background: var(--border);
  margin: 16px 0;           /* 垂直间距用 spacing.lg */
}
```

---

## 七、Logo 与品牌展示

### 7.1 Logo 组合

Logo 由图标 + 文字 + slogan 三部分组成：

```
  [G]  GenNovel              ← logo-mark: icon(40x40) + wordmark(24px, 600)
AI 驱动的小说创作平台         ← slogan: 15px, text-muted
```

**Logo 图标：**
- 尺寸：40x40（认证页）/ 32x32（Header/Sidebar）
- 圆角：10px
- 背景：`var(--accent)`
- 文字：白色，20px，bold

**品牌文字：**
- 字号：24px
- 字重：600
- letter-spacing：-0.5px（微收紧，现代感）

**Slogan：**
- 仅在认证页显示
- 字号：15px
- 颜色：`var(--text-muted)`

---

## 八、新增语义色

在现有 colors.ts 基础上新增以下语义色，确保全站统一：

```typescript
// Dark theme 新增
error: '#EF4444',
errorLight: 'rgba(239, 68, 68, 0.1)',
success: '#22C55E',
successLight: 'rgba(34, 197, 94, 0.1)',
warning: '#F59E0B',
warningLight: 'rgba(245, 158, 11, 0.1)',

// Light theme 新增
error: '#DC2626',
errorLight: 'rgba(220, 38, 38, 0.06)',
success: '#16A34A',
successLight: 'rgba(22, 163, 74, 0.06)',
warning: '#D97706',
warningLight: 'rgba(217, 119, 6, 0.06)',
```

使用规则：
- **错误状态**（表单校验、API 失败）→ `error` + `errorLight` 背景
- **成功状态**（保存成功、操作完成）→ `success` + `successLight` 背景
- **警告状态**（余额不足、即将过期）→ `warning` + `warningLight` 背景
- **禁止使用硬编码颜色**（如 `#EF4444`），必须通过 `colors.error` 引用

---

## 九、图标系统

### 9.1 统一使用 Lucide

**全站禁止使用 Emoji 作为功能图标。** 统一使用 Lucide React Native：

```bash
npx expo install lucide-react-native
```

### 9.2 图标规格

| 场景 | 尺寸 | 颜色 | strokeWidth |
|------|------|------|-------------|
| 输入框内嵌 (eye icon) | 18px | text-muted → hover: text-secondary | 2 |
| 错误/状态图标 | 14px | 对应状态色 (error/success/warning) | 2 |
| 按钮图标 | 18px | 继承按钮文字色 | 2 |
| Header 工具栏 | 20px | text-secondary → hover: text-primary | 1.5 |
| 空状态插图 | 48px | text-muted | 1.5 |

### 9.3 替换清单

| 位置 | 旧 (emoji) | 新 (Lucide) |
|------|------------|-------------|
| Header 菜单 | ☰ | `<Menu />` |
| Header 主题 | 🌙 / ☀️ | `<Moon />` / `<Sun />` |
| Sidebar 折叠 | ‹ | `<ChevronLeft />` |
| UserMenu 触发 | ⋯ | `<MoreHorizontal />` |
| 密码可见性 | 无 | `<Eye />` / `<EyeOff />` |
| 错误提示 | 无 | `<AlertCircle />` |
| 消息空状态 | 📭 | `<Inbox />` |
| 用量空状态 | 📋 | `<FileText />` |
| 关闭按钮 | ✕ | `<X />` |
| 充值箭头 | → | `<ArrowRight />` |

---

## 十、页脚

认证类页面底部统一显示版权信息：

```
© 2025 GenNovel. All rights reserved.
```

样式：`font-size: 12px`, `color: var(--text-muted)`, `margin-top: 48px`, 居中对齐。

功能页面（chat、settings 等）不显示页脚。

---

## 十一、各页面类型应用指南

### 11.1 认证页（登录 / 注册 / 忘记密码 / 验证邮箱）

```
结构：
  全屏居中 (flexbox center)
  └── 容器 max-width: 360px
      ├── Logo 区 (icon + wordmark + slogan)  ← margin-bottom: 56px
      ├── 表单区 (label + 底部线条输入框)       ← 字段间距: 28px
      ├── 主按钮 (full-width)                  ← margin-top: 8px
      ├── 文字分隔线 "或"                       ← margin: 32px 0
      ├── 链接组 (居中, | 分隔)
      └── 页脚 (版权)                          ← margin-top: 48px

特征：
  ✓ 无 Card 包裹
  ✓ 底部线条输入框
  ✓ 永久可见 label
  ✓ 字段级错误提示
  ✓ 密码 eye icon
```

### 11.2 内容页（聊天）

```
结构：
  ├── Sidebar (260px, 可折叠)
  │   ├── Logo (32x32, 无 slogan)
  │   ├── 新建聊天按钮
  │   └── 会话列表 (hover: bgTertiary, active: 左侧accent色条)
  └── 主区域
      ├── Header (48px)
      ├── 消息列表 (max-width: 768px, 居中)
      └── ChatInput (悬浮, 底部固定)

Modern Minimal 应用点：
  ✓ Sidebar 会话列表无 Card，用 hover 背景 + active 色条区分
  ✓ Header 工具按钮用 Lucide icon，hover 有 bgTertiary 背景
  ✓ 消息区域大量留白，不同消息间 padding 充裕
```

### 11.3 设置页（个人资料 / 用量概览）

```
结构：
  ├── Header
  └── 主区域 (max-width: 600px, 居中)
      ├── 左侧 Tabs (desktop) / 顶部 Tabs (mobile)
      └── 内容区
          ├── Section 标题 (18px, 600)
          ├── 表单字段 (底部线条输入框)
          ├── 分割线
          └── 下一个 Section

Modern Minimal 应用点：
  ✓ 表单字段用底部线条输入框
  ✓ Section 之间用分割线 + 间距区分，不套 Card
  ✓ 只读字段用 disabled 输入框样式（dashed 底线 + lower opacity）
  ✓ 操作按钮用 Button 组件，不用裸 TouchableOpacity
```

### 11.4 列表页（消息 / 交易记录）

```
结构：
  ├── Header
  └── 主区域 (max-width: 768px, 居中)
      ├── 筛选/Tab 栏
      ├── 列表区域
      │   ├── 列表项 (hover: bgTertiary, bottom-border 分隔)
      │   ├── 列表项
      │   └── ...
      └── 加载更多 / 空状态

Modern Minimal 应用点：
  ✓ 列表项之间用 1px bottom-border 分隔，不套 Card
  ✓ 列表项 hover 时 bgTertiary 背景
  ✓ 空状态用 Lucide icon (48px) + 文字描述，不用 emoji
  ✓ 筛选 Tab 用底部线条指示 active 状态
```

---

## 十二、过渡动画规范

| 属性 | 时长 | 缓动 | 使用场景 |
|------|------|------|----------|
| `border-color` | 0.2s | ease | 输入框聚焦 |
| `background` | 0.15s | ease | 按钮 hover、链接 hover |
| `color` | 0.15s | ease | 链接 hover、icon hover |
| `transform` | 0.1s | ease | 按钮 pressed (scale) |
| `opacity` | 0.15s | ease | 元素显隐 |

**规则：**
- 微交互不超过 200ms
- 面板展开/收起 使用 300ms
- 禁止使用 `transition: all` — 显式声明需要过渡的属性

---

## 十三、无障碍要求

| 要求 | 规范 |
|------|------|
| **对比度** | 正文文字 ≥ 4.5:1，大文字 ≥ 3:1 |
| **Focus ring** | 所有可交互元素必须有 `focus-visible` 样式 |
| **触摸目标** | 最小 44x44px |
| **标签** | 所有输入框必须有关联的 label（可见或 aria-label） |
| **错误通知** | 使用 `accessibilityRole="alert"` |
| **图标** | 功能图标必须有 `accessibilityLabel` |
| **颜色不唯一** | 颜色不能是传递信息的唯一手段（配合 icon 或文字） |
| **减少动效** | 尊重 `prefers-reduced-motion: reduce` |

---

## 十四、检查清单

每个页面/组件交付前，对照以下检查：

### 视觉
- [ ] 无 Card 过度包裹（遵循去容器化原则）
- [ ] 输入框使用底部线条风格
- [ ] 所有 label 永久可见
- [ ] 无 emoji 图标（使用 Lucide SVG）
- [ ] 无硬编码颜色值（使用 theme tokens）
- [ ] 无硬编码间距值（使用 spacing tokens）
- [ ] 圆角统一（按钮 8px）
- [ ] 留白充裕，垂直节奏一致

### 交互
- [ ] 五态完整：default / hover / focus-visible / active / disabled
- [ ] hover 过渡 150ms
- [ ] 所有可点击元素 `cursor: pointer`
- [ ] disabled 状态 `cursor: not-allowed`
- [ ] 按钮 pressed 有 scale(0.985)

### 反馈
- [ ] 错误提示到字段级（icon + 文字）
- [ ] 异步操作有 loading 状态
- [ ] 破坏性操作有确认弹窗

### 响应式
- [ ] 375px 无溢出
- [ ] 768px 布局合理
- [ ] 1024px+ 间距充裕
- [ ] 内容不超过 max-width

### 无障碍
- [ ] 对比度 ≥ 4.5:1
- [ ] focus-visible 可见
- [ ] 触摸目标 ≥ 44px
- [ ] accessibilityLabel 完整
