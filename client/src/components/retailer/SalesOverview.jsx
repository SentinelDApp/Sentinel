/**
 * SalesOverview Component
 * QR Scanner wrapper for Retailer Dashboard
 * Uses shared QRScannerUI component for shipment receiving
 */
import QRScannerUI from '../shared/QRScannerUI'
import { SCANNER_ROLES } from '../../hooks/useQRScanner'

function SalesOverview({ onExpandChange, onShipmentConfirmed }) {
  // Handle when shipment batch is completed or reported with exception
  const handleShipmentReceived = (shipment, txResult) => {
    console.log('Retailer received shipment:', shipment)
    console.log('Transaction result:', txResult)
    
    // Notify parent to add to received shipments list
    if (onShipmentConfirmed) {
      onShipmentConfirmed(shipment, txResult)
    }
  }

  return (
    <QRScannerUI
      role={SCANNER_ROLES.RETAILER}
      walletAddress="0x7a3d...f829" // TODO: Get from wallet context
      onShipmentReceived={handleShipmentReceived}
      onExpandChange={onExpandChange}
    />
  )
}

export default SalesOverview
