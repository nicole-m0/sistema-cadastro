import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';

export function ProtectedRoute() {
  const { admin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-cream">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
