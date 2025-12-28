import { useState } from 'react';
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
  CONCERN_STATUS,
  TRANSPORTER_AGENCIES,
  generateMetadataHash,
} from './supplier.constants';

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState(DEMO_SHIPMENTS);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewingShipmentDetails, setViewingShipmentDetails] = useState(null); // For QR code view

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
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <span className="text-xl">🛡️</span>
                </div>
                <h1 className="text-xl font-bold text-slate-50">Sentinel</h1>
              </Link>
              <span className="text-sm text-slate-400 hidden sm:inline">Supplier Portal</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-3 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
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
            <SupplierOverview shipments={shipments} />
            <ShipmentList 
              shipments={shipments} 
              selectedShipment={selectedShipment} 
              onShipmentSelect={handleSelectShipment} 
            />
          </div>
        )}

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form - Takes 2 columns */}
            <div className="lg:col-span-2 h-fit">
              <CreateShipment onCreateShipment={handleCreateShipment} />
            </div>

            {/* Sidebar - Info */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 h-fit">
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-slate-50">{shipments.length}</p>
                  <p className="text-xs text-slate-400 mt-1">Total Shipments</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">
                    {shipments.filter(s => s.status === SHIPMENT_STATUSES.DELIVERED).length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Delivered</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-700 my-5"></div>

              {/* Approved Transporters */}
              <h3 className="text-sm font-semibold text-slate-50 mb-4 flex items-center gap-2">
                <span className="text-lg">🚚</span> Approved Transporters
              </h3>
              <div className="space-y-2">
                {TRANSPORTER_AGENCIES.slice(0, 4).map((transporter) => (
                  <div key={transporter.id} className="flex items-center justify-between p-2.5 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-slate-300">
                        {transporter.name.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-200">{transporter.name}</span>
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
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
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-50 mb-2">No Shipment Selected</h3>
                <p className="text-slate-400 mb-4">
                  Select a shipment from the Dashboard to manage it
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {selectedShipment && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Actions or Details */}
                {viewingShipmentDetails ? (
                  <ShipmentDetails 
                    shipment={viewingShipmentDetails} 
                    onClose={handleCloseDetails} 
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Quick Actions Bar */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(selectedShipment)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        View QR Code
                      </button>
                      <button
                        onClick={() => setSelectedShipment(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 text-sm font-medium rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Deselect
                      </button>
                    </div>
                    <ShipmentActions 
                      shipment={selectedShipment} 
                      onAssignTransporter={handleAssignTransporter} 
                      onMarkReady={handleMarkReady}
                      onAcknowledgeConcern={handleAcknowledgeConcern}
                      onResolveConcern={handleResolveConcern}
                    />
                  </div>
                )}
                <UploadMetadata 
                  shipment={selectedShipment} 
                  onUploadComplete={handleMetadataUpload} 
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SupplierDashboard;
