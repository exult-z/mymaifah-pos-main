import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from './BottomNav';

const MainLayout = () => {
  const { user, canAccess } = useAuth();

  // Check if user can access this section
  // This should be enhanced to check the current route
  if (user && user.role === 'cashier') {
    // Cashiers can only access POS - if they try to go elsewhere, redirect
    const currentPath = window.location.pathname;
    if (currentPath !== '/pos' && currentPath !== '/') {
      return <Navigate to="/pos" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
};

export default MainLayout;