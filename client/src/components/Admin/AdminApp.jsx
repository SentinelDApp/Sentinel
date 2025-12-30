import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import AdminLayout from "./layout/AdminLayout";
import SupplierDashboard from "./pages/SupplierDashboard";
import ShipmentTrackingPage from "./pages/ShipmentTrackingPage";
import QRScanPage from "./pages/QRScanPage";
import LiveDashboard from "./pages/LiveDashboard";
import CustomerVerificationPage from "./pages/CustomerVerificationPage";
import UsersPage from "./pages/UsersPage";
import RequestsPage from "./pages/RequestsPage";

// Main Admin App - Contains all admin-specific logic
function AdminApp({ role = "admin" }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Derive current page from URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/tracking') || path.includes('/shipments')) return 'tracking';
    if (path.includes('/scan')) return 'scan';
    if (path.includes('/live')) return 'live';
    if (path.includes('/verification')) return 'verification';
    if (path.includes('/users')) return 'users';
    if (path.includes('/requests')) return 'requests';
    return 'dashboard';
  };
  
  const [currentPage, setCurrentPage] = useState(getCurrentPage());

  const handleNavigate = (page) => {
    setCurrentPage(page);
    switch (page) {
      case 'dashboard':
        navigate('/admin/dashboard');
        break;
      case 'tracking':
      case 'shipments':
        navigate('/admin/tracking');
        break;
      case 'scan':
        navigate('/admin/scan');
        break;
      case 'live':
        navigate('/admin/live');
        break;
      case 'verification':
        navigate('/admin/verification');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'requests':
        navigate('/admin/requests');
        break;
      default:
        navigate('/admin/dashboard');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <SupplierDashboard />;
      case "tracking":
      case "shipments":
        return <ShipmentTrackingPage />;
      case "scan":
        return <QRScanPage />;
      case "live":
        return <LiveDashboard />;
      case "verification":
        return <CustomerVerificationPage />;
      case "users":
        return <UsersPage />;
      case "requests":
        return <RequestsPage />;
      default:
        return <SupplierDashboard />;
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case "supplier":
        return "Supplier";
      case "transporter":
        return "Transporter";
      case "warehouse":
        return "Warehouse";
      case "customer":
        return "Customer";
      case "admin":
        return "Admin";
      default:
        return "User";
    }
  };

  return (
    <ThemeProvider>
      <AdminLayout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentRole={getRoleTitle()}
      >
        {renderPage()}
      </AdminLayout>
    </ThemeProvider>
  );
}

export default AdminApp;
