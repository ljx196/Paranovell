import { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Checkbox, Statistic, Row, Col } from 'antd';
import { SearchOutlined, ScanOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAdminStore } from '../store/useAdminStore';
import FilterBar from '../components/shared/FilterBar';
import StatusBadge from '../components/shared/StatusBadge';
import ConversationDetailDrawer from '../components/modals/ConversationDetailDrawer';
import ScanModal from '../components/modals/ScanModal';
import { formatFullDateTime, REVIEW_STATUS_MAP, FLAG_TYPE_MAP } from '../utils/format';
import type { ConversationListItem, ReviewStatus } from '../types/admin';
import { adminColors } from '../styles/theme';

export default function ContentReview() {
  const {
    conversations, conversationTotal, conversationParams,
    isConversationsLoading, fetchConversations,
  } = useAdminStore();

  const [selectedConv, setSelectedConv] = useState<ConversationListItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [onlyFlagged, setOnlyFlagged] = useState(true);

  // Review status counts for stat cards
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, violated: 0, dismissed: 0 });

  useEffect(() => {
    fetchConversations({ only_flagged: onlyFlagged });
  }, [fetchConversations]); // eslint-disable-line

  useEffect(() => {
    // Count by status from loaded conversations
    const counts = { pending: 0, approved: 0, violated: 0, dismissed: 0 };
    conversations.forEach((c) => {
      if (c.review) {
        const s = c.review.status as keyof typeof counts;
        if (s in counts) counts[s]++;
      }
    });
    setStatusCounts(counts);
  }, [conversations]);

  const handleSearch = (values: Record<string, unknown>) => {
    fetchConversations({ ...values, only_flagged: onlyFlagged, page: 1 } as Record<string, unknown>);
  };

  const handleOnlyFlaggedChange = (checked: boolean) => {
    setOnlyFlagged(checked);
    fetchConversations({ only_flagged: checked, page: 1 });
  };

  const handleView = (record: ConversationListItem) => {
    setSelectedConv(record);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedConv(null);
  };

  const handleReviewComplete = () => {
    setDrawerOpen(false);
    setSelectedConv(null);
    fetchConversations();
  };

  const columns: ColumnsType<ConversationListItem> = [
    { title: 'ID', dataIndex: 'conversation_id', width: 80, ellipsis: true },
    { title: '对话标题', dataIndex: 'title', width: 200, ellipsis: true,
      render: (text) => text || '(无标题)',
    },
    { title: '用户', dataIndex: 'user_email', width: 180, ellipsis: true,
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13 }}>{r.user_email}</div>
          {r.user_nickname && <div style={{ fontSize: 11, color: '#999' }}>{r.user_nickname}</div>}
        </div>
      ),
    },
    { title: '消息数', dataIndex: 'message_count', width: 80, align: 'center' },
    { title: '标记', width: 100, align: 'center',
      render: (_, r) => {
        if (!r.review) return <span style={{ color: '#ccc' }}>--</span>;
        const flagInfo = FLAG_TYPE_MAP[r.review.flag_type];
        return flagInfo ? <StatusBadge text={flagInfo.text} variant={flagInfo.variant as 'warning' | 'error'} /> : '--';
      },
    },
    { title: '状态', width: 100, align: 'center',
      render: (_, r) => {
        if (!r.review) return <span style={{ color: '#ccc' }}>--</span>;
        const statusInfo = REVIEW_STATUS_MAP[r.review.status];
        return statusInfo ? <StatusBadge text={statusInfo.text} variant={statusInfo.variant as 'warning' | 'success' | 'error' | 'info'} /> : '--';
      },
    },
    { title: '标记时间', width: 160,
      render: (_, r) => r.review ? formatFullDateTime(r.review.created_at) : '--',
    },
    { title: '操作', width: 80, fixed: 'right', align: 'center',
      render: (_, r) => (
        <Button type="link" size="small" icon={<SearchOutlined />} onClick={() => handleView(r)}>
          查看
        </Button>
      ),
    },
  ];

  const filterItems = [
    { type: 'input' as const, key: 'user_email', placeholder: '用户邮箱', width: 200 },
    {
      type: 'select' as const, key: 'review_status', placeholder: '审查状态',
      options: [
        { value: 'pending', label: '待审查' },
        { value: 'approved', label: '已通过' },
        { value: 'violated', label: '已违规' },
        { value: 'dismissed', label: '已忽略' },
      ],
    },
    {
      type: 'select' as const, key: 'flag_type', placeholder: '标记类型',
      options: [
        { value: 'manual', label: '手动' },
        { value: 'auto', label: '自动' },
      ],
    },
    { type: 'dateRange' as const, key: 'dateRange' },
  ];

  return (
    <div>
      {/* Stat cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {(['pending', 'approved', 'violated', 'dismissed'] as ReviewStatus[]).map((status) => {
          const info = REVIEW_STATUS_MAP[status];
          return (
            <Col span={6} key={status}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title={info.text}
                  value={statusCounts[status]}
                  valueStyle={{ fontSize: 24, fontWeight: 600 }}
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Filter bar */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <FilterBar items={filterItems} onSearch={handleSearch} />
          <Checkbox checked={onlyFlagged} onChange={(e) => handleOnlyFlaggedChange(e.target.checked)}>
            仅已标记
          </Checkbox>
          <Button icon={<ScanOutlined />} onClick={() => setScanOpen(true)}>
            扫描最近对话
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: 8 }}>
        <Table
          dataSource={conversations}
          columns={columns}
          rowKey="conversation_id"
          loading={isConversationsLoading}
          scroll={{ x: 1000 }}
          pagination={{
            current: conversationParams.page,
            pageSize: conversationParams.page_size,
            total: conversationTotal,
            showTotal: (t) => `共 ${t.toLocaleString()} 条`,
            onChange: (page, pageSize) => fetchConversations({ page, page_size: pageSize }),
          }}
        />
      </Card>

      {/* Drawer */}
      <ConversationDetailDrawer
        open={drawerOpen}
        conversation={selectedConv}
        onClose={handleDrawerClose}
        onReviewComplete={handleReviewComplete}
      />

      {/* Scan Modal */}
      <ScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onComplete={() => {
          setScanOpen(false);
          fetchConversations();
        }}
      />
    </div>
  );
}
