import { useEffect, useState, useMemo } from 'react';
import { Drawer, Spin, Radio, Input, Button, Space, message, Descriptions, Tag, Modal } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { useAdminStore } from '../../store/useAdminStore';
import StatusBadge from '../shared/StatusBadge';
import { REVIEW_STATUS_MAP, FLAG_TYPE_MAP, SENSITIVE_CATEGORY_MAP } from '../../utils/format';
import type { ConversationListItem, ReviewStatus, ReviewAction } from '../../types/admin';
import { adminColors } from '../../styles/theme';

interface Props {
  open: boolean;
  conversation: ConversationListItem | null;
  onClose: () => void;
  onReviewComplete: () => void;
}

export default function ConversationDetailDrawer({ open, conversation, onClose, onReviewComplete }: Props) {
  const {
    conversationMessages, conversationMessageTotal, isMessagesLoading,
    fetchConversationMessages, flagConversation, reviewConversation,
    sensitiveWords, fetchSensitiveWords,
  } = useAdminStore();

  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('approved');
  const [reviewAction, setReviewAction] = useState<ReviewAction>('none');
  const [reviewReason, setReviewReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load sensitive words for highlighting
  useEffect(() => {
    if (open && sensitiveWords.length === 0) {
      fetchSensitiveWords({ page: 1, page_size: 500 });
    }
  }, [open]); // eslint-disable-line

  // Load messages when conversation changes
  useEffect(() => {
    if (open && conversation) {
      fetchConversationMessages(conversation.conversation_id, conversation.user_id);
    }
  }, [open, conversation]); // eslint-disable-line

  // Collect enabled sensitive words for highlighting
  const enabledWords = useMemo(() => {
    return sensitiveWords.filter((w) => w.is_enabled).map((w) => w.word);
  }, [sensitiveWords]);

  // Highlight sensitive words in content
  const highlightContent = (content: string) => {
    if (enabledWords.length === 0) return content;

    const pattern = enabledWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = content.split(regex);

    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <span key={i} style={{ background: '#ff4d4f30', color: '#ff4d4f', fontWeight: 600, padding: '0 2px', borderRadius: 2 }}>{part}</span>;
      }
      return part;
    });
  };

  const handleSubmitReview = async () => {
    if (!conversation) return;

    // Confirm dangerous actions
    if (reviewStatus === 'violated' && reviewAction !== 'none') {
      const actionText = reviewAction === 'delete_conversation' ? '删除该对话' : '封禁该用户';
      Modal.confirm({
        title: '确认操作',
        content: `确定要${actionText}吗？此操作不可撤销。`,
        okText: '确认',
        okButtonProps: { danger: true },
        onOk: () => doSubmit(),
      });
      return;
    }

    await doSubmit();
  };

  const doSubmit = async () => {
    if (!conversation) return;
    setSubmitting(true);
    try {
      // Ensure there's a review record first
      if (!conversation.review) {
        await flagConversation(conversation.conversation_id, {
          user_id: conversation.user_id,
          reason: reviewReason || '管理员审查',
        });
      }

      await reviewConversation(conversation.conversation_id, {
        user_id: conversation.user_id,
        status: reviewStatus,
        action: reviewStatus === 'violated' ? reviewAction : 'none',
        reason: reviewReason,
      });
      message.success('审查完成');
      onReviewComplete();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '审查失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!conversation) return null;

  return (
    <Drawer
      title="对话详情"
      open={open}
      onClose={onClose}
      width={680}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header info */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="用户">{conversation.user_email}</Descriptions.Item>
          <Descriptions.Item label="模型">{conversation.model || '--'}</Descriptions.Item>
          <Descriptions.Item label="消息数">{conversation.message_count}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{conversation.created_at}</Descriptions.Item>
          <Descriptions.Item label="审查状态">
            {conversation.review ? (
              <StatusBadge
                text={REVIEW_STATUS_MAP[conversation.review.status]?.text || conversation.review.status}
                variant={REVIEW_STATUS_MAP[conversation.review.status]?.variant as 'warning' | 'success' | 'error' | 'info'}
              />
            ) : <Tag>未标记</Tag>}
          </Descriptions.Item>
          {conversation.review?.flag_reason && (
            <Descriptions.Item label="标记原因">
              <span style={{ color: '#ff4d4f', fontSize: 12 }}>{conversation.review.flag_reason}</span>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
        {isMessagesLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : conversationMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无消息</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {conversationMessages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex', gap: 10,
                flexDirection: msg.role === 'user' ? 'row' : 'row',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: msg.role === 'user' ? '#1677ff' : '#52c41a',
                  color: '#fff', fontSize: 14,
                }}>
                  {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>
                    {msg.role === 'user' ? '用户' : 'AI 助手'} · {msg.created_at}
                  </div>
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, fontSize: 13, lineHeight: 1.6,
                    background: msg.role === 'user' ? '#f6f8fa' : '#f0f7ff',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {highlightContent(msg.content)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review action area */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
        <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 14 }}>审查操作</div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>审查结果</div>
          <Radio.Group value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
            <Radio value="approved">通过</Radio>
            <Radio value="violated">违规</Radio>
            <Radio value="dismissed">忽略</Radio>
          </Radio.Group>
        </div>

        {reviewStatus === 'violated' && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>处理动作</div>
            <Radio.Group value={reviewAction} onChange={(e) => setReviewAction(e.target.value)}>
              <Radio value="none">仅标记</Radio>
              <Radio value="delete_conversation">删除对话</Radio>
              <Radio value="ban_user">封禁用户</Radio>
            </Radio.Group>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>备注</div>
          <Input.TextArea
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
            rows={2}
            placeholder="输入审查备注..."
            maxLength={500}
            showCount
          />
        </div>

        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmitReview}>
            提交审查
          </Button>
        </Space>
      </div>
    </Drawer>
  );
}
