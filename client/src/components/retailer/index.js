// Retailer Module Exports
// This file provides a clean public API for the retailer module

// Main App Component
export { default as RetailerApp } from './RetailerApp';
export { default as RetailerDashboard } from './RetailerApp'; // Alias for backward compatibility

// Pages
export { default as ProfileSettingsPage } from './pages/ProfileSettingsPage';

// Components
export { default as OrdersTable } from './components/OrdersTable';
export { default as SalesOverview } from './components/SalesOverview';
export { default as StatsCard } from './components/StatsCard';
export { default as StatsCards } from './components/StatsCards';
export { default as ReceivedShipments } from './components/ReceivedShipments';
export { default as ShipmentsModal } from './components/ShipmentsModal';
export { default as NavigationTabs } from './components/NavigationTabs';

// Layout Components
export { default as Header } from './layout/Header';
export { default as RetailerLayout } from './layout/RetailerLayout';

// Context
export { RetailerThemeProvider, useRetailerTheme } from './context/ThemeContext';

// Hooks
export { useRetailerDashboard } from './hooks/useRetailerDashboard';
export { useOrders } from './hooks/useOrders';
export { useShipments } from './hooks/useShipments';

// Icons
export * from './icons/Icons';

// Constants
export * from './constants';
