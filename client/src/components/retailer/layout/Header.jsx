/**
 * Header Component
 * Retailer Dashboard header matching Transporter design pattern.
 * Contains: Logo, Search, Role Badge, Theme Toggle, Notifications, Profile
 */

import { useState, useEffect, useRef } from "react";
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
  RetailIcon,
} from "../icons/Icons";

// Helper to get time ago string
const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

const Header = ({ onMenuClick, searchQuery, setSearchQuery }) => {
  const { isDarkMode, toggleTheme } = useRetailerTheme();
  const { logout, user, walletAddress } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Real-time notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Refs for click outside detection
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Get user display info from auth context
  const displayName = user?.fullName || user?.businessName || "Retailer";
  const displayId = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem("retailer_notifications");
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n) => !n.read).length);
      } catch (e) {
        console.error("Failed to parse notifications:", e);
      }
    }
  }, []);

  // Listen for custom notification events (from other components)
  useEffect(() => {
    const handleNewNotification = (event) => {
      const newNotif = {
        id: Date.now(),
        title: event.detail.title,
        message: event.detail.message,
        type: event.detail.type || "info", // success, warning, error, info
        time: new Date().toISOString(),
        read: false,
      };
      
      setNotifications((prev) => {
        const updated = [newNotif, ...prev].slice(0, 20); // Keep max 20
        localStorage.setItem("retailer_notifications", JSON.stringify(updated));
        return updated;
      });
      setUnreadCount((prev) => prev + 1);
    };

    window.addEventListener("retailer-notification", handleNewNotification);
    return () => window.removeEventListener("retailer-notification", handleNewNotification);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark all as read when opening notifications
  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowProfile(false);
    
    if (!showNotifications && unreadCount > 0) {
      // Mark all as read
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, read: true }));
        localStorage.setItem("retailer_notifications", JSON.stringify(updated));
        return updated;
      });
      setUnreadCount(0);
    }
  };

  // Clear all notifications
  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem("retailer_notifications");
  };

  return (
    <header
      className={`
        backdrop-blur-xl border-b sticky top-0 z-30 px-4 lg:px-6 py-4 transition-colors duration-200
        ${
          isDarkMode
            ? "bg-slate-900/80 border-slate-700/50"
            : "bg-white/80 border-slate-200"
        }
      `}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left Section - Logo & Search */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className={`
              lg:hidden p-2 rounded-xl transition-colors
              ${
                isDarkMode
                  ? "text-slate-400 hover:text-white hover:bg-slate-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }
            `}
          >
            <MenuIcon className="w-6 h-6" />
          </button>

          <Link to="/retailer/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1
                className={`font-bold text-lg ${
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
                Retail Hub
              </p>
            </div>
          </Link>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl w-full
                ${
                  isDarkMode
                    ? "bg-slate-800/50 border border-slate-700/50"
                    : "bg-slate-100 border border-slate-200"
                }
              `}
            >
              <SearchIcon
                className={`w-5 h-5 ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              />
              <input
                type="text"
                placeholder="Search shipments, products..."
                value={searchQuery || ""}
                onChange={(e) =>
                  setSearchQuery && setSearchQuery(e.target.value)
                }
                className={`
                  bg-transparent outline-none w-full text-sm
                  ${
                    isDarkMode
                      ? "text-white placeholder:text-slate-500"
                      : "text-slate-900 placeholder:text-slate-400"
                  }
                `}
              />
              <kbd
                className={`
                  hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded text-xs
                  ${
                    isDarkMode
                      ? "bg-slate-700 text-slate-400"
                      : "bg-slate-200 text-slate-500"
                  }
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
              ${
                isDarkMode
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                  : "bg-cyan-50 text-cyan-600 border border-cyan-200"
              }
            `}
          >
            <RetailIcon className="w-4 h-4" />
            Retailer
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`
              p-2.5 rounded-xl transition-all duration-200
              ${
                isDarkMode
                  ? "text-slate-400 hover:text-yellow-400 hover:bg-slate-800"
                  : "text-slate-600 hover:text-amber-500 hover:bg-slate-100"
              }
            `}
          >
            {isDarkMode ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleOpenNotifications}
              className={`
                relative p-2.5 rounded-xl transition-all duration-200
                ${
                  isDarkMode
                    ? "text-slate-400 hover:text-white hover:bg-slate-800"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }
              `}
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full px-1 border-2 ${
                    isDarkMode ? "border-slate-900" : "border-white"
                  }`}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown - Responsive */}
            {showNotifications && (
              <div
                className={`
                  absolute right-0 mt-2 w-72 sm:w-80 md:w-96 
                  rounded-2xl shadow-2xl border overflow-hidden z-50
                  ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200"
                  }
                `}
              >
                <div
                  className={`px-4 py-3 border-b flex items-center justify-between ${
                    isDarkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <h3
                    className={`font-semibold ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Notifications
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className={`text-xs font-medium ${
                        isDarkMode
                          ? "text-slate-400 hover:text-red-400"
                          : "text-slate-500 hover:text-red-500"
                      }`}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className={`px-4 py-8 text-center ${
                      isDarkMode ? "text-slate-500" : "text-slate-400"
                    }`}>
                      <BellIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications yet</p>
                      <p className="text-xs mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`
                          px-4 py-3 border-b last:border-0 cursor-pointer transition-colors
                          ${
                            isDarkMode
                              ? "border-slate-700/50 hover:bg-slate-700/50"
                              : "border-slate-100 hover:bg-slate-50"
                          }
                          ${!notification.read ? (isDarkMode ? "bg-slate-700/30" : "bg-blue-50/50") : ""}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.type === "success" ? "bg-emerald-500" :
                            notification.type === "warning" ? "bg-amber-500" :
                            notification.type === "error" ? "bg-red-500" :
                            "bg-cyan-500"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isDarkMode ? "text-slate-200" : "text-slate-700"
                              }`}
                            >
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p
                                className={`text-xs mt-0.5 line-clamp-2 ${
                                  isDarkMode ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                {notification.message}
                              </p>
                            )}
                            <p
                              className={`text-xs mt-1 ${
                                isDarkMode ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {getTimeAgo(notification.time)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className={`
                flex items-center gap-2 p-1.5 pr-2 sm:pr-3 rounded-xl transition-all duration-200
                ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}
              `}
            >
              {/* Blue Avatar Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20"
              >
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 hidden sm:block ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              />
            </button>

            {/* Profile Dropdown - Responsive */}
            {showProfile && (
              <div
                className={`
                  absolute right-0 mt-2 w-56 sm:w-64 rounded-2xl shadow-2xl border overflow-hidden z-50
                  ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200"
                  }
                `}
              >
                <div
                  className={`px-4 py-3 border-b ${
                    isDarkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold truncate ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {displayName}
                      </p>
                      <p
                        className={`text-xs mt-0.5 truncate ${
                          isDarkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {displayId}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate("/retailer/profile-settings");
                      setShowProfile(false);
                    }}
                    className={`
                      w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3
                      ${
                        isDarkMode
                          ? "text-slate-300 hover:bg-slate-700/50"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isDarkMode ? "bg-slate-700" : "bg-slate-100"
                    }`}>
                      <UserIcon className={`w-4 h-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
                    </span>
                    Profile Settings
                  </button>
                  <button
                    className={`
                      w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3
                      ${
                        isDarkMode
                          ? "text-slate-300 hover:bg-slate-700/50"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isDarkMode ? "bg-slate-700" : "bg-slate-100"
                    }`}>
                      <ShieldCheckIcon className={`w-4 h-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
                    </span>
                    Store Settings
                  </button>
                  <div className={`my-2 border-t ${isDarkMode ? "border-slate-700" : "border-slate-100"}`} />
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className={`
                      w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3
                      ${
                        isDarkMode
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-red-600 hover:bg-red-50"
                      }
                    `}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isDarkMode ? "bg-red-500/10" : "bg-red-50"
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </span>
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
