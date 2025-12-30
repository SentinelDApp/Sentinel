import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  HomeIcon,
  BoxIcon,
  TruckIcon,
  ChartIcon,
  ShieldCheckIcon,
  CogIcon,
  LogoutIcon,
  ChevronRightIcon,
  BlockchainIcon,
  WarehouseIcon,
  UsersIcon,
  ClockIcon,
} from "../icons/Icons";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: HomeIcon, path: "/admin" },
  {
    id: "requests",
    label: "Requests",
    icon: ClockIcon,
    path: "/admin/requests",
  },
  {
    id: "shipments",
    label: "Shipments",
    icon: TruckIcon,
    path: "/admin/shipments",
  },
  { id: "products", label: "Products", icon: BoxIcon, path: "/admin/products" },
  {
    id: "tracking",
    label: "Tracking",
    icon: ChartIcon,
    path: "/admin/tracking",
  },
  {
    id: "verification",
    label: "Verification",
    icon: ShieldCheckIcon,
    path: "/admin/verification",
  },
  {
    id: "warehouse",
    label: "Warehouse",
    icon: WarehouseIcon,
    path: "/admin/warehouse",
  },
  {
    id: "live",
    label: "Live Dashboard",
    icon: BlockchainIcon,
    path: "/admin/live",
  },
  { id: "users", label: "Users", icon: UsersIcon, path: "/admin/users" },
  { id: "settings", label: "Settings", icon: CogIcon, path: "/admin/settings" },
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
              bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25
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
                Blockchain Tracking
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
                  onClick={() => onNavigate(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200 group relative
                    ${
                      isActive
                        ? isDarkMode
                          ? "bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-400 border border-blue-500/30"
                          : "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 border border-blue-200"
                        : isDarkMode
                        ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-r-full" />
                  )}

                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isHovered ? "scale-110" : ""
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>

                  {isActive && <ChevronRightIcon className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div
          className={`
          p-4 border-t
          ${isDarkMode ? "border-slate-700/50" : "border-slate-200"}
        `}
        >
          {/* Blockchain Status */}
          <div
            className={`
            mb-4 p-3 rounded-xl
            ${isDarkMode ? "bg-slate-800/50" : "bg-slate-100"}
          `}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span
                className={`text-xs font-medium ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Blockchain Connected
              </span>
            </div>
            <p
              className={`text-xs ${
                isDarkMode ? "text-slate-500" : "text-slate-500"
              }`}
            >
              Network: Ethereum Mainnet
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => onNavigate("logout")}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-200
              ${
                isDarkMode
                  ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  : "text-slate-600 hover:text-red-600 hover:bg-red-50"
              }
            `}
          >
            <LogoutIcon className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
