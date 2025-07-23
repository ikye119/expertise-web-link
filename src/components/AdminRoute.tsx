import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, isLoading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-4 terminal-text">[VERIFYING_ADMIN_ACCESS...]</span>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}