/**
 * useRetailerShipments Hook
 * 
 * Fetches real shipments from the API for the retailer dashboard.
 * The shipments displayed are those that have been assigned to this retailer
 * by a warehouse and are ready for delivery/pickup.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getRetailerShipments } from '../../../services/scanApi';

/**
 * Map backend status to retailer-friendly display status
 */
const mapStatusToRetailer = (status) => {
  const statusMap = {
    'CREATED': 'Pending',
    'READY_FOR_DISPATCH': 'Ready for Pickup',
    'IN_TRANSIT': 'In Transit',
    'AT_WAREHOUSE': 'At Warehouse',
    'DELIVERED': 'Delivered',
  };
  return statusMap[status] || status;
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

/**
 * Transform API shipment data to retailer display format
 */
const transformShipmentToDisplay = (shipment) => {
  return {
    // Core identifiers
    id: shipment.shipmentHash || shipment._id,
    shipmentHash: shipment.shipmentHash,
    batchId: shipment.batchId,
    
    // Product info
    productName: shipment.productName || `Batch ${shipment.batchId}`,
    product: shipment.productName || `Batch ${shipment.batchId}`,
    
    // Origin info (warehouse that assigned this shipment)
    origin: shipment.assignedWarehouse?.organizationName || 
            shipment.assignedWarehouse?.name || 
            'Warehouse',
    warehouseName: shipment.assignedWarehouse?.name || null,
    warehouseOrganization: shipment.assignedWarehouse?.organizationName || null,
    
    // Quantities
    itemCount: shipment.numberOfContainers,
    expectedItems: shipment.numberOfContainers,
    numberOfContainers: shipment.numberOfContainers,
    quantityPerContainer: shipment.quantityPerContainer,
    totalQuantity: shipment.totalQuantity,
    
    // Status - mapped to retailer display format
    status: mapStatusToRetailer(shipment.status),
    originalStatus: shipment.status,
    
    // Blockchain info
    isLocked: !!shipment.txHash,
    txHash: shipment.txHash,
    blockNumber: shipment.blockNumber,
    
    // Supplier info
    supplierWallet: shipment.supplierWallet,
    
    // Assigned stakeholders
    assignedTransporter: shipment.assignedTransporter || null,
    assignedWarehouse: shipment.assignedWarehouse || null,
    assignedRetailer: shipment.assignedRetailer || null,
    
    // Timestamps
    createdAt: formatDate(shipment.createdAt),
    createdAtRaw: shipment.createdAt,
    assignedAt: shipment.assignedRetailer?.assignedAt 
      ? formatDate(shipment.assignedRetailer.assignedAt) 
      : null,
    receivedAt: new Date(shipment.assignedRetailer?.assignedAt || shipment.createdAt)
      .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    
    // Exception handling
    hasException: false,
    exceptionNote: null,
    
    // Supporting documents
    supportingDocuments: shipment.supportingDocuments || [],
    
    // Keep raw data for reference
    _raw: shipment,
  };
};

/**
 * Custom hook for fetching retailer shipments
 */
export const useRetailerShipments = () => {
  const { user, walletAddress } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  /**
   * Fetch shipments assigned to this retailer
   */
  const loadShipments = useCallback(async () => {
    if (!walletAddress) {
      console.log('useRetailerShipments: No wallet address available');
      setShipments([]);
      setIsLoading(false);
      setError('Please connect your wallet to view assigned shipments');
      return;
    }

    console.log('useRetailerShipments: Fetching shipments for wallet:', walletAddress);
    setIsLoading(true);
    setError(null);

    try {
      // Fetch only shipments assigned to this retailer
      const result = await getRetailerShipments(walletAddress, { 
        limit: 100 
      });
      
      console.log('useRetailerShipments: API response:', result);
      
      if (result.success && result.data) {
        // Transform shipments to display format
        const transformedShipments = result.data.map(transformShipmentToDisplay);
        console.log('useRetailerShipments: Transformed shipments:', transformedShipments);
        setShipments(transformedShipments);
        setPagination(result.pagination);
      } else {
        console.log('useRetailerShipments: No data or failed:', result);
        setShipments([]);
        setError(result.message || 'Failed to load shipments');
      }
    } catch (err) {
      console.error('useRetailerShipments: Failed to fetch retailer shipments:', err);
      setError(err.message || 'Failed to load shipments');
      setShipments([]);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  /**
   * Refresh shipments
   */
  const refreshShipments = useCallback(async () => {
    await loadShipments();
  }, [loadShipments]);

  /**
   * Update a shipment's status locally (after action)
   */
  const updateShipmentStatus = useCallback((shipmentId, newStatus) => {
    setShipments(prev => 
      prev.map(shipment => 
        shipment.id === shipmentId 
          ? { ...shipment, status: mapStatusToRetailer(newStatus), originalStatus: newStatus }
          : shipment
      )
    );
  }, []);

  /**
   * Mark shipment as received (move from assigned to received)
   */
  const markAsReceived = useCallback((shipmentId) => {
    setShipments(prev => 
      prev.map(shipment => 
        shipment.id === shipmentId 
          ? { ...shipment, status: 'Delivered', originalStatus: 'DELIVERED' }
          : shipment
      )
    );
  }, []);

  // Load shipments on mount and when wallet changes
  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  return {
    shipments,
    isLoading,
    error,
    pagination,
    refreshShipments,
    updateShipmentStatus,
    markAsReceived,
  };
};

export default useRetailerShipments;
