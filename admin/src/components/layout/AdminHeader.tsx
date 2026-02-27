import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useAdminStore } from '../../store/useAdminStore';

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: '仪表盘',
  users: '用户管理',
  orders: '订单管理',
  transactions: '交易流水',
  announcements: '公告管理',
  'content-review': '对话审查',
  'sensitive-words': '敏感词管理',
  referrals: '邀请管理',
  configs: '系统配置',
  'audit-logs': '操作日志',
};

export default function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAdminStore((s) => s.logout);

  const getBreadcrumb = () => {
    const segments = location.pathname.replace('/admin/', '').split('/');
    const mainKey = segments[0];
    const label = BREADCRUMB_MAP[mainKey] || mainKey;

    if (mainKey === 'users' && segments.length > 1) {
      return (
        <>
          管理后台 / <span style={{ cursor: 'pointer', color: '#1677ff' }} onClick={() => navigate('/admin/users')}>用户管理</span> / <span style={{ color: '#333', fontWeight: 500 }}>用户详情</span>
        </>
      );
    }

    return (
      <>
        管理后台 / <span style={{ color: '#333', fontWeight: 500 }}>{label}</span>
      </>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div
      style={{
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      <div style={{ color: '#999', fontSize: 13 }}>{getBreadcrumb()}</div>
      <Button
        icon={<LogoutOutlined />}
        onClick={handleLogout}
        size="small"
      >
        退出登录
      </Button>
    </div>
  );
}
