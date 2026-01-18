/**
 * useTransporterShipments Hook
 * 
 * Fetches real shipments from the API for the transporter dashboard.
 * The shipments displayed are those that have been created by suppliers
 * and are ready for pickup or in transit.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { fetchTransporterShipments } from '../../../services/shipmentApi';

/**
 * Map backend status to transporter-friendly display status
 */
const mapStatusToTransporter = (status) => {
  const statusMap = {
    'created': 'Pending',
    'ready_for_dispatch': 'Ready',
    'in_transit': 'In Transit',
    'at_warehouse': 'At Warehouse',
    'delivered': 'Delivered',
  };
  return statusMap[status] || status;
};

/**
 * Transform API shipment data to transporter job format
 */
const transformShipmentToJob = (shipment) => {
  // Determine destination based on whether transporter is assigned via nextTransporter
  const isNextTransporter = shipment.isNextTransporter || false;
  const destination = shipment.destination || (isNextTransporter ? 'RETAILER' : 'WAREHOUSE');
  
  // Get destination name for display
  let destName = 'Destination';
  if (destination === 'RETAILER') {
    destName = shipment.assignedRetailer?.name || 
               shipment.destinationDetails?.name || 
               'Retailer';
  } else {
    destName = shipment.assignedWarehouse?.name || 
               shipment.destinationDetails?.name || 
               'Warehouse';
  }
  
  return {
    // Core identifiers
    id: shipment.shipmentHash || shipment.id,
    shipmentHash: shipment.shipmentHash,
    batchId: shipment.batchId,
    
    // Product info - use batchId as product name since we don't have product details
    product: shipment.productName || `Batch ${shipment.batchId}`,
    
    // Route info
    origin: shipment.origin || 'Supplier Warehouse',
    dest: destName,
    
    // Quantities
    expectedQuantity: shipment.totalQuantity || shipment.quantity,
    numberOfContainers: shipment.numberOfContainers,
    quantityPerContainer: shipment.quantityPerContainer,
    
    // Weight (not in current API, default placeholder)
    weight: shipment.weight || `${(shipment.totalQuantity || 0) * 2} kg`,
    
    // Status - mapped to transporter display format
    status: mapStatusToTransporter(shipment.status),
    originalStatus: shipment.status,
    
    // Blockchain info
    isLocked: shipment.isLocked,
    txHash: shipment.txHash,
    blockNumber: shipment.blockNumber,
    
    // Supplier info
    supplierWallet: shipment.supplierWallet,
    
    // Transporter assignment info
    isNextTransporter, // true if assigned via nextTransporter field
    destination, // "WAREHOUSE" or "RETAILER"
    destinationDetails: shipment.destinationDetails || null,
    assignedTransporter: shipment.assignedTransporter || null,
    nextTransporter: shipment.nextTransporter || null,
    assignedWarehouse: shipment.assignedWarehouse || null,
    assignedRetailer: shipment.assignedRetailer || null,
    
    // Containers
    containers: shipment.containers || [],
    
    // Timestamps
    createdAt: formatDate(shipment.createdAt),
    createdAtRaw: shipment.createdAt,
    
    // Additional info
    temperature: shipment.temperature || null,
    humidity: shipment.humidity || null,
    priority: shipment.priority || 'Normal',
    eta: shipment.eta || null,
    distance: shipment.distance || null,
  };
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
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
 * Custom hook for fetching transporter shipments
 */
export const useTransporterShipments = () => {
  const { user, walletAddress } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  /**
   * Fetch shipments assigned to this transporter
   */
  const loadShipments = useCallback(async () => {
    if (!walletAddress) {
      setJobs([]);
      setIsLoading(false);
      setError('Please connect your wallet to view assigned shipments');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch shipments assigned to this transporter (from both assignedTransporter and nextTransporter)
      const result = await fetchTransporterShipments(walletAddress, { 
        limit: 100
      });
      
      // Transform shipments to job format
      const transformedJobs = result.shipments.map(transformShipmentToJob);
      
      setJobs(transformedJobs);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
      setError(err.message || 'Failed to load shipments');
      setJobs([]);
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
   * Update a job's status locally (after blockchain update)
   */
  const updateJobStatus = useCallback((jobId, newStatus) => {
    setJobs(prev => 
      prev.map(job => 
        job.id === jobId 
          ? { ...job, status: newStatus }
          : job
      )
    );
  }, []);

  // Load shipments on mount
  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  return {
    jobs,
    isLoading,
    error,
    pagination,
    refreshShipments,
    updateJobStatus,
  };
};

export default useTransporterShipments;
