import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for managing retailer dashboard state
 * Handles modals, shipments, and scanner state
 */
export const useRetailerDashboard = () => {
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
  
  // Ref to scroll to QR scanner section
  const scannerRef = useRef(null);

  // Handle when retailer confirms receipt of shipment (batch complete or exception)
  const handleShipmentReceived = useCallback((shipment, txResult) => {
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
    
    // Add to beginning of list (most recent first)
    setReceivedShipments(prev => [newShipment, ...prev]);
    
    // Close Accept Shipment modal if open
    setShowAcceptShipment(false);
  }, []);
  
  // Header action handlers
  const handleAcceptShipment = useCallback(() => {
    setShowAcceptShipment(true);
  }, []);
  
  const handleViewReceived = useCallback(() => {
    setShowAllShipments(true);
  }, []);
  
  const handleViewOrders = useCallback(() => {
    setShowOrdersModal(true);
  }, []);

  const closeAcceptShipment = useCallback(() => {
    setShowAcceptShipment(false);
  }, []);

  const closeAllShipments = useCallback(() => {
    setShowAllShipments(false);
  }, []);

  const closeOrdersModal = useCallback(() => {
    setShowOrdersModal(false);
  }, []);

  return {
    // State
    scannerExpanded,
    receivedShipments,
    showAllShipments,
    showAcceptShipment,
    showOrdersModal,
    scannerRef,
    
    // Setters
    setScannerExpanded,
    setReceivedShipments,
    
    // Actions
    handleShipmentReceived,
    handleAcceptShipment,
    handleViewReceived,
    handleViewOrders,
    closeAcceptShipment,
    closeAllShipments,
    closeOrdersModal,
  };
};

export default useRetailerDashboard;
