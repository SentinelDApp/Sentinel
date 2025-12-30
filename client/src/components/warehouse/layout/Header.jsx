import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWarehouseTheme } from '../context/ThemeContext';
import { 
  SunIcon, 
  MoonIcon, 
  ShieldCheckIcon, 
  SearchIcon, 
  BellIcon, 
  UserIcon, 
  ChevronDownIcon,
  WarehouseIcon,
} from '../icons/Icons';

const Header = ({ searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useWarehouseTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifications = [
    { id: 1, title: 'Shipment SHP-W001 arriving soon', time: '5 min ago', type: 'info' },
    { id: 2, title: 'Concern raised on SHP-W005', time: '1 hour ago', type: 'warning' },
    { id: 3, title: 'SHP-W004 stored in Zone B-1', time: '3 hours ago', type: 'success' },
  ];

  return (
    <header className={`
      backdrop-blur-xl border-b sticky top-0 z-30 px-4 lg:px-6 py-4 transition-colors duration-200
      ${isDarkMode 
        ? 'bg-slate-900/80 border-slate-700/50' 
        : 'bg-white/80 border-slate-200'
      }
    `}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Section - Logo & Search */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sentinel</h1>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Warehouse Hub</p>
            </div>
          </Link>

          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl w-80
              ${isDarkMode 
                ? 'bg-slate-800/50 border border-slate-700/50' 
                : 'bg-slate-100 border border-slate-200'
              }
            `}>
              <SearchIcon className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search shipments, products..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                className={`
                  bg-transparent outline-none w-full text-sm
                  ${isDarkMode 
                    ? 'text-white placeholder:text-slate-500' 
                    : 'text-slate-900 placeholder:text-slate-400'
                  }
                `}
              />
              <kbd className={`
                hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded text-xs
                ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}
              `}>
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Role Badge */}
          <div className={`
            hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
            ${isDarkMode 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
              : 'bg-blue-50 text-blue-600 border border-blue-200'
            }
          `}>
            <WarehouseIcon className="w-4 h-4" />
            Warehouse
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`
              p-2.5 rounded-xl transition-all duration-200
              ${isDarkMode 
                ? 'text-slate-400 hover:text-yellow-400 hover:bg-slate-800' 
                : 'text-slate-600 hover:text-amber-500 hover:bg-slate-100'
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
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }
              `}
            >
              <BellIcon className="w-5 h-5" />
              <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${isDarkMode ? 'border-slate-900' : 'border-white'}`} />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className={`
                absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-50
                ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}
              `}>
                <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`
                        px-4 py-3 border-b last:border-0 cursor-pointer transition-colors
                        ${isDarkMode ? 'border-slate-700/50 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-2 h-2 mt-2 rounded-full shrink-0
                          ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}
                        `} />
                        <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{notif.title}</p>
                          <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <button className="text-sm text-blue-500 hover:text-blue-400 font-medium w-full text-center">
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
                ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}
              `}
            >
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <ChevronDownIcon className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className={`
                absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl overflow-hidden z-50
                ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}
              `}>
                <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Warehouse Admin</p>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>warehouse@sentinel.io</p>
                </div>
                <div className="p-2">
                  {['Profile', 'Settings', 'Help'].map((item) => (
                    <button
                      key={item}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                        ${isDarkMode 
                          ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        }
                      `}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className={`p-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <button
                    onClick={() => navigate('/login')}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                      ${isDarkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}
                    `}
                  >
                    Sign out
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
