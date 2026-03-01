import { useState, useRef, useCallback, useEffect } from 'react';
import { View, ScrollView, Animated, Easing, NativeSyntheticEvent, NativeScrollEvent, Text, Platform, Pressable, StyleSheet } from 'react-native';
import { router, Redirect } from 'expo-router';
import { useTheme } from '../src/theme';
import { useResponsive } from '../src/hooks/useResponsive';
import { useAuthStore } from '../src/store/useAuthStore';
import { Header } from '../src/components/layout';
import {
  Sidebar,
  MessageBubble,
  ChatInput,
  TypingIndicator,
  LoadMoreIndicator,
  MessageImage,
  QuickReplies,
} from '../src/components/chat';
import { api } from '../src/services/api';
import { useChatStore } from '../src/store/useChatStore';
import { useBalanceStore } from '../src/store/useBalanceStore';
import { LowBalanceModal } from '../src/components/usage';

// Demo messages for when backend is not available
const demoMessages = [
  {
    id: 1,
    role: 'user' as const,
    content: '我想创作一个玄幻小说，主角是一个从现代穿越的程序员，你能帮我设计一下他的人物背景吗？',
    images: [
      {
        uri: 'https://picsum.photos/400/300',
        width: 400,
        height: 300,
      },
    ] as MessageImage[],
  },
  {
    id: 2,
    role: 'assistant' as const,
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
    role: 'user' as const,
    content: '太棒了！我很喜欢这个设定。能再帮我想想他的金手指是什么吗？',
  },
  {
    id: 4,
    role: 'assistant' as const,
    content: `好的！既然主角是程序员出身，金手指可以和编程概念结合。这里给你几个方向：

【方案一：代码之眼】
能看到万物的"底层代码"，包括功法的运行逻辑、丹药的配方结构。相当于拥有了修仙界的"调试器"，可以发现别人功法中的bug并加以利用。

【方案二：系统编译器】
可以将任何功法"反编译"成基础指令，然后重新"编译优化"。别人需要十年才能练成的功法，他用算法优化后三个月就能速成。

【方案三：多线程修炼】
意识可以分成多个"线程"同时运行，一边修炼一边炼丹一边推演功法。相当于别人单核CPU，他是多核并行处理。

【方案四：版本控制】
拥有类似Git的能力，可以给自己的修炼状态打"快照"。如果走火入魔可以回滚到之前的稳定版本。

你更喜欢哪个方向？我可以继续细化。`,
  },
];

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  images?: MessageImage[];
}

export default function ChatScreen() {
  const { colors, messagePadding: msgPad, typography, spacing } = useTheme();
  const { isMobile, isDesktop } = useResponsive();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { fetchBalance, setShowLowBalanceModal } = useBalanceStore();
  const {
    sidebarConversations: conversations,
    isLoadingConversations,
    loadConversations,
    setActiveConversation,
  } = useChatStore();

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [messages, setMessages] = useState<Message[]>(demoMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [quickReplies, setQuickReplies] = useState<{ id: number; content: string }[]>([]);
  const [bottomHeight, setBottomHeight] = useState(150);
  const bottomRef = useRef<View>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  const [inputExpanded, setInputExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animatedSetInputExpanded = useCallback((value: boolean) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 60,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setInputExpanded(value);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const scrollViewRef = useRef<ScrollView>(null);

  // Mark as mounted + measure scrollbar width on web
  useEffect(() => {
    setMounted(true);
    if (Platform.OS === 'web') {
      const scrollEl = (scrollViewRef.current as any)?._node ?? (scrollViewRef.current as any)?.getHostNode?.() ?? scrollViewRef.current;
      if (scrollEl && 'offsetWidth' in scrollEl) {
        setScrollbarWidth(scrollEl.offsetWidth - scrollEl.clientWidth);
      }
    }
  }, []);

  // Auth state logged for debugging
  useEffect(() => {
    if (!mounted) return;
    console.log('[Chat] Auth state:', { authLoading, isAuthenticated, hasUser: !!user });
  }, [mounted, authLoading, isAuthenticated]);

  // Load conversations and balance on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      fetchBalance();
    }
  }, [isAuthenticated]);

  // Load quick replies
  useEffect(() => {
    if (isAuthenticated) {
      api.getQuickReplies()
        .then((res) => setQuickReplies(res.items || []))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Measure bottom area height dynamically
  useEffect(() => {
    requestAnimationFrame(() => {
      if (Platform.OS === 'web' && bottomRef.current) {
        const el = (bottomRef.current as any)?._node ?? (bottomRef.current as any)?.getHostNode?.() ?? bottomRef.current;
        if (el && el.offsetHeight) {
          setBottomHeight(el.offsetHeight);
        }
      }
    });
  }, [quickReplies, inputExpanded]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      if (contentOffset.y < 50 && !isLoadingMore && hasMoreHistory) {
        loadMoreMessages();
      }
    },
    [isLoadingMore, hasMoreHistory]
  );

  const loadMoreMessages = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setIsLoadingMore(false);
      setHasMoreHistory(false);
    }, 1500);
  };

  const doSendMessage = async (text: string) => {
    // Check balance before sending
    try {
      const checkResult = await api.checkBalance();
      if (!checkResult.sufficient) {
        setShowLowBalanceModal(true, checkResult.balance);
        return;
      }
    } catch {
      // If check fails, allow sending (don't block on network issues)
    }

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    animatedSetInputExpanded(false);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Try to send to backend, fallback to demo response
    try {
      if (activeConversationId) {
        await api.sendMessage(activeConversationId, text);
        // In real implementation, we would receive AI response via WebSocket or polling
      }
    } catch (error) {
      // Backend not ready, use demo response
      console.log('Chat backend not available, using demo response');
    }

    // Simulate AI response (demo mode)
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: generateDemoResponse(text),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);

      // Reload quick replies after AI response
      api.getQuickReplies()
        .then((res) => setQuickReplies(res.items || []))
        .catch(() => {});

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500 + Math.random() * 1000);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue('');
    await doSendMessage(text);
  };

  const handleQuickReply = async (content: string) => {
    setQuickReplies([]);
    await doSendMessage(content);
  };

  const generateDemoResponse = (userInput: string): string => {
    const responses = [
      `这是一个很好的想法！让我来帮你分析一下...\n\n关于"${userInput.slice(0, 20)}..."，我认为可以从以下几个角度来考虑：\n\n1. 首先，我们需要确定核心主题\n2. 其次，考虑目标读者群体\n3. 最后，设计合适的叙事节奏\n\n你想要我详细展开哪一点？`,
      `感谢你的问题！关于这个话题，我有一些建议...\n\n在小说创作中，这类设定很常见但也很有挑战性。关键是要找到独特的切入点，让读者感到新鲜感。\n\n需要我帮你做更具体的设计吗？`,
      `很有创意的想法！\n\n我建议可以这样处理：\n\n• 保持逻辑自洽是首要任务\n• 设定不要太过复杂，以免读者难以理解\n• 在展开世界观的同时，不要忘记角色的情感发展\n\n你觉得这个方向如何？`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleNewChat = async () => {
    setMessages([]);
    setIsTyping(false);
    setHasMoreHistory(true);
    setActiveConversationId(null);
    setActiveConversation(null);
    animatedSetInputExpanded(false);
  };

  const handleSelectConversation = (id: number | string) => {
    setActiveConversation(id);

    if (typeof id === 'number') {
      setActiveConversationId(id);
      // In real implementation, load messages for this conversation
      // For now, keep demo messages
    } else {
      setActiveConversationId(null);
      setMessages(demoMessages);
    }
  };

  const activeConversation = conversations.find((c) => c.active);

  // Auth redirect (use component instead of useEffect to avoid navigation-before-mount)
  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/login" />;
  }
  if (authLoading || !isAuthenticated) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}
        accessibilityRole="progressbar"
        accessibilityLabel="加载中"
      >
        <Text style={{ color: colors.textSecondary }}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bgPrimary }}>
      <LowBalanceModal />
      {/* Sidebar */}
      {sidebarOpen && (
        <>
          {/* Mobile: overlay backdrop */}
          {isMobile && (
            <Pressable
              style={chatStyles.sidebarBackdrop}
              onPress={() => setSidebarOpen(false)}
              accessibilityLabel="关闭菜单"
            />
          )}
          <View style={isMobile ? chatStyles.sidebarMobile : undefined}>
            <Sidebar
              conversations={conversations}
              onNewChat={handleNewChat}
              onSelectConversation={(id) => {
                handleSelectConversation(id);
                if (isMobile) setSidebarOpen(false);
              }}
              onCollapse={() => setSidebarOpen(false)}
              onLogout={() => {
                useAuthStore.getState().logout();
                router.replace('/login');
              }}
              userName={user?.nickname || user?.email || '用户'}
              userPlan="免费版"
            />
          </View>
        </>
      )}

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {/* Header */}
        <Header
          title={activeConversation?.title || '新会话'}
          showMenuButton={isMobile ? !sidebarOpen : !sidebarOpen}
          onMenuPress={() => setSidebarOpen(true)}
        />

        {/* Messages + Bottom overlay container */}
        <View style={{ flex: 1, position: 'relative' }}>
          {/* ScrollView takes full height */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: bottomHeight }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <LoadMoreIndicator
              visible={isLoadingMore || !hasMoreHistory}
              loading={isLoadingMore}
              noMore={!hasMoreHistory}
            />

            {messages.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 }}>
                <Text style={{ color: colors.textMuted, fontSize: typography.bodyLarge.fontSize }}>
                  开始新的对话吧
                </Text>
              </View>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  images={msg.images}
                />
              ))
            )}

            {isTyping && (
              <View
                style={{
                  paddingVertical: msgPad.mobile.vertical,
                  paddingHorizontal: isMobile ? msgPad.mobile.horizontal : msgPad.desktop.horizontal,
                }}
              >
                <View style={{ maxWidth: 768, alignSelf: 'center', width: '100%' }}>
                  <TypingIndicator />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom area: absolute positioned over ScrollView */}
          <View
            ref={bottomRef}
            pointerEvents="box-none"
            onLayout={(e) => setBottomHeight(e.nativeEvent.layout.height)}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: scrollbarWidth,
              backgroundColor: colors.bgPrimary,
            }}
          >
            {/* Quick Replies */}
            <QuickReplies items={quickReplies} onSelect={handleQuickReply} />

            {/* Input */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                }],
              }}
            >
              <ChatInput
                value={inputValue}
                onChangeText={setInputValue}
                onSend={handleSend}
                expanded={inputExpanded}
                onExpand={() => animatedSetInputExpanded(true)}
              />
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const chatStyles = StyleSheet.create({
  sidebarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 9,
  },
  sidebarMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 10,
  },
});
