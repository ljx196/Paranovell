import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import { adminColors } from '../../styles/theme';

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminHeader />
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            background: adminColors.bgPage,
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
