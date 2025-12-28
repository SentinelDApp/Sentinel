/**
 * Sentinel - Smart Supply Chain Tracking
 * Main App Component
 * Routes to different role-based dashboards
 */

import { useState } from "react";
import RetailerDashboard from "./components/retailer/RetailerDashboard";
import { AdminApp, ThemeProvider } from "./components/Admin";

function App() {
  const [currentRole, setCurrentRole] = useState("admin"); // Default to admin for now

  const renderDashboard = () => {
    switch (currentRole) {
      case "admin":
        return (
          <ThemeProvider>
            <AdminApp
              role={currentRole}
              onLogout={() => setCurrentRole(null)}
            />
          </ThemeProvider>
        );
      case "retailer":
        return <RetailerDashboard />;
      // TODO: Add routing for other roles (Manufacturer, Distributor, Consumer)
      default:
        return <RetailerDashboard />;
    }
  };

  return renderDashboard();
}

export default App;
