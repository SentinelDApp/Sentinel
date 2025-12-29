/**
 * RetailerApp Component
 * Main dashboard view for retailer role in Sentinel supply chain system.
 * Features Transporter-style header with navigation tabs.
 */

import { useState } from 'react';
import { RetailerThemeProvider, useRetailerTheme } from './context/ThemeContext';
import Header from './layout/Header';
import NavigationTabs from './components/NavigationTabs';
import SalesOverview from './components/SalesOverview';
import OrdersTable from './components/OrdersTable';
import ReceivedShipments from './components/ReceivedShipments';
import ShipmentsModal from './components/ShipmentsModal';
import StatsCards from './components/StatsCards';
import { DEMO_ORDERS } from './constants';

// Main Retailer Dashboard Content
function RetailerDashboardContent() {
  const { isDarkMode } = useRetailerTheme();
  
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track if QR scanner is showing expanded result
  const [scannerExpanded, setScannerExpanded] = useState(false);
  
  // Track received shipments (scanned and confirmed by retailer)
  const [receivedShipments, setReceivedShipments] = useState([]);
  
  // Track if shipments modal is open
  const [showAllShipments, setShowAllShipments] = useState(false);
  
  // Track if Accept Shipment modal is open
  const [showAcceptShipment, setShowAcceptShipment] = useState(false);
  
  // Track if orders modal is open
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Handle when retailer confirms receipt of shipment
  const handleShipmentReceived = (shipment, txResult) => {
    const newShipment = {
      id: shipment.id,
      origin: shipment.origin,
      batch: shipment.batch,
      productName: shipment.productName || 'Items',
      itemCount: shipment.itemCount,
      expectedItems: shipment.expectedItems,
      status: shipment.status || 'Received',
      exceptionNote: shipment.exceptionNote || null,
      receivedAt: shipment.scannedAt || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      txHash: txResult.txHash,
      hasException: txResult.exception || false,
    };
    
    setReceivedShipments(prev => [newShipment, ...prev]);
    setShowAcceptShipment(false);
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            {/* Stats Cards */}
            <StatsCards />

            {/* Section Divider */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDarkMode ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-50 border border-cyan-200'}`}>
                  <svg className={`h-4 w-4 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Store Operations</h2>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Scan products & manage orders</p>
                </div>
              </div>
              <div className={`flex-1 h-px ${isDarkMode ? 'bg-gradient-to-r from-slate-700/50 to-transparent' : 'bg-gradient-to-r from-slate-200 to-transparent'}`}></div>
            </div>

            {/* QR Scanner + Orders */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SalesOverview 
                onExpandChange={setScannerExpanded} 
                onShipmentConfirmed={handleShipmentReceived}
              />
              <OrdersTable expandedMode={scannerExpanded} />
            </div>

            {/* Received Shipments Section */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <svg className={`h-4 w-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Received Shipments</h2>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Scanned and added to blockchain</p>
                </div>
              </div>
              <div className={`flex-1 h-px ${isDarkMode ? 'bg-gradient-to-r from-slate-700/50 to-transparent' : 'bg-gradient-to-r from-slate-200 to-transparent'}`}></div>
            </div>

            <ReceivedShipments 
              shipments={receivedShipments} 
              onViewAll={() => setShowAllShipments(true)} 
            />
          </>
        );
      
      case 'inventory':
        return (
          <div className={`rounded-2xl p-8 text-center ${isDarkMode ? 'bg-slate-900/60 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
            <div className={`flex h-16 w-16 mx-auto items-center justify-center rounded-2xl ${isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-50'} mb-4`}>
              <span className="text-3xl">📦</span>
            </div>
            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Inventory Management</h3>
            <p className={`mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Track and manage your store inventory</p>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Coming soon...</p>
          </div>
        );
      
      case 'orders':
        return (
          <div className="space-y-6">
            <OrdersTable expandedMode={true} />
          </div>
        );
      
      case 'shipments':
        return (
          <div className="space-y-6">
            {/* Incoming Shipments */}
            <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-900/60 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Incoming Shipments</h3>
              <SalesOverview 
                onExpandChange={() => {}} 
                onShipmentConfirmed={handleShipmentReceived}
              />
            </div>
            
            {/* Received Shipments */}
            <ReceivedShipments 
              shipments={receivedShipments} 
              onViewAll={() => setShowAllShipments(true)} 
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Navigation Tabs */}
      <NavigationTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {renderTabContent()}
      </main>

      {/* All Shipments Modal */}
      <ShipmentsModal 
        shipments={receivedShipments}
        isOpen={showAllShipments}
        onClose={() => setShowAllShipments(false)}
      />

      {/* Accept Shipment Modal */}
      {showAcceptShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowAcceptShipment(false)}
          />
          <div className={`relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDarkMode ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-50 border border-cyan-200'}`}>
                  <svg className={`h-5 w-5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Accept Shipment</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Scan QR to receive shipment</p>
                </div>
              </div>
              <button
                onClick={() => setShowAcceptShipment(false)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/50 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <SalesOverview 
                onExpandChange={() => {}} 
                onShipmentConfirmed={(shipment, tx) => {
                  handleShipmentReceived(shipment, tx);
                  setTimeout(() => setShowAcceptShipment(false), 1500);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Orders Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowOrdersModal(false)}
          />
          <div className={`relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col ${isDarkMode ? 'bg-slate-900 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDarkMode ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                  <svg className={`h-5 w-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Order History</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>All customer orders</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrdersModal(false)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/50 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <table className="min-w-full">
                <thead className={`${isDarkMode ? 'bg-slate-800/60' : 'bg-slate-50'} sticky top-0`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Order ID</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Product</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Customer</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Date</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                  {DEMO_ORDERS.map((order) => (
                    <tr key={order.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3">
                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{order.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.product}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.customerName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.date}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          order.status === 'Pending' 
                            ? isDarkMode ? 'bg-amber-500/15 text-amber-300 border-amber-500/25' : 'bg-amber-50 text-amber-600 border-amber-200'
                            : order.status === 'In Delivery' 
                            ? isDarkMode ? 'bg-blue-500/15 text-blue-300 border-blue-500/25' : 'bg-blue-50 text-blue-600 border-blue-200'
                            : isDarkMode ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`px-6 py-4 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Total: <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{DEMO_ORDERS.length}</span> orders
              </p>
              <button
                onClick={() => setShowOrdersModal(false)}
                className={`rounded-xl px-5 py-2 text-sm font-medium transition-colors ${isDarkMode ? 'bg-slate-800/60 border border-slate-600/40 text-slate-200 hover:bg-slate-700/50' : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App with Theme Provider
function RetailerApp() {
  return (
    <RetailerThemeProvider>
      <RetailerDashboardContent />
    </RetailerThemeProvider>
  );
}

export default RetailerApp;
