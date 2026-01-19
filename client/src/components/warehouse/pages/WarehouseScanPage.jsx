/**
 * WarehouseScanPage Component
 * 
 * Dedicated QR scanning page for warehouses in the Sentinel supply chain system.
 * 
 * WAREHOUSE SCANNING RULES:
 * - Can ONLY scan containers when shipment.status === "IN_TRANSIT"
 * - Each container can be scanned ONLY ONCE by warehouse
 * - When ALL containers are scanned → shipment.status becomes AT_WAREHOUSE
 * - All scans are logged in scan_logs for history
 * 
 * Features:
 * - Camera-based QR code scanning
 * - Image upload for QR scanning
 * - Real-time scan progress tracking
 * - Clear success/error messaging
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useWarehouseTheme } from '../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { 
  scanContainerForWarehouse, 
  parseQRDataLocal, 
  getRejectionMessage,
  getShipmentContainers,
  updateShipmentStatus
} from '../../../services/scanApi';
import QRCameraScanner from '../../shared/QRCameraScanner';
import QRImageScanner from '../../shared/QRImageScanner';

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
  ERROR: 'ERROR'
};

const WarehouseScanPage = ({ shipmentFilter = null, shipmentData = null, onScanComplete = null }) => {
  const { isDarkMode } = useWarehouseTheme();
  const { user } = useAuth();
  
  // State
  const [scanState, setScanState] = useState(SCAN_STATES.IDLE);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [scanMode, setScanMode] = useState(SCAN_MODES.CAMERA);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [shipmentStatus, setShipmentStatus] = useState(shipmentData?.status || shipmentData?.rawStatus || null);
  
  // Container count state
  const [containerStats, setContainerStats] = useState({
    total: 0,
    atWarehouse: 0,
    pending: 0,
    isLoading: true
  });
  
  const scannerRef = useRef(null);

  // Fetch container counts on mount
  const fetchContainerCounts = useCallback(async () => {
    if (!shipmentFilter) {
      setContainerStats(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setContainerStats(prev => ({ ...prev, isLoading: true }));
      
      const response = await getShipmentContainers(shipmentFilter);
      if (response.success && response.containers) {
        const containers = response.containers;
        const atWarehouseCount = containers.filter(c => c.status === 'AT_WAREHOUSE').length;
        const totalContainers = containers.length;

        setContainerStats({
          total: totalContainers,
          atWarehouse: atWarehouseCount,
          pending: totalContainers - atWarehouseCount,
          isLoading: false
        });
        
        // Also update shipment status from response
        if (response.shipment?.status) {
          setShipmentStatus(response.shipment.status);
        }
      } else if (shipmentData) {
        // Fallback to shipment data
        setContainerStats({
          total: shipmentData.numberOfContainers || 0,
          atWarehouse: 0,
          pending: shipmentData.numberOfContainers || 0,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to fetch container counts:', error);
      if (shipmentData) {
        setContainerStats({
          total: shipmentData.numberOfContainers || 0,
          atWarehouse: 0,
          pending: shipmentData.numberOfContainers || 0,
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
      atWarehouse: 0,
      pending: 0,
      isLoading: true
    });
    setScanHistory([]);
    setScanResult(null);
    setScanState(SCAN_STATES.IDLE);
    fetchContainerCounts();
  }, [shipmentFilter, fetchContainerCounts]);

  // Handle QR scan
  const handleScan = useCallback(async (qrData) => {
    if (scanState === SCAN_STATES.PROCESSING) return;

    // Parse QR data locally first
    const parsed = parseQRDataLocal(qrData);
    if (!parsed.isValid) {
      setErrorMessage(parsed.error || 'Invalid QR code format');
      setScanState(SCAN_STATES.ERROR);
      return;
    }

    if (parsed.type !== 'container') {
      setErrorMessage('Please scan a container QR code, not a shipment QR code');
      setScanState(SCAN_STATES.ERROR);
      return;
    }

    setScanState(SCAN_STATES.PROCESSING);
    setErrorMessage('');

    try {
      // Call warehouse-specific scan API
      const result = await scanContainerForWarehouse(parsed.containerId);

      if (result.success || result.status === 'VERIFIED') {
        setScanResult(result);
        setScanState(SCAN_STATES.SUCCESS);

        // Add to scan history
        setScanHistory(prev => [{
          containerId: result.container?.containerId || parsed.containerId,
          status: 'success',
          timestamp: new Date().toISOString(),
          message: result.message || 'Container received'
        }, ...prev.slice(0, 9)]);

        // Update container stats
        setContainerStats(prev => ({
          ...prev,
          atWarehouse: result.progress?.scanned || prev.atWarehouse + 1,
          pending: result.progress?.total - result.progress?.scanned || prev.pending - 1
        }));

        // Notify parent of successful scan
        if (onScanComplete) {
          onScanComplete(result);
        }
        
        // Auto-reset after 2 seconds for continuous scanning
        setTimeout(() => {
          setScanState(SCAN_STATES.IDLE);
          setScanResult(null);
        }, 2000);
      } else {
        const errorMsg = getRejectionMessage(result.code) || result.reason || result.message || 'Scan failed';
        setErrorMessage(errorMsg);
        setScanState(SCAN_STATES.ERROR);

        // Add to scan history
        setScanHistory(prev => [{
          containerId: parsed.containerId,
          status: 'error',
          timestamp: new Date().toISOString(),
          message: errorMsg
        }, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Warehouse scan error:', error);
      const errorMsg = error.data?.reason || error.data?.message || error.message || 'Scan failed';
      setErrorMessage(getRejectionMessage(error.data?.code) || errorMsg);
      setScanState(SCAN_STATES.ERROR);

      // Add to scan history
      setScanHistory(prev => [{
        containerId: parsed.containerId,
        status: 'error',
        timestamp: new Date().toISOString(),
        message: errorMsg
      }, ...prev.slice(0, 9)]);
    }
  }, [scanState, onScanComplete]);

  // Handle update shipment status to AT_WAREHOUSE
  const handleUpdateStatus = async () => {
    if (!shipmentFilter) return;

    setIsUpdatingStatus(true);
    try {
      const result = await updateShipmentStatus(shipmentFilter, 'AT_WAREHOUSE', 'All containers received at warehouse');
      if (result.success) {
        setShipmentStatus('AT_WAREHOUSE');
        setScanResult(prev => ({
          ...prev,
          statusUpdated: true,
          newStatus: 'AT_WAREHOUSE'
        }));
        if (onScanComplete) {
          onScanComplete({ ...scanResult, statusUpdated: true });
        }
        alert('Shipment status updated to AT_WAREHOUSE! You can now assign transporter and retailer.');
      } else {
        setErrorMessage(result.message || 'Failed to update shipment status');
        alert(result.message || 'Failed to update shipment status');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update shipment status');
      alert(error.message || 'Failed to update shipment status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Reset scan state
  const handleReset = () => {
    setScanState(SCAN_STATES.IDLE);
    setScanResult(null);
    setErrorMessage('');
  };

  // Check if all containers are scanned
  const allContainersScanned = containerStats.pending === 0 && containerStats.total > 0;
  
  // Check if shipment is already AT_WAREHOUSE (no need to show update button)
  const isAlreadyAtWarehouse = shipmentStatus?.toUpperCase() === 'AT_WAREHOUSE';
  
  // Show update button only if all containers scanned but status not yet updated
  const showUpdateStatusButton = allContainersScanned && !isAlreadyAtWarehouse;

  return (
    <div className="space-y-6">
      {/* Progress Stats Card */}
      <div className={`rounded-2xl border p-5 ${
        isDarkMode 
          ? 'bg-slate-900/50 border-slate-700/50' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Container Scan Progress
          </h3>
          <button
            onClick={fetchContainerCounts}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-slate-800 text-slate-400' 
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <RefreshIcon className={`w-4 h-4 ${containerStats.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {containerStats.isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className={`animate-spin w-6 h-6 border-2 rounded-full ${
              isDarkMode ? 'border-purple-500 border-t-transparent' : 'border-purple-600 border-t-transparent'
            }`} />
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className={`h-3 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
              }`}>
                <div
                  className={`h-full transition-all duration-500 ${
                    allContainersScanned
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                      : 'bg-gradient-to-r from-purple-500 to-cyan-500'
                  }`}
                  style={{ 
                    width: `${containerStats.total > 0 
                      ? (containerStats.atWarehouse / containerStats.total) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {containerStats.atWarehouse}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Received
                </p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${
                  containerStats.pending > 0 
                    ? 'text-amber-400' 
                    : isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {containerStats.pending}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Pending
                </p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {containerStats.total}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Total
                </p>
              </div>
            </div>

            {/* All scanned message */}
            {allContainersScanned && (
              <div className="mt-4">
                <div className={`p-3 rounded-xl text-center ${
                  isDarkMode ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  <p className={`font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    ✅ All containers received!
                  </p>
                  {showUpdateStatusButton ? (
                    <button
                      onClick={handleUpdateStatus}
                      disabled={isUpdatingStatus}
                      className="mt-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium text-sm hover:from-emerald-600 hover:to-green-600 transition-all disabled:opacity-50"
                    >
                      {isUpdatingStatus ? 'Updating...' : 'Update Shipment Status to AT_WAREHOUSE'}
                    </button>
                  ) : isAlreadyAtWarehouse ? (
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      ✓ Status is AT_WAREHOUSE. Go back to assign transporter & retailer.
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Scan Mode Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setScanMode(SCAN_MODES.CAMERA)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
            scanMode === SCAN_MODES.CAMERA
              ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25'
              : isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <CameraIcon />
          Camera
        </button>
        <button
          onClick={() => setScanMode(SCAN_MODES.UPLOAD)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
            scanMode === SCAN_MODES.UPLOAD
              ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25'
              : isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <UploadIcon />
          Upload
        </button>
      </div>

      {/* Scanner */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDarkMode 
          ? 'bg-slate-900/50 border-slate-700/50' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {scanState === SCAN_STATES.SUCCESS ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Container Received!
            </h3>
            <p className={`mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {scanResult?.container?.containerId}
            </p>
            <div className={`text-sm mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              {scanResult?.progress?.scanned || containerStats.atWarehouse} of {scanResult?.progress?.total || containerStats.total} containers received
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-cyan-600 transition-all"
            >
              Scan Next Container
            </button>
          </div>
        ) : scanState === SCAN_STATES.ERROR ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Scan Failed
            </h3>
            <p className={`mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              {errorMessage}
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-cyan-600 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : scanState === SCAN_STATES.PROCESSING ? (
          <div className="p-8 text-center">
            <div className={`animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-4 ${
              isDarkMode 
                ? 'border-purple-500 border-t-transparent' 
                : 'border-purple-600 border-t-transparent'
            }`} />
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
              Verifying container...
            </p>
          </div>
        ) : (
          <div className="p-4">
            {scanMode === SCAN_MODES.CAMERA ? (
              <QRCameraScanner
                ref={scannerRef}
                onScan={handleScan}
                onError={(error) => {
                  console.error('Camera error:', error);
                }}
              />
            ) : (
              <QRImageScanner
                onScan={handleScan}
                onError={(error) => {
                  setErrorMessage(error.message || 'Failed to scan image');
                  setScanState(SCAN_STATES.ERROR);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Recent Scan History */}
      {scanHistory.length > 0 && (
        <div className={`rounded-2xl border overflow-hidden ${
          isDarkMode 
            ? 'bg-slate-900/50 border-slate-700/50' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`px-5 py-3 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <h4 className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Recent Scans
            </h4>
          </div>
          <div className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {scanHistory.map((scan, index) => (
              <div key={index} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  scan.status === 'success'
                    ? 'bg-emerald-500/20'
                    : 'bg-red-500/20'
                }`}>
                  {scan.status === 'success' ? (
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-mono truncate ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {scan.containerId}
                  </p>
                  <p className={`text-xs truncate ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {scan.message}
                  </p>
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(scan.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className={`rounded-2xl border p-5 ${
        isDarkMode 
          ? 'bg-slate-900/50 border-slate-700/50' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <h4 className={`font-medium text-sm mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          📋 Scanning Instructions
        </h4>
        <ul className={`text-sm space-y-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">1.</span>
            Shipment must be IN_TRANSIT to scan containers
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">2.</span>
            Each container can only be scanned once
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">3.</span>
            Scan all containers to receive the shipment
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">4.</span>
            Click "Update Status" after all containers are scanned
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WarehouseScanPage;
