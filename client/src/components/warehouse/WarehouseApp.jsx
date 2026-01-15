import { useState, useEffect, useCallback } from 'react';
import { WarehouseThemeProvider, useWarehouseTheme } from './context/ThemeContext';
import Header from './layout/Header';
import WarehouseOverview from './components/WarehouseOverview';
import IncomingShipments from './components/IncomingShipments';
import ShipmentActions from './components/ShipmentActions';
import ShipmentDetails from './components/ShipmentDetails';
import QRScanner from './components/QRScanner';
import { useAuth } from '../../context/AuthContext';
import { fetchWarehouseShipments } from '../../services/shipmentApi';
import { 
  DEMO_SHIPMENTS, 
  SHIPMENT_STATUSES,
  CONCERN_STATUS,
  STORAGE_ZONES,
  RETAILERS,
  generateTxHash,
} from './constants';

// Navigation Tabs Component
const NavigationTabs = ({ activeTab, setActiveTab, alertCount, dispatchCount, isDarkMode }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'incoming', label: 'Incoming', icon: '📦' },
    { 
      id: 'dispatch', 
      label: 'Order Dispatch', 
      icon: '🚚',
      badge: dispatchCount > 0 ? dispatchCount : null,
    },
    { 
      id: 'manage', 
      label: 'Manage', 
      icon: '⚙️',
      badge: alertCount > 0 ? alertCount : null,
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

// Dispatch Form Component
const DispatchForm = ({ shipment, retailers, onDispatch, isDarkMode }) => {
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const handleDispatch = () => {
    if (selectedRetailer) {
      onDispatch(shipment.id, selectedRetailer);
      setSelectedRetailer('');
      setDispatchNotes('');
      setVehicleNumber('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          Select Retailer *
        </label>
        <select
          value={selectedRetailer}
          onChange={(e) => setSelectedRetailer(e.target.value)}
          className={`
            mt-1 w-full px-3 py-2.5 rounded-xl text-sm
            ${isDarkMode 
              ? 'bg-slate-800 border border-slate-700 text-white' 
              : 'bg-slate-50 border border-slate-200 text-slate-900'
            }
          `}
        >
          <option value="">Choose destination retailer...</option>
          {retailers.map((retailer) => (
            <option key={retailer.id} value={retailer.id}>
              {retailer.name} - {retailer.location}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          Vehicle Number
        </label>
        <input
          type="text"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          placeholder="e.g., MH-12-AB-1234"
          className={`
            mt-1 w-full px-3 py-2.5 rounded-xl text-sm
            ${isDarkMode 
              ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' 
              : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400'
            }
          `}
        />
      </div>

      <div>
        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          Dispatch Notes
        </label>
        <textarea
          value={dispatchNotes}
          onChange={(e) => setDispatchNotes(e.target.value)}
          placeholder="Add any special handling instructions..."
          rows={2}
          className={`
            mt-1 w-full px-3 py-2 rounded-xl text-sm resize-none
            ${isDarkMode 
              ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' 
              : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400'
            }
          `}
        />
      </div>

      <button
        onClick={handleDispatch}
        disabled={!selectedRetailer}
        className={`
          w-full py-3 px-4 rounded-xl font-medium text-sm transition-all
          bg-gradient-to-r from-emerald-500 to-teal-500 text-white
          hover:from-emerald-600 hover:to-teal-600
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg shadow-emerald-500/25
        `}
      >
        🚚 Dispatch to {retailers.find(r => r.id === selectedRetailer)?.name || 'Retailer'}
      </button>

      <p className={`text-xs text-center ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        This action will be recorded on the blockchain
      </p>
    </div>
  );
};

// Main Warehouse Dashboard Content
const WarehouseDashboardContent = () => {
  const { isDarkMode } = useWarehouseTheme();
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewingShipmentDetails, setViewingShipmentDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);
  const [shipmentsError, setShipmentsError] = useState(null);

  // Map backend shipment status to warehouse status
  const mapBackendStatusToWarehouseStatus = (status) => {
    switch (status) {
      case 'created':
      case 'ready_for_dispatch':
      case 'in_transit':
        return SHIPMENT_STATUSES.PENDING;
      case 'at_warehouse':
        return SHIPMENT_STATUSES.RECEIVED;
      case 'delivered':
        return SHIPMENT_STATUSES.DISPATCHED;
      default:
        return SHIPMENT_STATUSES.PENDING;
    }
  };

  // Fetch shipments assigned to this warehouse
  const loadShipments = useCallback(async () => {
    if (!user?.walletAddress) return;
    
    setIsLoadingShipments(true);
    setShipmentsError(null);
    
    try {
      const result = await fetchWarehouseShipments(user.walletAddress);
      // Transform shipments to warehouse format for UI compatibility
      const warehouseShipments = result.shipments.map(shipment => ({
        id: shipment.shipmentHash,
        shipmentHash: shipment.shipmentHash,
        productName: shipment.productName || `Batch ${shipment.batchId}`,
        batchId: shipment.batchId,
        supplierName: 'Supplier',
        supplierWallet: shipment.supplierWallet,
        quantity: shipment.totalQuantity,
        numberOfContainers: shipment.numberOfContainers,
        status: mapBackendStatusToWarehouseStatus(shipment.status),
        createdAt: shipment.createdAt,
        expectedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        assignedTransporter: shipment.assignedTransporter,
        assignedWarehouse: shipment.assignedWarehouse,
        transporterName: shipment.assignedTransporter?.name || 'Assigned Transporter',
        concerns: [],
      }));
      setShipments(warehouseShipments);
    } catch (error) {
      console.error('Failed to fetch warehouse shipments:', error);
      setShipmentsError('Failed to load shipments. Please try again.');
      // Fallback to demo data for UI testing
      setShipments(DEMO_SHIPMENTS);
    } finally {
      setIsLoadingShipments(false);
    }
  }, [user?.walletAddress]);

  // Load shipments on mount and when user changes
  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  // Receive shipment (update status to received)
  const handleReceiveShipment = (shipmentId) => {
    setShipments(prev => prev.map(s => 
      s.id === shipmentId 
        ? { 
            ...s, 
            status: SHIPMENT_STATUSES.RECEIVED,
            receivedAt: new Date().toISOString(),
            blockchainTxId: generateTxHash(),
          } 
        : s
    ));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({ 
        ...prev, 
        status: SHIPMENT_STATUSES.RECEIVED,
        receivedAt: new Date().toISOString(),
      }));
    }
  };

  // Verify shipment
  const handleVerifyShipment = (shipmentId, verificationData) => {
    setShipments(prev => prev.map(s => 
      s.id === shipmentId 
        ? { 
            ...s, 
            status: SHIPMENT_STATUSES.VERIFIED,
            verifiedAt: new Date().toISOString(),
            verification: verificationData,
            blockchainTxId: generateTxHash(),
          } 
        : s
    ));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({ 
        ...prev, 
        status: SHIPMENT_STATUSES.VERIFIED,
        verifiedAt: new Date().toISOString(),
        verification: verificationData,
      }));
    }
  };

  // Assign storage zone
  const handleAssignStorage = (shipmentId, zoneId) => {
    const zone = STORAGE_ZONES.find(z => z.id === zoneId);
    
    setShipments(prev => prev.map(s => 
      s.id === shipmentId 
        ? { 
            ...s, 
            status: SHIPMENT_STATUSES.STORED,
            storedAt: new Date().toISOString(),
            storageZone: zoneId,
            storageZoneName: zone?.name,
            blockchainTxId: generateTxHash(),
          } 
        : s
    ));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({ 
        ...prev, 
        status: SHIPMENT_STATUSES.STORED,
        storedAt: new Date().toISOString(),
        storageZone: zoneId,
        storageZoneName: zone?.name,
      }));
    }
  };

  // Mark ready for dispatch
  const handleMarkReadyForDispatch = (shipmentId) => {
    setShipments(prev => prev.map(s => 
      s.id === shipmentId 
        ? { 
            ...s, 
            status: SHIPMENT_STATUSES.READY_FOR_DISPATCH,
            readyAt: new Date().toISOString(),
            blockchainTxId: generateTxHash(),
          } 
        : s
    ));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({ 
        ...prev, 
        status: SHIPMENT_STATUSES.READY_FOR_DISPATCH,
        readyAt: new Date().toISOString(),
      }));
    }
  };

  // Dispatch shipment
  const handleDispatchShipment = (shipmentId, retailerId) => {
    const retailer = RETAILERS.find(r => r.id === retailerId);
    
    setShipments(prev => prev.map(s => 
      s.id === shipmentId 
        ? { 
            ...s, 
            status: SHIPMENT_STATUSES.DISPATCHED,
            dispatchedAt: new Date().toISOString(),
            retailerId,
            retailerName: retailer?.name,
            blockchainTxId: generateTxHash(),
          } 
        : s
    ));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({ 
        ...prev, 
        status: SHIPMENT_STATUSES.DISPATCHED,
        dispatchedAt: new Date().toISOString(),
        retailerId,
        retailerName: retailer?.name,
      }));
    }
  };

  // Raise concern
  const handleRaiseConcern = (shipmentId, concernData) => {
    const concernId = `CON-${Date.now()}`;
    const concern = {
      id: concernId,
      ...concernData,
      status: CONCERN_STATUS.OPEN,
      raisedAt: new Date().toISOString(),
    };

    setShipments(prev => prev.map(s => 
      s.id === shipmentId 
        ? { 
            ...s, 
            status: SHIPMENT_STATUSES.CONCERN_RAISED,
            concern,
          } 
        : s
    ));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({ 
        ...prev, 
        status: SHIPMENT_STATUSES.CONCERN_RAISED,
        concern,
      }));
    }
  };

  // Resolve concern
  const handleResolveConcern = (shipmentId, resolution) => {
    setShipments(prev => prev.map(s => {
      if (s.id !== shipmentId) return s;
      
      return { 
        ...s, 
        status: SHIPMENT_STATUSES.VERIFIED,
        concern: {
          ...s.concern,
          status: CONCERN_STATUS.RESOLVED,
          resolvedAt: new Date().toISOString(),
          resolution,
        },
      };
    }));
    
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => ({
        ...prev,
        status: SHIPMENT_STATUSES.VERIFIED,
        concern: {
          ...prev.concern,
          status: CONCERN_STATUS.RESOLVED,
          resolvedAt: new Date().toISOString(),
          resolution,
        },
      }));
    }
  };

  // Select shipment and switch to manage tab
  const handleSelectShipment = (shipment) => {
    setSelectedShipment(shipment);
    setViewingShipmentDetails(null);
    setActiveTab('manage');
  };

  // Close details view
  const handleCloseDetails = () => {
    setViewingShipmentDetails(null);
  };

  // Count shipments with open concerns for badge
  const alertCount = shipments.filter(s => 
    s.concern?.status === CONCERN_STATUS.OPEN
  ).length;

  // Count shipments ready for dispatch
  const dispatchCount = shipments.filter(s => 
    s.status === SHIPMENT_STATUSES.STORED || 
    s.status === SHIPMENT_STATUSES.READY_FOR_DISPATCH
  ).length;

  // Filter shipments based on search
  const filteredShipments = shipments.filter(s => 
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-linear-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-linear-to-br from-slate-50 via-white to-slate-100'
    }`}>
      {/* Header */}
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Navigation */}
      <NavigationTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        alertCount={alertCount}
        dispatchCount={dispatchCount}
        isDarkMode={isDarkMode}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <WarehouseOverview shipments={filteredShipments} isDarkMode={isDarkMode} />
            <IncomingShipments 
              shipments={filteredShipments} 
              selectedShipment={selectedShipment} 
              onShipmentSelect={handleSelectShipment}
              onReceive={handleReceiveShipment}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Incoming Tab */}
        {activeTab === 'incoming' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <IncomingShipments 
                shipments={filteredShipments.filter(s => 
                  s.status === SHIPMENT_STATUSES.PENDING || 
                  s.status === SHIPMENT_STATUSES.RECEIVED
                )} 
                selectedShipment={selectedShipment} 
                onShipmentSelect={handleSelectShipment}
                onReceive={handleReceiveShipment}
                isDarkMode={isDarkMode}
              />
            </div>
            <div>
              <QRScanner 
                onScanComplete={(data) => {
                  const shipment = shipments.find(s => s.id === data);
                  if (shipment) handleSelectShipment(shipment);
                }}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {/* Order Dispatch Tab */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            {/* Dispatch Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`rounded-2xl p-5 border ${
                isDarkMode ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'
              }`}>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {shipments.filter(s => s.status === SHIPMENT_STATUSES.STORED).length}
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Stored & Ready</p>
              </div>
              <div className={`rounded-2xl p-5 border ${
                isDarkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
              }`}>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {shipments.filter(s => s.status === SHIPMENT_STATUSES.READY_FOR_DISPATCH).length}
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Pending Dispatch</p>
              </div>
              <div className={`rounded-2xl p-5 border ${
                isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {shipments.filter(s => s.status === SHIPMENT_STATUSES.DISPATCHED).length}
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Dispatched Today</p>
              </div>
              <div className={`rounded-2xl p-5 border ${
                isDarkMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
              }`}>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {RETAILERS.length}
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Active Retailers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ready for Dispatch List */}
              <div className="lg:col-span-2">
                <div className={`rounded-2xl border overflow-hidden ${
                  isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className={`px-5 py-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      🚚 Orders Ready for Dispatch
                    </h3>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Select an order to assign retailer and dispatch
                    </p>
                  </div>
                  
                  <div className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {filteredShipments.filter(s => 
                      s.status === SHIPMENT_STATUSES.STORED || 
                      s.status === SHIPMENT_STATUSES.READY_FOR_DISPATCH
                    ).length === 0 ? (
                      <div className="p-8 text-center">
                        <span className="text-4xl">📦</span>
                        <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          No orders ready for dispatch
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          Orders will appear here once verified and stored
                        </p>
                      </div>
                    ) : (
                      filteredShipments.filter(s => 
                        s.status === SHIPMENT_STATUSES.STORED || 
                        s.status === SHIPMENT_STATUSES.READY_FOR_DISPATCH
                      ).map(shipment => (
                        <div
                          key={shipment.id}
                          onClick={() => setSelectedShipment(shipment)}
                          className={`p-4 cursor-pointer transition-all ${
                            selectedShipment?.id === shipment.id
                              ? isDarkMode 
                                ? 'bg-blue-500/10 border-l-2 border-l-blue-500' 
                                : 'bg-blue-50 border-l-2 border-l-blue-500'
                              : isDarkMode 
                                ? 'hover:bg-slate-800/50' 
                                : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {shipment.id}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  shipment.status === SHIPMENT_STATUSES.READY_FOR_DISPATCH
                                    ? 'bg-indigo-500/20 text-indigo-400'
                                    : 'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {shipment.status === SHIPMENT_STATUSES.READY_FOR_DISPATCH ? 'Ready' : 'Stored'}
                                </span>
                              </div>
                              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {shipment.productName}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs">
                                <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>
                                  📦 {shipment.quantity} units
                                </span>
                                {shipment.storageZoneName && (
                                  <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>
                                    📍 {shipment.storageZoneName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-2xl ${shipment.priority === 'high' || shipment.priority === 'critical' ? '' : 'opacity-30'}`}>
                                {shipment.priority === 'critical' ? '🔴' : shipment.priority === 'high' ? '🟡' : '⚪'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Dispatch Actions */}
              <div className="space-y-6">
                {selectedShipment && (
                  selectedShipment.status === SHIPMENT_STATUSES.STORED || 
                  selectedShipment.status === SHIPMENT_STATUSES.READY_FOR_DISPATCH
                ) ? (
                  <div className={`rounded-2xl border p-5 space-y-4 ${
                    isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div>
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Dispatch: {selectedShipment?.id}
                      </h3>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {selectedShipment?.productName}
                      </p>
                    </div>

                    {selectedShipment?.status === SHIPMENT_STATUSES.STORED && (
                      <div className="space-y-3">
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Mark this shipment as ready for dispatch
                        </p>
                        <button
                          onClick={() => handleMarkReadyForDispatch(selectedShipment.id)}
                          className="w-full py-2.5 px-4 rounded-xl font-medium text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transition-all"
                        >
                          🚀 Mark Ready for Dispatch
                        </button>
                      </div>
                    )}

                    {selectedShipment?.status === SHIPMENT_STATUSES.READY_FOR_DISPATCH && (
                      <DispatchForm 
                        shipment={selectedShipment}
                        retailers={RETAILERS}
                        onDispatch={handleDispatchShipment}
                        isDarkMode={isDarkMode}
                      />
                    )}
                  </div>
                ) : (
                  <div className={`rounded-2xl border p-8 text-center ${
                    isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <span className="text-4xl">👈</span>
                    <p className={`mt-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Select an order
                    </p>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      Choose an order from the list to dispatch
                    </p>
                  </div>
                )}

                {/* Retailers Quick View */}
                <div className={`rounded-2xl border overflow-hidden ${
                  isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className={`px-5 py-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <h4 className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      📍 Active Retailers
                    </h4>
                  </div>
                  <div className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {RETAILERS.map(retailer => (
                      <div key={retailer.id} className="px-5 py-3">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {retailer.name}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          {retailer.location}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {selectedShipment ? (
                <>
                  <ShipmentDetails 
                    shipment={selectedShipment} 
                    onClose={() => setSelectedShipment(null)}
                    isDarkMode={isDarkMode}
                  />
                  <ShipmentActions 
                    shipment={selectedShipment}
                    onVerify={handleVerifyShipment}
                    onAssignStorage={handleAssignStorage}
                    onMarkReady={handleMarkReadyForDispatch}
                    onDispatch={handleDispatchShipment}
                    onRaiseConcern={handleRaiseConcern}
                    onResolveConcern={handleResolveConcern}
                    storageZones={STORAGE_ZONES}
                    retailers={RETAILERS}
                    isDarkMode={isDarkMode}
                  />
                </>
              ) : (
                <div className={`
                  rounded-2xl p-12 text-center
                  ${isDarkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'}
                `}>
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    No Shipment Selected
                  </h3>
                  <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Select a shipment from the list to view details and take actions
                  </p>
                </div>
              )}
            </div>
            <div>
              <IncomingShipments 
                shipments={filteredShipments} 
                selectedShipment={selectedShipment} 
                onShipmentSelect={handleSelectShipment}
                onReceive={handleReceiveShipment}
                isDarkMode={isDarkMode}
                compact={true}
                title="All Shipments"
              />
            </div>
          </div>
        )}
      </main>

      {/* Shipment Details Modal */}
      {viewingShipmentDetails && (
        <ShipmentDetails 
          shipment={viewingShipmentDetails} 
          onClose={handleCloseDetails}
          isModal={true}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

// Main App with Theme Provider
const WarehouseApp = () => {
  return (
    <WarehouseThemeProvider>
      <WarehouseDashboardContent />
    </WarehouseThemeProvider>
  );
};

export default WarehouseApp;
