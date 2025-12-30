import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

const WarehouseLayout = ({ children, currentPage, onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage={currentPage}
          onNavigate={onNavigate}
        />

        <div className="flex-1 min-h-screen flex flex-col lg:ml-0">
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            warehouseName="Central Warehouse"
            warehouseLocation="Mumbai, India"
          />

          <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default WarehouseLayout;
