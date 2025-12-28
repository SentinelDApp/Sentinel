import { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import AdminLayout from "./layout/AdminLayout";
import ManufacturerDashboard from "./pages/ManufacturerDashboard";
import ShipmentTrackingPage from "./pages/ShipmentTrackingPage";
import QRScanPage from "./pages/QRScanPage";
import LiveDashboard from "./pages/LiveDashboard";
import CustomerVerificationPage from "./pages/CustomerVerificationPage";
import UsersPage from "./pages/UsersPage";

// Main Admin App - Contains all admin-specific logic
function AdminApp({ role, onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleNavigate = (page) => {
    if (page === "logout") {
      onLogout();
      return;
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <ManufacturerDashboard />;
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
      default:
        return <ManufacturerDashboard />;
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case "manufacturer":
        return "Manufacturer";
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
