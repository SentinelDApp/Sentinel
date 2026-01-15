/**
 * useQRScanner Hook (v2)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * REAL-TIME QR SCANNING WITH BACKEND VERIFICATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This hook provides both simulated and real QR scanning functionality.
 * It integrates with the backend API for verification against the database
 * and blockchain.
 * 
 * MODES:
 * - simulated: Uses mock data for development/testing (original behavior)
 * - live: Uses real camera and backend API verification
 * 
 * FLOW (Live Mode):
 * 1. Camera captures QR code
 * 2. QR data sent to backend for verification
 * 3. Backend validates against DB and blockchain
 * 4. Returns verification result with shipment/container data
 * 5. User confirms action to update status
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  verifyScan, 
  confirmScan, 
  parseQRDataLocal,
  SCAN_STATUS 
} from '../services/scanApi';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Scan states
 */
export const SCAN_STATES = {
  READY: 'ready',                    // Waiting for scan
  LOADING_SHIPMENT: 'loading_shipment', // Loading shipment from QR
  VERIFYING: 'verifying',            // Verifying against backend
  VERIFIED: 'verified',              // Verification successful
  SCANNING_ITEMS: 'scanning_items',  // Ready to scan items (legacy)
  SCANNING_ONE: 'scanning_one',      // Scanning single item (legacy)
  CONFIRMING: 'confirming',          // User confirming action
  COMPLETED: 'completed',            // All done
  REJECTED: 'rejected',              // Verification failed
  EXCEPTION: 'exception',            // Exception reported
  ERROR: 'error'                     // System error
};

/**
 * Role types for different scan behaviors
 */
export const SCANNER_ROLES = {
  SUPPLIER: 'supplier',
  TRANSPORTER: 'transporter',
  WAREHOUSE: 'warehouse',
  RETAILER: 'retailer'
};

/**
 * Scan modes
 */
export const SCAN_MODES = {
  SIMULATED: 'simulated',  // Mock data for testing
  LIVE: 'live'             // Real camera + backend API
};

// ═══════════════════════════════════════════════════════════════════════════
// DEMO DATA (for simulated mode - kept for backwards compatibility)
// ═══════════════════════════════════════════════════════════════════════════

const DEMO_SHIPMENTS = [
  { id: 'SHP-4521', origin: 'Punjab Farms', batch: 'B-2024-1205', type: 'Shipment', expectedItems: 20, productName: 'Basmati Rice' },
  { id: 'SHP-4520', origin: 'Gujarat Oils', batch: 'B-2024-1198', type: 'Shipment', expectedItems: 15, productName: 'Groundnut Oil' },
  { id: 'SHP-4519', origin: 'Assam Gardens', batch: 'B-2024-1210', type: 'Shipment', expectedItems: 12, productName: 'Assam Tea' },
  { id: 'SHP-4518', origin: 'Mumbai Care', batch: 'B-2024-1215', type: 'Shipment', expectedItems: 18, productName: 'Health Supplements' },
];

const STATUS_BY_ROLE = {
  [SCANNER_ROLES.SUPPLIER]: 'Ready for Dispatch',
  [SCANNER_ROLES.TRANSPORTER]: 'In Transit',
  [SCANNER_ROLES.WAREHOUSE]: 'At Warehouse',
  [SCANNER_ROLES.RETAILER]: 'Received'
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

const useQRScanner = ({
  role = SCANNER_ROLES.RETAILER,
  walletAddress = null,
  mode = SCAN_MODES.LIVE,  // Default to live mode
  onScanProgress = null,
  onBatchComplete = null,
  onException = null,
  onVerified = null,
  onRejected = null,
  onError = null
} = {}) => {
  // State
  const [scanState, setScanState] = useState(SCAN_STATES.READY);
  const [scanMode, setScanMode] = useState(mode);
  const [shipmentData, setShipmentData] = useState(null);
  const [containerData, setContainerData] = useState(null);
  const [scannedItems, setScannedItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [exceptionMessage, setExceptionMessage] = useState('');
  const [location, setLocation] = useState(null);

  // Refs
  const scannedItemsRef = useRef([]);

  // ═══════════════════════════════════════════════════════════════════════
  // GEOLOCATION - Get human-readable location name
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (navigator.geolocation) {
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
              // Get human-readable location: city, town, or village + state
              const parts = [];
              if (data.address) {
                const addr = data.address;
                const place = addr.city || addr.town || addr.village || addr.suburb || addr.county;
                if (place) parts.push(place);
                if (addr.state) parts.push(addr.state);
                if (!parts.length && addr.country) parts.push(addr.country);
              }
              
              const locationName = parts.length > 0 
                ? parts.join(', ') 
                : data.display_name?.split(',').slice(0, 2).join(',') || null;
              
              setLocation(locationName);
            } else {
              // Fallback: just use coordinates description
              setLocation(null);
            }
          } catch (err) {
            console.log('Reverse geocoding failed:', err.message);
            setLocation(null);
          }
        },
        (err) => console.log('Geolocation not available:', err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // LIVE MODE - REAL API VERIFICATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Verify QR data against backend API
   * This is the main function for live mode
   */
  const verifyQRCode = useCallback(async (qrData) => {
    if (!qrData) {
      setError('No QR data provided');
      setScanState(SCAN_STATES.ERROR);
      return null;
    }

    // Quick local validation
    const localParse = parseQRDataLocal(qrData);
    if (!localParse.isValid) {
      setError(localParse.error);
      setScanState(SCAN_STATES.REJECTED);
      if (onRejected) onRejected({ error: localParse.error });
      return null;
    }

    setScanState(SCAN_STATES.VERIFYING);
    setError(null);

    try {
      const result = await verifyScan(qrData, location);
      
      setVerificationResult(result);
      
      // Check for ACCEPTED (new) or VERIFIED (legacy)
      if (result.status === SCAN_STATUS.ACCEPTED || result.status === 'ACCEPTED' || result.status === 'VERIFIED') {
        setShipmentData(result.shipment);
        setContainerData(result.container);
        setScanState(SCAN_STATES.VERIFIED);
        
        if (onVerified) {
          onVerified(result);
        }
        
        return result;
      } else {
        setError(result.reason || 'Verification failed');
        setScanState(SCAN_STATES.REJECTED);
        
        if (onRejected) {
          onRejected(result);
        }
        
        return result;
      }
    } catch (err) {
      console.error('Verification error:', err);
      const errorMessage = err.data?.reason || err.message || 'Verification failed';
      setError(errorMessage);
      setScanState(SCAN_STATES.REJECTED);
      setVerificationResult(err.data || null);
      
      if (onRejected) {
        onRejected({ error: errorMessage, data: err.data });
      }
      
      return null;
    }
  }, [location, onVerified, onRejected]);

  /**
   * Confirm a verified scan and update shipment status
   */
  const confirmVerification = useCallback(async (notes = '') => {
    if (!verificationResult?.scanId) {
      setError('No scan to confirm');
      return null;
    }

    setScanState(SCAN_STATES.CONFIRMING);

    try {
      const result = await confirmScan(verificationResult.scanId, true, notes);
      
      setScanState(SCAN_STATES.COMPLETED);
      
      if (onBatchComplete) {
        onBatchComplete(shipmentData, 1, [verificationResult]);
      }
      
      return result;
    } catch (err) {
      console.error('Confirmation error:', err);
      setError(err.message || 'Confirmation failed');
      setScanState(SCAN_STATES.ERROR);
      
      if (onError) {
        onError(err);
      }
      
      return null;
    }
  }, [verificationResult, shipmentData, onBatchComplete, onError]);

  /**
   * Cancel a verified scan
   */
  const cancelVerification = useCallback(async () => {
    if (verificationResult?.scanId) {
      try {
        await confirmScan(verificationResult.scanId, false);
      } catch (err) {
        console.error('Cancel error:', err);
      }
    }
    
    resetScanner();
  }, [verificationResult]);

  // ═══════════════════════════════════════════════════════════════════════
  // SIMULATED MODE - DEMO DATA (Original behavior for backwards compat)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Start simulated shipment scan (original behavior)
   */
  const startShipmentScan = useCallback(async () => {
    if (scanMode === SCAN_MODES.LIVE) {
      // In live mode, this just prepares for scanning
      setScanState(SCAN_STATES.READY);
      return;
    }

    // Simulated mode - original behavior
    setScanState(SCAN_STATES.LOADING_SHIPMENT);
    setError(null);
    setScannedItems([]);
    scannedItemsRef.current = [];
    setExceptionMessage('');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const shipment = DEMO_SHIPMENTS[Math.floor(Math.random() * DEMO_SHIPMENTS.length)];
    
    const shipmentInfo = {
      ...shipment,
      status: STATUS_BY_ROLE[role],
      scannedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      walletAddress,
    };
    
    setShipmentData(shipmentInfo);
    setScanState(SCAN_STATES.SCANNING_ITEMS);
  }, [scanMode, role, walletAddress]);

  /**
   * Scan one item (simulated mode - original behavior)
   */
  const scanOneItem = useCallback(async () => {
    if (!shipmentData) return;
    if (scannedItemsRef.current.length >= shipmentData.expectedItems) return;
    
    setScanState(SCAN_STATES.SCANNING_ONE);
    
    const itemIndex = scannedItemsRef.current.length;
    const itemData = {
      itemId: `${shipmentData.id}-ITEM-${String(itemIndex + 1).padStart(3, '0')}`,
      shipmentId: shipmentData.id,
      productName: shipmentData.productName,
      origin: shipmentData.origin,
      batch: shipmentData.batch,
      itemNumber: itemIndex + 1,
      totalItems: shipmentData.expectedItems,
    };
    setCurrentItem(itemData);
    
    const scanDelay = 1000 + Math.random() * 500;
    await new Promise(resolve => setTimeout(resolve, scanDelay));
    
    // Simulate blockchain record
    const txResult = {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      itemId: itemData.itemId,
    };
    
    const scannedItem = {
      ...itemData,
      txHash: txResult.txHash,
      scannedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    
    scannedItemsRef.current = [...scannedItemsRef.current, scannedItem];
    setScannedItems(scannedItemsRef.current);
    setCurrentItem(null);
    
    if (onScanProgress) {
      onScanProgress(scannedItemsRef.current.length, shipmentData.expectedItems, scannedItem);
    }
    
    if (scannedItemsRef.current.length >= shipmentData.expectedItems) {
      setScanState(SCAN_STATES.COMPLETED);
      if (onBatchComplete) {
        onBatchComplete(shipmentData, scannedItemsRef.current.length, scannedItemsRef.current);
      }
    } else {
      setScanState(SCAN_STATES.SCANNING_ITEMS);
    }
  }, [shipmentData, onScanProgress, onBatchComplete]);

  /**
   * Report exception with missing items
   */
  const reportException = useCallback((message) => {
    setExceptionMessage(message);
    setScanState(SCAN_STATES.EXCEPTION);
    setCurrentItem(null);
    
    if (onException) {
      onException({
        shipment: shipmentData,
        scannedCount: scannedItemsRef.current.length,
        expectedCount: shipmentData?.expectedItems || 0,
        missingCount: (shipmentData?.expectedItems || 0) - scannedItemsRef.current.length,
        message,
        scannedItems: scannedItemsRef.current,
      });
    }
  }, [shipmentData, onException]);

  /**
   * Reset scanner to ready state
   */
  const resetScanner = useCallback(() => {
    setScanState(SCAN_STATES.READY);
    setShipmentData(null);
    setContainerData(null);
    setScannedItems([]);
    scannedItemsRef.current = [];
    setCurrentItem(null);
    setVerificationResult(null);
    setExceptionMessage('');
    setError(null);
  }, []);

  /**
   * Toggle between simulated and live mode
   */
  const toggleMode = useCallback(() => {
    setScanMode(current => 
      current === SCAN_MODES.LIVE ? SCAN_MODES.SIMULATED : SCAN_MODES.LIVE
    );
    resetScanner();
  }, [resetScanner]);

  // ═══════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════

  const progress = {
    scanned: scannedItems.length,
    total: shipmentData?.expectedItems || shipmentData?.numberOfContainers || 0,
    percentage: shipmentData 
      ? Math.round((scannedItems.length / (shipmentData.expectedItems || shipmentData.numberOfContainers || 1)) * 100) 
      : 0,
    missing: shipmentData 
      ? (shipmentData.expectedItems || shipmentData.numberOfContainers || 0) - scannedItems.length 
      : 0,
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════

  return {
    // State
    scanState,
    scanMode,
    shipmentData,
    containerData,
    scannedItems,
    currentItem,
    verificationResult,
    error,
    exceptionMessage,
    progress,
    location,
    
    // State checks
    isReady: scanState === SCAN_STATES.READY,
    isLoadingShipment: scanState === SCAN_STATES.LOADING_SHIPMENT,
    isVerifying: scanState === SCAN_STATES.VERIFYING,
    isVerified: scanState === SCAN_STATES.VERIFIED,
    isReadyToScan: scanState === SCAN_STATES.SCANNING_ITEMS,
    isScanningOne: scanState === SCAN_STATES.SCANNING_ONE,
    isConfirming: scanState === SCAN_STATES.CONFIRMING,
    isCompleted: scanState === SCAN_STATES.COMPLETED,
    isRejected: scanState === SCAN_STATES.REJECTED,
    hasException: scanState === SCAN_STATES.EXCEPTION,
    hasError: scanState === SCAN_STATES.ERROR,
    isLiveMode: scanMode === SCAN_MODES.LIVE,
    
    // Live mode actions
    verifyQRCode,
    confirmVerification,
    cancelVerification,
    
    // Simulated mode actions (original)
    startShipmentScan,
    scanOneItem,
    reportException,
    
    // Common actions
    resetScanner,
    toggleMode,
    setExceptionMessage,
    
    // Constants
    SCAN_STATES,
    SCAN_MODES,
    role,
  };
};

export default useQRScanner;
