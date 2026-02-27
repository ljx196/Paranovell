import { useEffect, useState } from 'react';
import { Table, Card, Row, Col, Statistic } from 'antd';
import { TeamOutlined, GiftOutlined, TrophyOutlined, RiseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAdminStore } from '../store/useAdminStore';
import FilterBar from '../components/shared/FilterBar';
import StatusBadge from '../components/shared/StatusBadge';
import ReferrerDetailDrawer from '../components/modals/ReferrerDetailDrawer';
import { formatNumber, formatFullDateTime, USER_STATUS_MAP } from '../utils/format';
import type { ReferralListItem } from '../types/admin';
import { adminColors } from '../styles/theme';

export default function Referrals() {
  const {
    referralStats, isReferralStatsLoading, fetchReferralStats,
    referrals, referralTotal, referralParams, isReferralsLoading, fetchReferrals,
  } = useAdminStore();

  const [selectedReferrerId, setSelectedReferrerId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchReferralStats();
    fetchReferrals();
  }, [fetchReferralStats, fetchReferrals]);

  const handleSearch = (values: Record<string, unknown>) => {
    fetchReferrals({ ...values, page: 1 } as Record<string, unknown>);
  };

  const handleViewReferrer = (userId: number) => {
    setSelectedReferrerId(userId);
    setDrawerOpen(true);
  };

  const statCards = referralStats ? [
    { title: '总邀请数', value: referralStats.total_referrals, icon: <TeamOutlined />, color: '#1677ff' },
    { title: '总奖励发放', value: referralStats.total_rewards_points, icon: <GiftOutlined />, color: '#52c41a', suffix: '积分' },
    { title: '今日邀请', value: referralStats.today_referrals, icon: <RiseOutlined />, color: '#faad14' },
    { title: '今日奖励', value: referralStats.today_rewards_points, icon: <GiftOutlined />, color: '#722ed1', suffix: '积分' },
    { title: '有效邀请率', value: (referralStats.active_referral_rate * 100).toFixed(1), icon: <TrophyOutlined />, color: '#13c2c2', suffix: '%' },
  ] : [];

  const columns: ColumnsType<ReferralListItem> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '邀请人', width: 180, ellipsis: true,
      render: (_, r) => (
        <a onClick={() => handleViewReferrer(r.referrer_id)} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: 13 }}>{r.referrer_email}</div>
          {r.referrer_nickname && <div style={{ fontSize: 11, color: '#999' }}>{r.referrer_nickname}</div>}
        </a>
      ),
    },
    { title: '被邀请人', width: 180, ellipsis: true,
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13 }}>{r.referee_email}</div>
          {r.referee_nickname && <div style={{ fontSize: 11, color: '#999' }}>{r.referee_nickname}</div>}
        </div>
      ),
    },
    { title: '被邀请人消费', dataIndex: 'referee_total_consumed', width: 120, align: 'right',
      render: (v: number) => formatNumber(v),
    },
    { title: '注册奖励', dataIndex: 'signup_reward', width: 100, align: 'right',
      render: (v: number) => <span style={{ color: '#52c41a' }}>{v > 0 ? `+${formatNumber(v)}` : '--'}</span>,
    },
    { title: '首充返利', dataIndex: 'first_recharge_reward', width: 100, align: 'right',
      render: (v: number) => <span style={{ color: '#faad14' }}>{v > 0 ? `+${formatNumber(v)}` : '--'}</span>,
    },
    { title: '总奖励', dataIndex: 'total_reward', width: 100, align: 'right',
      render: (v: number) => <span style={{ fontWeight: 600 }}>{formatNumber(v)}</span>,
    },
    { title: '邀请时间', dataIndex: 'created_at', width: 170, render: formatFullDateTime },
  ];

  const filterItems = [
    { type: 'input' as const, key: 'referrer_email', placeholder: '邀请人邮箱', width: 180 },
    { type: 'input' as const, key: 'referee_email', placeholder: '被邀请人邮箱', width: 180 },
    { type: 'dateRange' as const, key: 'dateRange' },
  ];

  return (
    <div>
      {/* Stat Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statCards.map((card) => (
          <Col flex="1" key={card.title}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Statistic
                  title={card.title}
                  value={card.value}
                  suffix={card.suffix}
                  valueStyle={{ fontSize: 22, fontWeight: 600 }}
                />
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: card.color + '15', color: card.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Top Referrers */}
      {referralStats && referralStats.top_referrers.length > 0 && (
        <Card size="small" title="Top 邀请人" style={{ marginBottom: 16, borderRadius: 8 }}>
          <Table
            dataSource={referralStats.top_referrers}
            rowKey="user_id"
            size="small"
            pagination={false}
            columns={[
              { title: '排名', width: 60, render: (_, __, i) => (
                <span style={{
                  display: 'inline-block', width: 24, height: 24, borderRadius: '50%',
                  background: i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#f0f0f0',
                  color: i < 3 ? '#fff' : '#666', textAlign: 'center', lineHeight: '24px',
                  fontWeight: 600, fontSize: 12,
                }}>{i + 1}</span>
              )},
              { title: '邮箱', dataIndex: 'email', ellipsis: true,
                render: (text, r) => (
                  <a onClick={() => handleViewReferrer(r.user_id)} style={{ cursor: 'pointer' }}>{text}</a>
                ),
              },
              { title: '昵称', dataIndex: 'nickname', ellipsis: true },
              { title: '邀请数', dataIndex: 'referral_count', width: 80, align: 'right' },
              { title: '累计收益', dataIndex: 'total_earned', width: 100, align: 'right',
                render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{formatNumber(v)}</span>,
              },
            ]}
          />
        </Card>
      )}

      {/* Filter */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <FilterBar items={filterItems} onSearch={handleSearch} />
      </Card>

      {/* Referral Table */}
      <Card style={{ borderRadius: 8 }}>
        <Table
          dataSource={referrals}
          columns={columns}
          rowKey="id"
          loading={isReferralsLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: referralParams.page,
            pageSize: referralParams.page_size,
            total: referralTotal,
            showTotal: (t) => `共 ${t.toLocaleString()} 条`,
            onChange: (page, pageSize) => fetchReferrals({ page, page_size: pageSize }),
          }}
        />
      </Card>

      {/* Detail Drawer */}
      <ReferrerDetailDrawer
        open={drawerOpen}
        userId={selectedReferrerId}
        onClose={() => { setDrawerOpen(false); setSelectedReferrerId(null); }}
      />
    </div>
  );
}
