// Supplier Module Exports
// This file provides a clean public API for the supplier module

// Main App Component
export { default as SupplierApp } from './SupplierApp';
export { default as SupplierDashboard } from './SupplierApp'; // Alias for backward compatibility

// Components
export { default as CreateShipment } from './components/CreateShipment';
export { default as QRCodeDisplay } from './components/QRCodeDisplay';
export { default as ShipmentActions } from './components/ShipmentActions';
export { default as ShipmentCard } from './components/ShipmentCard';
export { default as ShipmentDetails } from './components/ShipmentDetails';
export { default as ShipmentList } from './components/ShipmentList';
export { default as SupplierOverview } from './components/SupplierOverview';
export { default as UploadMetadata } from './components/UploadMetadata';

// Layout Components
export { default as Header } from './layout/Header';
export { default as SupplierLayout } from './layout/SupplierLayout';

// Context
export { SupplierThemeProvider, useSupplierTheme } from './context/ThemeContext';

// Icons
export * from './icons/Icons';

// Constants
export * from './constants';
