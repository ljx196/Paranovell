import { useEffect } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import FilterBar from '../components/shared/FilterBar';
import StatusBadge from '../components/shared/StatusBadge';
import { useAdminStore } from '../store/useAdminStore';
import { formatDateTime, formatYuan, ORDER_STATUS_MAP } from '../utils/format';
import type { FilterItem } from '../components/shared/FilterBar';
import type { OrderListItem } from '../types/admin';

const filterItems: FilterItem[] = [
  {
    type: 'select',
    key: 'status',
    placeholder: '全部状态',
    options: [
      { label: '全部', value: '' },
      { label: '待支付', value: 0 },
      { label: '已支付', value: 1 },
      { label: '已取消', value: 2 },
      { label: '已退款', value: 3 },
    ],
  },
  {
    type: 'select',
    key: 'payment_method',
    placeholder: '支付方式',
    options: [
      { label: '全部', value: '' },
      { label: '支付宝', value: 'alipay' },
      { label: '微信', value: 'wechat' },
    ],
  },
  { type: 'dateRange', key: 'dateRange', placeholder: '创建时间' },
  { type: 'input', key: 'user_email', placeholder: '用户邮箱', width: 200 },
];

export default function Orders() {
  const {
    orders, orderTotal, orderParams, orderSummary,
    isOrdersLoading, fetchOrders, fetchOrderSummary,
  } = useAdminStore();

  useEffect(() => {
    fetchOrders();
    fetchOrderSummary();
  }, [fetchOrders, fetchOrderSummary]);

  const columns: ColumnsType<OrderListItem> = [
    { title: '订单号', dataIndex: 'order_no', width: 180, ellipsis: true },
    { title: '用户', dataIndex: 'user_email', width: 180, ellipsis: true },
    {
      title: '金额(¥)',
      dataIndex: 'amount',
      width: 100,
      render: (v: number) => formatYuan(v),
    },
    {
      title: '点数',
      dataIndex: 'points',
      width: 100,
      render: (v: number) => v.toLocaleString(),
    },
    { title: '支付方式', dataIndex: 'payment_method', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) => {
        const map = ORDER_STATUS_MAP[v];
        return map ? <StatusBadge text={map.text} variant={map.variant as 'success' | 'error' | 'warning' | 'info'} /> : '-';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 120,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '支付时间',
      dataIndex: 'paid_at',
      width: 120,
      render: (v: string) => (v ? formatDateTime(v) : '-'),
    },
  ];

  const summary = orderSummary;

  return (
    <>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>订单管理</div>
      <FilterBar items={filterItems} onSearch={(v) => fetchOrders(v as Record<string, unknown>)} />

      {/* Summary Bar */}
      {summary && (
        <div
          style={{
            display: 'flex',
            gap: 24,
            padding: '12px 16px',
            background: '#fff',
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13,
            color: '#666',
          }}
        >
          <span>总计 <strong>{summary.total_count?.toLocaleString()}</strong> 单</span>
          <span>已支付 <strong style={{ color: '#52c41a' }}>{formatYuan(summary.paid_amount ?? 0)}</strong></span>
          <span>待支付 <strong style={{ color: '#faad14' }}>{formatYuan(summary.pending_amount ?? 0)}</strong></span>
          <span>已取消 <strong style={{ color: '#ff4d4f' }}>{formatYuan(summary.cancelled_amount ?? 0)}</strong></span>
          <span>已退款 <strong style={{ color: '#1677ff' }}>{formatYuan(summary.refunded_amount ?? 0)}</strong></span>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          size="middle"
          loading={isOrdersLoading}
          pagination={{
            current: orderParams.page,
            pageSize: orderParams.page_size,
            total: orderTotal,
            showTotal: (total) => `共 ${total.toLocaleString()} 条`,
            onChange: (page, pageSize) => fetchOrders({ page, page_size: pageSize }),
          }}
        />
      </div>
    </>
  );
}
