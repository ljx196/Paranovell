import type { ThemeConfig } from 'antd';

export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorError: '#ff4d4f',
    colorWarning: '#faad14',
    colorInfo: '#1677ff',
    borderRadius: 6,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Table: {
      headerBg: '#fafafa',
      headerColor: '#888',
      rowHoverBg: '#fafafa',
      borderColor: '#f5f5f5',
      headerBorderRadius: 0,
    },
    Button: {
      borderRadius: 6,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Card: {
      borderRadiusLG: 10,
    },
  },
};

export const adminColors = {
  bgPage: '#f0f2f5',
  bgCard: '#ffffff',
  bgSection: '#fafafa',

  textPrimary: '#111',
  textRegular: '#333',
  textSecondary: '#666',
  textMuted: '#999',
  textLight: '#bbb',

  border: '#e8e8e8',
  borderLight: '#f0f0f0',
  borderLighter: '#f5f5f5',

  success: '#52c41a',
  danger: '#ff4d4f',
  warning: '#faad14',
  info: '#1677ff',
  purple: '#722ed1',

  sidebarBg: '#001529',
  sidebarText: 'rgba(255,255,255,0.65)',
  sidebarTextActive: '#ffffff',
  sidebarItemActive: '#1677ff',

  statCardIcons: {
    users: { bg: 'rgba(22,119,255,0.1)', color: '#1677ff' },
    active: { bg: 'rgba(82,196,26,0.1)', color: '#52c41a' },
    newUsers: { bg: 'rgba(250,173,20,0.1)', color: '#faad14' },
    revenue: { bg: 'rgba(245,34,45,0.1)', color: '#f5222d' },
  },

  chartGradients: {
    users: ['#1677ff', '#69b1ff'],
    revenue: ['#52c41a', '#95de64'],
    tokens: ['#fa8c16', '#ffc069'],
  },
} as const;
