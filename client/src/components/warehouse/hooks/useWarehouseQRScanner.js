/**
 * useWarehouseQRScanner Hook
 *
 * Warehouse QR scanning logic for Sentinel blockchain supply chain system.
 *
 * Features:
 * - Scan container QR codes that have been scanned by transporter
 * - Verify container exists on blockchain (has txHash)
 * - Prevent duplicate scans
 * - Track real-time progress (scanned/total)
 * - Enable status update when all containers are scanned
 *
 * Flow:
 * 1. Upload QR code image to scan container ID
 * 2. Verify container exists and is locked on blockchain
 * 3. Check if container was already scanned by transporter (IN_TRANSIT status)
 * 4. Prevent duplicate warehouse scans
 * 5. Track progress and enable status update when complete
 */

import { useState, useCallback, useRef } from "react";
import {
  scanContainerForWarehouse,
  getShipmentContainers,
  updateShipmentStatus,
} from "../../../services/scanApi";

/**
 * Scan states
 */
const SCAN_STATES = {
  IDLE: "idle", // No active scanning session
  LOADING_SHIPMENT: "loading_shipment", // Loading shipment details
  READY_TO_SCAN: "ready_to_scan", // Ready to scan containers
  SCANNING: "scanning", // Currently processing a scan
  ALL_SCANNED: "all_scanned", // All containers scanned
  UPDATING_STATUS: "updating_status", // Updating shipment status
  COMPLETED: "completed", // Status updated successfully
  ERROR: "error", // Error state
};

/**
 * Scan result types
 */
const SCAN_RESULT = {
  SUCCESS: "success",
  DUPLICATE: "duplicate",
  NOT_FOUND: "not_found",
  NOT_ON_BLOCKCHAIN: "not_on_blockchain",
  NOT_SCANNED_BY_TRANSPORTER: "not_scanned_by_transporter",
  ALREADY_AT_WAREHOUSE: "already_at_warehouse",
  ERROR: "error",
};

/**
 * useWarehouseQRScanner Hook
 */
const useWarehouseQRScanner = ({
  walletAddress,
  onScanComplete = null,
  onAllScanned = null,
  onStatusUpdated = null,
  onError = null,
} = {}) => {
  // State
  const [scanState, setScanState] = useState(SCAN_STATES.IDLE);
  const [shipmentData, setShipmentData] = useState(null);
  const [containers, setContainers] = useState([]);
  const [scannedContainers, setScannedContainers] = useState([]);
  const [scanLogs, setScanLogs] = useState([]);
  const [currentScan, setCurrentScan] = useState(null);
  const [error, setError] = useState(null);

  // Refs for tracking
  const scannedIdsRef = useRef(new Set());

  /**
   * Reset scanner to initial state
   */
  const resetScanner = useCallback(() => {
    setScanState(SCAN_STATES.IDLE);
    setShipmentData(null);
    setContainers([]);
    setScannedContainers([]);
    setScanLogs([]);
    setCurrentScan(null);
    setError(null);
    scannedIdsRef.current = new Set();
  }, []);

  /**
   * Initialize scanner with a shipment
   * Loads shipment details and containers list
   */
  const initializeWithShipment = useCallback(
    async (shipmentHash) => {
      setScanState(SCAN_STATES.LOADING_SHIPMENT);
      setError(null);

      try {
        console.log("Initializing scanner with shipment:", shipmentHash);

        if (!shipmentHash) {
          throw new Error("Shipment hash is required");
        }

        const response = await getShipmentContainers(shipmentHash);
        console.log("Got containers response:", response);

        if (!response || !response.success) {
          const errorMsg =
            response?.message ||
            "Failed to load shipment. Please check if the server is running.";
          throw new Error(errorMsg);
        }

        const { shipment, containers: shipmentContainers } = response;

        if (!shipment) {
          throw new Error("Shipment data not found in response");
        }

        // Verify shipment is locked on blockchain
        if (!shipment.txHash) {
          throw new Error(
            "Shipment is not locked on blockchain yet. Please wait for the supplier to confirm dispatch.",
          );
        }

        // Ensure containers is an array
        const containersList = Array.isArray(shipmentContainers)
          ? shipmentContainers
          : [];

        // Filter containers that need to be scanned by warehouse
        // (containers that have been scanned by transporter - IN_TRANSIT status)
        const containersToScan = containersList.filter(
          (c) => c.status === "IN_TRANSIT" || c.status === "AT_WAREHOUSE",
        );

        // Find already scanned containers (AT_WAREHOUSE status with warehouse scan)
        const alreadyScanned = containersList.filter(
          (c) =>
            c.status === "AT_WAREHOUSE" &&
            c.lastScannedBy?.role === "warehouse",
        );

        // Update refs
        alreadyScanned.forEach((c) => scannedIdsRef.current.add(c.containerId));

        setShipmentData(shipment);
        setContainers(containersList);
        setScannedContainers(alreadyScanned);

        // Check if all are already scanned
        if (
          containersList.length > 0 &&
          alreadyScanned.length === containersList.length
        ) {
          setScanState(SCAN_STATES.ALL_SCANNED);
        } else {
          setScanState(SCAN_STATES.READY_TO_SCAN);
        }

        return { success: true, shipment, containers: containersList };
      } catch (err) {
        console.error("Failed to initialize scanner:", err);
        const errorMessage =
          err?.message || "Failed to load shipment. Please try again.";
        setError(errorMessage);
        setScanState(SCAN_STATES.ERROR);
        if (onError) onError(new Error(errorMessage));
        return { success: false, error: errorMessage };
      }
    },
    [onError],
  );

  /**
   * Process a scanned QR code
   * Can be called from IDLE state (direct scanning) or READY_TO_SCAN state
   * @param {string} qrData - Raw QR data from scanner
   */
  const processQRScan = useCallback(
    async (qrData) => {
      if (!qrData) {
        setCurrentScan({
          qrData: null,
          status: "error",
          error: "No QR code detected in image",
        });
        return {
          success: false,
          result: SCAN_RESULT.ERROR,
          message: "No QR code detected in image",
        };
      }

      setScanState(SCAN_STATES.SCANNING);
      setCurrentScan({ qrData, status: "processing" });
      setError(null);

      try {
        // Extract container ID from QR data
        let containerId = qrData.trim().toUpperCase();

        // Handle JSON format
        if (qrData.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(qrData);
            containerId = (parsed.containerId || "").toUpperCase();
          } catch (e) {
            // Not JSON, use as-is
          }
        }

        // Extract CNT-xxx pattern if embedded in other text
        const containerMatch = containerId.match(
          /CNT-[A-Za-z0-9]+-[A-Za-z0-9]+/i,
        );
        if (containerMatch) {
          containerId = containerMatch[0].toUpperCase();
        }

        // Check if already scanned in this session
        if (scannedIdsRef.current.has(containerId)) {
          const scanLog = {
            containerId,
            result: SCAN_RESULT.DUPLICATE,
            message: "Container already scanned",
            timestamp: new Date().toISOString(),
          };
          setScanLogs((prev) => [scanLog, ...prev]);
          setCurrentScan({ qrData, containerId, status: "duplicate" });
          setScanState(SCAN_STATES.READY_TO_SCAN);

          return {
            success: false,
            result: SCAN_RESULT.DUPLICATE,
            message: "This container has already been scanned",
            containerId,
          };
        }

        // Call API to verify and scan container
        const response = await scanContainerForWarehouse(containerId);

        if (response.success) {
          // Successful scan
          scannedIdsRef.current.add(containerId);

          const scannedContainer = {
            containerId,
            ...response.container,
            scannedAt: new Date().toISOString(),
          };

          setScannedContainers((prev) => [...prev, scannedContainer]);

          const scanLog = {
            containerId,
            result: SCAN_RESULT.SUCCESS,
            message: "Container verified and scanned successfully",
            scanId: response.scanId,
            container: response.container,
            shipment: response.shipment,
            timestamp: new Date().toISOString(),
          };
          setScanLogs((prev) => [scanLog, ...prev]);
          setCurrentScan({
            qrData,
            containerId,
            status: "success",
            data: response,
          });

          // Update containers list with new status
          setContainers((prev) =>
            prev.map((c) =>
              c.containerId === containerId
                ? { ...c, status: response.container.currentStatus }
                : c,
            ),
          );

          // Notify callback
          if (onScanComplete) {
            onScanComplete(scannedContainer, response);
          }

          // Check if all containers are now scanned (only if shipment is loaded)
          const totalContainers =
            shipmentData?.numberOfContainers || containers.length;
          const newScannedCount = scannedIdsRef.current.size;

          if (
            shipmentData &&
            newScannedCount >= totalContainers &&
            totalContainers > 0
          ) {
            setScanState(SCAN_STATES.ALL_SCANNED);
            if (onAllScanned) {
              onAllScanned({
                shipment: shipmentData,
                scannedCount: newScannedCount,
                totalCount: totalContainers,
              });
            }
          } else if (shipmentData) {
            setScanState(SCAN_STATES.READY_TO_SCAN);
          } else {
            // No shipment loaded, stay in idle mode for continuous scanning
            setScanState(SCAN_STATES.IDLE);
          }

          return {
            success: true,
            result: SCAN_RESULT.SUCCESS,
            message: "Container scanned successfully",
            containerId,
            data: response,
          };
        } else {
          // Handle different rejection reasons
          let result = SCAN_RESULT.ERROR;
          let message = response.message || response.reason || "Scan failed";

          if (response.code === "CONTAINER_NOT_FOUND") {
            result = SCAN_RESULT.NOT_FOUND;
            message = "Container not found in system";
          } else if (response.code === "NOT_READY_FOR_DISPATCH") {
            result = SCAN_RESULT.NOT_ON_BLOCKCHAIN;
            message = "Container shipment not locked on blockchain";
          } else if (response.code === "NOT_SCANNED_BY_TRANSPORTER") {
            result = SCAN_RESULT.NOT_SCANNED_BY_TRANSPORTER;
            message = "Container must be scanned by transporter first";
          } else if (response.code === "ALREADY_SCANNED_BY_WAREHOUSE") {
            result = SCAN_RESULT.ALREADY_AT_WAREHOUSE;
            message = "Container already scanned by warehouse";
            // Add to scanned list to prevent re-scanning
            scannedIdsRef.current.add(containerId);
          }

          const scanLog = {
            containerId,
            result,
            message,
            code: response.code,
            timestamp: new Date().toISOString(),
          };
          setScanLogs((prev) => [scanLog, ...prev]);
          setCurrentScan({
            qrData,
            containerId,
            status: "rejected",
            error: message,
          });
          // Return to idle if no shipment loaded, otherwise ready to scan
          setScanState(
            shipmentData ? SCAN_STATES.READY_TO_SCAN : SCAN_STATES.IDLE,
          );

          return {
            success: false,
            result,
            message,
            containerId,
            code: response.code,
          };
        }
      } catch (err) {
        console.error("Scan processing error:", err);
        const errorMessage =
          err.data?.message || err.message || "Failed to process scan";

        const scanLog = {
          qrData,
          result: SCAN_RESULT.ERROR,
          message: errorMessage,
          timestamp: new Date().toISOString(),
        };
        setScanLogs((prev) => [scanLog, ...prev]);
        setCurrentScan({ qrData, status: "error", error: errorMessage });
        setError(errorMessage);
        // Return to idle if no shipment loaded, otherwise ready to scan
        setScanState(
          shipmentData ? SCAN_STATES.READY_TO_SCAN : SCAN_STATES.IDLE,
        );

        if (onError) onError(err);

        return {
          success: false,
          result: SCAN_RESULT.ERROR,
          message: errorMessage,
        };
      }
    },
    [shipmentData, containers, onScanComplete, onAllScanned, onError],
  );

  /**
   * Update shipment status to AT_WAREHOUSE
   */
  const confirmWarehouseArrival = useCallback(async () => {
    if (!shipmentData?.shipmentHash) {
      return { success: false, message: "No shipment loaded" };
    }

    setScanState(SCAN_STATES.UPDATING_STATUS);
    setError(null);

    try {
      const response = await updateShipmentStatus(
        shipmentData.shipmentHash,
        "AT_WAREHOUSE",
        "All containers received at warehouse",
      );

      if (response.success) {
        setScanState(SCAN_STATES.COMPLETED);

        // Update local shipment data
        setShipmentData((prev) => ({
          ...prev,
          status: "AT_WAREHOUSE",
        }));

        if (onStatusUpdated) {
          onStatusUpdated({
            shipment: shipmentData,
            newStatus: "AT_WAREHOUSE",
            scannedCount: scannedContainers.length,
          });
        }

        return {
          success: true,
          message: "Shipment status updated successfully",
        };
      } else {
        throw new Error(response.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Status update error:", err);
      const errorMessage = err.message || "Failed to update shipment status";
      setError(errorMessage);
      setScanState(SCAN_STATES.ALL_SCANNED); // Go back to all scanned state

      if (onError) onError(err);

      return { success: false, message: errorMessage };
    }
  }, [shipmentData, scannedContainers, onStatusUpdated, onError]);

  /**
   * Get progress information
   */
  const getProgress = useCallback(() => {
    const total = shipmentData?.numberOfContainers || containers.length || 0;
    const scanned = scannedIdsRef.current.size;
    const percentage = total > 0 ? Math.round((scanned / total) * 100) : 0;
    const remaining = total - scanned;

    return {
      scanned,
      total,
      percentage,
      remaining,
      isComplete: scanned >= total && total > 0,
    };
  }, [shipmentData, containers]);

  return {
    // State
    scanState,
    shipmentData,
    containers,
    scannedContainers,
    scanLogs,
    currentScan,
    error,

    // Computed
    progress: getProgress(),
    isIdle: scanState === SCAN_STATES.IDLE,
    isLoading: scanState === SCAN_STATES.LOADING_SHIPMENT,
    isReadyToScan: scanState === SCAN_STATES.READY_TO_SCAN,
    isScanning: scanState === SCAN_STATES.SCANNING,
    isAllScanned: scanState === SCAN_STATES.ALL_SCANNED,
    isUpdating: scanState === SCAN_STATES.UPDATING_STATUS,
    isCompleted: scanState === SCAN_STATES.COMPLETED,
    hasError: scanState === SCAN_STATES.ERROR,

    // Actions
    initializeWithShipment,
    processQRScan,
    confirmWarehouseArrival,
    resetScanner,

    // Constants
    SCAN_STATES,
    SCAN_RESULT,
  };
};

export default useWarehouseQRScanner;
export { SCAN_STATES, SCAN_RESULT };
