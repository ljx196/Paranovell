import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

// 主题配置
const themes = {
  light: {
    bg: '#FAFAF9',
    bgSecondary: '#FFFFFF',
    bgTertiary: '#F5F5F4',
    sidebar: '#F5F5F4',
    sidebarHover: '#E7E5E4',
    textPrimary: '#1C1917',
    textSecondary: '#57534E',
    textMuted: '#A8A29E',
    accent: '#C4704F',
    accentLight: '#FDF4F0',
    border: '#E7E5E4',
    userMsg: '#F5F5F4',
    aiMsg: 'transparent',
    inputBg: '#FFFFFF',
    inputBorder: '#D6D3D1',
  },
  dark: {
    bg: '#1A1A1A',
    bgSecondary: '#262626',
    bgTertiary: '#2A2A2A',
    sidebar: '#1F1F1F',
    sidebarHover: '#2A2A2A',
    textPrimary: '#FAFAF9',
    textSecondary: '#A8A29E',
    textMuted: '#78716C',
    accent: '#D4836A',
    accentLight: '#2D2420',
    border: '#3D3D3D',
    userMsg: '#2A2A2A',
    aiMsg: 'transparent',
    inputBg: '#262626',
    inputBorder: '#3D3D3D',
  },
};

// 模拟会话列表
const conversations = [
  { id: 1, title: '小说角色设定讨论', time: '刚刚', active: true },
  { id: 2, title: '第三章剧情构思', time: '2小时前', active: false },
  { id: 3, title: '世界观设定', time: '昨天', active: false },
  { id: 4, title: '对话风格优化', time: '3天前', active: false },
];

// 模拟消息
const messages = [
  {
    id: 1,
    role: 'user',
    content: '我想创作一个玄幻小说，主角是一个从现代穿越的程序员，你能帮我设计一下他的人物背景吗？',
  },
  {
    id: 2,
    role: 'assistant',
    content: `这是一个很有趣的设定！一个程序员穿越到玄幻世界，可以产生很多有意思的冲突和故事。让我帮你设计这个角色：

【基础信息】
• 姓名：林逸（现代名）/ 凌尘（修仙名）
• 年龄：28岁穿越，修仙界重生为16岁少年
• 职业：前世是某大厂资深后端工程师

【性格特点】
• 理性思维：习惯用逻辑分析问题，对修仙界的"玄学"持怀疑态度
• 效率至上：试图用编程思维优化修炼方法
• 内敛沉稳：经历过996的毒打，心态成熟

【核心冲突】
他会发现修仙界的功法其实类似于"程序"，而灵气就像是"计算资源"...

需要我继续展开某个方面吗？`,
  },
  {
    id: 3,
    role: 'user',
    content: '太棒了！我很喜欢这个设定。能再帮我想想他的金手指是什么吗？',
  },
];

export default function DemoScreen() {
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const theme = isDark ? themes.dark : themes.light;

  // 侧边栏组件
  const Sidebar = () => (
    <View
      style={{
        width: isMobile ? '100%' : 280,
        backgroundColor: theme.sidebar,
        borderRightWidth: isMobile ? 0 : 1,
        borderRightColor: theme.border,
        height: '100%',
      }}
    >
      {/* Logo 区域 */}
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: theme.accent,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>G</Text>
          </View>
          <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '600' }}>
            GenNovel
          </Text>
        </View>
        {!isMobile && (
          <TouchableOpacity onPress={() => setSidebarOpen(false)}>
            <Text style={{ color: theme.textMuted, fontSize: 18 }}>‹</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 新建会话按钮 */}
      <View style={{ padding: 12 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border,
            borderStyle: 'dashed',
          }}
        >
          <Text style={{ color: theme.textSecondary, fontSize: 18 }}>+</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>新建会话</Text>
        </TouchableOpacity>
      </View>

      {/* 会话列表 */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 12 }}>
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 12,
            fontWeight: '500',
            marginBottom: 8,
            marginTop: 8,
            paddingLeft: 4,
          }}
        >
          最近会话
        </Text>
        {conversations.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 4,
              backgroundColor: conv.active ? theme.sidebarHover : 'transparent',
            }}
          >
            <Text
              style={{
                color: conv.active ? theme.textPrimary : theme.textSecondary,
                fontSize: 14,
                fontWeight: conv.active ? '500' : '400',
              }}
              numberOfLines={1}
            >
              {conv.title}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
              {conv.time}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 底部用户区域 */}
      <View
        style={{
          padding: 12,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}
      >
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 8,
            borderRadius: 8,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.accent,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '600' }}>U</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '500' }}>
              用户名
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>免费版</Text>
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 16 }}>⋯</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 消息组件
  const Message = ({ role, content }: { role: string; content: string }) => (
    <View
      style={{
        paddingVertical: 24,
        paddingHorizontal: isMobile ? 16 : 48,
        backgroundColor: role === 'user' ? theme.userMsg : theme.aiMsg,
      }}
    >
      <View
        style={{
          maxWidth: 768,
          width: '100%',
          alignSelf: 'center',
          flexDirection: 'row',
          gap: 16,
        }}
      >
        {/* 头像 */}
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: role === 'user' ? theme.textMuted : theme.accent,
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ color: role === 'user' ? theme.bg : '#FFF', fontSize: 12, fontWeight: 'bold' }}>
            {role === 'user' ? 'U' : 'G'}
          </Text>
        </View>
        {/* 内容 */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.textMuted,
              fontSize: 12,
              fontWeight: '500',
              marginBottom: 8,
            }}
          >
            {role === 'user' ? '你' : 'GenNovel AI'}
          </Text>
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 15,
              lineHeight: 24,
            }}
          >
            {content}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.bg }}>
      {/* 侧边栏 */}
      {sidebarOpen && !isMobile && <Sidebar />}

      {/* 主内容区 */}
      <View style={{ flex: 1 }}>
        {/* 顶部栏 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            backgroundColor: theme.bgSecondary,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {!sidebarOpen && (
              <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                <Text style={{ color: theme.textSecondary, fontSize: 20 }}>☰</Text>
              </TouchableOpacity>
            )}
            <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '500' }}>
              小说角色设定讨论
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* 主题切换 */}
            <TouchableOpacity
              onPress={() => setIsDark(!isDark)}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: theme.bgTertiary,
              }}
            >
              <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            {/* 更多选项 */}
            <TouchableOpacity>
              <Text style={{ color: theme.textSecondary, fontSize: 18 }}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 消息区域 */}
        <ScrollView style={{ flex: 1 }}>
          {messages.map((msg) => (
            <Message key={msg.id} role={msg.role} content={msg.content} />
          ))}

          {/* 正在输入指示器 */}
          <View
            style={{
              paddingVertical: 24,
              paddingHorizontal: isMobile ? 16 : 48,
            }}
          >
            <View
              style={{
                maxWidth: 768,
                width: '100%',
                alignSelf: 'center',
                flexDirection: 'row',
                gap: 16,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: theme.accent,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>G</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.accent,
                    opacity: 0.6,
                  }}
                />
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.accent,
                    opacity: 0.4,
                  }}
                />
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.accent,
                    opacity: 0.2,
                  }}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* 输入区域 */}
        <View
          style={{
            padding: 16,
            paddingBottom: 24,
            backgroundColor: theme.bg,
          }}
        >
          <View
            style={{
              maxWidth: 768,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                backgroundColor: theme.inputBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.inputBorder,
                paddingHorizontal: 16,
                paddingVertical: 12,
                gap: 12,
              }}
            >
              {/* 附件按钮 */}
              <TouchableOpacity style={{ paddingBottom: 2 }}>
                <Text style={{ color: theme.textMuted, fontSize: 20 }}>📎</Text>
              </TouchableOpacity>
              {/* 输入框 */}
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: theme.textPrimary,
                  maxHeight: 120,
                  lineHeight: 22,
                  outlineStyle: 'none',
                } as any}
                placeholder="输入你的创意想法..."
                placeholderTextColor={theme.textMuted}
                multiline
              />
              {/* 发送按钮 */}
              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: theme.accent,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 16 }}>↑</Text>
              </TouchableOpacity>
            </View>
            {/* 提示文字 */}
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 12,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              GenNovel 可能会出错，请核实重要信息
            </Text>
          </View>
        </View>
      </View>

      {/* 移动端侧边栏遮罩 */}
      {isMobile && sidebarOpen && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          activeOpacity={1}
          onPress={() => setSidebarOpen(false)}
        >
          <View style={{ width: 280, height: '100%' }}>
            <Sidebar />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
