import { TransporterThemeProvider, useTransporterTheme } from "./context/ThemeContext";
import Header from "./layout/Header";
import DashboardPage from "./pages/DashboardPage";
import "./Transporter.css";

/**
 * TransporterDashboardContent - Main content with sidebar layout
 */
const TransporterDashboardContent = () => {
  const { isDarkMode } = useTransporterTheme();

  return (
    <div
      className={`min-h-screen flex transition-colors duration-200 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
      }`}
    >
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />

        {/* Dashboard Page handles its own layout including left sidebar */}
        <DashboardPage />
      </div>
    </div>
  );
};

const TransporterApp = () => {
  return (
    <TransporterThemeProvider>
      <TransporterDashboardContent />
    </TransporterThemeProvider>
  );
};

export default TransporterApp;
