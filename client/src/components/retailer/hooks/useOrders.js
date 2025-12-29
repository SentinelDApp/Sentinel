import { useState, useCallback } from 'react';
import { DEMO_ORDERS } from '../constants';

/**
 * Custom hook for managing orders state and actions
 */
export const useOrders = (initialOrders = DEMO_ORDERS) => {
  const [orders, setOrders] = useState(initialOrders);
  const [showHistory, setShowHistory] = useState(false);

  // Get recent orders (configurable count)
  const getRecentOrders = useCallback((count = 3) => {
    return orders.slice(0, count);
  }, [orders]);

  // Get orders by status
  const getOrdersByStatus = useCallback((status) => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  // Update order status
  const updateOrderStatus = useCallback((orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));
  }, []);

  // Add new order
  const addOrder = useCallback((newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
  }, []);

  // Open/close history modal
  const openHistory = useCallback(() => setShowHistory(true), []);
  const closeHistory = useCallback(() => setShowHistory(false), []);

  return {
    orders,
    showHistory,
    setOrders,
    getRecentOrders,
    getOrdersByStatus,
    updateOrderStatus,
    addOrder,
    openHistory,
    closeHistory,
  };
};

export default useOrders;
