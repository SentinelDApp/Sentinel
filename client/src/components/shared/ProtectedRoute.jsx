import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * PROTECTED ROUTE COMPONENT
 * 
 * SENTINEL ACCESS CONTROL:
 * - Enforces authentication before accessing protected routes
 * - Enforces role-based access when allowedRoles is specified
 * - Redirects to login if not authenticated
 * - Redirects to appropriate dashboard if role doesn't match
 */

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role access if allowedRoles is specified
  if (allowedRoles.length > 0) {
    const userRole = user?.role?.toLowerCase();
    const normalizedRoles = allowedRoles.map(r => r.toLowerCase());
    
    if (!normalizedRoles.includes(userRole)) {
      // User doesn't have required role - redirect to their dashboard
      const dashboardRoutes = {
        admin: '/admin/dashboard',
        manufacturer: '/supplier/dashboard',
        supplier: '/supplier/dashboard',
        transporter: '/transporter/dashboard',
        warehouse: '/admin/dashboard',
        retailer: '/retailer/dashboard'
      };
      
      const userDashboard = dashboardRoutes[userRole] || '/login';
      return <Navigate to={userDashboard} replace />;
    }
  }

  // Authenticated and authorized - render children
  return children;
};

export default ProtectedRoute;
