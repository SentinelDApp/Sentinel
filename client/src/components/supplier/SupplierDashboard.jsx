import { useState, createContext, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SupplierOverview from './SupplierOverview';
import CreateShipment from './CreateShipment';
import ShipmentList from './ShipmentList';
import ShipmentActions from './ShipmentActions';
import ShipmentDetails from './ShipmentDetails';
import UploadMetadata from './UploadMetadata';
import { 
  DEMO_SHIPMENTS, 
  SHIPMENT_STATUSES,
  STATUS_COLORS,
  CONCERN_STATUS,
  TRANSPORTER_AGENCIES,
  generateMetadataHash,
} from './supplier.constants';

// Icons
const SunIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const ShieldCheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const SearchIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const BellIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

// Theme Context for Supplier
const SupplierThemeContext = createContext();

export const useSupplierTheme = () => {
  const context = useContext(SupplierThemeContext);
  if (!context) {
    throw new Error('useSupplierTheme must be used within SupplierDashboard');
  }
  return context;
};

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [shipments, setShipments] = useState(DEMO_SHIPMENTS);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewingShipmentDetails, setViewingShipmentDetails] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const notifications = [
    { id: 1, title: 'Shipment SHP-001 picked up', time: '5 min ago', type: 'success' },
    { id: 2, title: 'New concern raised on SHP-003', time: '1 hour ago', type: 'warning' },
    { id: 3, title: 'Transporter assigned to SHP-002', time: '3 hours ago', type: 'info' },
  ];

  // Create new shipment
  const handleCreateShipment = (newShipment) => {
    setShipments(prev => [newShipment, ...prev]);
    setActiveTab('dashboard');
  };

  // Assign transporter to shipment
  const handleAssignTransporter = (shipmentId, transporterId) => {
    const transporterName = TRANSPORTER_AGENCIES.find(t => t.id === transporterId)?.name || null;
    
    setShipments(prev => prev.map(s => 
      s.id === shipmentId 
        ? { ...s, transporterId, transporterName } 
        : s
    ));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({ ...prev, transporterId, transporterName }));
    }
  };

  // Mark shipment ready for dispatch
  const handleMarkReady = (shipmentId) => {
    setShipments(prev => prev.map(s => 
      s.id === shipmentId 
        ? { ...s, status: SHIPMENT_STATUSES.READY_FOR_DISPATCH } 
        : s
    ));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({ ...prev, status: SHIPMENT_STATUSES.READY_FOR_DISPATCH }));
    }
  };

  // Upload metadata (off-chain)
  const handleMetadataUpload = (shipmentId, files) => {
    const metadataHash = generateMetadataHash({ files, uploadedAt: Date.now() });
    const metadata = {
      hash: metadataHash,
      documents: files.map(f => f.name),
      uploadedAt: Date.now(),
    };
    
    setShipments(prev => prev.map(s => 
      s.id === shipmentId 
        ? { ...s, metadata } 
        : s
    ));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({ ...prev, metadata }));
    }
  };

  // Acknowledge a concern
  const handleAcknowledgeConcern = (shipmentId, concernId) => {
    setShipments(prev => prev.map(s => {
      if (s.id !== shipmentId) return s;
      
      const updatedConcerns = s.concerns.map(c => 
        c.id === concernId 
          ? { ...c, status: CONCERN_STATUS.ACKNOWLEDGED, acknowledgedAt: Date.now() }
          : c
      );
      
      return { ...s, concerns: updatedConcerns };
    }));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({
        ...prev,
        concerns: prev.concerns.map(c =>
          c.id === concernId
            ? { ...c, status: CONCERN_STATUS.ACKNOWLEDGED, acknowledgedAt: Date.now() }
            : c
        ),
      }));
    }
  };

  // Resolve a concern
  const handleResolveConcern = (shipmentId, concernId, resolution) => {
    setShipments(prev => prev.map(s => {
      if (s.id !== shipmentId) return s;
      
      const updatedConcerns = s.concerns.map(c => 
        c.id === concernId 
          ? { ...c, status: CONCERN_STATUS.RESOLVED, resolvedAt: Date.now(), resolution }
          : c
      );
      
      // Check if all concerns are resolved to update shipment status
      const hasOpenConcerns = updatedConcerns.some(c => 
        c.status === CONCERN_STATUS.OPEN || c.status === CONCERN_STATUS.ACKNOWLEDGED
      );
      
      return { 
        ...s, 
        concerns: updatedConcerns,
        // If was in concern_raised status and all concerns resolved, keep previous status
        // In real app, would need to track previous status
      };
    }));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({
        ...prev,
        concerns: prev.concerns.map(c =>
          c.id === concernId
            ? { ...c, status: CONCERN_STATUS.RESOLVED, resolvedAt: Date.now(), resolution }
            : c
        ),
      }));
    }
  };

  // Select shipment and switch to manage tab
  const handleSelectShipment = (shipment) => {
    setSelectedShipment(shipment);
    setViewingShipmentDetails(null); // Reset details view when selecting a new shipment
    setActiveTab('manage');
  };

  // View shipment details (QR code view)
  const handleViewDetails = (shipment) => {
    setViewingShipmentDetails(shipment);
  };

  // Close details view
  const handleCloseDetails = () => {
    setViewingShipmentDetails(null);
  };

  // Count shipments with open concerns for badge
  const shipmentsWithConcerns = shipments.filter(s => 
    s.concerns?.some(c => c.status === CONCERN_STATUS.OPEN)
  ).length;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'create', label: 'Create Shipment', icon: '➕' },
    { 
      id: 'manage', 
      label: 'Manage', 
      icon: '⚙️',
      badge: shipmentsWithConcerns > 0 ? shipmentsWithConcerns : null,
    },
  ];

  return (
    <SupplierThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <div className={`min-h-screen transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}>
        {/* Header */}
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Supplier
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
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
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
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>John Doe</p>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>john@sentinel.io</p>
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

        {/* Navigation */}
        <nav className={`
          backdrop-blur-xl border-b transition-colors duration-200
          ${isDarkMode 
            ? 'bg-slate-900/50 border-slate-800' 
            : 'bg-white/50 border-slate-200'
          }
        `}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 py-3 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <SupplierOverview shipments={shipments} isDarkMode={isDarkMode} />
              <ShipmentList 
                shipments={shipments} 
                selectedShipment={selectedShipment} 
                onShipmentSelect={handleSelectShipment}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {/* Create Tab */}
          {activeTab === 'create' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form - Takes 2 columns */}
              <div className="lg:col-span-2 h-fit">
                <CreateShipment onCreateShipment={handleCreateShipment} isDarkMode={isDarkMode} />
              </div>

              {/* Sidebar - Info */}
              <div className={`
                border rounded-2xl p-5 h-fit transition-colors duration-200
                ${isDarkMode 
                  ? 'bg-slate-900/50 border-slate-800' 
                  : 'bg-white border-slate-200 shadow-sm'
                }
              `}>
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className={`
                    rounded-xl p-4 text-center border
                    ${isDarkMode 
                      ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20' 
                      : 'bg-blue-50 border-blue-200'
                    }
                  `}>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                      {shipments.length}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Total Shipments
                    </p>
                  </div>
                  <div className={`
                    rounded-xl p-4 text-center border
                    ${isDarkMode 
                      ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20' 
                      : 'bg-green-50 border-green-200'
                    }
                  `}>
                    <p className="text-3xl font-bold text-green-500">
                      {shipments.filter(s => s.status === SHIPMENT_STATUSES.DELIVERED).length}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Delivered
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className={`border-t my-5 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}></div>

                {/* Approved Transporters */}
                <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                  <span className="text-lg">🚚</span> Approved Transporters
                </h3>
                <div className="space-y-2">
                  {TRANSPORTER_AGENCIES.slice(0, 4).map((transporter) => (
                    <div 
                      key={transporter.id} 
                      className={`
                        flex items-center justify-between p-2.5 rounded-lg transition-colors
                        ${isDarkMode 
                          ? 'bg-slate-800/50 hover:bg-slate-800' 
                          : 'bg-slate-50 hover:bg-slate-100'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                          ${isDarkMode 
                            ? 'bg-slate-700 text-slate-300' 
                            : 'bg-slate-200 text-slate-600'
                          }
                        `}>
                          {transporter.name.charAt(0)}
                        </div>
                        <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                          {transporter.name}
                        </span>
                      </div>
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${isDarkMode 
                          ? 'text-emerald-400 bg-emerald-500/10' 
                          : 'text-emerald-600 bg-emerald-50'
                        }
                      `}>
                        Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Manage Tab */}
          {activeTab === 'manage' && (
            <div className="space-y-6">
              {!selectedShipment && (
                <div className={`
                  border rounded-2xl p-8 text-center transition-colors duration-200
                  ${isDarkMode 
                    ? 'bg-slate-900/50 border-slate-800' 
                    : 'bg-white border-slate-200 shadow-sm'
                  }
                `}>
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
                    ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}
                  `}>
                    <svg className={`w-8 h-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                    No Shipment Selected
                  </h3>
                  <p className={`mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Select a shipment from the Dashboard to manage it
                  </p>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}

              {selectedShipment && (
                <div className="space-y-6">
                  {/* Selected Shipment Header Card */}
                  <div className={`
                    border rounded-2xl p-5 transition-colors duration-200
                    ${isDarkMode 
                      ? 'bg-slate-900/50 border-slate-800' 
                      : 'bg-white border-slate-200 shadow-sm'
                    }
                  `}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Shipment Info */}
                      <div className="flex items-start gap-4">
                        <div className={`
                          w-14 h-14 rounded-xl flex items-center justify-center shrink-0
                          ${isDarkMode ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' : 'bg-gradient-to-br from-blue-100 to-cyan-100'}
                        `}>
                          <span className="text-2xl">📦</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                              {selectedShipment.productName}
                            </h2>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                              STATUS_COLORS[selectedShipment.status]?.bg || ''
                            } ${STATUS_COLORS[selectedShipment.status]?.text || ''} ${
                              STATUS_COLORS[selectedShipment.status]?.border || ''
                            }`}>
                              {STATUS_COLORS[selectedShipment.status]?.label || selectedShipment.status}
                            </span>
                          </div>
                          <p className={`text-sm font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {selectedShipment.id}
                          </p>
                          <div className={`flex items-center gap-4 mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span>Batch: <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{selectedShipment.batchId}</span></span>
                            <span>•</span>
                            <span>Qty: <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{selectedShipment.quantity} {selectedShipment.unit}</span></span>
                            {selectedShipment.transporterName && (
                              <>
                                <span>•</span>
                                <span>🚚 <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{selectedShipment.transporterName}</span></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 lg:shrink-0">
                        <button
                          onClick={() => handleViewDetails(selectedShipment)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                        <button
                          onClick={() => setSelectedShipment(null)}
                          className={`
                            flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors border
                            ${isDarkMode 
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                            }
                          `}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Details or Actions */}
                    {viewingShipmentDetails ? (
                      <ShipmentDetails 
                        shipment={viewingShipmentDetails} 
                        onClose={handleCloseDetails}
                        isDarkMode={isDarkMode}
                      />
                    ) : (
                      <ShipmentActions 
                        shipment={selectedShipment} 
                        onAssignTransporter={handleAssignTransporter} 
                        onMarkReady={handleMarkReady}
                        onAcknowledgeConcern={handleAcknowledgeConcern}
                        onResolveConcern={handleResolveConcern}
                        isDarkMode={isDarkMode}
                      />
                    )}

                    {/* Right Column: Upload Metadata */}
                    <UploadMetadata 
                      shipment={selectedShipment} 
                      onUploadComplete={handleMetadataUpload}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </SupplierThemeContext.Provider>
  );
};

export default SupplierDashboard;
