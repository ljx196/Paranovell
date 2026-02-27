import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import {
  UserOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import RecentLogs from '../components/dashboard/RecentLogs';
import { useAdminStore } from '../store/useAdminStore';
import { adminColors } from '../styles/theme';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    dashboardStats,
    trendData,
    trendDays,
    recentLogs,
    isDashboardLoading,
    initDashboard,
    setTrendDays,
  } = useAdminStore();

  useEffect(() => {
    initDashboard();
  }, [initDashboard]);

  const stats = dashboardStats;
  const icons = adminColors.statCardIcons;
  const gradients = adminColors.chartGradients;

  return (
    <Spin spinning={isDashboardLoading}>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          title="总用户数"
          value={stats?.total_users ?? 0}
          yesterdayValue={undefined}
          icon={<UserOutlined />}
          iconBg={icons.users.bg}
          iconColor={icons.users.color}
        />
        <StatCard
          title="活跃用户"
          value={stats?.today_active ?? 0}
          yesterdayValue={stats?.yesterday_active ?? 0}
          icon={<ThunderboltOutlined />}
          iconBg={icons.active.bg}
          iconColor={icons.active.color}
        />
        <StatCard
          title="今日新增"
          value={stats?.today_new_users ?? 0}
          yesterdayValue={stats?.yesterday_new_users ?? 0}
          icon={<UserAddOutlined />}
          iconBg={icons.newUsers.bg}
          iconColor={icons.newUsers.color}
        />
        <StatCard
          title="今日收入"
          value={stats?.today_revenue_yuan ?? 0}
          prefix="¥"
          yesterdayValue={stats?.yesterday_revenue_yuan ?? 0}
          icon={<DollarOutlined />}
          iconBg={icons.revenue.bg}
          iconColor={icons.revenue.color}
        />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <ChartCard
          title="用户增长趋势"
          data={trendData.users}
          days={trendDays.users}
          onDaysChange={(d) => setTrendDays('users', d)}
          color={gradients.users as [string, string]}
        />
        <ChartCard
          title="收入趋势"
          data={trendData.revenue}
          days={trendDays.revenue}
          onDaysChange={(d) => setTrendDays('revenue', d)}
          color={gradients.revenue as [string, string]}
        />
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard
          title="Token 消耗趋势"
          data={trendData.tokens}
          days={trendDays.tokens}
          onDaysChange={(d) => setTrendDays('tokens', d)}
          color={gradients.tokens as [string, string]}
        />
        <RecentLogs
          logs={recentLogs}
          onViewAll={() => navigate('/admin/audit-logs')}
        />
      </div>
    </Spin>
  );
}
