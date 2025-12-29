/**
 * Sentinel - Router Configuration
 * Defines all routes for the application
 */

import { createBrowserRouter, Navigate } from "react-router-dom";

// Auth Pages
import Signup from "./components/signup/Signup";
import LoginPage from "./components/Admin/pages/LoginPage";

// Dashboard Pages
import SupplierDashboard from "./components/supplier/SupplierDashboard";
import RetailerDashboard from "./components/retailer/RetailerDashboard";
import { TransporterApp } from "./components/Transporter";

// Admin App (includes layout with sidebar)
import { AdminApp, ThemeProvider } from "./components/Admin";

// Wrapper component for non-admin routes that need ThemeProvider
const AdminWrapper = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Router configuration
export const router = createBrowserRouter([
  // ============================================
  // Public Routes
  // ============================================
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: (
      <AdminWrapper>
        <LoginPage />
      </AdminWrapper>
    ),
  },
  {
    path: "/signup",
    element: <Signup />,
  },

  // ============================================
  // Supplier Routes
  // ============================================
  {
    path: "/supplier",
    element: <Navigate to="/supplier/dashboard" replace />,
  },
  {
    path: "/supplier/dashboard",
    element: <SupplierDashboard />,
  },

  // ============================================
  // Retailer Routes
  // ============================================
  {
    path: "/retailer",
    element: <Navigate to="/retailer/dashboard" replace />,
  },
  {
    path: "/retailer/dashboard",
    element: <RetailerDashboard />,
  },

  // ============================================
  // Transporter Routes
  // ============================================
  {
    path: "/transporter",
    element: <Navigate to="/transporter/dashboard" replace />,
  },
  {
    path: "/transporter/dashboard",
    element: <TransporterApp />,
  },

  // ============================================
  // Admin/Manufacturer Routes
  // All admin routes use AdminApp which includes the sidebar layout
  // ============================================
  {
    path: "/admin",
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: "/admin/dashboard",
    element: <AdminApp />,
  },
  {
    path: "/admin/manufacturer",
    element: <AdminApp />,
  },
  {
    path: "/admin/tracking",
    element: <AdminApp />,
  },
  {
    path: "/admin/shipments",
    element: <AdminApp />,
  },
  {
    path: "/admin/scan",
    element: <AdminApp />,
  },
  {
    path: "/admin/live",
    element: <AdminApp />,
  },
  {
    path: "/admin/verification",
    element: <AdminApp />,
  },
  {
    path: "/admin/users",
    element: <AdminApp />,
  },

  // ============================================
  // Catch-all / 404
  // ============================================
  {
    path: "*",
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
