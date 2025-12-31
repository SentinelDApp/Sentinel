/**
 * Header Component
 * Retailer Dashboard header matching Transporter design pattern.
 * Contains: Logo, Search, Role Badge, Theme Toggle, Notifications, Profile
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRetailerTheme } from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  SearchIcon,
  UserIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  MenuIcon,
} from "../icons/Icons";
import { DEMO_NOTIFICATIONS } from "../constants";

const Header = ({ onMenuClick, searchQuery, setSearchQuery }) => {
  const { isDarkMode, toggleTheme } = useRetailerTheme();
  const { logout, user, walletAddress } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Get user display info from auth context
  const displayName = user?.fullName || user?.businessName || 'Retailer';
  const displayId = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '';

  return (
    <header
      className={`
        backdrop-blur-xl border-b sticky top-0 z-30 px-4 lg:px-6 py-4 transition-colors duration-200
        ${isDarkMode
          ? "bg-slate-900/80 border-slate-700/50"
          : "bg-white/80 border-slate-200"
        }
      `}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Section - Logo & Search */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className={`
              lg:hidden p-2 rounded-xl transition-colors
              ${isDarkMode
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }
            `}
          >
            <MenuIcon className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
          </Link>

          {/* Search */}
          <div className="hidden md:flex items-center">
            <div
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl w-80
                ${isDarkMode
                  ? "bg-slate-800/50 border border-slate-700/50"
                  : "bg-slate-100 border border-slate-200"
                }
              `}
            >
              <SearchIcon
                className={`w-5 h-5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
              />
              <input
                type="text"
                placeholder="Search shipments, products..."
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                className={`
                  bg-transparent outline-none w-full text-sm
                  ${isDarkMode
                    ? "text-white placeholder:text-slate-500"
                    : "text-slate-900 placeholder:text-slate-400"
                  }
                `}
              />
              <kbd
                className={`
                  hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded text-xs
                  ${isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-500"}
                `}
              >
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Role Badge */}
          <div
            className={`
              hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
              ${isDarkMode
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "bg-cyan-50 text-cyan-600 border border-cyan-200"
              }
            `}
          >
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            Retailer
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`
              p-2.5 rounded-xl transition-all duration-200
              ${isDarkMode
                ? "text-slate-400 hover:text-yellow-400 hover:bg-slate-800"
                : "text-slate-600 hover:text-amber-500 hover:bg-slate-100"
              }
            `}
          >
            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className={`
                relative p-2.5 rounded-xl transition-all duration-200
                ${isDarkMode
                  ? "text-slate-400 hover:text-white hover:bg-slate-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }
              `}
            >
              <BellIcon className="w-5 h-5" />
              <span
                className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${
                  isDarkMode ? "border-slate-900" : "border-white"
                }`}
              />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                className={`
                  absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50
                  ${isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                  }
                `}
              >
                <div
                  className={`px-4 py-3 border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
                >
                  <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    Notifications
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {DEMO_NOTIFICATIONS.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        px-4 py-3 border-b last:border-0 cursor-pointer transition-colors
                        ${isDarkMode
                          ? "border-slate-700/50 hover:bg-slate-700/50"
                          : "border-slate-100 hover:bg-slate-50"
                        }
                      `}
                    >
                      <p className={`text-sm ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                        {notification.title}
                      </p>
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                        {notification.time}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  className={`px-4 py-2 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
                >
                  <button
                    className={`w-full text-center text-sm font-medium py-1 ${
                      isDarkMode ? "text-cyan-400 hover:text-cyan-300" : "text-cyan-600 hover:text-cyan-700"
                    }`}
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className={`
                flex items-center gap-2 p-1.5 pr-3 rounded-xl transition-all duration-200
                ${isDarkMode
                  ? "hover:bg-slate-800"
                  : "hover:bg-slate-100"
                }
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isDarkMode ? "bg-slate-700" : "bg-blue-100"}
                `}
              >
                <UserIcon className={`w-5 h-5 ${isDarkMode ? "text-slate-300" : "text-blue-600"}`} />
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 hidden sm:block ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
              />
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div
                className={`
                  absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border overflow-hidden z-50
                  ${isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                  }
                `}
              >
                <div className={`px-4 py-3 border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                  <p className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {displayName}
                  </p>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    {displayId}
                  </p>
                </div>
                <div className="py-2">
                  <button
                    className={`
                      w-full text-left px-4 py-2 text-sm transition-colors
                      ${isDarkMode
                        ? "text-slate-300 hover:bg-slate-700/50"
                        : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    Profile Settings
                  </button>
                  <button
                    className={`
                      w-full text-left px-4 py-2 text-sm transition-colors
                      ${isDarkMode
                        ? "text-slate-300 hover:bg-slate-700/50"
                        : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    Store Settings
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className={`
                      w-full text-left px-4 py-2 text-sm transition-colors
                      ${isDarkMode
                        ? "text-red-400 hover:bg-slate-700/50"
                        : "text-red-600 hover:bg-slate-50"
                      }
                    `}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
