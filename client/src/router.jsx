/**
 * Sentinel - Router Configuration
 * Defines all routes for the application
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';

// Auth Pages
import Signup from './components/signup/Signup';
import LoginPage from './components/Admin/pages/LoginPage';

// Dashboard Pages
import SupplierDashboard from './components/supplier/SupplierDashboard';
import RetailerDashboard from './components/retailer/RetailerDashboard';
import TransporterDashboard from './components/Transporter/TransporterDashboard';

// Admin Pages (wrapped with ThemeProvider in component)
import { AdminApp, ThemeProvider } from './components/Admin';
import ManufacturerDashboard from './components/Admin/pages/ManufacturerDashboard';
import ShipmentTrackingPage from './components/Admin/pages/ShipmentTrackingPage';
import QRScanPage from './components/Admin/pages/QRScanPage';
import LiveDashboard from './components/Admin/pages/LiveDashboard';
import CustomerVerificationPage from './components/Admin/pages/CustomerVerificationPage';
import UsersPage from './components/Admin/pages/UsersPage';

// Wrapper component for Admin routes
const AdminWrapper = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

// Router configuration
export const router = createBrowserRouter([
  // ============================================
  // Public Routes
  // ============================================
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <AdminWrapper>
        <LoginPage />
      </AdminWrapper>
    ),
  },
  {
    path: '/signup',
    element: <Signup />,
  },

  // ============================================
  // Supplier Routes
  // ============================================
  {
    path: '/supplier',
    element: <Navigate to="/supplier/dashboard" replace />,
  },
  {
    path: '/supplier/dashboard',
    element: <SupplierDashboard />,
  },

  // ============================================
  // Retailer Routes
  // ============================================
  {
    path: '/retailer',
    element: <Navigate to="/retailer/dashboard" replace />,
  },
  {
    path: '/retailer/dashboard',
    element: <RetailerDashboard />,
  },

  // ============================================
  // Transporter Routes
  // ============================================
  {
    path: '/transporter',
    element: <Navigate to="/transporter/dashboard" replace />,
  },
  {
    path: '/transporter/dashboard',
    element: <TransporterDashboard />,
  },

  // ============================================
  // Admin/Manufacturer Routes
  // ============================================
  {
    path: '/admin',
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: '/admin/dashboard',
    element: (
      <AdminWrapper>
        <AdminApp />
      </AdminWrapper>
    ),
  },
  {
    path: '/admin/manufacturer',
    element: (
      <AdminWrapper>
        <ManufacturerDashboard />
      </AdminWrapper>
    ),
  },
  {
    path: '/admin/tracking',
    element: (
      <AdminWrapper>
        <ShipmentTrackingPage />
      </AdminWrapper>
    ),
  },
  {
    path: '/admin/shipments',
    element: (
      <AdminWrapper>
        <ShipmentTrackingPage />
      </AdminWrapper>
    ),
  },
  {
    path: '/admin/scan',
    element: (
      <AdminWrapper>
        <QRScanPage />
      </AdminWrapper>
    ),
  },
  {
    path: '/admin/live',
    element: (
      <AdminWrapper>
        <LiveDashboard />
      </AdminWrapper>
    ),
  },
  {
    path: '/admin/verification',
    element: (
      <AdminWrapper>
        <CustomerVerificationPage />
      </AdminWrapper>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <AdminWrapper>
        <UsersPage />
      </AdminWrapper>
    ),
  },

  // ============================================
  // Catch-all / 404
  // ============================================
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

// 404 Page Component
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-4xl">🛡️</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-50 mb-2">404</h1>
        <p className="text-lg text-slate-400 mb-6">Page not found</p>
        <a 
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}

export default router;
