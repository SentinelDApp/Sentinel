import { useState, useCallback } from 'react';

/**
 * Custom hook for managing received shipments state and actions
 */
export const useShipments = (initialShipments = []) => {
  const [shipments, setShipments] = useState(initialShipments);
  const [showModal, setShowModal] = useState(false);

  // Add new shipment to the list
  const addShipment = useCallback((shipment, txResult) => {
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
    
    setShipments(prev => [newShipment, ...prev]);
    return newShipment;
  }, []);

  // Get recent shipments (configurable count)
  const getRecentShipments = useCallback((count = 3) => {
    return shipments.slice(0, count);
  }, [shipments]);

  // Get shipments with exceptions
  const getExceptionShipments = useCallback(() => {
    return shipments.filter(s => s.hasException);
  }, [shipments]);

  // Get shipment by ID
  const getShipmentById = useCallback((id) => {
    return shipments.find(s => s.id === id);
  }, [shipments]);

  // Open/close modal
  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  return {
    shipments,
    showModal,
    setShipments,
    addShipment,
    getRecentShipments,
    getExceptionShipments,
    getShipmentById,
    openModal,
    closeModal,
  };
};

export default useShipments;
