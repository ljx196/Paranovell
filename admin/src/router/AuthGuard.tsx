import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, restoreSession } = useAdminStore();

  if (!isAuthenticated && !restoreSession()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
