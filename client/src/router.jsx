/**
 * Sentinel - Router Configuration
 * Defines all routes for the application
 */

import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

// Auth Pages
import { Signup } from "./components/signup";
import LoginPage from "./components/Admin/pages/LoginPage";

// Dashboard Pages
import { SupplierApp } from "./components/supplier";
import { WarehouseApp } from "./components/warehouse";
import WarehouseProfilePage from "./components/warehouse/pages/ProfilePage";
import ManageShipmentPage from "./components/warehouse/pages/ManageShipmentPage";
import {
  RetailerApp,
  ProfileSettingsPage as RetailerProfileSettingsPage,
} from "./components/retailer";
import { TransporterApp } from "./components/Transporter";

// Admin App (includes layout with sidebar)
import { AdminApp, ThemeProvider } from "./components/Admin";

// Auth & Protected Routes
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";

// Root layout that wraps all routes with AuthProvider
const RootLayout = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
);

// Wrapper component for non-admin routes that need ThemeProvider
const AdminWrapper = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Router configuration
export const router = createBrowserRouter([
  {
    // Root element wraps everything with AuthProvider
    element: <RootLayout />,
    children: [
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
      // Supplier Routes (Protected)
      // ============================================
      {
        path: "/supplier",
        element: <Navigate to="/supplier/dashboard" replace />,
      },
      {
        path: "/supplier/dashboard",
        element: (
          <ProtectedRoute allowedRoles={["supplier"]}>
            <SupplierApp />
          </ProtectedRoute>
        ),
      },

      // ============================================
      // Warehouse Routes
      // ============================================
      {
        path: "/warehouse",
        element: <Navigate to="/warehouse/dashboard" replace />,
      },
      {
        path: "/warehouse/dashboard",
        element: (
          <ProtectedRoute allowedRoles={["warehouse"]}>
            <WarehouseApp />
          </ProtectedRoute>
        ),
      },
      {
        path: "/warehouse/profile",
        element: (
          <ProtectedRoute allowedRoles={["warehouse"]}>
            <WarehouseApp page="profile" />
          </ProtectedRoute>
        ),
      },
      {
        path: "/warehouse/shipment/:shipmentHash",
        element: (
          <ProtectedRoute allowedRoles={["warehouse"]}>
            <ManageShipmentPage />
          </ProtectedRoute>
        ),
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
        element: <RetailerApp />,
      },
      {
        path: "/retailer/profile-settings",
        element: <RetailerProfileSettingsPage />,
      },

      // ============================================
      // Transporter Routes (Protected)
      // ============================================
      {
        path: "/transporter",
        element: <Navigate to="/transporter/dashboard" replace />,
      },
      {
        path: "/transporter/dashboard",
        element: (
          <ProtectedRoute allowedRoles={["transporter"]}>
            <TransporterApp />
          </ProtectedRoute>
        ),
      },

      // ============================================
      // Admin/Supplier Routes (Protected)
      // All admin routes use AdminApp which includes the sidebar layout
      // ============================================
      {
        path: "/admin",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminApp role="admin" />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: null },
          { path: "dashboard", element: null },
          { path: "requests", element: null },
          { path: "tracking", element: null },
          { path: "shipments", element: null },
          { path: "scan", element: null },
          { path: "live", element: null },
          { path: "verification", element: null },
          { path: "users", element: null },
        ],
      },

      // ============================================
      // Catch-all / 404
      // ============================================
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
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
