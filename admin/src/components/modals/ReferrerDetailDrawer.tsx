import { useEffect } from 'react';
import { Drawer, Spin, Descriptions, Table, Card, Timeline, Tag } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAdminStore } from '../../store/useAdminStore';
import StatusBadge from '../shared/StatusBadge';
import { formatNumber, formatFullDateTime, USER_STATUS_MAP } from '../../utils/format';
import type { RefereeItem } from '../../types/admin';

interface Props {
  open: boolean;
  userId: number | null;
  onClose: () => void;
}

export default function ReferrerDetailDrawer({ open, userId, onClose }: Props) {
  const { referrerDetail, isReferrerDetailLoading, fetchReferrerDetail } = useAdminStore();

  useEffect(() => {
    if (open && userId) {
      fetchReferrerDetail(userId);
    }
  }, [open, userId]); // eslint-disable-line

  const refereeColumns: ColumnsType<RefereeItem> = [
    { title: '邮箱', dataIndex: 'email', width: 180, ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 80, align: 'center',
      render: (status: number) => {
        const info = USER_STATUS_MAP[status];
        return info ? <StatusBadge text={info.text} variant={info.variant as 'success' | 'error'} /> : '--';
      },
    },
    { title: '注册时间', dataIndex: 'registered_at', width: 160, render: (v: string) => formatFullDateTime(v) },
    { title: '消费总额', dataIndex: 'total_consumed', width: 100, align: 'right', render: formatNumber },
    { title: '充值总额', dataIndex: 'total_recharged', width: 100, align: 'right', render: formatNumber },
    { title: '贡献奖励', width: 100, align: 'right',
      render: (_, r) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{formatNumber(r.signup_reward + r.first_recharge_reward)}</span>,
    },
  ];

  const referrer = referrerDetail?.referrer;

  return (
    <Drawer
      title="邀请人详情"
      open={open}
      onClose={onClose}
      width={680}
      styles={{ body: { padding: 0 } }}
    >
      {isReferrerDetailLoading || !referrerDetail ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Referrer info */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="邮箱">{referrer?.email}</Descriptions.Item>
              <Descriptions.Item label="昵称">{referrer?.nickname || '--'}</Descriptions.Item>
              <Descriptions.Item label="邀请码">
                <Tag color="blue">{referrer?.invite_code}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="总邀请数">
                <span style={{ fontWeight: 600 }}>{referrer?.total_referrals}</span>
              </Descriptions.Item>
            </Descriptions>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div style={{
                flex: 1, padding: '12px', borderRadius: 8,
                background: '#f6ffed', border: '1px solid #b7eb8f', textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: '#52c41a', marginBottom: 4 }}>累计收益</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{formatNumber(referrer?.total_earned || 0)}</div>
              </div>
              <div style={{
                flex: 1, padding: '12px', borderRadius: 8,
                background: '#e6f7ff', border: '1px solid #91d5ff', textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: '#1677ff', marginBottom: 4 }}>注册奖励合计</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>{formatNumber(referrer?.signup_rewards_total || 0)}</div>
              </div>
              <div style={{
                flex: 1, padding: '12px', borderRadius: 8,
                background: '#fff7e6', border: '1px solid #ffd591', textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: '#faad14', marginBottom: 4 }}>首充返利合计</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#faad14' }}>{formatNumber(referrer?.recharge_rewards_total || 0)}</div>
              </div>
            </div>
          </div>

          {/* Referees list */}
          <div style={{ padding: '16px 24px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
              被邀请人列表 ({referrerDetail.total_referees})
            </div>
            <Table
              dataSource={referrerDetail.referees}
              columns={refereeColumns}
              rowKey="referee_id"
              size="small"
              pagination={false}
              scroll={{ x: 800 }}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13 }}>奖励流水</div>
                    {record.reward_transactions.length === 0 ? (
                      <div style={{ color: '#999', fontSize: 12 }}>暂无相关奖励记录</div>
                    ) : (
                      <Timeline
                        items={record.reward_transactions.map((tx) => ({
                          color: tx.amount > 0 ? 'green' : 'red',
                          children: (
                            <div style={{ fontSize: 12 }}>
                              <span style={{ color: tx.amount > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
                                {tx.amount > 0 ? '+' : ''}{formatNumber(tx.amount)}
                              </span>
                              <span style={{ color: '#666', marginLeft: 8 }}>{tx.description}</span>
                              <span style={{ color: '#999', marginLeft: 8 }}>{formatFullDateTime(tx.created_at)}</span>
                            </div>
                          ),
                        }))}
                      />
                    )}
                  </div>
                ),
                rowExpandable: () => true,
              }}
            />
          </div>
        </div>
      )}
    </Drawer>
  );
}
