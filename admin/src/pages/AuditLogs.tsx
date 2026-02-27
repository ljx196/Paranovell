import { useEffect, useState } from 'react';
import { Table, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import FilterBar from '../components/shared/FilterBar';
import StatusBadge from '../components/shared/StatusBadge';
import LogDetailModal from '../components/modals/LogDetailModal';
import { useAdminStore } from '../store/useAdminStore';
import { formatDateTime, ACTION_LABELS, AUDIT_ACTION_BADGE } from '../utils/format';
import type { FilterItem } from '../components/shared/FilterBar';
import type { AuditLogListItem } from '../types/admin';

const filterItems: FilterItem[] = [
  {
    type: 'select',
    key: 'action',
    placeholder: '操作类型',
    options: [
      { label: '全部', value: '' },
      { label: '封禁用户', value: 'user.disable' },
      { label: '解封用户', value: 'user.enable' },
      { label: '手动调账', value: 'user.adjust_balance' },
      { label: '重置密码', value: 'user.reset_password' },
      { label: '群发公告', value: 'message.broadcast' },
      { label: '删除公告', value: 'message.delete' },
      { label: '修改配置', value: 'config.update' },
      { label: '订单退款', value: 'order.refund' },
    ],
  },
  { type: 'input', key: 'admin_name', placeholder: '操作人', width: 150 },
  { type: 'dateRange', key: 'dateRange', placeholder: '操作时间' },
];

export default function AuditLogs() {
  const {
    auditLogs, auditLogTotal, auditLogParams, auditLogDetail,
    isAuditLogsLoading, fetchAuditLogs, fetchAuditLogDetail,
  } = useAdminStore();
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleViewDetail = async (id: number) => {
    await fetchAuditLogDetail(id);
    setDetailOpen(true);
  };

  const columns: ColumnsType<AuditLogListItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '操作人', dataIndex: 'admin_name', width: 120 },
    {
      title: '操作类型',
      dataIndex: 'action',
      width: 120,
      render: (v: string) => {
        const badge = AUDIT_ACTION_BADGE[v];
        const label = ACTION_LABELS[v] || v;
        return badge ? <StatusBadge text={label} variant={badge as 'success' | 'error' | 'warning' | 'info' | 'purple'} /> : label;
      },
    },
    {
      title: '操作对象',
      dataIndex: 'target_type',
      width: 120,
      render: (v: string, record) => (v ? `${v} #${record.target_id}` : '-'),
    },
    { title: '摘要', dataIndex: 'summary', ellipsis: true },
    { title: 'IP', dataIndex: 'ip', width: 130 },
    {
      title: '时间',
      dataIndex: 'created_at',
      width: 140,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>操作日志</div>
      <FilterBar items={filterItems} onSearch={(v) => fetchAuditLogs(v as Record<string, unknown>)} />
      <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={auditLogs}
          rowKey="id"
          size="middle"
          loading={isAuditLogsLoading}
          pagination={{
            current: auditLogParams.page,
            pageSize: auditLogParams.page_size,
            total: auditLogTotal,
            showTotal: (total) => `共 ${total.toLocaleString()} 条`,
            onChange: (page, pageSize) => fetchAuditLogs({ page, page_size: pageSize }),
          }}
        />
      </div>

      <LogDetailModal
        open={detailOpen}
        log={auditLogDetail}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
