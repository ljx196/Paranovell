import { useEffect, useState } from 'react';
import { Table, Button, Modal, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import FilterBar from '../components/shared/FilterBar';
import StatusBadge from '../components/shared/StatusBadge';
import AnnounceModal from '../components/modals/AnnounceModal';
import { useAdminStore } from '../store/useAdminStore';
import { formatDateTime, MSG_TYPE_MAP } from '../utils/format';
import type { FilterItem } from '../components/shared/FilterBar';
import type { AnnouncementListItem } from '../types/admin';

const filterItems: FilterItem[] = [
  {
    type: 'select',
    key: 'msg_type',
    placeholder: '全部类型',
    options: [
      { label: '全部', value: '' },
      { label: '系统公告', value: 'notice' },
      { label: '账户通知', value: 'account' },
      { label: '用量提醒', value: 'usage' },
    ],
  },
  { type: 'dateRange', key: 'dateRange', placeholder: '发送时间' },
];

export default function Announcements() {
  const {
    announcements, announcementTotal, announcementParams,
    isAnnouncementsLoading, fetchAnnouncements, deleteAnnouncement,
  } = useAdminStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该公告吗？此操作不可撤回。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteAnnouncement(id);
          message.success('删除成功');
          fetchAnnouncements();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '删除失败';
          message.error(msg);
        }
      },
    });
  };

  const columns: ColumnsType<AnnouncementListItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '类型',
      dataIndex: 'msg_type',
      width: 100,
      render: (v: string) => {
        const map = MSG_TYPE_MAP[v];
        return map ? <StatusBadge text={map.text} variant={map.variant as 'info' | 'warning' | 'purple'} /> : v;
      },
    },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '发送对象',
      dataIndex: 'target',
      width: 100,
      render: (v: string) => (v === 'all' ? '全部用户' : '指定用户'),
    },
    {
      title: '触达人数',
      dataIndex: 'target_count',
      width: 100,
      render: (v: number) => (v ?? 0).toLocaleString(),
    },
    {
      title: '已读数',
      dataIndex: 'read_count',
      width: 80,
      render: (v: number) => (v ?? 0).toLocaleString(),
    },
    {
      title: '发送时间',
      dataIndex: 'created_at',
      width: 140,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Button danger size="small" onClick={() => handleDelete(record.id)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>公告管理</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          发送新公告
        </Button>
      </div>

      <FilterBar items={filterItems} onSearch={(v) => fetchAnnouncements(v as Record<string, unknown>)} />

      <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={announcements}
          rowKey="id"
          size="middle"
          loading={isAnnouncementsLoading}
          pagination={{
            current: announcementParams.page,
            pageSize: announcementParams.page_size,
            total: announcementTotal,
            showTotal: (total) => `共 ${total.toLocaleString()} 条`,
            onChange: (page, pageSize) => fetchAnnouncements({ page, page_size: pageSize }),
          }}
        />
      </div>

      <AnnounceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchAnnouncements(); }}
      />
    </>
  );
}
