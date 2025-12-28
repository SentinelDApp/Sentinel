/**
 * RetailerDashboard Component
 * Main dashboard view for retailer role in Sentinel supply chain system.
 * Contains: Header, Store Operations (QR Scanner + Orders), Received Shipments
 */

import { useState, useRef } from 'react'
import Header from './Header'
import SalesOverview from './SalesOverview'
import OrdersTable from './OrdersTable'

function RetailerDashboard() {
  // Track if QR scanner is showing expanded result
  const [scannerExpanded, setScannerExpanded] = useState(false)
  
  // Track received shipments (scanned and confirmed by retailer)
  const [receivedShipments, setReceivedShipments] = useState([])
  
  // Track if shipments modal is open
  const [showAllShipments, setShowAllShipments] = useState(false)
  
  // Track if Accept Shipment modal is open
  const [showAcceptShipment, setShowAcceptShipment] = useState(false)
  
  // Track if orders modal is open
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  
  // Ref to scroll to QR scanner section
  const scannerRef = useRef(null)

  // Handle when retailer confirms receipt of shipment (batch complete or exception)
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
    }
    
    // Add to beginning of list (most recent first)
    setReceivedShipments(prev => [newShipment, ...prev])
    
    // Close Accept Shipment modal if open
    setShowAcceptShipment(false)
  }
  
  // Header action handlers
  const handleAcceptShipment = () => {
    setShowAcceptShipment(true)
  }
  
  const handleViewReceived = () => {
    setShowAllShipments(true)
  }
  
  const handleViewOrders = () => {
    setShowOrdersModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Pattern Overlay */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjI4MzUiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20 pointer-events-none" />
      
      {/* Main Content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header with Retailer Identity, Alerts & Actions */}
        <Header 
          onAcceptShipment={handleAcceptShipment}
          onViewReceived={handleViewReceived}
          onViewOrders={handleViewOrders}
        />

        {/* Section Divider with Title */}
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Store Operations</h2>
              <p className="text-xs text-slate-500">Scan products & manage orders</p>
            </div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-700/50 to-transparent"></div>
        </div>

        {/* QR Scanner + Orders side by side */}
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Received Shipments</h2>
              <p className="text-xs text-slate-500">Scanned and added to blockchain</p>
            </div>
          </div>
          <div className="flex-1 h-px bg-linear-to-r from-slate-700/50 to-transparent"></div>
        </div>

        {/* Received Shipments Card */}
        <section className="rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 p-6 shadow-xl shadow-cyan-500/5">
          {receivedShipments.length === 0 ? (
            /* Empty State */
            <div className="text-center py-8">
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/50 mb-4">
                <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-400">No shipments received yet</p>
              <p className="text-xs text-slate-500 mt-1">Scan a QR code to receive shipments</p>
            </div>
          ) : (
            /* Shipments Grid */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {receivedShipments.slice(0, 3).map((shipment, index) => (
                  <div 
                    key={`${shipment.id}-${index}`}
                    className={`flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border transition-all ${
                      shipment.hasException 
                        ? 'border-amber-500/30 hover:border-amber-500/50' 
                        : 'border-slate-700/40 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                      shipment.hasException 
                        ? 'bg-amber-500/10 border border-amber-500/20' 
                        : 'bg-emerald-500/10 border border-emerald-500/20'
                    }`}>
                      <svg className={`h-6 w-6 ${shipment.hasException ? 'text-amber-400' : 'text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-white truncate">{shipment.productName || shipment.id}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          shipment.hasException 
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        }`}>
                          {shipment.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-slate-400">From: {shipment.origin}</span>
                        <span className="text-slate-600">•</span>
                        <span className={`text-sm font-semibold ${shipment.hasException ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {shipment.itemCount}{shipment.expectedItems ? `/${shipment.expectedItems}` : ''} items
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="text-xs text-slate-500 font-mono">{shipment.id}</span>
                        <div className="flex items-center gap-1">
                          <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs text-slate-500">{shipment.receivedAt}</span>
                        </div>
                      </div>
                      {shipment.exceptionNote && (
                        <div className="mt-2 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
                          <p className="text-xs text-red-400 truncate">{shipment.exceptionNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Link */}
              {receivedShipments.length > 3 && (
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => setShowAllShipments(true)}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    View all {receivedShipments.length} shipments
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* All Shipments Modal */}
        {showAllShipments && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowAllShipments(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/50 shadow-2xl shadow-cyan-500/10 flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">All Received Shipments</h3>
                    <p className="text-sm text-slate-400">Shipments scanned and confirmed on blockchain</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllShipments(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receivedShipments.map((shipment, index) => (
                    <div 
                      key={`modal-${shipment.id}-${index}`}
                      className={`flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border transition-all ${
                        shipment.hasException 
                          ? 'border-amber-500/30 hover:border-amber-500/50' 
                          : 'border-slate-700/40 hover:border-emerald-500/30'
                      }`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                        shipment.hasException 
                          ? 'bg-amber-500/10 border border-amber-500/20' 
                          : 'bg-emerald-500/10 border border-emerald-500/20'
                      }`}>
                        <svg className={`h-6 w-6 ${shipment.hasException ? 'text-amber-400' : 'text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-white truncate">{shipment.productName || shipment.id}</p>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            shipment.hasException 
                              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          }`}>
                            {shipment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-slate-400">From: {shipment.origin}</span>
                          <span className="text-slate-600">•</span>
                          <span className={`text-sm font-semibold ${shipment.hasException ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {shipment.itemCount}{shipment.expectedItems ? `/${shipment.expectedItems}` : ''} items
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="text-xs text-slate-500 font-mono">{shipment.id}</span>
                          <div className="flex items-center gap-1">
                            <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-slate-500">{shipment.receivedAt}</span>
                          </div>
                        </div>
                        {shipment.exceptionNote && (
                          <div className="mt-2 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
                            <p className="text-xs text-red-400">{shipment.exceptionNote}</p>
                          </div>
                        )}
                        {/* Blockchain TX Hash */}
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-700/30">
                          <svg className="h-3 w-3 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <code className="text-[10px] text-slate-500 font-mono truncate">{shipment.txHash}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Total: <span className="font-medium text-slate-300">{receivedShipments.length}</span> shipments received
                </p>
                <button
                  onClick={() => setShowAllShipments(false)}
                  className="rounded-xl bg-slate-800/60 border border-slate-600/40 px-5 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-6 border-t border-slate-800/50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10">
              <svg className="h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Sentinel</span>
          </div>
          <p className="text-xs text-slate-500">
            Blockchain-Powered Supply Chain Tracking · © 2025
          </p>
        </footer>
      </div>

      {/* Accept Shipment Modal - QR Scanner */}
      {showAcceptShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowAcceptShipment(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/50 shadow-2xl shadow-cyan-500/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Accept Shipment</h3>
                  <p className="text-sm text-slate-400">Scan QR to receive shipment</p>
                </div>
              </div>
              <button
                onClick={() => setShowAcceptShipment(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - QR Scanner */}
            <div className="p-6">
              <SalesOverview 
                onExpandChange={() => {}} 
                onShipmentConfirmed={(shipment, tx) => {
                  handleShipmentReceived(shipment, tx)
                  // Close modal after a brief delay to show success
                  setTimeout(() => setShowAcceptShipment(false), 1500)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Orders Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowOrdersModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/50 shadow-2xl shadow-cyan-500/10 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Order History</h3>
                  <p className="text-sm text-slate-400">All customer orders</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrdersModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
              <table className="min-w-full">
                <thead className="bg-slate-800/60 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {[
                    { id: 'ORD-1045', customerName: 'Ayesha Khan', product: 'Basmati Rice (5kg)', status: 'Pending', date: 'Today' },
                    { id: 'ORD-1044', customerName: 'Rohit Sharma', product: 'Sunflower Oil (1L)', status: 'In Delivery', date: 'Today' },
                    { id: 'ORD-1043', customerName: 'Meera Patel', product: 'Toothpaste', status: 'Delivered', date: 'Today' },
                    { id: 'ORD-1042', customerName: 'Arjun Singh', product: 'Tea Pack (500g)', status: 'Delivered', date: 'Yesterday' },
                    { id: 'ORD-1041', customerName: 'Sara Ali', product: 'Hand Soap', status: 'Delivered', date: 'Yesterday' },
                    { id: 'ORD-1040', customerName: 'Vikram Mehta', product: 'Coffee Powder', status: 'Delivered', date: '2 days ago' },
                    { id: 'ORD-1039', customerName: 'Priya Nair', product: 'Sugar (1kg)', status: 'Delivered', date: '2 days ago' },
                    { id: 'ORD-1038', customerName: 'Anil Kumar', product: 'Milk Powder', status: 'Delivered', date: '3 days ago' },
                  ].map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{order.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-300">{order.product}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-300">{order.customerName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-400">{order.date}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          order.status === 'Pending' ? 'bg-amber-500/15 text-amber-300 border-amber-500/25' :
                          order.status === 'In Delivery' ? 'bg-blue-500/15 text-blue-300 border-blue-500/25' :
                          'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Total: <span className="font-medium text-slate-300">8</span> orders
              </p>
              <button
                onClick={() => setShowOrdersModal(false)}
                className="rounded-xl bg-slate-800/60 border border-slate-600/40 px-5 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RetailerDashboard
