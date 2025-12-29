import { TransporterThemeProvider } from "./context/ThemeContext";
import TransporterLayout from "./layout/TransporterLayout";
import DashboardPage from "./pages/DashboardPage";
import "./Transporter.css";

const TransporterApp = () => {
  return (
    <TransporterThemeProvider>
      <TransporterLayout>
        <DashboardPage />
      </TransporterLayout>
    </TransporterThemeProvider>
  );
};

export default TransporterApp;
