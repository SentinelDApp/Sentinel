import { useTransporterTheme } from "../context/ThemeContext";
import Header from "./Header";

const TransporterLayout = ({ children, searchQuery, setSearchQuery }) => {
  const { isDarkMode } = useTransporterTheme();

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
      }`}
    >
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        onMenuClick={() => {}} // For mobile menu if needed later
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default TransporterLayout;
