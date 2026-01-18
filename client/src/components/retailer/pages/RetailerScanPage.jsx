/**
 * RetailerScanPage Component
 * 
 * Dedicated QR scanning page for retailers in the Sentinel supply chain system.
 * 
 * Features:
 * - Camera-based QR code scanning
 * - Strict backend validation (no frontend-only checks)
 * - Clear success/error messaging
 * - Optional concern input before submitting scan
 * - Real-time scan history
 * - Auto-updates shipment to DELIVERED when all containers scanned
 * 
 * Domain Rules Enforced (Backend):
 * - QR code contains ONLY containerId
 * - Shipment must be blockchain-locked (txHash check)
 * - Shipment must be assigned to this retailer
 * - Container must be AT_WAREHOUSE status
 * - Only RETAILER role can scan
 * - Containers can only be scanned ONCE
 * - All scans are logged (success or failure)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRetailerTheme } from '../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { 
  scanContainerAsRetailer, 
  parseQRDataLocal, 
  getRejectionMessage,
  getRetailerAssignedContainers 
} from '../../../services/scanApi';
import RetailerQRScanner from '../components/RetailerQRScanner';
import RetailerImageScanner from '../components/RetailerImageScanner';

// Icons
const ScanIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6 20h2M6 8h2m8 0h2M6 4h2m8 0h2" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CameraIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UploadIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TruckIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

// Scan Modes
const SCAN_MODES = {
  CAMERA: 'CAMERA',
  UPLOAD: 'UPLOAD'
};

// Scan States
const SCAN_STATES = {
  IDLE: 'IDLE',
  SCANNING: 'SCANNING',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  CONCERN_INPUT: 'CONCERN_INPUT'
};

const RetailerScanPage = ({ shipmentFilter = null, shipmentData = null, onUpdateStatus = null, onAllScansComplete = null }) => {
  const { isDarkMode } = useRetailerTheme();
  const { user, walletAddress } = useAuth();
  
  // State
  const [scanState, setScanState] = useState(SCAN_STATES.IDLE);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [concernText, setConcernText] = useState('');
  const [showConcernInput, setShowConcernInput] = useState(false);
  const [pendingContainerId, setPendingContainerId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [scanMode, setScanMode] = useState(SCAN_MODES.CAMERA);
  const [allScansComplete, setAllScansComplete] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Container count state
  const [containerStats, setContainerStats] = useState({
    total: 0,
    pending: 0,
    scanned: 0,
    isLoading: true
  });
  
  const scannerRef = useRef(null);

  // Fetch container counts on mount (filtered by shipment if provided)
  const fetchContainerCounts = useCallback(async () => {
    try {
      setContainerStats(prev => ({ ...prev, isLoading: true }));
      
      const response = await getRetailerAssignedContainers();
      if (response.success) {
        // If shipmentFilter is provided, filter stats for that shipment only
        if (shipmentFilter && response.data.shipments) {
          const filteredShipment = response.data.shipments.find(
            s => s.shipmentHash === shipmentFilter || 
                 s.shipmentId === shipmentFilter || 
                 s.batchId === shipmentFilter ||
                 s._id === shipmentFilter
          );
          if (filteredShipment) {
            console.log('Found filtered shipment:', filteredShipment);
            setContainerStats({
              total: filteredShipment.totalContainers,
              pending: filteredShipment.pendingScans,
              scanned: filteredShipment.scannedCount,
              isLoading: false
            });
            return;
          } else {
            console.log('No matching shipment found for filter:', shipmentFilter);
            
            // Fallback: use shipmentData passed from parent if available
            if (shipmentData) {
              console.log('Using shipmentData from parent:', shipmentData);
              setContainerStats({
                total: shipmentData.numberOfContainers || 0,
                pending: shipmentData.numberOfContainers || 0,
                scanned: 0,
                isLoading: false
              });
              return;
            }
          }
        }
        // Otherwise show all
        setContainerStats({
          total: response.data.totalContainers,
          pending: response.data.pendingScans,
          scanned: response.data.totalContainers - response.data.pendingScans,
          isLoading: false
        });
      } else if (shipmentData) {
        console.log('API failed, using shipmentData:', shipmentData);
        setContainerStats({
          total: shipmentData.numberOfContainers || 0,
          pending: shipmentData.numberOfContainers || 0,
          scanned: 0,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to fetch container counts:', error);
      if (shipmentData) {
        setContainerStats({
          total: shipmentData.numberOfContainers || 0,
          pending: shipmentData.numberOfContainers || 0,
          scanned: 0,
          isLoading: false
        });
      } else {
        setContainerStats(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, [shipmentFilter, shipmentData]);

  // Reset state when shipmentFilter changes
  useEffect(() => {
    setContainerStats({
      total: 0,
      pending: 0,
      scanned: 0,
      isLoading: true
    });
    setScanHistory([]);
    setScanResult(null);
    setScanState(SCAN_STATES.IDLE);
    setErrorMessage('');
    
    fetchContainerCounts();
  }, [shipmentFilter, fetchContainerCounts]);

  // Handle QR code scanned
  const handleQRScanned = useCallback(async (qrData) => {
    if (scanState === SCAN_STATES.PROCESSING) return;
    
    setScanState(SCAN_STATES.PROCESSING);
    setErrorMessage('');
    setScanResult(null);
    
    try {
      // Parse QR data locally first for quick feedback
      const parsed = parseQRDataLocal(qrData);
      
      if (!parsed.isValid) {
        setScanState(SCAN_STATES.ERROR);
        setErrorMessage(parsed.error || 'Invalid QR code format');
        addToHistory({
          containerId: qrData.substring(0, 30),
          status: 'REJECTED',
          reason: 'INVALID_QR_FORMAT',
          timestamp: new Date()
        });
        return;
      }
      
      if (parsed.type !== 'container') {
        setScanState(SCAN_STATES.ERROR);
        setErrorMessage('Please scan a container QR code, not a shipment QR code');
        return;
      }
      
      // Check if user wants to add a concern before submitting
      if (showConcernInput) {
        setPendingContainerId(parsed.containerId);
        setScanState(SCAN_STATES.CONCERN_INPUT);
        return;
      }
      
      // Submit scan to backend
      await submitScan(parsed.containerId, null);
      
    } catch (error) {
      console.error('Scan error:', error);
      setScanState(SCAN_STATES.ERROR);
      setErrorMessage(error.data?.reason || error.message || 'Scan failed');
      
      if (error.data) {
        addToHistory({
          containerId: error.data.container?.containerId || 'Unknown',
          status: 'REJECTED',
          reason: error.data.code,
          timestamp: new Date()
        });
      }
    }
  }, [scanState, showConcernInput]);

  // Submit scan to backend
  const submitScan = async (containerId, concern) => {
    setScanState(SCAN_STATES.PROCESSING);
    
    try {
      const result = await scanContainerAsRetailer(containerId, { concern });
      
      setScanResult(result);
      setScanState(SCAN_STATES.SUCCESS);
      setConcernText('');
      setPendingContainerId(null);
      
      // Update container counts after successful scan
      const newPending = Math.max(0, containerStats.pending - 1);
      setContainerStats(prev => ({
        ...prev,
        pending: newPending,
        scanned: prev.scanned + 1
      }));
      
      // Check if all containers are now scanned (don't auto-update, just track state)
      if (result.shipment.allDelivered || newPending === 0) {
        setAllScansComplete(true);
        // Notify parent that all scans are complete
        if (onAllScansComplete) {
          onAllScansComplete(result.shipment);
        }
      }
      
      addToHistory({
        containerId: result.container.containerId,
        status: 'ACCEPTED',
        shipmentHash: result.shipment.shipmentHash,
        batchId: result.shipment.batchId,
        previousStatus: result.container.previousStatus,
        newStatus: result.container.currentStatus,
        concern: result.concern,
        allDelivered: result.shipment.allDelivered,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Submit scan error:', error);
      setScanState(SCAN_STATES.ERROR);
      
      const errorData = error.data || {};
      setErrorMessage(errorData.reason || error.message || 'Scan failed');
      
      addToHistory({
        containerId: errorData.container?.containerId || containerId,
        status: 'REJECTED',
        reason: errorData.code,
        message: errorData.message,
        timestamp: new Date()
      });
    }
  };

  // Add to scan history
  const addToHistory = (entry) => {
    setScanHistory(prev => [entry, ...prev].slice(0, 10));
  };

  // Submit concern and scan
  const handleSubmitWithConcern = async () => {
    if (!pendingContainerId) return;
    await submitScan(pendingContainerId, concernText.trim() || null);
  };

  // Skip concern and scan
  const handleSkipConcern = async () => {
    if (!pendingContainerId) return;
    await submitScan(pendingContainerId, null);
  };

  // Reset scanner for new scan
  const handleNewScan = () => {
    setScanState(SCAN_STATES.IDLE);
    setScanResult(null);
    setErrorMessage('');
    setConcernText('');
    setPendingContainerId(null);
  };

  // Handle Update Status button click
  const handleUpdateStatus = async () => {
    if (!onUpdateStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      const shipmentHash = scanResult?.shipment?.shipmentHash || shipmentData?.shipmentHash || shipmentFilter;
      if (shipmentHash) {
        await onUpdateStatus(shipmentHash);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Theme classes
  const cardClass = isDarkMode
    ? 'bg-slate-900/50 border-slate-800'
    : 'bg-white border-slate-200 shadow-sm';
  
  const textClass = isDarkMode ? 'text-white' : 'text-slate-900';
  const mutedTextClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const inputClass = isDarkMode
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400';

  return (
    <div className="space-y-6">
      {/* Container Count Stats */}
      {!containerStats.isLoading && containerStats.total > 0 && (
        <div className={`border rounded-2xl p-4 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                <span className={`text-2xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {containerStats.scanned}
                </span>
                <span className={`text-sm ${mutedTextClass}`}>/ {containerStats.total}</span>
              </div>
              <div>
                <p className={`text-sm font-medium ${textClass}`}>Containers Received</p>
                <p className={`text-xs ${mutedTextClass}`}>
                  {containerStats.scanned < containerStats.total 
                    ? `${containerStats.total - containerStats.scanned} remaining to receive`
                    : 'All containers received! ✓'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Update Status button - ONLY when ALL containers are scanned */}
              {containerStats.scanned > 0 && containerStats.scanned >= containerStats.total && onUpdateStatus && (
                <button
                  onClick={handleUpdateStatus}
                  disabled={isUpdatingStatus}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isUpdatingStatus
                      ? 'bg-slate-500 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {isUpdatingStatus ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="hidden sm:inline">Update Status</span>
                    </>
                  )}
                </button>
              )}
              
              {/* Progress bar */}
              <div className="hidden sm:block w-32">
                <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${containerStats.total > 0 ? (containerStats.scanned / containerStats.total) * 100 : 0}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 text-center ${mutedTextClass}`}>
                  {containerStats.total > 0 ? Math.round((containerStats.scanned / containerStats.total) * 100) : 0}% delivered
                </p>
              </div>
              
              {/* Refresh button */}
              <button
                onClick={fetchContainerCounts}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                title="Refresh counts"
              >
                <RefreshIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Card */}
      <div className={`border rounded-2xl p-6 ${cardClass}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <ScanIcon />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${textClass}`}>Delivery Scanner</h2>
              <p className={`text-sm ${mutedTextClass}`}>Scan container QR codes to confirm delivery</p>
            </div>
          </div>
          
          {/* Toggle Concern Input */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showConcernInput}
              onChange={(e) => setShowConcernInput(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className={`text-sm ${mutedTextClass}`}>Add concern</span>
          </label>
        </div>

        {/* Scan Mode Toggle - Camera vs Upload */}
        {scanState === SCAN_STATES.IDLE && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setScanMode(SCAN_MODES.CAMERA)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                scanMode === SCAN_MODES.CAMERA
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CameraIcon />
              Camera
            </button>
            <button
              onClick={() => setScanMode(SCAN_MODES.UPLOAD)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                scanMode === SCAN_MODES.UPLOAD
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <UploadIcon />
              Upload QR
              <span className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>Test</span>
            </button>
          </div>
        )}

        {/* IDLE State - Show Scanner */}
        {scanState === SCAN_STATES.IDLE && (
          <div className="space-y-4">
            {/* Camera Scanner */}
            {scanMode === SCAN_MODES.CAMERA && (
              <RetailerQRScanner
                onScan={handleQRScanned}
                onError={(err) => {
                  console.error('Scanner error:', err);
                  setErrorMessage('Camera error: ' + (err.message || 'Unknown error'));
                }}
                disabled={scanState !== SCAN_STATES.IDLE}
              />
            )}

            {/* Image Upload Scanner */}
            {scanMode === SCAN_MODES.UPLOAD && (
              <RetailerImageScanner
                onScan={handleQRScanned}
                onError={(err) => {
                  console.error('Image scanner error:', err);
                  setErrorMessage('Image scan error: ' + (err.message || 'Unknown error'));
                }}
                disabled={scanState !== SCAN_STATES.IDLE}
              />
            )}
            
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <p className={`text-sm ${mutedTextClass}`}>
                {scanMode === SCAN_MODES.CAMERA 
                  ? 'Point your camera at a container QR code. The scan will be automatically processed.'
                  : 'Upload or drag & drop a QR code image to scan. (Testing mode)'
                }
              </p>
            </div>
          </div>
        )}

        {/* PROCESSING State */}
        {scanState === SCAN_STATES.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className={`w-16 h-16 border-4 rounded-full animate-spin mb-4 ${isDarkMode ? 'border-emerald-500/20 border-t-emerald-400' : 'border-emerald-200 border-t-emerald-600'}`} />
            <p className={`text-lg font-medium ${textClass}`}>Processing Scan...</p>
            <p className={`text-sm ${mutedTextClass}`}>Verifying container with backend</p>
          </div>
        )}

        {/* CONCERN_INPUT State */}
        {scanState === SCAN_STATES.CONCERN_INPUT && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-start gap-3">
                <AlertIcon className={isDarkMode ? 'text-amber-400' : 'text-amber-600'} />
                <div>
                  <p className={`font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                    Container: {pendingContainerId}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-amber-400/70' : 'text-amber-600'}`}>
                    Add a concern below or skip to proceed with delivery confirmation
                  </p>
                </div>
              </div>
            </div>
            
            <textarea
              value={concernText}
              onChange={(e) => setConcernText(e.target.value)}
              placeholder="Describe any issues (damage, tampering, missing items, etc.)..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${inputClass}`}
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleSubmitWithConcern}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:shadow-lg transition-all"
              >
                Submit with Concern
              </button>
              <button
                onClick={handleSkipConcern}
                className={`flex-1 px-4 py-3 rounded-xl border font-medium transition-all ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
              >
                Skip & Confirm
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS State */}
        {scanState === SCAN_STATES.SUCCESS && scanResult && (
          <div className="space-y-4">
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                  <CheckCircleIcon className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    {scanResult.shipment.allDelivered ? '🎉 All Delivered!' : 'Delivery Confirmed!'}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-emerald-400/70' : 'text-emerald-600'}`}>
                    {scanResult.shipment.allDelivered 
                      ? 'All containers have been delivered. Shipment complete!'
                      : 'Container has been marked as DELIVERED'
                    }
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Container ID</p>
                  <p className={`font-mono text-sm ${textClass}`}>{scanResult.container.containerId}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Batch ID</p>
                  <p className={`font-mono text-sm ${textClass}`}>{scanResult.shipment.batchId}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Previous Status</p>
                  <p className={`text-sm ${textClass}`}>{scanResult.container.previousStatus}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>New Status</p>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {scanResult.container.currentStatus}
                  </p>
                </div>
              </div>
              
              {scanResult.shipment.statusChanged && (
                <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    📦 Shipment status changed: {scanResult.shipment.previousStatus} → {scanResult.shipment.currentStatus}
                  </p>
                </div>
              )}
              
              {/* Progress indicator */}
              {!scanResult.shipment.allDelivered && (
                <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm ${mutedTextClass}`}>Delivery Progress</p>
                    <p className={`text-sm font-medium ${textClass}`}>
                      {scanResult.shipment.deliveredContainers} / {scanResult.shipment.numberOfContainers}
                    </p>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${(scanResult.shipment.deliveredContainers / scanResult.shipment.numberOfContainers) * 100}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${mutedTextClass}`}>
                    {scanResult.shipment.pendingContainers} container(s) remaining
                  </p>
                </div>
              )}
              
              {scanResult.concern && (
                <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                    ⚠️ Concern recorded: {scanResult.concern.message}
                  </p>
                </div>
              )}
            </div>
            
            {/* Always show Scan Another Container button after successful scan */}
            <button
              onClick={handleNewScan}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RefreshIcon />
              Scan Another Container
            </button>
            
            {/* Show Update Status button when all containers are scanned */}
            {(allScansComplete || scanResult.shipment.allDelivered || containerStats.pending === 0) && onUpdateStatus && (
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus}
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  isUpdatingStatus
                    ? 'bg-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg shadow-blue-500/25'
                } text-white`}
              >
                {isUpdatingStatus ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating Status...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Update Status to Delivered
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* ERROR State */}
        {scanState === SCAN_STATES.ERROR && (
          <div className="space-y-4">
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                  <XCircleIcon className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                    Scan Failed
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-red-400/70' : 'text-red-600'}`}>
                    {getRejectionMessage(errorMessage) || errorMessage}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleNewScan}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RefreshIcon />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className={`border rounded-2xl p-6 ${cardClass}`}>
          <h3 className={`text-lg font-bold mb-4 ${textClass}`}>Recent Scans</h3>
          <div className="space-y-3">
            {scanHistory.map((entry, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  entry.status === 'ACCEPTED'
                    ? isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                    : isDarkMode ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {entry.status === 'ACCEPTED' ? (
                      <CheckCircleIcon className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} />
                    ) : (
                      <XCircleIcon className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
                    )}
                    <span className={`font-mono text-sm ${textClass}`}>{entry.containerId}</span>
                    {entry.allDelivered && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                        Final
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${mutedTextClass}`}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {entry.status === 'REJECTED' && entry.reason && (
                  <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-400/70' : 'text-red-600'}`}>
                    {getRejectionMessage(entry.reason)}
                  </p>
                )}
                {entry.concern && (
                  <p className={`mt-2 text-sm ${isDarkMode ? 'text-amber-400/70' : 'text-amber-600'}`}>
                    Concern: {entry.concern.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className={`border rounded-2xl p-6 ${cardClass}`}>
        <h3 className={`text-lg font-bold mb-4 ${textClass}`}>Scanner Instructions</h3>
        <ul className={`text-sm space-y-3 ${mutedTextClass}`}>
          <li className="flex items-start gap-3">
            <span className="text-emerald-500 font-bold">1.</span>
            Point your camera at a container QR code to scan
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-500 font-bold">2.</span>
            Only containers that have been received at warehouse can be scanned
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-500 font-bold">3.</span>
            Each container can only be scanned once for delivery confirmation
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-500 font-bold">4.</span>
            Enable "Add concern" to report issues (damage, tampering, etc.)
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-500 font-bold">5.</span>
            When all containers are scanned, shipment will be marked as DELIVERED
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RetailerScanPage;
