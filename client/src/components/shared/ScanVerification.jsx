/**
 * ScanVerification Component
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPLETE QR SCANNING & VERIFICATION WORKFLOW
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This component provides the full QR scanning and verification workflow:
 * 
 * FLOW:
 * 1. READY: Camera ready, waiting for scan
 * 2. SCANNING: Actively scanning for QR codes
 * 3. VERIFYING: QR detected, sending to backend
 * 4. VERIFIED: Scan successful, showing result
 * 5. REJECTED: Scan failed, showing error
 * 6. CONFIRMING: User confirming the action
 * 7. COMPLETED: Action confirmed, status updated
 * 
 * USAGE:
 * <ScanVerification
 *   onComplete={(result) => handleComplete(result)}
 *   onCancel={() => handleCancel()}
 * />
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Package, 
  Truck,
  MapPin,
  Clock,
  ChevronRight,
  RotateCcw,
  Shield,
  Link2,
  Upload,
  Camera
} from 'lucide-react';
import QRCameraScanner from './QRCameraScanner';
import QRImageScanner from './QRImageScanner';
import { 
  verifyScan, 
  confirmScan, 
  parseQRDataLocal, 
  getRejectionMessage,
  SCAN_STATUS 
} from '../../services/scanApi';
import { useAuth } from '../../context/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// SCAN STATES
// ═══════════════════════════════════════════════════════════════════════════

const SCAN_FLOW_STATE = {
  READY: 'ready',
  SCANNING: 'scanning',
  VERIFYING: 'verifying',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  CONFIRMING: 'confirming',
  COMPLETED: 'completed',
  ERROR: 'error'
};

// Scan input modes
const SCAN_MODE = {
  IMAGE: 'image',   // Upload image
  CAMERA: 'camera'  // Use camera
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ScanVerification = ({
  onComplete,
  onCancel,
  autoConfirm = false,  // Auto-confirm without user interaction
  // showHistory = false,  // Reserved for future: Show scan history after completion
  className = ''
}) => {
  // Auth context
  const { user } = useAuth();

  // State
  const [flowState, setFlowState] = useState(SCAN_FLOW_STATE.READY);
  const [scanMode, setScanMode] = useState(SCAN_MODE.CAMERA); // Default to camera for QR scanning
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [location, setLocation] = useState(null);

  // ═══════════════════════════════════════════════════════════════════════
  // GEOLOCATION - Get human-readable location
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get current location as human-readable string
   */
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
            { headers: { 'Accept-Language': 'en' } }
          );
          
          if (response.ok) {
            const data = await response.json();
            const parts = [];
            if (data.address) {
              const addr = data.address;
              const place = addr.city || addr.town || addr.village || addr.suburb || addr.county;
              if (place) parts.push(place);
              if (addr.state) parts.push(addr.state);
            }
            
            const locationName = parts.length > 0 
              ? parts.join(', ') 
              : data.display_name?.split(',').slice(0, 2).join(',') || null;
            
            setLocation(locationName);
          }
        } catch (err) {
          console.log('Reverse geocoding failed:', err.message);
          setLocation(null);
        }
      },
      (error) => {
        console.log('Geolocation error:', error.message);
        setLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  // Get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // ═══════════════════════════════════════════════════════════════════════
  // SCAN HANDLING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Handle QR code detection from camera
   */
  const handleQRScan = useCallback(async (qrData) => {
    console.log('handleQRScan called with:', qrData);
    console.log('QR data type:', typeof qrData);
    console.log('QR data length:', qrData?.length);
    
    // Quick local validation
    const localParse = parseQRDataLocal(qrData);
    console.log('Local parse result:', localParse);
    
    if (!localParse.isValid) {
      setError(localParse.error);
      setFlowState(SCAN_FLOW_STATE.REJECTED);
      return;
    }

    // Start verification
    setFlowState(SCAN_FLOW_STATE.VERIFYING);
    setError(null);

    try {
      const result = await verifyScan(qrData, location);
      
      setScanResult(result);
      
      // Check for ACCEPTED (new) or VERIFIED (legacy)
      if (result.status === SCAN_STATUS.ACCEPTED || result.status === 'ACCEPTED' || result.status === 'VERIFIED') {
        setFlowState(SCAN_FLOW_STATE.VERIFIED);
        
        // Auto-confirm if enabled
        if (autoConfirm) {
          await handleConfirm();
        }
      } else {
        setError(result.reason || getRejectionMessage(result.code));
        setFlowState(SCAN_FLOW_STATE.REJECTED);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.data?.reason || err.message || 'Verification failed');
      setScanResult(err.data || null);
      setFlowState(SCAN_FLOW_STATE.REJECTED);
    }
  }, [location, autoConfirm]);

  /**
   * Handle scan confirmation
   */
  const handleConfirm = useCallback(async () => {
    if (!scanResult?.scanId) return;

    setIsConfirming(true);
    setFlowState(SCAN_FLOW_STATE.CONFIRMING);

    try {
      const result = await confirmScan(scanResult.scanId, true, notes);
      
      setFlowState(SCAN_FLOW_STATE.COMPLETED);
      
      if (onComplete) {
        onComplete({
          ...scanResult,
          confirmResult: result
        });
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      setError(err.message || 'Failed to confirm scan');
      setFlowState(SCAN_FLOW_STATE.ERROR);
    } finally {
      setIsConfirming(false);
    }
  }, [scanResult, notes, onComplete]);

  /**
   * Cancel confirmation
   */
  const handleCancelConfirm = useCallback(async () => {
    if (scanResult?.scanId) {
      try {
        await confirmScan(scanResult.scanId, false);
      } catch (err) {
        console.error('Cancel error:', err);
      }
    }
    
    if (onCancel) {
      onCancel();
    }
  }, [scanResult, onCancel]);

  /**
   * Reset to start new scan
   */
  const handleReset = useCallback(() => {
    setFlowState(SCAN_FLOW_STATE.READY);
    setScanResult(null);
    setError(null);
    setNotes('');
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Render status badge
   */
  const renderStatusBadge = (status) => {
    const colors = {
      'CREATED': 'bg-gray-100 text-gray-700',
      'READY_FOR_DISPATCH': 'bg-blue-100 text-blue-700',
      'IN_TRANSIT': 'bg-yellow-100 text-yellow-700',
      'AT_WAREHOUSE': 'bg-purple-100 text-purple-700',
      'DELIVERED': 'bg-green-100 text-green-700'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          QR Verification Scanner
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          Scan a shipment or container QR code to verify
        </p>
      </div>

      <div className="p-6">
        {/* READY / SCANNING STATE */}
        {(flowState === SCAN_FLOW_STATE.READY || flowState === SCAN_FLOW_STATE.SCANNING) && (
          <div>
            {/* Mode Selector Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button
                onClick={() => setScanMode(SCAN_MODE.IMAGE)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  scanMode === SCAN_MODE.IMAGE
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </button>
              <button
                onClick={() => setScanMode(SCAN_MODE.CAMERA)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  scanMode === SCAN_MODE.CAMERA
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Camera className="w-4 h-4" />
                Camera
              </button>
            </div>

            {/* Image Upload Scanner */}
            {scanMode === SCAN_MODE.IMAGE && (
              <QRImageScanner
                onScan={handleQRScan}
                onError={(err) => setError(err.message)}
                disabled={flowState === SCAN_FLOW_STATE.VERIFYING}
              />
            )}

            {/* Camera Scanner */}
            {scanMode === SCAN_MODE.CAMERA && (
              <>
                <QRCameraScanner
                  onScan={handleQRScan}
                  onError={(err) => setError(err.message)}
                  disabled={flowState === SCAN_FLOW_STATE.VERIFYING}
                  autoStart={true}
                />
                <p className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Camera requires HTTPS. If not working, use "Upload Image" mode.
                </p>
              </>
            )}
            
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>
                {scanMode === SCAN_MODE.IMAGE 
                  ? 'Upload or drag-drop a QR code image to verify'
                  : 'Point your camera at a Sentinel QR code'
                }
              </p>
              <p className="mt-1">
                Scanning as: <span className="font-medium text-gray-700 capitalize">{user?.role}</span>
              </p>
            </div>
          </div>
        )}

        {/* VERIFYING STATE */}
        {flowState === SCAN_FLOW_STATE.VERIFYING && (
          <div className="py-12 text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">Verifying QR Code...</h3>
            <p className="text-gray-500 mt-2">Checking against database and blockchain</p>
            
            <div className="mt-6 flex justify-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" /> Database
              </span>
              <span className="flex items-center gap-1">
                <Link2 className="w-4 h-4" /> Blockchain
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" /> Authorization
              </span>
            </div>
          </div>
        )}

        {/* VERIFIED STATE */}
        {flowState === SCAN_FLOW_STATE.VERIFIED && scanResult && (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800">Verification Successful</h3>
                <p className="text-sm text-green-600">QR code validated against blockchain</p>
              </div>
            </div>

            {/* Shipment Details */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="font-medium text-gray-800">Shipment Details</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Shipment ID</span>
                  <span className="font-mono text-sm">{scanResult.shipment?.shipmentHash?.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Batch ID</span>
                  <span className="font-medium">{scanResult.shipment?.batchId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  {renderStatusBadge(scanResult.shipment?.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Containers</span>
                  <span>{scanResult.shipment?.numberOfContainers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Quantity</span>
                  <span>{scanResult.shipment?.totalQuantity} units</span>
                </div>
              </div>
            </div>

            {/* Container Details (if scanned container) */}
            {scanResult.container && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">Container Details</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Container ID</span>
                    <span className="font-mono text-sm">{scanResult.container?.containerId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Container #</span>
                    <span>{scanResult.container?.containerNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Quantity</span>
                    <span>{scanResult.container?.quantity} units</span>
                  </div>
                </div>
              </div>
            )}

            {/* Blockchain Verification */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${
              scanResult.shipment?.isLocked 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <Link2 className={`w-6 h-6 ${
                scanResult.shipment?.isLocked ? 'text-green-500' : 'text-yellow-500'
              }`} />
              <div>
                <p className={`font-medium ${
                  scanResult.shipment?.isLocked ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  Blockchain: {scanResult.shipment?.isLocked ? 'Locked & Verified ✓' : 'Not Yet Locked'}
                </p>
                {scanResult.shipment?.isLocked && (
                  <p className="text-sm text-green-600">
                    Shipment confirmed on blockchain
                  </p>
                )}
                {scanResult.blockchain?.verified && scanResult.blockchain?.status && (
                  <p className="text-sm text-green-600">
                    Live status: {scanResult.blockchain.status}
                  </p>
                )}
              </div>
            </div>

            {/* Transition Info */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Pending Action
              </h4>
              <div className="mt-2 flex items-center gap-2 text-sm">
                {renderStatusBadge(scanResult.transition?.currentStatus)}
                <ChevronRight className="w-4 h-4 text-gray-400" />
                {renderStatusBadge(scanResult.transition?.nextStatus)}
              </div>
              <p className="mt-2 text-sm text-amber-700">
                {scanResult.transition?.message}
              </p>
            </div>

            {/* Notes Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this scan..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelConfirm}
                disabled={isConfirming}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm & Update Status
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* REJECTED STATE */}
        {flowState === SCAN_FLOW_STATE.REJECTED && (
          <div className="py-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Verification Failed</h3>
            <p className="text-red-600 mt-2 max-w-md mx-auto">{error}</p>
            
            {/* Show shipment info if available */}
            {scanResult?.shipment && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left max-w-md mx-auto">
                <h4 className="font-medium text-gray-700 mb-2">Shipment Info</h4>
                <p className="text-sm text-gray-600">
                  Status: {scanResult.shipment.status}
                </p>
                {scanResult.allowedRoles && (
                  <p className="text-sm text-gray-600 mt-1">
                    Allowed roles: {scanResult.allowedRoles.join(', ')}
                  </p>
                )}
              </div>
            )}
            
            <button
              onClick={handleReset}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Scan Again
            </button>
          </div>
        )}

        {/* COMPLETED STATE */}
        {flowState === SCAN_FLOW_STATE.COMPLETED && (
          <div className="py-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Status Updated!</h3>
            <p className="text-gray-600 mt-2">
              Shipment status has been successfully updated
            </p>
            
            {scanResult?.transition && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {renderStatusBadge(scanResult.transition.currentStatus)}
                <ChevronRight className="w-4 h-4 text-gray-400" />
                {renderStatusBadge(scanResult.transition.nextStatus)}
              </div>
            )}
            
            <div className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              {new Date().toLocaleTimeString()}
            </div>
            
            <button
              onClick={handleReset}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Scan Another
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {flowState === SCAN_FLOW_STATE.ERROR && (
          <div className="py-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Something Went Wrong</h3>
            <p className="text-gray-600 mt-2">{error || 'An unexpected error occurred'}</p>
            
            <button
              onClick={handleReset}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Footer with Scan ID */}
      {scanResult?.scanId && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Scan ID: <span className="font-mono">{scanResult.scanId}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ScanVerification;
