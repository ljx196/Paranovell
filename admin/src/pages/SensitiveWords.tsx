import { useEffect, useState } from 'react';
import { Table, Card, Button, Switch, message, Row, Col, Statistic, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAdminStore } from '../store/useAdminStore';
import FilterBar from '../components/shared/FilterBar';
import AddSensitiveWordModal from '../components/modals/AddSensitiveWordModal';
import { formatFullDateTime, SENSITIVE_CATEGORY_MAP } from '../utils/format';
import type { SensitiveWordItem, SensitiveCategory } from '../types/admin';

export default function SensitiveWords() {
  const {
    sensitiveWords, sensitiveWordTotal, sensitiveWordParams,
    isSensitiveWordsLoading, fetchSensitiveWords,
    updateSensitiveWord, deleteSensitiveWord,
  } = useAdminStore();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<SensitiveWordItem | null>(null);

  useEffect(() => {
    fetchSensitiveWords();
  }, [fetchSensitiveWords]);

  // Category counts
  const categoryCounts: Record<string, number> = {};
  let totalCount = sensitiveWordTotal;
  sensitiveWords.forEach((w) => {
    categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
  });

  const handleSearch = (values: Record<string, unknown>) => {
    fetchSensitiveWords({ ...values, page: 1 } as Record<string, unknown>);
  };

  const handleToggleEnabled = async (record: SensitiveWordItem) => {
    try {
      await updateSensitiveWord(record.id, { is_enabled: !record.is_enabled });
      message.success(record.is_enabled ? '已禁用' : '已启用');
      fetchSensitiveWords();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = (record: SensitiveWordItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除敏感词"${record.word}"吗？`,
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteSensitiveWord(record.id);
          message.success('删除成功');
          fetchSensitiveWords();
        } catch (err: unknown) {
          message.error(err instanceof Error ? err.message : '删除失败');
        }
      },
    });
  };

  const columns: ColumnsType<SensitiveWordItem> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '敏感词', dataIndex: 'word', width: 200 },
    { title: '类别', dataIndex: 'category', width: 100, align: 'center',
      render: (category: SensitiveCategory) => {
        const info = SENSITIVE_CATEGORY_MAP[category];
        return (
          <span style={{
            padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 500,
            background: info?.color + '15', color: info?.color, border: `1px solid ${info?.color}30`,
          }}>
            {info?.text || category}
          </span>
        );
      },
    },
    { title: '状态', dataIndex: 'is_enabled', width: 80, align: 'center',
      render: (enabled: boolean, record) => (
        <Switch size="small" checked={enabled} onChange={() => handleToggleEnabled(record)} />
      ),
    },
    { title: '创建人', dataIndex: 'creator_email', width: 180, ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', width: 170, render: formatFullDateTime },
    { title: '操作', width: 120, fixed: 'right', align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditingWord(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </div>
      ),
    },
  ];

  const filterItems = [
    {
      type: 'select' as const, key: 'category', placeholder: '类别',
      options: Object.entries(SENSITIVE_CATEGORY_MAP).map(([value, info]) => ({ value, label: info.text })),
    },
    {
      type: 'select' as const, key: 'is_enabled', placeholder: '状态',
      options: [{ value: 'true', label: '启用' }, { value: 'false', label: '禁用' }],
    },
    { type: 'input' as const, key: 'keyword', placeholder: '搜索关键词', width: 180 },
  ];

  return (
    <div>
      {/* Stats row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {Object.entries(SENSITIVE_CATEGORY_MAP).map(([key, info]) => (
          <Col flex="1" key={key}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title={info.text}
                value={categoryCounts[key] || 0}
                valueStyle={{ color: info.color, fontWeight: 600 }}
              />
            </Card>
          </Col>
        ))}
        <Col flex="1">
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic title="总计" value={totalCount} valueStyle={{ fontWeight: 600 }} />
          </Card>
        </Col>
      </Row>

      {/* Filter + Add button */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <FilterBar items={filterItems} onSearch={handleSearch} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            添加敏感词
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: 8 }}>
        <Table
          dataSource={sensitiveWords}
          columns={columns}
          rowKey="id"
          loading={isSensitiveWordsLoading}
          scroll={{ x: 900 }}
          pagination={{
            current: sensitiveWordParams.page,
            pageSize: sensitiveWordParams.page_size,
            total: sensitiveWordTotal,
            showTotal: (t) => `共 ${t.toLocaleString()} 条`,
            onChange: (page, pageSize) => fetchSensitiveWords({ page, page_size: pageSize }),
          }}
        />
      </Card>

      {/* Add Modal */}
      <AddSensitiveWordModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => { setAddModalOpen(false); fetchSensitiveWords(); }}
      />

      {/* Edit Modal */}
      {editingWord && (
        <EditSensitiveWordModal
          open={!!editingWord}
          word={editingWord}
          onClose={() => setEditingWord(null)}
          onSuccess={() => { setEditingWord(null); fetchSensitiveWords(); }}
        />
      )}
    </div>
  );
}

// Inline Edit Modal
function EditSensitiveWordModal({ open, word, onClose, onSuccess }: {
  open: boolean;
  word: SensitiveWordItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { updateSensitiveWord } = useAdminStore();
  const [form] = Modal.useModal ? [] : [];
  const [loading, setLoading] = useState(false);
  const [editWord, setEditWord] = useState(word.word);
  const [editCategory, setEditCategory] = useState(word.category);

  const handleOk = async () => {
    setLoading(true);
    try {
      const updates: Record<string, unknown> = {};
      if (editWord !== word.word) updates.word = editWord;
      if (editCategory !== word.category) updates.category = editCategory;
      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }
      await updateSensitiveWord(word.id, updates as { word?: string; category?: SensitiveCategory });
      message.success('修改成功');
      onSuccess();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="编辑敏感词" open={open} onCancel={onClose} onOk={handleOk} confirmLoading={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
        <div>
          <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>敏感词</div>
          <input
            value={editWord}
            onChange={(e) => setEditWord(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          />
        </div>
        <div>
          <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>类别</div>
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            {Object.entries(SENSITIVE_CATEGORY_MAP).map(([value, info]) => (
              <option key={value} value={value}>{info.text}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
