# GenNovel 设计系统规范

## 设计理念

> **设计语言详细规范请参阅：[`design-language-modern-minimal.md`](./design-language-modern-minimal.md)**
> 该文档定义了 Modern Minimal 风格的完整视觉规范、交互范式与各页面类型的应用指南。

### 核心原则

| 原则 | 说明 |
|------|------|
| **去容器化** | 减少 Card/Box 包裹，内容直接呈现于背景之上，用间距和线条创造层次 |
| **线条优于边框** | 用底部线条（bottom-border）代替全包围边框，更轻盈通透 |
| **留白即设计** | 充裕的间距取代装饰性元素，让内容自然呼吸 |
| **状态要明确** | 每个可交互元素具备 default/hover/focus/active/disabled 五态 |
| **信息要精确** | 错误提示到字段级别，标签始终可见，不依赖 placeholder |

### 参考风格

- Modern Minimal（确认方向，Demo: `docs/demos/login-modern-minimal.html`）
- Claude.ai 的简洁对话界面
- Linear / Notion 的极简交互范式

---

## 颜色系统

### 深色主题 (Dark Mode) - 默认

```css
:root {
  /* 背景层次 */
  --bg-primary: #1A1A1A;        /* 主背景 */
  --bg-secondary: #262626;      /* 次级背景（卡片、顶栏） */
  --bg-tertiary: #2A2A2A;       /* 第三层背景（按钮悬停） */

  /* 侧边栏 */
  --sidebar-bg: #1F1F1F;        /* 侧边栏背景 */
  --sidebar-hover: #2A2A2A;     /* 侧边栏项目悬停 */

  /* 文字 */
  --text-primary: #EAE6DF;      /* 主要文字（钢琴白） */
  --text-secondary: #A8A29E;    /* 次要文字 */
  --text-muted: #6B6560;        /* 静默文字（提示、时间戳） */

  /* 强调色 */
  --accent: #D4836A;            /* 品牌强调色（橙棕色） */
  --accent-hover: #E09478;      /* 强调色悬停 */

  /* 边框 */
  --border: #333333;            /* 边框颜色 */

  /* 消息区域 */
  --msg-user-bg: #242424;       /* 用户消息背景 */
  --msg-ai-bg: transparent;     /* AI 消息背景 */

  /* 输入框 */
  --input-bg: #262626;          /* 输入框背景 */
  --input-border: #3D3D3D;      /* 输入框边框 */
  --input-focus-border: #4D4D4D;/* 输入框聚焦边框 */

  /* 滚动条 */
  --scrollbar-thumb: #4A4A4A;   /* 滚动条滑块 */
  --scrollbar-hover: #5A5A5A;   /* 滚动条悬停 */
}
```

### 浅色主题 (Light Mode)

```css
.light {
  /* 背景层次 */
  --bg-primary: #FAFAF9;        /* 主背景（暖白） */
  --bg-secondary: #FFFFFF;      /* 次级背景 */
  --bg-tertiary: #F5F5F4;       /* 第三层背景 */

  /* 侧边栏 */
  --sidebar-bg: #F5F5F4;
  --sidebar-hover: #E7E5E4;

  /* 文字 */
  --text-primary: #1C1917;      /* 主要文字（深灰，非纯黑） */
  --text-secondary: #57534E;    /* 次要文字 */
  --text-muted: #A8A29E;        /* 静默文字 */

  /* 强调色 */
  --accent: #C4704F;            /* 品牌强调色 */
  --accent-hover: #B5614A;

  /* 边框 */
  --border: #E7E5E4;

  /* 消息区域 */
  --msg-user-bg: #F5F5F4;
  --msg-ai-bg: transparent;

  /* 输入框 */
  --input-bg: #FFFFFF;
  --input-border: #D6D3D1;
  --input-focus-border: #C4C4C4;

  /* 滚动条 */
  --scrollbar-thumb: #C4C4C4;
  --scrollbar-hover: #A0A0A0;
}
```

### 颜色使用指南

| 场景 | 深色主题 | 浅色主题 |
|------|----------|----------|
| 页面背景 | `--bg-primary` | `--bg-primary` |
| 卡片/面板 | `--bg-secondary` | `--bg-secondary` |
| 按钮悬停 | `--bg-tertiary` | `--bg-tertiary` |
| 正文内容 | `--text-primary` | `--text-primary` |
| 辅助说明 | `--text-secondary` | `--text-secondary` |
| 时间/提示 | `--text-muted` | `--text-muted` |
| 主要按钮 | `--accent` | `--accent` |
| 链接文字 | `--accent` | `--accent` |

---

## 字体规范

### 字体栈

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
```

### 字号层级

| 用途 | 字号 | 字重 | 行高 |
|------|------|------|------|
| 页面标题 | 24px | 600 | 1.3 |
| 区块标题 | 18px | 600 | 1.4 |
| 正文大 | 16px | 400 | 1.6 |
| 正文 | 15px | 400 | 1.8 |
| 辅助文字 | 14px | 400 | 1.5 |
| 小字/标签 | 12px | 500 | 1.4 |

### 文字颜色区分

- **用户输入内容**：使用 `--text-primary`（较亮）
- **AI 生成内容**：使用 `--text-secondary`（稍暗，增加沉浸感）
- **系统提示**：使用 `--text-muted`

---

## 间距系统

### 基础单位

基础间距单位：**4px**

### 间距规范

| 名称 | 值 | 使用场景 |
|------|-----|----------|
| xs | 4px | 图标与文字间距 |
| sm | 8px | 紧凑元素间距 |
| md | 12px | 标准元素间距 |
| lg | 16px | 区块内边距 |
| xl | 24px | 区块间距 |
| 2xl | 32px | 大区块分隔 |
| 3xl | 48px | 页面级边距 |

### 常用间距

```css
/* 内边距 */
padding-compact: 8px 12px;     /* 紧凑按钮 */
padding-normal: 12px 16px;     /* 标准按钮/输入框 */
padding-relaxed: 16px 20px;    /* 宽松卡片 */

/* 消息区域 */
message-padding-x: 48px;       /* 桌面端水平内边距 */
message-padding-x-mobile: 16px;/* 移动端水平内边距 */
message-padding-y: 24px;       /* 消息垂直间距 */
```

---

## 圆角规范

| 用途 | 圆角值 |
|------|--------|
| 小按钮/标签 | 4px |
| 输入框/按钮 | 8px |
| 卡片/面板 | 12px |
| 大型输入框 | 16px |
| 头像（圆形） | 50% |

---

## 组件样式

### 按钮

#### 主要按钮 (Primary)

```css
.btn-primary {
  background: var(--accent);
  color: #FFFFFF;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--accent-hover);
}
```

#### 次要按钮 (Secondary)

```css
.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}
```

#### 虚线按钮 (Dashed)

```css
.btn-dashed {
  background: transparent;
  color: var(--text-secondary);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px dashed var(--border);
  font-size: 14px;
  cursor: pointer;
}

.btn-dashed:hover {
  background: var(--bg-tertiary);
}
```

#### 图标按钮

```css
.btn-icon {
  width: 32px;
  height: 32px;
  padding: 8px;
  border-radius: 8px;
  background: var(--bg-tertiary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 输入框

```css
.input {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 15px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.input::placeholder {
  color: var(--text-muted);
}

.input:focus {
  border-color: var(--input-focus-border);
}
```

### 卡片

```css
.card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border);
}
```

### 消息气泡

```css
/* 用户消息 */
.message-user {
  background: var(--msg-user-bg);
  padding: 24px 48px;
}

.message-user .text {
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.8;
}

/* AI 消息 */
.message-ai {
  background: var(--msg-ai-bg);
  padding: 24px 48px;
}

.message-ai .text {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.8;
}
```

---

## 布局规范

### 页面结构

```
┌─────────────────────────────────────────────────┐
│                    页面                          │
├────────────┬────────────────────────────────────┤
│            │              Header                 │
│  Sidebar   ├────────────────────────────────────┤
│  260px     │              Content                │
│  (可折叠)   │           max-width: 768px          │
│            ├────────────────────────────────────┤
│            │              Footer/Input           │
└────────────┴────────────────────────────────────┘
```

### 关键尺寸

| 元素 | 尺寸 |
|------|------|
| 侧边栏宽度 | 260px |
| 内容区最大宽度 | 768px |
| 顶栏高度 | 48px |
| 输入区域高度 | ~80px |
| 移动端断点 | 768px |

### 响应式断点

```css
/* 移动端 */
@media (max-width: 768px) {
  --message-padding-x: 16px;
  /* 侧边栏隐藏或抽屉式 */
}

/* 平板 */
@media (min-width: 769px) and (max-width: 1024px) {
  /* 侧边栏可折叠 */
}

/* 桌面端 */
@media (min-width: 1025px) {
  /* 完整布局 */
}
```

---

## 滚动条样式

```css
/* Webkit 浏览器 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-hover);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}
```

---

## 动画与过渡

### 过渡时长

| 类型 | 时长 | 使用场景 |
|------|------|----------|
| 快速 | 0.15s | 按钮悬停、颜色变化 |
| 标准 | 0.2s | 大多数交互 |
| 舒缓 | 0.3s | 面板展开、主题切换 |

### 缓动函数

```css
--ease-default: ease;
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
```

### 加载动画

```css
/* 打字指示器 */
@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}

.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

/* 旋转加载 */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

---

## 交互规范

### 滚动加载

- 滚动到顶部（scrollTop < 50px）时触发加载历史消息
- 显示加载指示器
- 加载完成后保持滚动位置不跳动
- 无更多内容时显示"没有更多消息了"

### 主题切换

- 点击切换按钮立即切换
- 使用 CSS 变量实现无闪烁切换
- 保存用户偏好到本地存储

### 侧边栏

- 桌面端默认展开
- 移动端默认收起，点击汉堡菜单展开
- 展开时显示遮罩层

---

## 图标规范

### 图标来源

**全站统一使用 Lucide React Native，禁止使用 Emoji 作为功能图标。**

详细替换清单和图标规格参见 [`design-language-modern-minimal.md` 第九章](./design-language-modern-minimal.md#九图标系统)。

### 常用图标

| 用途 | Lucide 组件 | 尺寸 |
|------|-------------|------|
| 新建 | `<Plus />` | 20px |
| 发送 | `<ArrowUp />` | 18px |
| 附件 | `<Paperclip />` | 18px |
| 浅色模式 | `<Sun />` | 20px |
| 深色模式 | `<Moon />` | 20px |
| 菜单 | `<Menu />` | 20px |
| 更多 | `<MoreHorizontal />` | 20px |
| 折叠 | `<ChevronLeft />` | 20px |
| 密码可见 | `<Eye />` / `<EyeOff />` | 18px |
| 错误提示 | `<AlertCircle />` | 14px |
| 关闭 | `<X />` | 24px |

---

## 设计检查清单

### 新页面设计时检查

- [ ] 颜色是否使用 CSS 变量
- [ ] 是否支持深色/浅色主题
- [ ] 字号是否符合规范
- [ ] 间距是否使用 4px 倍数
- [ ] 圆角是否统一
- [ ] 是否有适当的过渡动画
- [ ] 滚动条是否美化
- [ ] 移动端是否适配

### 沉浸感检查

- [ ] 是否去除了不必要的边框
- [ ] 是否避免了高对比度
- [ ] 是否弱化了系统 UI 元素
- [ ] 内容区域是否足够突出

---

## 示例代码

完整示例参见：`frontend/demo.html`

---

## React Native 组件实现

### 文件结构

```
frontend/src/
├── theme/
│   ├── colors.ts         # 深色/浅色主题颜色常量
│   ├── spacing.ts        # 间距系统 (4px基础单位)
│   ├── typography.ts     # 字体规范
│   ├── ThemeContext.tsx  # Theme Context + Provider + useTheme hook
│   └── index.ts          # 导出入口
├── store/
│   └── useThemeStore.ts  # 主题持久化 (Zustand + AsyncStorage)
├── hooks/
│   └── useResponsive.ts  # 响应式断点 hook
├── components/
│   ├── ui/
│   │   ├── Button.tsx    # 按钮组件
│   │   ├── Input.tsx     # 输入框组件
│   │   ├── Card.tsx      # 卡片组件
│   │   ├── Avatar.tsx    # 头像组件
│   │   └── index.ts
│   ├── chat/
│   │   ├── Sidebar.tsx           # 侧边栏
│   │   ├── MessageBubble.tsx     # 消息气泡
│   │   ├── ChatInput.tsx         # 聊天输入框
│   │   ├── TypingIndicator.tsx   # 打字指示器
│   │   ├── LoadMoreIndicator.tsx # 加载更多
│   │   └── index.ts
│   └── layout/
│       ├── Header.tsx      # 顶部栏
│       ├── AuthLayout.tsx  # 认证页面布局
│       └── index.ts
```

---

## 核心组件样式规范

### ChatInput 聊天输入框

**设计哲学**：
- **悬浮感**：使用强阴影使输入框看起来漂浮在页面上
- **自适应高度**：输入框随文本内容自动增长，无内部滚动条
- **简洁无边框**：移除边框，用背景色和阴影区分层次

```typescript
// 核心样式
const styles = {
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    minHeight: 56,
    gap: 8,
    borderRadius: 24,
    backgroundColor: colors.bgSecondary,
    // 悬浮阴影 (Web)
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
    // iOS/Android 阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    textAlignVertical: 'center',
    outlineStyle: 'none',  // 移除 Web 焦点边框
    lineHeight: 24,
  },
  sideButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',  // Web 鼠标指针
  },
};
```

**高度自适应实现**：
```typescript
const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);

// 监听内容尺寸变化
const handleContentSizeChange = (e) => {
  const newHeight = e.nativeEvent.contentSize.height;
  setInputHeight(Math.min(Math.max(newHeight, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT));
};

// 清空时重置高度
const handleChange = (text) => {
  if (!text) setInputHeight(MIN_INPUT_HEIGHT);
};
```

---

### MessageBubble 消息气泡

**设计哲学**：
- **颜色区分**：用户消息用 `msgUserBg` 背景，AI 消息透明背景
- **文字层次**：用户文字较亮 (`textPrimary`)，AI 文字稍暗 (`textSecondary`)
- **无头像**：简洁风格，不显示头像

**图片交互**：
- 悬停时显示半透明放大镜图标（右下角）
- 悬停不改变图片亮度
- 点击打开全屏灯箱查看大图
- 鼠标指针变为 `zoom-in`

```typescript
// 图片悬停指示器
const styles = {
  zoomIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 用 View 绘制的放大镜图标
  zoomCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
  },
  zoomHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 6,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ rotate: '45deg' }],
  },
};
```

**灯箱 Modal**：
```typescript
<Modal visible={!!selectedImage} transparent animationType="fade">
  <Pressable style={styles.modalOverlay} onPress={closeModal}>
    <Image source={{ uri: selectedImage.uri }} resizeMode="contain" />
    <TouchableOpacity style={styles.closeButton}>
      <Text>✕</Text>
    </TouchableOpacity>
  </Pressable>
</Modal>
```

---

## 交互设计哲学

### 1. 悬浮与层次

使用阴影而非边框来区分 UI 层次：
- **轻阴影**：`0 2px 8px rgba(0,0,0,0.1)` - 卡片、按钮
- **中阴影**：`0 4px 16px rgba(0,0,0,0.2)` - 弹出菜单
- **重阴影**：`0 8px 32px rgba(0,0,0,0.4)` - 输入框、模态框

### 2. 渐进式反馈

- **悬停**：仅显示必要的视觉提示（如放大镜图标），不改变原有内容
- **点击**：提供即时反馈（如按钮按下效果）
- **加载**：使用动画指示器而非阻塞 UI

### 3. 自适应内容

- 输入框高度随内容增长，无内部滚动
- 消息区域无固定高度，完全展示内容
- 响应式布局适配不同屏幕

### 4. 指针语义化

| 场景 | 指针样式 |
|------|----------|
| 可点击按钮 | `pointer` |
| 可放大图片 | `zoom-in` |
| 文本输入 | `text` |
| 禁用状态 | `not-allowed` |

---

## Web 特定样式

React Native Web 需要特殊处理的样式：

```typescript
// 移除焦点边框
outlineStyle: 'none'

// 鼠标指针
cursor: 'pointer' | 'zoom-in' | 'text'

// Web 阴影
boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'

// 文本换行
whiteSpace: 'pre-wrap'
```

---

## 主题切换

使用 Zustand + AsyncStorage 持久化主题偏好：

```typescript
// useThemeStore.ts
const useThemeStore = create(
  persist(
    (set) => ({
      mode: 'dark',
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'theme-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ThemeContext.tsx
const colors = mode === 'dark' ? darkColors : lightColors;
```

---

*文档版本：3.0*
*创建时间：2026-02-02*
*最后更新：2026-02-27*
*设计语言：Modern Minimal（详见 design-language-modern-minimal.md）*
