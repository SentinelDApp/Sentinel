/**
 * useTransporterShipments Hook
 * 
 * Fetches real shipments from the API for the transporter dashboard.
 * The shipments displayed are those that have been created by suppliers
 * and are ready for pickup or in transit.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { fetchShipments } from '../../../services/shipmentApi';

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
  return {
    // Core identifiers
    id: shipment.shipmentHash || shipment.id,
    shipmentHash: shipment.shipmentHash,
    batchId: shipment.batchId,
    
    // Product info - use batchId as product name since we don't have product details
    product: shipment.productName || `Batch ${shipment.batchId}`,
    
    // Route info (these would come from extended shipment data)
    origin: shipment.origin || 'Supplier Warehouse',
    dest: shipment.destination || 'Destination',
    
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
      // Fetch only shipments assigned to this transporter
      const result = await fetchShipments(null, { 
        limit: 100,
        transporterWallet: walletAddress 
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
