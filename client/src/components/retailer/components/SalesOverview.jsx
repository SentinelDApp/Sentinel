/**
 * SalesOverview Component
 * QR Scanner wrapper for Retailer Dashboard
 * Uses shared QRScannerUI component for shipment receiving
 */
import QRScannerUI from '../../shared/QRScannerUI';
import { SCANNER_ROLES } from '../../../hooks/useQRScanner';
import { STORE_INFO } from '../constants';
import { useRetailerTheme } from '../context/ThemeContext';

function SalesOverview({ onExpandChange, onShipmentConfirmed }) {
  const { isDarkMode } = useRetailerTheme();
  
  // Handle when shipment batch is completed or reported with exception
  const handleShipmentReceived = (shipment, txResult) => {
    console.log('Retailer received shipment:', shipment);
    console.log('Transaction result:', txResult);
    
    // Notify parent to add to received shipments list
    if (onShipmentConfirmed) {
      onShipmentConfirmed(shipment, txResult);
    }
  };

  return (
    <QRScannerUI
      role={SCANNER_ROLES.RETAILER}
      walletAddress={STORE_INFO.walletAddress}
      onShipmentReceived={handleShipmentReceived}
      onExpandChange={onExpandChange}
      isDarkMode={isDarkMode}
    />
  );
}

export default SalesOverview;
