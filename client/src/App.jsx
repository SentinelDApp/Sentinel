import { useState } from "react";
import "./App.css";
import {
  ThemeProvider,
  AdminLayout,
  LoginPage,
  ManufacturerDashboard,
  ShipmentTrackingPage,
  QRScanPage,
  LiveDashboard,
  CustomerVerificationPage,
  UsersPage,
} from "./components/Admin";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleLogin = (role) => {
    setCurrentRole(role);
    setIsLoggedIn(true);
    setCurrentPage("dashboard");
  };

  const handleNavigate = (page) => {
    if (page === "logout") {
      setIsLoggedIn(false);
      setCurrentRole(null);
      setCurrentPage("dashboard");
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
    switch (currentRole) {
      case "manufacturer":
        return "Manufacturer";
      case "transporter":
        return "Transporter";
      case "warehouse":
        return "Warehouse";
      case "customer":
        return "Customer";
      default:
        return "User";
    }
  };

  return (
    <ThemeProvider>
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <AdminLayout
          currentPage={currentPage}
          onNavigate={handleNavigate}
          currentRole={getRoleTitle()}
        >
          {renderPage()}
        </AdminLayout>
      )}
    </ThemeProvider>
  );
}

export default App;
