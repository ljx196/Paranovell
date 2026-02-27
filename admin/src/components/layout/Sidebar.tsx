import { useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  SwapOutlined,
  SoundOutlined,
  SettingOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAdminStore } from '../../store/useAdminStore';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface MenuSection {
  items: MenuItem[];
  divider?: boolean;
}

const menuSections: MenuSection[] = [
  {
    items: [
      { key: 'dashboard', label: '仪表盘', icon: <DashboardOutlined />, path: '/admin/dashboard' },
      { key: 'users', label: '用户管理', icon: <UserOutlined />, path: '/admin/users' },
      { key: 'orders', label: '订单管理', icon: <ShoppingOutlined />, path: '/admin/orders' },
      { key: 'transactions', label: '交易流水', icon: <SwapOutlined />, path: '/admin/transactions' },
      { key: 'announcements', label: '公告管理', icon: <SoundOutlined />, path: '/admin/announcements' },
    ],
    divider: true,
  },
  {
    items: [
      { key: 'content-review', label: '对话审查', icon: <SafetyCertificateOutlined />, path: '/admin/content-review' },
      { key: 'sensitive-words', label: '敏感词管理', icon: <SafetyCertificateOutlined />, path: '/admin/sensitive-words' },
      { key: 'referrals', label: '邀请管理', icon: <TeamOutlined />, path: '/admin/referrals' },
    ],
    divider: true,
  },
  {
    items: [
      { key: 'configs', label: '系统配置', icon: <SettingOutlined />, path: '/admin/configs' },
      { key: 'audit-logs', label: '操作日志', icon: <AuditOutlined />, path: '/admin/audit-logs' },
    ],
  },
];

const menuItems: MenuItem[] = menuSections.flatMap((s) => s.items);

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useAdminStore((s) => s.currentUser);

  const getActiveKey = () => {
    const path = location.pathname;
    for (const item of menuItems) {
      if (path === item.path || path.startsWith(item.path + '/')) {
        return item.key;
      }
    }
    return 'dashboard';
  };

  const activeKey = getActiveKey();

  return (
    <div
      style={{
        width: 220,
        background: '#001529',
        color: '#fff',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
          GenNovel Admin
        </span>
      </div>

      {/* Menu */}
      <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {menuSections.map((section, si) => (
          <div key={si}>
            {section.items.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                    background: isActive ? '#1677ff' : 'transparent',
                    borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                    gap: 10,
                    fontSize: 14,
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              );
            })}
            {section.divider && (
              <div style={{ margin: '6px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
            )}
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {currentUser?.nickname?.charAt(0) || 'A'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
              {currentUser?.nickname || '管理员'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
              {currentUser?.role === 'super_admin' ? '超级管理员' : '管理员'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
