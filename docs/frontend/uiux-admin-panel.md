# 管理后台 UI/UX 设计稿

> 管理后台采用独立前端（React + Ant Design），与用户端完全隔离。仅提供浅色主题（Light Mode），设计风格偏向专业、高效的数据管理界面。
>
> 可交互演示 Demo：`docs/admin-demo.html`（浏览器打开即可预览）

---

## 1. 设计总览

### 1.1 设计原则

| 原则 | 在管理后台中的体现 |
|------|-----------------|
| 高效 | 数据表格为核心，搜索筛选一步到位，减少点击层级 |
| 清晰 | 数据层次分明，状态用彩色 Badge 区分，指标用大字号突出 |
| 安全 | 危险操作（封禁、调账）必须二次确认，所有操作有审计日志 |
| 一致 | 全局统一的表格、筛选栏、弹窗、按钮风格 |

### 1.2 色彩系统

管理后台使用独立的色彩方案（非用户端主题色），以蓝色为主色调：

```
主色调
─────────────────────
primary:        #1677ff       主蓝色（按钮、选中态、链接）
primaryHover:   #4096ff       主蓝色悬停
primaryLight:   rgba(22,119,255,0.1)  浅蓝背景

背景层次
─────────────────────
bgPage:         #f0f2f5       页面背景
bgCard:         #ffffff       卡片/表格背景
bgSection:      #fafafa       表头/代码块背景
bgHover:        #fafafa       行悬停背景

文字
─────────────────────
textPrimary:    #111          标题、大数字
textRegular:    #333          正文
textSecondary:  #666          标签、辅助文字
textMuted:      #999          时间戳、提示文字
textLight:      #bbb          分割线级弱文字

边框
─────────────────────
border:         #e8e8e8       Header 下边框
borderLight:    #f0f0f0       表头下边框
borderLighter:  #f5f5f5       表格行分割线

状态色
─────────────────────
success:        #52c41a       正常、已支付、收入(+)
danger:         #ff4d4f       封禁、已取消、支出(-)
warning:        #faad14       待支付、邀请奖励
info:           #1677ff       管理员、退款、调账
purple:         #722ed1       赠送、重置密码

侧边栏
─────────────────────
sidebarBg:      #001529       深色背景
sidebarText:    rgba(255,255,255,0.65)  默认文字
sidebarTextActive: #ffffff    选中文字
sidebarItemActive: #1677ff    选中背景
sidebarBorder:  rgba(255,255,255,0.1)  分割线
```

### 1.3 字体规范

```
字体栈: -apple-system, BlinkMacSystemFont, 'Segoe UI',
        'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif

| 用途           | 字号  | 字重 | 颜色          |
|----------------|-------|------|---------------|
| 页面标题        | 20px  | 600  | textPrimary   |
| 卡片/区块标题   | 15px  | 600  | textPrimary   |
| 指标大数字      | 28px  | 700  | textPrimary   |
| 表格正文        | 13px  | 400  | textRegular   |
| 表头            | 13px  | 500  | textMuted     |
| 筛选/按钮       | 13px  | 400  | textSecondary |
| Badge/标签      | 12px  | 500  | 对应状态色     |
| 时间戳          | 12px  | 400  | textMuted     |
| 侧边栏菜单      | 14px  | 400  | sidebarText   |
| Logo            | 16px  | 600  | white         |
| 登录页标题      | 24px  | 600  | sidebarBg     |
```

### 1.4 间距与圆角

```
间距
─────────────────────
页面内边距:         24px
卡片内边距:         20px
卡片间距:           16px
表格行内边距:       12px 16px
筛选栏元素间距:     12px
统计卡片网格间距:   16px
弹窗内边距:         24px

圆角
─────────────────────
卡片/表格容器:      10px
按钮/输入框/Badge:  6px
统计指标图标:       10px
头像:               50%
登录卡片:           12px
弹窗:               12px
柱状图顶部:         4px
```

---

## 2. 全局布局

### 2.1 整体结构

```
┌─────────────────────────────────────────────────────────────────┐
│                   display: flex; height: 100vh                   │
├──────────┬──────────────────────────────────────────────────────┤
│          │  Header (56px, bgCard, border-bottom)                │
│ Sidebar  │  ┌──────────────────────────────────────────────┐    │
│ (220px)  │  │ breadcrumb               [退出登录]          │    │
│ #001529  │  └──────────────────────────────────────────────┘    │
│          ├──────────────────────────────────────────────────────┤
│          │  Content Area (flex: 1, overflow-y: auto)            │
│          │  padding: 24px                                       │
│          │  background: #f0f2f5                                 │
│          │                                                      │
│          │  ┌──────────────────────────────────────────────┐    │
│          │  │  页面内容                                     │    │
│          │  │  (卡片/表格/配置项等)                         │    │
│          │  └──────────────────────────────────────────────┘    │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

### 2.2 Sidebar 详细规格

```
┌──────────────────────┐
│  [■] GenNovel Admin  │ ← Logo 区 (56px)
├──────────────────────┤
│  ▪ 仪表盘            │ ← 菜单项 (padding: 10px 20px)
│  ▪ 用户管理          │
│  ▪ 订单管理          │
│  ▪ 交易流水          │
│  ▪ 公告管理          │
│  ▪ 系统配置          │
│  ▪ 操作日志          │
│                      │
│  (flex: 1, 可滚动)    │
├──────────────────────┤
│  [A] Admin           │ ← 底部用户信息区
│      管理员          │
└──────────────────────┘

Logo 区:
  height: 56px
  padding: 0 20px
  display: flex, align-items: center
  border-bottom: 1px solid rgba(255,255,255,0.1)
  Logo 图标: 28×28, borderRadius: 6, bg: #1677ff, 内含白色条纹
  Logo 文字: 16px, 600, white, margin-left: 10px

菜单项:
  display: flex, align-items: center
  padding: 10px 20px
  gap: 10px
  font-size: 14px
  border-left: 3px solid transparent
  transition: all 0.2s

  默认态:
    color: rgba(255,255,255,0.65)
    background: transparent

  悬停态:
    color: #fff
    background: rgba(255,255,255,0.05)

  选中态:
    color: #fff
    background: #1677ff
    border-left-color: #fff

  图标: 16×16 SVG, currentColor

底部用户区:
  padding: 12px 20px
  border-top: 1px solid rgba(255,255,255,0.1)
  头像: 32×32, 圆形, bg: #1677ff, 白字首字母
  用户名: 13px, 500, white
  角色: 11px, rgba(255,255,255,0.45)
```

### 2.3 Header 详细规格

```
┌──────────────────────────────────────────────────────────────────┐
│  管理后台 / 仪表盘                                    [退出登录] │
└──────────────────────────────────────────────────────────────────┘

height: 56px
background: #fff
border-bottom: 1px solid #e8e8e8
padding: 0 24px
display: flex, justify-content: space-between, align-items: center

面包屑:
  font-size: 13px
  路径部分: color: #999
  当前页: color: #333, fontWeight: 500

退出按钮:
  padding: 4px 12px
  border: 1px solid #d9d9d9
  borderRadius: 6px
  fontSize: 13px
  color: #666
  hover: color: #1677ff, borderColor: #1677ff
```

---

## 3. 登录页

### 3.1 布局

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  background: linear-gradient(135deg, #001529 0%, #003a70 100%)   │
│  display: flex, center center, height: 100vh                     │
│                                                                  │
│              ┌────────────────────────────────────┐              │
│              │                                    │              │
│              │       GenNovel Admin               │              │
│              │       管理后台登录                   │              │
│              │                                    │              │
│              │  邮箱                               │              │
│              │  ┌──────────────────────────────┐  │              │
│              │  │ admin@gennovel.com           │  │              │
│              │  └──────────────────────────────┘  │              │
│              │                                    │              │
│              │  密码                               │              │
│              │  ┌──────────────────────────────┐  │              │
│              │  │ ••••••••                     │  │              │
│              │  └──────────────────────────────┘  │              │
│              │                                    │              │
│              │  ┌──────────────────────────────┐  │              │
│              │  │           登 录               │  │              │
│              │  └──────────────────────────────┘  │              │
│              │                                    │              │
│              └────────────────────────────────────┘              │
│               width: 400px                                       │
│               bgCard, borderRadius: 12, padding: 40              │
│               boxShadow: 0 8px 40px rgba(0,0,0,0.3)             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 组件规格

```
标题区:
  text-align: center, margin-bottom: 32px
  h1: 24px, 600, color: #001529
  副标题: 13px, color: #999

表单项:
  margin-bottom: 20px
  label: 13px, 500, color: #666, margin-bottom: 6px
  input: width: 100%, padding: 10px 12px
         border: 1px solid #d9d9d9, borderRadius: 8px
         fontSize: 14px
         focus: borderColor: #1677ff, boxShadow: 0 0 0 2px rgba(22,119,255,0.1)

登录按钮:
  width: 100%, padding: 10px
  background: #1677ff, color: #fff
  borderRadius: 8px, fontSize: 15px, 500
  hover: background: #4096ff

交互:
  - 登录后检查返回的 user.role
  - role !== 'admin' && role !== 'super_admin' → 显示"无管理权限"提示
  - role 合法 → 进入仪表盘
```

---

## 4. 仪表盘（Dashboard）

### 4.1 完整布局

```
Content (padding: 24px)
│
├── 统计指标卡片行 (stats-row)
│   display: grid, grid-template-columns: repeat(4, 1fr), gap: 16px
│   margin-bottom: 24px
│
│   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│   │ 总用户数    │ │ 今日活跃   │ │ 今日新增    │ │ 今日收入    │
│   │ 1,234      │ │ 328        │ │ 15         │ │ ¥2,580     │
│   │ ↑12.5%     │ │ ↑5.1%      │ │ ↓3.2%      │ │ ↑18.3%     │
│   └────────────┘ └────────────┘ └────────────┘ └────────────┘
│
├── 趋势图行 (charts-row)
│   display: grid, grid-template-columns: 1fr 1fr, gap: 16px
│   margin-bottom: 24px
│
│   ┌──────────────────────┐ ┌──────────────────────┐
│   │ 用户增长趋势   [30天]│ │ 收入趋势       [30天]│
│   │ 📊 柱状图             │ │ 📊 柱状图             │
│   └──────────────────────┘ └──────────────────────┘
│
├── 底部行 (charts-row)
│
│   ┌──────────────────────┐ ┌──────────────────────┐
│   │ Token 消耗趋势 [30天]│ │ 最近操作              │
│   │ 📊 柱状图             │ │ • 封禁 user@xx 10:32 │
│   │                      │ │ • 调账 +500    09:15 │
│   │                      │ │ • 发送公告     08:00 │
│   └──────────────────────┘ └──────────────────────┘
│
└── (底部留白)
```

### 4.2 统计指标卡片 (StatCard)

```
┌──────────────────────────────────────────┐
│  总用户数                          👥    │  ← header 行
│                                          │
│  1,234                                   │  ← 大数字
│  ↑ 12.5% 较昨日                          │  ← 变化率
└──────────────────────────────────────────┘

卡片容器:
  background: #fff
  borderRadius: 10px
  padding: 20px
  boxShadow: 0 1px 3px rgba(0,0,0,0.06)

header 行:
  display: flex, justify-content: space-between, align-items: center
  margin-bottom: 12px
  标题: 13px, color: #999
  图标容器: 40×40, borderRadius: 10px
    显示 emoji，背景色按指标类型区分:

    | 指标     | Emoji | 背景色                    | 文字色    |
    |----------|-------|---------------------------|-----------|
    | 总用户数 | 👥    | rgba(22,119,255, 0.1)     | #1677ff   |
    | 今日活跃 | ⚡    | rgba(82,196,26, 0.1)      | #52c41a   |
    | 今日新增 | 🆕    | rgba(250,173,20, 0.1)     | #faad14   |
    | 今日收入 | 💰    | rgba(245,34,45, 0.1)      | #f5222d   |

大数字:
  fontSize: 28px, fontWeight: 700, color: #111
  margin-bottom: 8px

变化率:
  fontSize: 12px
  上涨: color: #52c41a, 显示 ↑
  下跌: color: #ff4d4f, 显示 ↓
```

### 4.3 趋势图卡片 (ChartCard)

```
┌──────────────────────────────────────────────────────┐
│  用户增长趋势                    [7天] [30天] [90天] │  ← header
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │                                              │    │
│  │  ██  ██                 █  ██                │    │  ← 柱状图
│  │  ██  ██ ██     █  ██  ██  ██ ██  ██         │    │     height: 200px
│  │  ██  ██ ██ ██  ██ ██  ██  ██ ██  ██ ██      │    │
│  │  ██  ██ ██ ██  ██ ██  ██  ██ ██  ██ ██ ██   │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘

卡片容器:
  background: #fff, borderRadius: 10px, padding: 20px
  boxShadow: 0 1px 3px rgba(0,0,0,0.06)

header:
  display: flex, justify-content: space-between, align-items: center
  margin-bottom: 16px
  标题: 15px, 600

时间切换标签 (chart-tabs):
  display: flex, gap: 4px
  单个标签:
    padding: 3px 10px, borderRadius: 4px, fontSize: 12px
    默认: color: #999, background: #f5f5f5
    选中: background: #1677ff, color: #fff

图表区域:
  height: 200px, borderRadius: 8px
  background: #fafafa
  display: flex, align-items: flex-end
  padding: 0 10px 10px, gap: 6px

柱形条:
  flex: 1
  borderRadius: 4px 4px 0 0
  transition: height 0.5s
  高度: 随机模拟数据(实际接入 API)

  颜色方案（渐变）:
  | 图表         | 渐变                                    |
  |-------------|------------------------------------------|
  | 用户增长     | linear-gradient(180deg, #1677ff, #69b1ff)|
  | 收入趋势     | linear-gradient(180deg, #52c41a, #95de64)|
  | Token 消耗   | linear-gradient(180deg, #fa8c16, #ffc069)|
```

### 4.4 最近操作卡片 (RecentLogs)

```
┌──────────────────────────────────────────────────────┐
│  最近操作                              [查看全部]    │
├──────────────────────────────────────────────────────┤
│  🔴 封禁用户 carol@example.com — 违规操作     10:32 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  🔵 调账 +500 给 horizon@gmail.com — 补偿     09:15 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  🟢 发送公告「系统维护通知」— 全部用户        08:00 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  🟠 修改配置 新用户赠送积分 1000→2000    昨天 17:00 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  🔵 解封用户 dave@example.com            昨天 14:20 │
└──────────────────────────────────────────────────────┘

单行:
  display: flex, align-items: center, gap: 12px
  padding: 10px 0
  border-bottom: 1px solid #f5f5f5 (最后一条无)

  状态圆点: 8×8, borderRadius: 50%
    | 操作类型   | 颜色     |
    |-----------|----------|
    | 封禁/删除  | #ff4d4f  |
    | 调账/解封  | #1677ff  |
    | 发送公告   | #52c41a  |
    | 修改配置   | #fa8c16  |

  文本: flex: 1, fontSize: 13px, color: #555
  时间: fontSize: 12px, color: #bbb, whiteSpace: nowrap

[查看全部] 按钮:
  padding: 4px 10px, borderRadius: 4px
  border: 1px solid #d9d9d9, fontSize: 12px
  hover: color: #1677ff, borderColor: #1677ff
  点击 → 跳转操作日志页
```

---

## 5. 通用组件规格

以下组件在多个页面复用。

### 5.1 筛选栏 (FilterBar)

```
┌──────────────────────────────────────────────────────────────────┐
│  [下拉筛选▼]  [下拉筛选▼]  [日期范围▼]  [搜索关键词____] [搜索] │
└──────────────────────────────────────────────────────────────────┘

容器:
  display: flex, gap: 12px, flex-wrap: wrap, align-items: center
  margin-bottom: 16px

下拉筛选 (filter-select):
  padding: 7px 12px
  border: 1px solid #d9d9d9, borderRadius: 6px
  fontSize: 13px, background: #fff
  min-width: 120px
  focus: borderColor: #1677ff

搜索输入 (filter-input):
  padding: 7px 12px
  border: 1px solid #d9d9d9, borderRadius: 6px
  fontSize: 13px
  min-width: 200px
  placeholder: color #bbb
  focus: borderColor: #1677ff

搜索按钮 (btn-search):
  padding: 7px 20px
  background: #1677ff, color: #fff
  border: none, borderRadius: 6px, fontSize: 13px
  hover: background: #4096ff
```

### 5.2 数据表格 (Table)

```
┌──────────────────────────────────────────────────────────────────┐
│  ID │ 邮箱           │ 昵称    │ 状态    │ 操作                  │  ← thead
├──────────────────────────────────────────────────────────────────┤
│  1  │ alice@xx.com  │ Alice  │ 🟢正常  │ [详情]                │  ← tbody
│  2  │ bob@xx.com    │ Bob    │ 🟢正常  │ [详情]                │
│  3  │ carol@xx.com  │ Carol  │ 🔴封禁  │ [详情]                │
├──────────────────────────────────────────────────────────────────┤
│  共 1,234 条                     < 1  2  3  ...  62 >          │  ← footer
└──────────────────────────────────────────────────────────────────┘

表格容器 (table-card):
  background: #fff, borderRadius: 10px
  boxShadow: 0 1px 3px rgba(0,0,0,0.06)
  overflow: hidden

表头 (th):
  background: #fafafa
  padding: 12px 16px
  text-align: left
  fontSize: 13px, color: #888, fontWeight: 500
  border-bottom: 1px solid #f0f0f0
  white-space: nowrap

表格行 (td):
  padding: 12px 16px
  fontSize: 13px
  border-bottom: 1px solid #f5f5f5
  tr:hover → background: #fafafa

表格 Footer:
  display: flex, justify-content: space-between, align-items: center
  padding: 12px 16px

  总数: fontSize: 13px, color: #999
  分页: display: flex, gap: 4px
    页码按钮: 32×32, borderRadius: 6px
      border: 1px solid #d9d9d9, fontSize: 13px
      默认: background: #fff
      选中: background: #1677ff, color: #fff, borderColor: #1677ff
      hover: borderColor: #1677ff, color: #1677ff
```

### 5.3 状态 Badge

```
通用样式:
  padding: 2px 10px
  borderRadius: 10px
  fontSize: 12px, fontWeight: 500
  display: inline-block

| 状态       | 背景         | 文字      | 边框         |
|------------|-------------|-----------|-------------|
| 正常/已支付 | #f6ffed     | #52c41a   | #b7eb8f     |
| 封禁/已取消 | #fff2f0     | #ff4d4f   | #ffccc7     |
| 待支付      | #fffbe6     | #faad14   | #ffe58f     |
| 管理员/退款 | #e6f4ff     | #1677ff   | #91caff     |
| 赠送/重置   | #f9f0ff     | #722ed1   | #d3adf7     |
```

### 5.4 操作按钮

```
详情/查看按钮 (btn-sm):
  padding: 4px 10px, fontSize: 12px, borderRadius: 4px
  border: 1px solid #d9d9d9, background: #fff, color: #555
  hover: color: #1677ff, borderColor: #1677ff

主操作按钮 (btn-action):
  padding: 7px 16px, fontSize: 13px, borderRadius: 6px
  border: 1px solid #1677ff, color: #1677ff, background: #fff
  hover: background: #1677ff, color: #fff

危险操作按钮 (btn-danger):
  padding: 5px 12px, fontSize: 12px, borderRadius: 4px
  border: 1px solid #ff4d4f, color: #ff4d4f, background: #fff
  hover: background: #ff4d4f, color: #fff
```

### 5.5 弹窗 (Modal)

```
┌──────────────────────────────────────────────┐
│  弹窗标题                               [✕]  │  ← header
├──────────────────────────────────────────────┤
│                                              │
│  (表单内容)                                   │  ← body
│                                              │
├──────────────────────────────────────────────┤
│                        [取消]  [确认]        │  ← footer
└──────────────────────────────────────────────┘

遮罩层:
  position: fixed, inset: 0
  background: rgba(0,0,0,0.45)
  display: flex, center center, z-index: 1000

弹窗容器:
  background: #fff, borderRadius: 12px
  width: 520px, max-height: 80vh, overflow-y: auto
  boxShadow: 0 12px 48px rgba(0,0,0,0.2)

header:
  padding: 16px 24px
  border-bottom: 1px solid #f0f0f0
  display: flex, justify-content: space-between
  标题: 16px, 600
  关闭按钮: 32×32, borderRadius: 6px, fontSize: 18px
    hover: background: #f5f5f5

body:
  padding: 24px

footer:
  padding: 16px 24px
  border-top: 1px solid #f0f0f0
  display: flex, justify-content: flex-end, gap: 12px

  取消按钮: padding: 8px 20px, border: 1px solid #d9d9d9
            borderRadius: 6px, fontSize: 14px
            hover: borderColor: #1677ff, color: #1677ff

  确认按钮: padding: 8px 20px, borderRadius: 6px, fontSize: 14px
            background: #1677ff, color: #fff
            hover: background: #4096ff

  危险确认: background: #ff4d4f, hover: #ff7875
```

### 5.6 表单组件

```
单选组 (RadioGroup):
  display: flex, gap: 24px

  单选项:
    display: flex, align-items: center, gap: 6px
    cursor: pointer, fontSize: 14px

    圆形指示器: 16×16, border: 2px solid #d9d9d9, borderRadius: 50%
    选中态: borderColor: #1677ff
            内部圆: 6×6, borderRadius: 50%, background: #1677ff

多行输入 (Textarea):
  width: 100%, min-height: 100px
  padding: 10px 12px
  border: 1px solid #d9d9d9, borderRadius: 8px
  fontSize: 14px, font-family: inherit
  resize: vertical
  focus: borderColor: #1677ff

开关 (Switch):
  width: 44px, height: 22px
  borderRadius: 11px
  cursor: pointer
  transition: background 0.2s

  关闭态: background: #ccc
  开启态: background: #1677ff

  滑块: 18×18, borderRadius: 50%, background: #fff
         position: absolute, top: 2px, left: 2px
         boxShadow: 0 1px 3px rgba(0,0,0,0.2)
         开启态: transform: translateX(22px)
```

---

## 6. 用户管理

### 6.1 用户列表页

```
Content
│
├── page-header
│   页面标题: "用户管理", 20px, 600
│
├── filter-bar
│   [搜索邮箱或昵称___] [全部状态▼] [注册时间▼] [搜索]
│
└── table-card
    表头: ID | 邮箱 | 昵称 | 余额(点) | 状态 | 注册时间 | 最后活跃 | 操作
    每行: 对应数据，状态列用 Badge，操作列为 [详情] 按钮
    Footer: 总数 + 分页
```

### 6.2 用户详情页

```
Content
│
├── detail-back
│   "← 返回用户列表" (color: #1677ff, cursor: pointer)
│   hover: text-decoration: underline
│
├── page-header
│   "用户详情 #2"
│
├── detail-section: 基本信息
│   ┌──────────────────────────────────────────────────────────────┐
│   │  基本信息                                                    │ ← section-title
│   │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│   │                                                              │
│   │  邮箱: horizon@gmail.com      状态: 🟢正常                  │  ← 2列 grid
│   │  昵称: Horizon                角色: user                    │
│   │  邀请码: HRZ2026              注册时间: 2026-02-01 08:00    │
│   │  邮箱验证: ✓ 已验证           最后活跃: 2026-02-07 14:30    │
│   └──────────────────────────────────────────────────────────────┘
│
├── detail-section: 账户余额
│   ┌──────────────────────────────────────────────────────────────┐
│   │  账户余额                                         [调账]    │
│   │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│   │                                                              │
│   │  12,500 点          ← 32px, 700, color: #1677ff             │
│   │                                                              │
│   │  累计充值    累计消费    累计赠送                              │
│   │  50,000      36,200      1,200                               │
│   │  (green)     (red)       (purple)                            │
│   └──────────────────────────────────────────────────────────────┘
│
├── detail-section: 最近交易
│   ┌──────────────────────────────────────────────────────────────┐
│   │  最近交易                                                    │
│   │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│   │                                                              │
│   │  类型 │ 金额    │ 余额(后) │ 描述          │ 时间            │
│   │  充值 │ +5,000  │ 12,500  │ 支付宝 ¥50   │ 02-06 14:30    │
│   │  消费 │ -320    │ 7,500   │ 武侠 标准模型 │ 02-06 13:22    │
│   │  ...                                                        │
│   │                  [查看全部交易 →]                              │
│   └──────────────────────────────────────────────────────────────┘
│
└── detail-section: 操作
    ┌──────────────────────────────────────────────────────────────┐
    │  操作                                                        │
    │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
    │                                                              │
    │  [重置密码]  [封禁用户]                                      │
    │  (primary)   (danger)                                        │
    └──────────────────────────────────────────────────────────────┘

detail-section:
  background: #fff, borderRadius: 10px, padding: 20px
  margin-bottom: 16px
  boxShadow: 0 1px 3px rgba(0,0,0,0.06)

detail-section-title:
  fontSize: 15px, fontWeight: 600
  margin-bottom: 16px
  padding-bottom: 12px
  border-bottom: 1px solid #f0f0f0

detail-grid:
  display: grid, grid-template-columns: 1fr 1fr
  gap: 12px 32px

detail-item:
  display: flex, align-items: center, gap: 8px
  label: 13px, color: #999, min-width: 80px
  value: 13px, color: #333, fontWeight: 500

余额大数字:
  fontSize: 32px, fontWeight: 700, color: #1677ff
  "点" 后缀: fontSize: 16px, fontWeight: 400, color: #999

余额统计行:
  display: flex, gap: 32px, margin-top: 12px
  子标签: 12px, color: #999
  子数值: 18px, 600, margin-top: 4px
    充值: textRegular
    消费: textRegular
    赠送: textRegular
```

### 6.3 用户操作弹窗

#### 6.3.1 手动调账弹窗

```
┌──────────────────────────────────────────────┐
│  手动调账                               [✕]  │
├──────────────────────────────────────────────┤
│                                              │
│  调账类型                                     │
│  (●) 增加积分    ( ) 扣除积分                 │
│                                              │
│  积分数量                                     │
│  ┌──────────────────────────────────────┐    │
│  │ 500                                  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  原因（必填）                                  │
│  ┌──────────────────────────────────────┐    │
│  │ 客服补偿                              │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
├──────────────────────────────────────────────┤
│                        [取消]  [确认调账]     │
└──────────────────────────────────────────────┘

校验规则:
  - 积分数量 > 0，必填
  - 扣除时不能超过用户当前余额
  - 原因必填，最少 2 个字符
```

#### 6.3.2 封禁用户弹窗

```
┌──────────────────────────────────────────────┐
│  确认封禁用户                           [✕]   │
├──────────────────────────────────────────────┤
│                                              │
│  封禁后该用户将无法登录和使用平台服务。        │
│                                              │
│  封禁原因（必填）                              │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
├──────────────────────────────────────────────┤
│                        [取消]  [确认封禁]     │
└──────────────────────────────────────────────┘

确认按钮: 红色危险风格 (background: #ff4d4f)
```

#### 6.3.3 重置密码弹窗

```
┌──────────────────────────────────────────────┐
│  确认重置密码                           [✕]   │
├──────────────────────────────────────────────┤
│                                              │
│  将为用户 horizon@gmail.com 生成随机密码      │
│  并通过邮件发送。                              │
│                                              │
│  用户的当前密码将立即失效。                    │
│  (fontSize: 12px, color: #999)               │
│                                              │
├──────────────────────────────────────────────┤
│                        [取消]  [确认重置]     │
└──────────────────────────────────────────────┘
```

---

## 7. 订单管理

### 7.1 订单列表页

```
Content
│
├── page-header: "订单管理"
│
├── filter-bar
│   [全部状态▼] [全部支付方式▼] [时间范围▼] [用户邮箱___] [搜索]
│
└── table-card
    ┌── summary-bar ──────────────────────────────────────────────┐
    │ 总计 856 单 | 已支付 ¥128,500 | 待支付 ¥3,200 |             │
    │ 已取消 ¥15,800 | 已退款 ¥1,200                               │
    └─────────────────────────────────────────────────────────────┘
    表头: 订单号 | 用户 | 金额 | 点数 | 支付方式 | 状态 | 创建时间 | 支付时间
    Footer: 总数 + 分页

summary-bar:
  display: flex, gap: 24px
  padding: 12px 16px
  background: #fafafa
  border-bottom: 1px solid #f0f0f0
  fontSize: 13px, color: #666

  summary-value: fontWeight: 600, color: #333
  已支付金额: color: #52c41a
  待支付金额: color: #faad14
  已取消金额: color: #999
  已退款金额: color: #ff4d4f

订单号列: font-family: monospace
支付时间列: 无支付时间显示 "—"
```

---

## 8. 交易流水

### 8.1 交易列表页

```
Content
│
├── page-header: "交易流水"
│
├── filter-bar
│   [全部类型▼] [时间范围▼] [用户邮箱___] [搜索]
│
│   类型下拉选项: 全部 | 充值 | 消费 | 赠送 | 邀请奖励 | 退款
│
└── table-card
    表头: ID | 用户 | 类型 | 金额 | 余额(后) | 描述 | 时间

    类型列: 用 Badge 展示
    金额列: font-family: monospace
      收入(+): color: #52c41a
      支出(-): color: #ff4d4f
      赠送(+): color: #722ed1
      邀请(+): color: #faad14
      退款(+): color: #1677ff

    Footer: 总数 + 分页
```

---

## 9. 公告管理

### 9.1 公告列表页

```
Content
│
├── page-header
│   "公告管理"                              [+ 发送新公告]
│                                           (btn-action 样式)
│
├── filter-bar
│   [全部类型▼] [时间范围▼] [搜索]
│
└── table-card
    表头: ID | 类型 | 标题 | 发送对象 | 触达人数 | 已读率 | 发送时间 | 操作

    类型列: 用 Badge
      系统公告: badge-info
      用量提醒: badge-purple
      账户通知: badge-warning

    已读率: 百分比显示
    操作列: [删除] btn-danger

    Footer: 总数 + 分页
```

### 9.2 发送公告弹窗

```
┌──────────────────────────────────────────────────┐
│  发送系统公告                               [✕]   │
├──────────────────────────────────────────────────┤
│                                                  │
│  消息类型                                         │
│  (●) 系统公告  ( ) 账户通知  ( ) 用量提醒         │
│                                                  │
│  发送对象                                         │
│  (●) 全部用户  ( ) 指定用户                       │
│  ┌──────────────────────────────────────────┐    │
│  │ 输入用户邮箱，逗号分隔...                  │    │ ← 仅 "指定用户" 时显示
│  └──────────────────────────────────────────┘    │
│                                                  │
│  标题                                             │
│  ┌──────────────────────────────────────────┐    │
│  │                                          │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  内容                                             │
│  ┌──────────────────────────────────────────┐    │
│  │                                          │    │
│  │  (min-height: 120px)                     │    │
│  │                                          │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
├──────────────────────────────────────────────────┤
│                          [取消]  [确认发送]       │
└──────────────────────────────────────────────────┘

交互:
  - 选择"全部用户"时，点击"确认发送"弹出二次确认:
    "确定向全部用户发送此公告吗？此操作不可撤回。"
  - 标题最大 100 字符
  - 内容最大 2000 字符
  - 发送成功后自动关闭弹窗并刷新列表
```

---

## 10. 系统配置

### 10.1 页面布局

```
Content
│
├── page-header
│   "系统配置"                            [保存全部修改]
│
├── config-section: 注册设置
│   ┌──────────────────────────────────────────────────────────┐
│   │  ▎注册设置                                               │
│   │                                                          │
│   │  开放注册:            [====●]  (Switch 开启态)            │
│   │  仅邀请码注册:        [●====]  (Switch 关闭态)            │
│   │  新用户赠送积分:      [1000____] 点                      │
│   └──────────────────────────────────────────────────────────┘
│
├── config-section: 邀请奖励
│   ┌──────────────────────────────────────────────────────────┐
│   │  ▎邀请奖励                                               │
│   │                                                          │
│   │  邀请人奖励:          [500_____] 点                      │
│   │  被邀请人奖励:        [200_____] 点                      │
│   └──────────────────────────────────────────────────────────┘
│
├── config-section: 余额预警
│   ┌──────────────────────────────────────────────────────────┐
│   │  ▎余额预警                                               │
│   │                                                          │
│   │  低余额预警阈值:      [500_____] 点                      │
│   └──────────────────────────────────────────────────────────┘
│
└── config-section: 充值设置
    ┌──────────────────────────────────────────────────────────┐
    │  ▎充值设置                                               │
    │                                                          │
    │  人民币兑点数:        1 元 = [100____] 点                │
    │  最低充值金额:        [1______] 元                       │
    │  充值套餐:            ┌──────┐ ┌──────┐ ┌───────┐      │
    │                       │¥10   │ │¥50   │ │¥100   │ ...  │
    │                       │1,000点│ │5,000点│ │10,000点│      │
    │                       └──────┘ └──────┘ └───────┘      │
    │                                          [编辑套餐]      │
    └──────────────────────────────────────────────────────────┘

config-section:
  background: #fff, borderRadius: 10px, padding: 24px
  margin-bottom: 16px
  boxShadow: 0 1px 3px rgba(0,0,0,0.06)

config-section-title:
  fontSize: 15px, fontWeight: 600, color: #111
  display: flex, align-items: center, gap: 8px
  margin-bottom: 20px
  左侧标记条: width: 3px, height: 16px, background: #1677ff, borderRadius: 2px

config-row:
  display: flex, align-items: center
  margin-bottom: 16px (最后一行无)

  label: width: 140px, fontSize: 13px, color: #666, flex-shrink: 0
  control: flex: 1

config-input:
  padding: 7px 12px
  border: 1px solid #d9d9d9, borderRadius: 6px
  fontSize: 14px, width: 200px
  focus: borderColor: #1677ff

config-unit:
  margin-left: 8px, fontSize: 13px, color: #999

preset-tags:
  display: flex, gap: 8px, flex-wrap: wrap
  单个标签:
    padding: 6px 16px
    border: 1px solid #d9d9d9, borderRadius: 6px
    fontSize: 13px, background: #fafafa

交互:
  - Switch 点击切换开/关
  - 输入框修改后，[保存全部修改] 按钮高亮
  - 保存成功显示 Toast: "配置已保存"
  - 配置保存后清除 Redis 缓存，用户端立即生效
```

---

## 11. 操作日志

### 11.1 日志列表页

```
Content
│
├── page-header: "操作日志"
│
├── filter-bar
│   [全部操作▼] [全部操作人▼] [时间范围▼] [搜索]
│
│   操作类型选项: 全部 | 封禁用户 | 解封用户 | 手动调账 |
│                 重置密码 | 群发公告 | 删除公告 | 修改配置
│
└── table-card
    表头: ID | 操作人 | 操作类型 | 操作对象 | 摘要 | IP | 时间 | 操作

    操作类型列: 用 Badge
      | 操作     | Badge 样式    |
      |----------|---------------|
      | 封禁用户 | badge-danger  |
      | 解封用户 | badge-success |
      | 手动调账 | badge-info    |
      | 群发公告 | badge-success |
      | 修改配置 | badge-warning |
      | 删除公告 | badge-danger  |
      | 重置密码 | badge-purple  |

    IP 列: font-family: monospace, color: #999
    操作列: [详情] 按钮

    Footer: 总数 + 分页
```

### 11.2 日志详情弹窗

```
┌──────────────────────────────────────────────────┐
│  操作日志详情                               [✕]   │
├──────────────────────────────────────────────────┤
│                                                  │
│  操作人: admin@gennovel.com   操作时间: 02-07... │  ← detail-grid 2列
│  操作类型: 手动调账           IP 地址: 192.168...│
│  操作对象: user#2 (horizon@gmail.com)            │
│                                                  │
│  操作详情                                         │
│  ┌──────────────────────────────────────────┐    │
│  │ {                                        │    │  ← 代码块风格
│  │   "type": "increase",                    │    │     font-family: monospace
│  │   "amount": 500,                         │    │     background: #f6f8fa
│  │   "reason": "客服补偿",                   │    │     borderRadius: 8px
│  │   "balance_before": 12000,               │    │     padding: 16px
│  │   "balance_after": 12500                 │    │
│  │ }                                        │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
├──────────────────────────────────────────────────┤
│                                      [关闭]      │
└──────────────────────────────────────────────────┘
```

---

## 12. 页面路由表

| 路由 | 页面 | 侧边栏选中项 | 面包屑 |
|------|------|-------------|--------|
| `/admin/login` | 登录页 | — | — |
| `/admin/dashboard` | 仪表盘 | 仪表盘 | 管理后台 / 仪表盘 |
| `/admin/users` | 用户列表 | 用户管理 | 管理后台 / 用户管理 |
| `/admin/users/:id` | 用户详情 | 用户管理 | 管理后台 / 用户管理 / 用户详情 |
| `/admin/orders` | 订单列表 | 订单管理 | 管理后台 / 订单管理 |
| `/admin/transactions` | 交易流水 | 交易流水 | 管理后台 / 交易流水 |
| `/admin/announcements` | 公告管理 | 公告管理 | 管理后台 / 公告管理 |
| `/admin/configs` | 系统配置 | 系统配置 | 管理后台 / 系统配置 |
| `/admin/audit-logs` | 操作日志 | 操作日志 | 管理后台 / 操作日志 |

---

## 13. 交互规范

### 13.1 导航交互

| 交互 | 行为 |
|------|------|
| 点击侧边栏菜单项 | 切换页面，更新选中态和面包屑 |
| 用户详情 → 返回 | 点击 "← 返回用户列表" 回到列表页，保持筛选状态 |
| 查看全部交易 | 从用户详情跳转到交易流水页，预填该用户邮箱筛选 |
| 最近操作 → 查看全部 | 从仪表盘跳转到操作日志页 |

### 13.2 表格交互

| 交互 | 行为 |
|------|------|
| 筛选/搜索 | 点击搜索按钮触发查询，重置分页到第 1 页 |
| 翻页 | 点击页码按钮加载对应页数据 |
| 行悬停 | 整行背景变为 #fafafa |
| 排序 | 暂不实现（P1 迭代） |

### 13.3 弹窗交互

| 交互 | 行为 |
|------|------|
| 打开弹窗 | 显示遮罩 + 弹窗居中 |
| 关闭弹窗 | 点击 ✕ / 点击遮罩 / 点击取消 |
| 确认操作 | 校验表单 → 调用 API → 成功则关闭弹窗 + 刷新列表 + Toast |
| 危险操作 | 封禁/群发使用红色确认按钮，视觉上加重警示 |

### 13.4 配置页交互

| 交互 | 行为 |
|------|------|
| Switch 切换 | 点击即切换开/关状态 |
| 输入框修改 | 修改后不自动保存，需点击 "保存全部修改" |
| 保存 | 批量提交所有配置变更 → 成功 Toast → 清除缓存 |

---

## 14. 动画与过渡

```
通用过渡:
  按钮/输入框: transition: all 0.2s
  菜单项高亮: transition: all 0.2s
  Switch 滑块: transition: transform 0.2s, background 0.2s
  柱状图高度: transition: height 0.5s

弹窗动画:
  遮罩: opacity 0→1, duration: 0.2s
  弹窗: transform: scale(0.95)→scale(1) + opacity 0→1, duration: 0.2s

页面切换:
  无过渡动画（即时切换），与用户端保持一致

Toast 提示:
  从顶部滑入: translateY(-20)→0, opacity 0→1, duration: 0.3s
  自动消失: 3000ms 后 opacity 1→0
```

---

## 15. 前端文件结构规划

```
admin/                                  # 独立管理端项目
├── public/
│   └── index.html
├── src/
│   ├── pages/                         # 页面
│   │   ├── Login.tsx                  # 登录
│   │   ├── Dashboard.tsx              # 仪表盘
│   │   ├── Users.tsx                  # 用户列表
│   │   ├── UserDetail.tsx             # 用户详情
│   │   ├── Orders.tsx                 # 订单管理
│   │   ├── Transactions.tsx           # 交易流水
│   │   ├── Announcements.tsx          # 公告管理
│   │   ├── Configs.tsx                # 系统配置
│   │   └── AuditLogs.tsx              # 操作日志
│   │
│   ├── components/                    # 通用组件
│   │   ├── Layout/
│   │   │   ├── AdminLayout.tsx        # Sidebar + Header + Content 布局壳
│   │   │   ├── Sidebar.tsx            # 侧边栏
│   │   │   └── Header.tsx             # 顶栏
│   │   │
│   │   ├── StatCard.tsx               # 仪表盘指标卡片
│   │   ├── ChartCard.tsx              # 趋势图卡片
│   │   ├── FilterBar.tsx              # 筛选栏
│   │   ├── DataTable.tsx              # 通用数据表格 (含分页)
│   │   ├── StatusBadge.tsx            # 状态 Badge
│   │   ├── ConfirmModal.tsx           # 通用确认弹窗
│   │   ├── AdjustBalanceModal.tsx     # 调账弹窗
│   │   ├── BanUserModal.tsx           # 封禁弹窗
│   │   ├── AnnounceModal.tsx          # 发送公告弹窗
│   │   └── LogDetailModal.tsx         # 日志详情弹窗
│   │
│   ├── services/
│   │   └── adminApi.ts                # 管理端 API 客户端
│   │
│   ├── store/
│   │   └── useAdminStore.ts           # 管理端状态 (Zustand)
│   │
│   ├── types/
│   │   └── admin.ts                   # 管理端类型定义
│   │
│   ├── App.tsx                        # 根组件 + 路由
│   └── main.tsx                       # 入口文件
│
├── package.json
├── tsconfig.json
└── vite.config.ts                     # Vite 构建配置
```

---

## 16. 设计检查清单

### 16.1 视觉一致性

- [ ] 所有卡片使用统一的 borderRadius: 10px + boxShadow
- [ ] 所有表格使用统一的 th/td padding 和分割线样式
- [ ] 所有 Badge 使用预定义的 5 种状态色
- [ ] 所有弹窗使用统一的 Modal 壳（header + body + footer）
- [ ] 筛选栏组件样式全局统一
- [ ] 字号/字重/颜色符合 1.3 字体规范

### 16.2 交互一致性

- [ ] 所有危险操作有二次确认弹窗
- [ ] 所有列表页有筛选栏 + 分页
- [ ] 所有操作成功后显示 Toast + 刷新数据
- [ ] 弹窗可通过 ✕ / 遮罩 / 取消三种方式关闭
- [ ] 表格行悬停有背景变化
- [ ] 按钮悬停有视觉反馈

### 16.3 数据展示

- [ ] 金额数字使用 monospace 字体
- [ ] 收入/支出用颜色区分（绿/红）
- [ ] 大数字有千分位格式化（1,234）
- [ ] 时间格式统一（MM-DD HH:mm）
- [ ] 空数据状态有友好提示

### 16.4 响应式（后续迭代）

- [ ] 当前仅桌面端（min-width: 1024px），后续考虑 Tablet 适配
- [ ] Sidebar 可折叠为图标模式
- [ ] 表格宽度不足时水平滚动

---

*文档版本：1.0*
*创建日期：2026-02-07*
*最后更新：2026-02-07*
*可交互 Demo：`docs/admin-demo.html`*
