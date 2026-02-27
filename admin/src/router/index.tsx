import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import AuthGuard from './AuthGuard';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import UserDetail from '../pages/UserDetail';
import Orders from '../pages/Orders';
import Transactions from '../pages/Transactions';
import Announcements from '../pages/Announcements';
import Configs from '../pages/Configs';
import AuditLogs from '../pages/AuditLogs';
import ContentReview from '../pages/ContentReview';
import SensitiveWords from '../pages/SensitiveWords';
import Referrals from '../pages/Referrals';

export const router = createBrowserRouter([
  {
    path: '/admin/login',
    element: <Login />,
  },
  {
    path: '/admin',
    element: (
      <AuthGuard>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'users', element: <Users /> },
      { path: 'users/:id', element: <UserDetail /> },
      { path: 'orders', element: <Orders /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'announcements', element: <Announcements /> },
      { path: 'content-review', element: <ContentReview /> },
      { path: 'sensitive-words', element: <SensitiveWords /> },
      { path: 'referrals', element: <Referrals /> },
      { path: 'configs', element: <Configs /> },
      { path: 'audit-logs', element: <AuditLogs /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/admin/login" replace />,
  },
]);
