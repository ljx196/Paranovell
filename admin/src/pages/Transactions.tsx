import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import FilterBar from '../components/shared/FilterBar';
import StatusBadge from '../components/shared/StatusBadge';
import { useAdminStore } from '../store/useAdminStore';
import { formatDateTime, formatPoints, TRANSACTION_TYPE_MAP } from '../utils/format';
import type { FilterItem } from '../components/shared/FilterBar';
import type { TransactionListItem } from '../types/admin';

const filterItems: FilterItem[] = [
  {
    type: 'select',
    key: 'type',
    placeholder: '全部类型',
    options: [
      { label: '全部', value: '' },
      { label: '充值', value: 'recharge' },
      { label: '消费', value: 'consumption' },
      { label: '赠送', value: 'gift' },
      { label: '邀请奖励', value: 'referral' },
      { label: '退款', value: 'refund' },
    ],
  },
  { type: 'dateRange', key: 'dateRange', placeholder: '交易时间' },
  { type: 'input', key: 'user_email', placeholder: '用户邮箱', width: 200 },
];

export default function Transactions() {
  const [searchParams] = useSearchParams();
  const {
    transactions, transactionTotal, transactionParams,
    isTransactionsLoading, fetchTransactions,
  } = useAdminStore();

  useEffect(() => {
    const email = searchParams.get('user_email');
    fetchTransactions(email ? { user_email: email } : {});
  }, [fetchTransactions, searchParams]);

  const columns: ColumnsType<TransactionListItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户', dataIndex: 'user_email', width: 180, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (v: string) => {
        const map = TRANSACTION_TYPE_MAP[v];
        return map ? <StatusBadge text={map.text} variant={map.variant as 'success' | 'error' | 'warning' | 'info' | 'purple'} /> : v;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      render: (v: number, record) => {
        const map = TRANSACTION_TYPE_MAP[record.type];
        return (
          <span style={{ color: map?.color || '#333', fontWeight: 500 }}>
            {formatPoints(v)}
          </span>
        );
      },
    },
    {
      title: '余额(后)',
      dataIndex: 'balance_after',
      width: 100,
      render: (v: number) => (v ?? 0).toLocaleString(),
    },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '时间',
      dataIndex: 'created_at',
      width: 140,
      render: (v: string) => formatDateTime(v),
    },
  ];

  return (
    <>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>交易流水</div>
      <FilterBar items={filterItems} onSearch={(v) => fetchTransactions(v as Record<string, unknown>)} />
      <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          size="middle"
          loading={isTransactionsLoading}
          pagination={{
            current: transactionParams.page,
            pageSize: transactionParams.page_size,
            total: transactionTotal,
            showTotal: (total) => `共 ${total.toLocaleString()} 条`,
            onChange: (page, pageSize) => fetchTransactions({ page, page_size: pageSize }),
          }}
        />
      </div>
    </>
  );
}
