/**
 * QRScannerUI Component
 * Reusable QR Scanner UI for Sentinel blockchain supply chain system.
 * Used by: Retailer (to receive shipments), Transporter (to scan and add to chain)
 * 
 * Features:
 * - Scan shipment QR to load expected items
 * - Manual one-by-one item scanning
 * - Auto-confirmation to blockchain for each item
 * - Exception reporting for missing/damaged items
 * - Real-time progress tracking
 */
import { useState, useEffect } from 'react'
import useQRScanner, { SCANNER_ROLES } from '../../hooks/useQRScanner'

/**
 * QRScannerUI Component
 * @param {Object} props
 * @param {string} props.role - Scanner role ('retailer' or 'transporter')
 * @param {string} props.walletAddress - Connected wallet address
 * @param {Function} props.onShipmentReceived - Callback when shipment batch is complete
 * @param {Function} props.onExpandChange - Callback when scanner expands/collapses
 */
function QRScannerUI({ 
  role = SCANNER_ROLES.RETAILER, 
  walletAddress = '0x7a3d...f829',
  onShipmentReceived = null,
  onExpandChange = null
}) {
  const [showExceptionModal, setShowExceptionModal] = useState(false)
  const [exceptionNote, setExceptionNote] = useState('')

  // Use shared QR scanning hook
  const {
    shipmentData,
    scannedItems,
    currentItem,
    exceptionMessage,
    progress,
    isReady,
    isLoadingShipment,
    isReadyToScan,
    isScanningOne,
    isCompleted,
    hasException,
    startShipmentScan,
    scanOneItem,
    reportException,
    resetScanner,
  } = useQRScanner({
    role,
    walletAddress,
    onScanProgress: (scanned, total, item) => {
      console.log(`Scanned ${scanned}/${total}:`, item.itemId)
    },
    onBatchComplete: (shipment, count, items) => {
      console.log(`Batch complete: ${count} items received`)
      if (onShipmentReceived) {
        // Pass shipment data with proper structure for received shipments list
        const completedShipment = {
          id: shipment.id,
          origin: shipment.origin,
          batch: shipment.batch,
          productName: shipment.productName,
          itemCount: count,
          expectedItems: shipment.expectedItems,
          status: 'Received',
          scannedAt: shipment.scannedAt,
        }
        // Create a transaction-like object with combined tx hash
        const txResult = {
          txHash: items.length > 0 ? items[items.length - 1].txHash : `0x${Date.now().toString(16)}`,
          timestamp: new Date().toISOString(),
          itemsConfirmed: count,
        }
        onShipmentReceived(completedShipment, txResult)
      }
    },
    onException: (exceptionData) => {
      console.log('Exception reported:', exceptionData)
      if (onShipmentReceived && exceptionData.scannedCount > 0) {
        // Even with exception, report what was received
        const partialShipment = {
          id: exceptionData.shipment.id,
          origin: exceptionData.shipment.origin,
          batch: exceptionData.shipment.batch,
          productName: exceptionData.shipment.productName,
          itemCount: exceptionData.scannedCount,
          expectedItems: exceptionData.expectedCount,
          status: 'Partial',
          exceptionNote: exceptionData.message,
          scannedAt: exceptionData.shipment.scannedAt,
        }
        const txResult = {
          txHash: exceptionData.scannedItems.length > 0 ? exceptionData.scannedItems[exceptionData.scannedItems.length - 1].txHash : `0x${Date.now().toString(16)}`,
          timestamp: new Date().toISOString(),
          itemsConfirmed: exceptionData.scannedCount,
          exception: true,
        }
        onShipmentReceived(partialShipment, txResult)
      }
    },
  })

  // Notify parent when scanner expands/collapses
  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isReadyToScan || isScanningOne || isCompleted || hasException)
    }
  }, [isReadyToScan, isScanningOne, isCompleted, hasException, onExpandChange])

  // Handle exception submission
  const handleReportException = () => {
    reportException(exceptionNote || 'Items missing from shipment')
    setShowExceptionModal(false)
    setExceptionNote('')
  }

  // Get role-specific text
  const getRoleText = () => {
    if (role === SCANNER_ROLES.RETAILER) {
      return {
        title: 'Receive Shipment',
        subtitle: 'Scan items one by one',
        loadButton: 'Load Shipment',
        scanButton: 'Scan QR Code',
        completedTitle: 'Shipment Received',
        exceptionTitle: 'Partial Receipt',
      }
    }
    return {
      title: 'Process Shipment',
      subtitle: 'Scan items one by one',
      loadButton: 'Load Shipment',
      scanButton: 'Scan QR Code',
      completedTitle: 'Shipment Processed',
      exceptionTitle: 'Partial Processing',
    }
  }

  const roleText = getRoleText()

  return (
    <section className="rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 p-6 shadow-xl shadow-cyan-500/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6 20h2M6 8h2m8 0h2M6 4h2m8 0h2" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{roleText.title}</h2>
            <p className="text-sm text-slate-400">{roleText.subtitle}</p>
          </div>
        </div>
        {(isCompleted || hasException) && (
          <button
            onClick={resetScanner}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            New Shipment
          </button>
        )}
      </div>

      {/* Scanner Content */}
      <div className="flex-1">
        
        {/* Ready State - Load Shipment */}
        {isReady && (
          <div className="h-full flex flex-col">
            {/* Viewfinder */}
            <div className="relative flex-1 min-h-[200px] rounded-2xl bg-slate-800/60 border-2 border-dashed border-slate-600 overflow-hidden">
              {/* Corner Markers */}
              <div className="absolute top-4 left-4 w-10 h-10 border-l-4 border-t-4 border-cyan-400 rounded-tl-xl" />
              <div className="absolute top-4 right-4 w-10 h-10 border-r-4 border-t-4 border-cyan-400 rounded-tr-xl" />
              <div className="absolute bottom-4 left-4 w-10 h-10 border-l-4 border-b-4 border-cyan-400 rounded-bl-xl" />
              <div className="absolute bottom-4 right-4 w-10 h-10 border-r-4 border-b-4 border-cyan-400 rounded-br-xl" />
              
              {/* Center Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <p className="text-base font-medium text-white">Scan Shipment QR Code</p>
                  <p className="text-xs text-slate-500 mt-1">Load shipment details to start receiving</p>
                </div>
              </div>
            </div>

            {/* Load Shipment Button */}
            <button
              onClick={startShipmentScan}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6 20h2M6 8h2m8 0h2M6 4h2m8 0h2" />
              </svg>
              {roleText.loadButton}
            </button>
          </div>
        )}

        {/* Loading Shipment State */}
        {isLoadingShipment && (
          <div className="h-full flex flex-col items-center justify-center min-h-[280px]">
            <div className="h-16 w-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mb-4" />
            <p className="text-base font-semibold text-white">Loading Shipment...</p>
            <p className="text-xs text-slate-500 mt-1">Scanning QR code for shipment details</p>
          </div>
        )}

        {/* Manual Item Scanning State */}
        {(isReadyToScan || isScanningOne) && shipmentData && (
          <div className="space-y-4">
            {/* Shipment Info Card */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{shipmentData.id}</p>
                    <p className="text-xs text-slate-400">{shipmentData.origin}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 text-xs font-medium text-cyan-400">
                  {shipmentData.productName}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Scanning Progress</span>
                  <span className="text-cyan-400 font-semibold">{progress.scanned} / {progress.total}</span>
                </div>
                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <p className="text-center text-xs text-slate-500">{progress.percentage}% Complete • {progress.missing} items remaining</p>
              </div>
            </div>

            {/* Scan QR Code Button / Scanning State */}
            {isScanningOne && currentItem ? (
              <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <div className="h-5 w-5 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-cyan-300">Scanning Item #{currentItem.itemNumber}</p>
                    <p className="text-xs text-cyan-400/60 font-mono">{currentItem.itemId}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-xs text-cyan-400">Live</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={scanOneItem}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6 20h2M6 8h2m8 0h2M6 4h2m8 0h2" />
                </svg>
                {roleText.scanButton}
                <span className="text-cyan-200/70">({progress.scanned + 1} of {progress.total})</span>
              </button>
            )}

            {/* Recently Scanned Items */}
            {scannedItems.length > 0 && (
              <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700/30">
                  <p className="text-xs font-medium text-slate-400">Recently Scanned</p>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {scannedItems.slice(-5).reverse().map((item, idx) => (
                    <div key={item.itemId} className="px-3 py-2 flex items-center justify-between border-b border-slate-700/20 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-xs text-slate-300">Item #{item.itemNumber}</span>
                      </div>
                      <code className="text-[10px] text-slate-500 font-mono">{item.txHash}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Issue Button */}
            <button
              onClick={() => setShowExceptionModal(true)}
              className="w-full rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report Issue
            </button>
          </div>
        )}

        {/* Completed State */}
        {isCompleted && shipmentData && (
          <div className="space-y-4">
            {/* Success Banner */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 p-6 text-center">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{roleText.completedTitle}</h3>
              <p className="text-sm text-emerald-400">All {progress.total} items scanned and verified</p>
            </div>

            {/* Summary Card */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
              <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{shipmentData.id}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Complete
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-700/30">
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Items Received</span>
                  <span className="text-sm font-bold text-white">{progress.scanned}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400">From</span>
                  <span className="text-sm font-medium text-white">{shipmentData.origin}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Batch</span>
                  <span className="text-sm font-mono text-slate-300">{shipmentData.batch}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Blockchain Status</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    All Confirmed
                  </span>
                </div>
              </div>
            </div>

            {/* Scan Next Button */}
            <button
              onClick={resetScanner}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6 20h2M6 8h2m8 0h2M6 4h2m8 0h2" />
              </svg>
              Scan Next Shipment
            </button>
          </div>
        )}

        {/* Exception State */}
        {hasException && shipmentData && (
          <div className="space-y-4">
            {/* Exception Banner */}
            <div className="rounded-xl bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30 p-6 text-center">
              <div className="h-16 w-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{roleText.exceptionTitle}</h3>
              <p className="text-sm text-amber-400">{progress.scanned} of {progress.total} items received</p>
              <p className="text-xs text-red-400 mt-1">{progress.missing} items missing</p>
            </div>

            {/* Exception Note */}
            {exceptionMessage && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-400 mb-1">Exception Note</p>
                    <p className="text-sm text-slate-300">{exceptionMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Card */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
              <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{shipmentData.id}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-medium text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                    Partial
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-700/30">
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Items Received</span>
                  <span className="text-sm font-bold text-emerald-400">{progress.scanned}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Items Missing</span>
                  <span className="text-sm font-bold text-red-400">{progress.missing}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400">From</span>
                  <span className="text-sm font-medium text-white">{shipmentData.origin}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Blockchain Status</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Exception Logged
                  </span>
                </div>
              </div>
            </div>

            {/* Scan Next Button */}
            <button
              onClick={resetScanner}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6 20h2M6 8h2m8 0h2M6 4h2m8 0h2" />
              </svg>
              Scan Next Shipment
            </button>
          </div>
        )}
      </div>

      {/* Exception Modal */}
      {showExceptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/50 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Report Exception</h3>
                  <p className="text-xs text-slate-400">Document missing or damaged items</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{progress.scanned}</p>
                  <p className="text-xs text-slate-400">Scanned</p>
                </div>
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{progress.missing}</p>
                  <p className="text-xs text-slate-400">Missing</p>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Exception Note <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  value={exceptionNote}
                  onChange={(e) => setExceptionNote(e.target.value)}
                  placeholder="e.g., 15 items missing from shipment. Packaging was damaged. Notified supplier."
                  rows={3}
                  className="w-full rounded-xl bg-slate-800/60 border border-slate-600/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 resize-none"
                />
              </div>

              {/* Quick Notes */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Quick notes:</p>
                <div className="flex flex-wrap gap-2">
                  {['Items missing', 'Damaged packaging', 'Wrong items', 'Quantity mismatch'].map((note) => (
                    <button
                      key={note}
                      onClick={() => setExceptionNote(prev => prev ? `${prev}. ${note}` : note)}
                      className="rounded-lg bg-slate-800/60 border border-slate-600/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-cyan-500/30 transition-colors"
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50 flex gap-3">
              <button
                onClick={() => {
                  setShowExceptionModal(false)
                  setExceptionNote('')
                }}
                className="flex-1 rounded-xl bg-slate-800/60 border border-slate-600/50 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReportException}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 px-4 py-3 text-sm font-bold text-white shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                Report Exception
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default QRScannerUI
