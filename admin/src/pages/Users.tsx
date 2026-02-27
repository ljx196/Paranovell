import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import FilterBar from '../components/shared/FilterBar';
import StatusBadge from '../components/shared/StatusBadge';
import { useAdminStore } from '../store/useAdminStore';
import { formatDateTime, USER_STATUS_MAP } from '../utils/format';
import type { FilterItem } from '../components/shared/FilterBar';
import type { UserListItem } from '../types/admin';

const filterItems: FilterItem[] = [
  { type: 'input', key: 'keyword', placeholder: '搜索邮箱 / 昵称', width: 200 },
  {
    type: 'select',
    key: 'status',
    placeholder: '全部状态',
    options: [
      { label: '全部', value: '' },
      { label: '正常', value: 1 },
      { label: '封禁', value: 0 },
    ],
  },
  { type: 'dateRange', key: 'dateRange', placeholder: '注册时间' },
];

export default function Users() {
  const navigate = useNavigate();
  const { users, userTotal, userParams, isUsersLoading, fetchUsers } = useAdminStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns: ColumnsType<UserListItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '邮箱', dataIndex: 'email', ellipsis: true },
    { title: '昵称', dataIndex: 'nickname', ellipsis: true },
    {
      title: '余额(点)',
      dataIndex: 'balance',
      render: (v: number) => (v ?? 0).toLocaleString(),
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) => {
        const map = USER_STATUS_MAP[v];
        return map ? <StatusBadge text={map.text} variant={map.variant as 'success' | 'error'} /> : '-';
      },
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      width: 120,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => navigate(`/admin/users/${record.id}`)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>用户管理</div>
      <FilterBar items={filterItems} onSearch={(v) => fetchUsers(v as Record<string, unknown>)} />
      <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          size="middle"
          loading={isUsersLoading}
          pagination={{
            current: userParams.page,
            pageSize: userParams.page_size,
            total: userTotal,
            showTotal: (total) => `共 ${total.toLocaleString()} 条`,
            onChange: (page, pageSize) => fetchUsers({ page, page_size: pageSize }),
          }}
        />
      </div>
    </>
  );
}
