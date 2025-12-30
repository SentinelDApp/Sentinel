import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  HomeIcon,
  BoxIcon,
  TruckIcon,
  QRCodeIcon,
  ClipboardCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BlockchainIcon,
  CogIcon,
  LogoutIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "../icons/Icons";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: HomeIcon, path: "/warehouse" },
  { id: "incoming", label: "Incoming Shipments", icon: ArrowDownTrayIcon, path: "/warehouse/incoming" },
  { id: "qr-scan", label: "QR Scanner", icon: QRCodeIcon, path: "/warehouse/scan" },
  { id: "verification", label: "Verification", icon: ClipboardCheckIcon, path: "/warehouse/verification" },
  { id: "dispatch", label: "Outbound Dispatch", icon: ArrowUpTrayIcon, path: "/warehouse/dispatch" },
  { id: "inventory", label: "Inventory", icon: BoxIcon, path: "/warehouse/inventory" },
  { id: "alerts", label: "Alerts & Exceptions", icon: ExclamationTriangleIcon, path: "/warehouse/alerts" },
  { id: "activity", label: "Activity Log", icon: BlockchainIcon, path: "/warehouse/activity" },
  { id: "analytics", label: "Analytics", icon: ChartBarIcon, path: "/warehouse/analytics" },
  { id: "settings", label: "Settings", icon: CogIcon, path: "/warehouse/settings" },
];

const Sidebar = ({ isOpen, onClose, currentPage, onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-72 
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${
            isDarkMode
              ? "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-700/50"
              : "bg-gradient-to-b from-white via-slate-50 to-slate-100 border-r border-slate-200"
          }
        `}
      >
        {/* Logo Section */}
        <div
          className={`
          p-6 border-b 
          ${isDarkMode ? "border-slate-700/50" : "border-slate-200"}
        `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25
            `}
            >
              <ShieldCheckIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1
                className={`text-xl font-bold tracking-tight ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Sentinel
              </h1>
              <p
                className={`text-xs ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Warehouse Operations
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const isHovered = hoveredItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200 group relative
                    ${
                      isActive
                        ? isDarkMode
                          ? "bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-200"
                        : isDarkMode
                        ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-r-full" />
                  )}

                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isHovered && !isActive ? "scale-110" : ""
                    }`}
                  />

                  <span className="font-medium text-sm">{item.label}</span>

                  {isActive && (
                    <ChevronRightIcon className="w-4 h-4 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div
          className={`p-4 border-t ${
            isDarkMode ? "border-slate-700/50" : "border-slate-200"
          }`}
        >
          <button
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-200
              ${
                isDarkMode
                  ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  : "text-red-600 hover:bg-red-50 hover:text-red-700"
              }
            `}
          >
            <LogoutIcon className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
