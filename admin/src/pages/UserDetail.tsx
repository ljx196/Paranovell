import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Table, Spin, Space, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import StatusBadge from '../components/shared/StatusBadge';
import AdjustBalanceModal from '../components/modals/AdjustBalanceModal';
import BanUserModal from '../components/modals/BanUserModal';
import { useAdminStore } from '../store/useAdminStore';
import {
  formatFullDateTime,
  formatDateTime,
  formatPoints,
  USER_STATUS_MAP,
  TRANSACTION_TYPE_MAP,
} from '../utils/format';
import type { UserTransaction } from '../types/admin';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetail, isUserDetailLoading, fetchUserDetail, resetPassword } = useAdminStore();

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);

  const userId = Number(id);

  useEffect(() => {
    if (userId) fetchUserDetail(userId);
  }, [userId, fetchUserDetail]);

  const refresh = () => fetchUserDetail(userId);

  const handleResetPassword = () => {
    Modal.confirm({
      title: '确认重置密码',
      content: `将为用户 ${userDetail?.email} 生成随机密码并通过邮件发送。用户的当前密码将立即失效。`,
      okText: '确认重置',
      cancelText: '取消',
      onOk: async () => {
        try {
          await resetPassword(userId);
          message.success('密码已重置，新密码已发送至用户邮箱');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '重置失败';
          message.error(msg);
        }
      },
    });
  };

  const txColumns: ColumnsType<UserTransaction> = [
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
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '时间',
      dataIndex: 'created_at',
      width: 120,
      render: (v: string) => formatDateTime(v),
    },
  ];

  const detail = userDetail;
  const statusMap = detail ? USER_STATUS_MAP[detail.status] : null;

  return (
    <Spin spinning={isUserDetailLoading}>
      {/* Back Link */}
      <div
        style={{ color: '#1677ff', cursor: 'pointer', marginBottom: 20, fontSize: 13 }}
        onClick={() => navigate('/admin/users')}
      >
        ← 返回用户列表
      </div>

      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
        用户详情 #{userId}
      </div>

      {detail && (
        <>
          {/* Basic Info */}
          <Card style={{ marginBottom: 16, borderRadius: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
              基本信息
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#999', minWidth: 80, fontSize: 13 }}>邮箱</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{detail.email}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#999', minWidth: 80, fontSize: 13 }}>状态</span>
                {statusMap && <StatusBadge text={statusMap.text} variant={statusMap.variant as 'success' | 'error'} />}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#999', minWidth: 80, fontSize: 13 }}>昵称</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{detail.nickname || '-'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#999', minWidth: 80, fontSize: 13 }}>角色</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{detail.role}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#999', minWidth: 80, fontSize: 13 }}>邀请码</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{detail.invite_code || '-'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#999', minWidth: 80, fontSize: 13 }}>注册时间</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{formatFullDateTime(detail.created_at)}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#999', minWidth: 80, fontSize: 13 }}>邮箱验证</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{detail.email_verified ? '已验证' : '未验证'}</span>
              </div>
            </div>
          </Card>

          {/* Balance */}
          <Card style={{ marginBottom: 16, borderRadius: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
              账户余额
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1677ff' }}>
              {(detail.balance.balance ?? 0).toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400, color: '#999' }}>点</span>
            </div>
            <div style={{ display: 'flex', gap: 32, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#999' }}>累计充值</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{(detail.balance.total_recharged ?? 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#999' }}>累计消费</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{(detail.balance.total_consumed ?? 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#999' }}>累计赠送</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{(detail.balance.total_gifted ?? 0).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={() => setAdjustOpen(true)}>调账</Button>
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card style={{ marginBottom: 16, borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>最近交易</span>
              <Button type="link" size="small" onClick={() => navigate(`/admin/transactions?user_email=${detail.email}`)}>
                查看全部交易 →
              </Button>
            </div>
            <Table
              columns={txColumns}
              dataSource={detail.recent_transactions || []}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>

          {/* Actions */}
          <Card style={{ borderRadius: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
              操作
            </div>
            <Space>
              <Button onClick={handleResetPassword}>重置密码</Button>
              <Button
                danger={detail.status === 1}
                type={detail.status === 1 ? 'primary' : 'default'}
                onClick={() => setBanOpen(true)}
              >
                {detail.status === 1 ? '封禁用户' : '解封用户'}
              </Button>
            </Space>
          </Card>

          {/* Modals */}
          <AdjustBalanceModal
            open={adjustOpen}
            userId={userId}
            currentBalance={detail.balance.balance}
            onClose={() => setAdjustOpen(false)}
            onSuccess={() => { setAdjustOpen(false); refresh(); }}
          />
          <BanUserModal
            open={banOpen}
            userId={userId}
            userEmail={detail.email}
            currentStatus={detail.status}
            onClose={() => setBanOpen(false)}
            onSuccess={() => { setBanOpen(false); refresh(); }}
          />
        </>
      )}
    </Spin>
  );
}
