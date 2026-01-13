/**
 * SupplierApp - Main Supplier Dashboard Application
 * 
 * SYSTEM PRINCIPLE:
 * Sentinel records shipment identity on-chain while enabling container-level
 * traceability using off-chain QR codes. The supplier creates shipments with
 * containers, and when marked "Ready for Dispatch", the shipment is permanently
 * locked to the blockchain.
 */

import { useState } from 'react';
import { SupplierThemeProvider, useSupplierTheme } from './context/ThemeContext';
import Header from './layout/Header';
import SupplierOverview from './components/SupplierOverview';
import CreateShipment from './components/CreateShipment';
import ShipmentList from './components/ShipmentList';
import ShipmentActions from './components/ShipmentActions';
import ShipmentDetails from './components/ShipmentDetails';
import UploadMetadata from './components/UploadMetadata';
import { 
  SHIPMENT_STATUSES,
  STATUS_COLORS,
  CONCERN_STATUS,
  generateMetadataHash,
} from './constants';

// Navigation Tabs Component
const NavigationTabs = ({ activeTab, setActiveTab, shipmentsWithConcerns, isDarkMode }) => {
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
                  ? 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
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
  );
};

// Main Supplier Dashboard Content
const SupplierDashboardContent = () => {
  const { isDarkMode } = useSupplierTheme();
  // Shipments state - starts empty, populated when supplier creates shipments
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewingShipmentDetails, setViewingShipmentDetails] = useState(null);

  // Create new shipment
  const handleCreateShipment = (newShipment) => {
    setShipments(prev => [newShipment, ...prev]);
    setActiveTab('dashboard');
  };

  // Mark shipment ready for dispatch (locks to blockchain)
  const handleMarkReady = (shipmentId) => {
    const blockchainTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    setShipments(prev => prev.map(s => {
      if (s.id !== shipmentId) return s;
      
      // Lock all containers
      const lockedContainers = (s.containers || []).map(c => ({
        ...c,
        status: 'LOCKED',
      }));
      
      return { 
        ...s, 
        status: SHIPMENT_STATUSES.READY_FOR_DISPATCH,
        isLocked: true,
        blockchainTxHash,
        containers: lockedContainers,
      };
    }));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({
        ...prev,
        status: SHIPMENT_STATUSES.READY_FOR_DISPATCH,
        isLocked: true,
        blockchainTxHash,
        containers: (prev.containers || []).map(c => ({ ...c, status: 'LOCKED' })),
      }));
    }
  };

  // Assign transporter to shipment (only allowed before dispatch/lock)
  const handleAssignTransporter = (shipmentId, transporterInfo) => {
    setShipments(prev => prev.map(s => {
      if (s.id !== shipmentId) return s;
      // Only allow if not locked
      if (s.isLocked) return s;
      return { 
        ...s, 
        transporterId: transporterInfo.transporterId,
        transporterName: transporterInfo.transporterName,
      };
    }));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => {
        if (prev.isLocked) return prev;
        return { 
          ...prev, 
          transporterId: transporterInfo.transporterId,
          transporterName: transporterInfo.transporterName,
        };
      });
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
      
      return { ...s, concerns: updatedConcerns };
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
    setViewingShipmentDetails(null);
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

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-linear-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-linear-to-br from-slate-50 via-white to-slate-100'
    }`}>
      {/* Header */}
      <Header />

      {/* Navigation */}
      <NavigationTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        shipmentsWithConcerns={shipmentsWithConcerns}
        isDarkMode={isDarkMode}
      />

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
                    ? 'bg-linear-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20' 
                    : 'bg-blue-50 border-blue-200'
                  }
                `}>
                  <p className={`text-3xl font-bold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                    {shipments.reduce((acc, s) => acc + (s.numberOfContainers || s.containers?.length || 0), 0)}
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Total Containers
                  </p>
                </div>
                <div className={`
                  rounded-xl p-4 text-center border
                  ${isDarkMode 
                    ? 'bg-linear-to-br from-green-500/10 to-emerald-500/10 border-green-500/20' 
                    : 'bg-green-50 border-green-200'
                  }
                `}>
                  <p className="text-3xl font-bold text-green-500">
                    {shipments.filter(s => s.isLocked || s.blockchainTxHash).length}
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    On Blockchain
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className={`border-t my-5 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}></div>

              {/* Recent Shipments Quick Info */}
              <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                <span className="text-lg">📦</span> Recent Shipments
              </h3>
              <div className="space-y-2">
                {shipments.slice(0, 5).map((shipment) => (
                  <div 
                    key={shipment.id} 
                    className={`
                      flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer
                      ${isDarkMode 
                        ? 'bg-slate-800/50 hover:bg-slate-800' 
                        : 'bg-slate-50 hover:bg-slate-100'
                      }
                    `}
                    onClick={() => {
                      setSelectedShipment(shipment);
                      setActiveTab('manage');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                        ${isDarkMode 
                          ? 'bg-slate-700 text-slate-300' 
                          : 'bg-slate-200 text-slate-600'
                        }
                      `}>
                        {shipment.numberOfContainers || shipment.containers?.length || 0}
                      </div>
                      <span className={`text-sm font-mono truncate max-w-[120px] ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {shipment.batchId}
                      </span>
                    </div>
                    {shipment.isLocked ? (
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full flex items-center gap-1
                        ${isDarkMode 
                          ? 'text-emerald-400 bg-emerald-500/10' 
                          : 'text-emerald-600 bg-emerald-50'
                        }
                      `}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${isDarkMode 
                          ? 'text-slate-400 bg-slate-700/50' 
                          : 'text-slate-500 bg-slate-100'
                        }
                      `}>
                        Draft
                      </span>
                    )}
                  </div>
                ))}
                {shipments.length === 0 && (
                  <p className={`text-sm text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    No shipments yet
                  </p>
                )}
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
                  className="px-4 py-2 bg-linear-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all"
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
                        ${isDarkMode ? 'bg-linear-to-br from-blue-500/20 to-cyan-500/20' : 'bg-linear-to-br from-blue-100 to-cyan-100'}
                      `}>
                        <span className="text-2xl">📦</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className={`text-lg font-semibold font-mono ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                            {selectedShipment.batchId}
                          </h2>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            STATUS_COLORS[selectedShipment.status]?.bg || ''
                          } ${STATUS_COLORS[selectedShipment.status]?.text || ''} ${
                            STATUS_COLORS[selectedShipment.status]?.border || ''
                          }`}>
                            {STATUS_COLORS[selectedShipment.status]?.label || selectedShipment.status}
                          </span>
                          {selectedShipment.isLocked && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Blockchain Locked
                            </span>
                          )}
                        </div>
                        <p className={`text-sm font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {selectedShipment.shipmentHash || selectedShipment.id}
                        </p>
                        <div className={`flex items-center gap-4 mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span>Containers: <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{selectedShipment.numberOfContainers || selectedShipment.containers?.length || 0}</span></span>
                          <span>•</span>
                          <span>Total: <span className={`font-medium text-emerald-400`}>{selectedShipment.totalQuantity || 0} units</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 lg:shrink-0">
                      <button
                        onClick={() => handleViewDetails(selectedShipment)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25"
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
                      onMarkReady={handleMarkReady}
                      onAssignTransporter={handleAssignTransporter}
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
  );
};

// Main SupplierApp wrapper with Theme Provider
const SupplierApp = () => {
  return (
    <SupplierThemeProvider>
      <SupplierDashboardContent />
    </SupplierThemeProvider>
  );
};

export default SupplierApp;
