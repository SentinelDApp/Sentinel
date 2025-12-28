/**
 * Sentinel - Smart Supply Chain Tracking
 * Main App Component
 * Routes to different role-based dashboards
 */

import RetailerDashboard from "./components/retailer/RetailerDashboard";

function App() {
  // Currently showing Retailer Dashboard
  // TODO: Add routing for other roles (Manufacturer, Distributor, Consumer)
  return <RetailerDashboard />;
}

export default App;
