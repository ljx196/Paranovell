# Chat 页面底部交互区设计文档

> 适用于 Web / iOS / Android 跨平台移植参考

---

## 1. 整体布局架构

### 页面结构

```
+----------------------------------------------+
|  Header (固定高度 48px)                       |
+----------------------------------------------+
|  容器 (flex: 1, position: relative)           |
|                                              |
|  ScrollView (消息列表, flex: 1)               |
|  contentContainerStyle.paddingBottom          |
|    = bottomHeight (动态绑定底部区域高度)        |
|                                              |
|  ............................................|
|                                              |
|  +--------------------------------------+  ▐ |  ← absolute 定位
|  |  QuickReplies (快捷回复选择框)         |  ▐ |    bottom: 0
|  +--------------------------------------+  ▐ |    left: 0
|  |  Animated.View > ChatInput           |  ▐ |    right: scrollbarWidth
|  |    (文本输入框 + 提示文字)             |  ▐ |    背景: bgPrimary
|  +--------------------------------------+  ▐ |    ▐ = 滚动条(不被遮挡)
+----------------------------------------------+
```

### 关键设计决策

**底部区域使用 `position: absolute` 叠加在 ScrollView 之上**，而非与 ScrollView 并列。

原因：如果底部区域和 ScrollView 是兄弟元素（上下排列），鼠标/手指在底部区域时，滚轮/滑动事件无法传递到 ScrollView，导致滚动失效。

### 动态留白

ScrollView 的 `contentContainerStyle.paddingBottom` 与底部区域高度动态绑定：
- 通过 `onLayout` 回调获取底部容器实际高度（原生 + Web 通用）
- 通过 `ref` + `requestAnimationFrame` + DOM `offsetHeight` 在内容变化时重新测量（Web 端补充）
- QuickReplies 数量变化、ChatInput 展开/折叠时自动更新

```
状态变量: bottomHeight (默认 150px)
触发更新: onLayout 回调, quickReplies 数据变化, inputExpanded 状态变化
```

### 滚动条避让

底部容器 `right` 值为动态测量的 `scrollbarWidth`，避免背景遮挡 ScrollView 滚动条：
- Web 端在 mounted 时测量: `scrollEl.offsetWidth - scrollEl.clientWidth`
- macOS overlay 滚动条 → 0px（无影响）
- Windows 经典滚动条 → ~17px（自动留白）
- iOS / Android → 无需处理

```
状态变量: scrollbarWidth (默认 0)
测量时机: mounted useEffect
```

### 底部容器属性

| 属性 | 值 | 说明 |
|------|----|------|
| position | absolute | 叠加在 ScrollView 上方 |
| bottom | 0 | 贴底 |
| left | 0 | 左对齐 |
| right | scrollbarWidth (动态) | 避让滚动条 |
| backgroundColor | bgPrimary | 不透明，遮挡下方消息文字 |
| pointerEvents | box-none | 容器自身不拦截事件，子元素正常响应 |

### 父容器属性 (Main Content)

```
View style={{ flex: 1 }}        ← 无 overflow: hidden
  Header
  View style={{ flex: 1, position: 'relative' }}   ← 消息 + 底部叠加容器
    ScrollView
    底部区域 (absolute)
```

---

## 2. ChatInput 文本输入框

### 组件层级

```
container (paddingHorizontal: 16, paddingBottom: 8)
  └── inner (maxWidth: 808, width: 100%, alignSelf: center)
       ├── box (bgSecondary, borderRadius: 20, border: 1px, shadow)
       │    ├── [展开态] inputArea + funcBar
       │    └── [折叠态] collapsedRow
       └── hint (提示文字)
```

### 两种状态

```
折叠态 (Collapsed):
+----------------------------------------------+
|  回复...                              [ ← ]  |
+----------------------------------------------+

展开态 (Expanded):
+----------------------------------------------+
|  [可编辑文本区域]                              |
|  自动增长，最多5行，超出滚动                     |
+----------------------------------------------+
|                                      [ ↑ ]   |
+----------------------------------------------+
```

### Props 接口

```typescript
interface ChatInputProps {
  value?: string;            // 受控值 (外部状态)
  onChangeText?: (text: string) => void;
  onSend?: () => void;
  expanded?: boolean;        // 展开/折叠状态 (默认 false)
  onExpand?: () => void;     // 展开回调
  placeholder?: string;      // 默认 '回复...'
  disabled?: boolean;        // 默认 false
}
```

### 状态切换

| 动作 | 结果 |
|------|------|
| 点击折叠态任意区域 / 点击 [←] | 调用 onExpand，展开后 TextInput autoFocus |
| 点击 [↑] (有内容时) 或按 Enter | 调用 onSend，父组件负责折叠 |
| Shift + Enter (Web) | 换行（不发送） |
| 发送消息后 | 父组件调用 animatedSetInputExpanded(false) |
| 新建会话 | 父组件调用 animatedSetInputExpanded(false) |

### 展开/折叠动画 (在 chat.tsx 中实现)

```
动画类型: Fade + TranslateY (Animated API, useNativeDriver: true)
折叠过程: opacity 1→0 (60ms, Easing.in(ease)) → setInputExpanded → opacity 0→1 (100ms, Easing.out(ease))
位移: translateY 6px → 0px (跟随 fadeAnim interpolate)
```

### 尺寸规格

| 参数 | 值 | 代码来源 |
|------|----|---------|
| maxWidth | contentMaxWidth + 40 = **808px** | `layout.contentMaxWidth + 40` |
| borderRadius | 20px | 内联样式 |
| borderWidth | 1px | 内联样式 |
| 折叠态 minHeight | 46px | `styles.collapsedRow` |
| 折叠态 paddingLeft | 16px | `styles.collapsedRow` |
| 折叠态 paddingRight | 8px | `styles.collapsedRow` |
| 折叠态 paddingVertical | 8px | `styles.collapsedRow` |
| 展开态 inputArea paddingTop | 14px | `styles.inputArea` |
| 展开态 inputArea paddingBottom | 8px | `styles.inputArea` |
| 展开态 inputArea paddingHorizontal | spacing.lg = 16px | 内联样式 |
| funcBar paddingTop | 6px | `styles.funcBar` |
| funcBar paddingBottom | 10px | `styles.funcBar` |
| funcBar paddingHorizontal | spacing.sm = 8px | 内联样式 |
| 外层 paddingHorizontal | spacing.lg = 16px | 内联样式 |
| 外层 paddingBottom | spacing.sm = 8px | 内联样式 |

### TextInput 自动增长

| 参数 | 值 | 代码常量 |
|------|----|---------|
| lineHeight | 22px | `LINE_HEIGHT = 22` |
| 最大行数 | 5 | `MAX_LINES = 5` |
| 最大高度 | 5 × 22 = **110px** | `MAX_INPUT_HEIGHT = MAX_LINES * LINE_HEIGHT` |
| 超出行为 | 显示滚动条 (overflowY: auto) | adjustHeight() |
| 初始高度 | 22px (单行) | `useState(LINE_HEIGHT)` |
| numberOfLines | 1 | Web 上映射为 `rows="1"` |

**Web 实现方式** (`adjustHeight` callback)：
```
1. 获取 DOM textarea 元素: node._node ?? node.getHostNode() ?? node
2. el.style.height = '0px' (强制 scrollHeight 重新计算)
3. 读取 scrollHeight
4. height = min(scrollHeight, MAX_INPUT_HEIGHT)
5. el.style.overflowY = scrollHeight > MAX ? 'auto' : 'hidden'
6. setInputHeight(newHeight)
触发: useEffect 监听 [inputValue, expanded, adjustHeight] → requestAnimationFrame(adjustHeight)
```

**iOS / Android 实现方式**：使用 `onContentSizeChange` 回调获取内容高度

### 颜色与样式

| 元素 | Dark | Light | 代码 token |
|------|------|-------|-----------|
| 背景 | #262626 | #F5F3F0 | colors.bgSecondary |
| 边框(默认) | #3D3D3D | #D6D3D1 | colors.inputBorder |
| 边框(聚焦) | #4D4D4D | #C4C4C4 | colors.inputFocusBorder |
| 文字 | #EAE6DF | #1C1917 | colors.textPrimary |
| placeholder | #6B6560 | #A8A29E | colors.textMuted |
| fontSize | 16px | 16px | typography.bodyLarge.fontSize |
| 阴影 (Web) | `0 2px 12px rgba(0,0,0,0.15)` | 同左 | boxShadow 内联 |
| 阴影 (Native) | shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 | 同左 | styles.box |

### 发送按钮 (展开态右下角)

| 状态 | 背景 | 图标颜色 | 代码 |
|------|------|---------|------|
| 禁用(空输入) | bgTertiary | textMuted | `canSend = false` |
| 可发送 | accent | #FFFFFF | `canSend = true` |
| 可发送+hover | accentHover | #FFFFFF | `state.hovered` |

| 属性 | 值 |
|------|----|
| 尺寸 | 30 × 30px (`styles.iconBtn`) |
| borderRadius | borderRadius.full = 9999px |
| 图标 | ArrowUp, size=16, strokeWidth=2.5 |

### 折叠态箭头 (右侧)

| 属性 | 值 |
|------|----|
| 图标 | ArrowLeft, size=16, strokeWidth=2.5 |
| 颜色 | textMuted |
| hover 背景 | bgTertiary |
| 默认背景 | transparent |
| 尺寸 | 30 × 30px (`styles.iconBtn`) |

### 提示文字 (Hint)

| 属性 | 值 | 代码 |
|------|----|------|
| 文案 | "GenNovel 可能会出错，请核实重要信息" | |
| fontSize | 12px | `styles.hint` |
| color | textMuted | 内联样式 |
| textAlign | center | `styles.hint` |
| marginTop | spacing.sm = 8px | 内联样式 |

---

## 3. QuickReplies 快捷回复选择框

### 结构

```
+----------------------------------------------+
|  ┃ 帮我写一个故事大纲                          |
+----------------------------------------------+
|  ┃ 继续写下去                                  |
+----------------------------------------------+
|  ┃ 换一种风格重写                              |
+----------------------------------------------+
```

每个条目左侧有一条 accent 色竖线 (2px) 作为视觉标识。

### Props 接口

```typescript
interface QuickReplyItem {
  id: number;
  content: string;
}

interface QuickRepliesProps {
  items: QuickReplyItem[];
  onSelect: (content: string) => void;
}
```

### 尺寸规格

| 参数 | 值 | 代码 |
|------|----|------|
| maxWidth | **808px** | 内联样式 |
| width | 100% | 内联样式 |
| alignSelf | center | 内联样式 |
| paddingHorizontal | spacing.md = 12px | 内联样式 |
| paddingBottom | spacing.xs = 4px | 内联样式 |
| 条目间距 (gap) | spacing.xs = 4px | 内联样式 |
| 条目 paddingVertical | spacing.sm = 8px | 内联样式 |
| 条目 paddingHorizontal | spacing.md = 12px | 内联样式 |
| 条目 borderRadius | borderRadius.md = 8px | 内联样式 |
| 条目 borderWidth | 1px | 内联样式 |
| 左侧竖线 width | 2px | 内联样式 |
| 左侧竖线 borderRadius | 1px | 内联样式 |
| 左侧竖线 marginRight | spacing.sm = 8px | 内联样式 |
| 文字 numberOfLines | 1 (溢出截断) | |

### 颜色与样式

| 元素 | Dark | Light | 代码 token |
|------|------|-------|-----------|
| 条目背景(默认) | #262626 | #F5F3F0 | colors.bgSecondary |
| 条目背景(hover/press) | #2A2A2A | #E8E6E3 | colors.bgTertiary |
| 条目边框(默认) | #333333 | #E7E5E4 | colors.border |
| 条目边框(hover/press) | #4D4D4D | #C4C4C4 | colors.inputFocusBorder |
| 左侧竖线 | #D4836A | #C4704F | colors.accent |
| 文字(默认) | #A8A29E | #57534E | colors.textSecondary |
| 文字(hover/press) | #EAE6DF | #1C1917 | colors.textPrimary |
| 文字 fontSize | 14px | 14px | typography.auxiliary.fontSize |

### 交互

- 点击条目：调用 `onSelect(item.content)`，父组件清空列表并发送
- Hover/Press: 背景变深 (bgTertiary) + 边框加深 (inputFocusBorder) + 文字变亮 (textPrimary)
- 状态跟踪: `pressedId` state，`onPressIn/onPressOut/onHoverIn/onHoverOut` 控制
- 数据来源: API `getQuickReplies()`，初始加载 + AI 回复后刷新
- items 为空时组件不渲染 (return null)

---

## 4. 消息气泡 (MessageBubble)

用户消息和 AI 消息使用**相同的透明背景** (`backgroundColor: 'transparent'`)，不做交替色区分。

---

## 5. 滚动条主题 (Web)

### 实现方式

1. **ThemeContext** 在主题切换时同步 class 到 `<html>` 元素：
   ```typescript
   // ThemeContext.tsx
   useEffect(() => {
     if (Platform.OS === 'web' && typeof document !== 'undefined') {
       document.documentElement.classList.remove('dark', 'light');
       document.documentElement.classList.add(currentMode);
     }
   }, [currentMode]);
   ```

2. **global.css** 使用 `.light` 选择器覆盖滚动条颜色：

| 属性 | Dark (默认) | Light (.light) | 代码 token |
|------|------------|----------------|-----------|
| scrollbar width | 8px | 8px | global.css |
| thumb | #4A4A4A | #C4C4C4 | colors.scrollbarThumb |
| thumb:hover | #5A5A5A | #A0A0A0 | colors.scrollbarHover |
| track | transparent | transparent | |

---

## 6. 主题 Token 速查

### 间距 (spacing)

| Token | 值 |
|-------|----|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| 2xl | 32px |
| 3xl | 48px |

### 圆角 (borderRadius)

| Token | 值 |
|-------|----|
| sm | 4px |
| md | 8px |
| lg | 12px |
| xl | 16px |
| full | 9999px |

### 布局 (layout)

| Token | 值 |
|-------|----|
| contentMaxWidth | 768px |
| headerHeight | 48px |
| sidebarWidth | 260px |

### 字体 (typography)

| Token | fontSize | fontWeight | lineHeight (计算值) |
|-------|----------|------------|-------------------|
| pageTitle | 24px | 600 (semibold) | 31.2px (×1.3) |
| sectionTitle | 18px | 600 (semibold) | 25.2px (×1.4) |
| bodyLarge | 16px | 400 (normal) | 25.6px (×1.6) |
| body | 15px | 400 (normal) | 27px (×1.8) |
| auxiliary | 14px | 400 (normal) | 21px (×1.5) |
| small | 12px | 500 (medium) | 16.8px (×1.4) |

---

## 7. 跨平台移植注意事项

### iOS

| 问题 | 方案 |
|------|------|
| 键盘弹出遮挡输入框 | 使用 `KeyboardAvoidingView` (behavior="padding") |
| 安全区域 | 底部区域需考虑 SafeAreaView 的 bottom inset |
| TextInput 自动增长 | 使用 `onContentSizeChange` 获取内容高度 |
| 阴影 | 使用 `shadowColor/shadowOffset/shadowOpacity/shadowRadius` |
| 滚轮问题不存在 | iOS 上 ScrollView 和底部区域的触摸事件天然分离 |
| 滚动条避让 | 不需要，iOS 使用 overlay 滚动条 |

### Android

| 问题 | 方案 |
|------|------|
| 键盘弹出 | `android:windowSoftInputMode="adjustResize"` |
| TextInput 自动增长 | 使用 `onContentSizeChange` |
| 阴影 | 使用 `elevation` 属性 |
| 返回键 | 展开态按返回键应折叠输入框而非退出页面 |
| 滚动条避让 | 不需要，Android 使用 overlay 滚动条 |

### Web (当前实现)

| 问题 | 方案 |
|------|------|
| textarea 不自动增长 | 直接操作 DOM: scrollHeight 测量 (`adjustHeight`) |
| 底部区域拦截滚轮 | absolute 定位叠加，ScrollView 保持全高 |
| 滚动条被底部背景遮挡 | 测量 scrollbarWidth，底部容器 `right: scrollbarWidth` |
| 滚动条主题跟随 | ThemeContext 同步 class 到 `<html>`, global.css `.light` 选择器 |
| Enter 发送 | `onKeyPress` 拦截 Enter，Shift+Enter 换行 |
| textarea resize 手柄 | CSS `resize: 'none'` |
| focus outline | CSS `outlineStyle: 'none'` |

---

## 8. 文件索引

| 文件 | 说明 |
|------|------|
| `frontend/app/chat.tsx` | 聊天页面（布局、状态、动画、底部区域定位） |
| `frontend/src/components/chat/ChatInput.tsx` | 文本输入框组件（折叠/展开、自动增长） |
| `frontend/src/components/chat/QuickReplies.tsx` | 快捷回复选择框组件 |
| `frontend/src/components/chat/MessageBubble.tsx` | 消息气泡组件 |
| `frontend/src/theme/ThemeContext.tsx` | 主题上下文（含 Web 端 class 同步到 `<html>`） |
| `frontend/src/theme/colors.ts` | 颜色 Token (darkColors / lightColors) |
| `frontend/src/theme/spacing.ts` | 间距、圆角、布局 Token |
| `frontend/src/theme/typography.ts` | 字体 Token |
| `frontend/global.css` | 全局 CSS（滚动条主题样式） |
