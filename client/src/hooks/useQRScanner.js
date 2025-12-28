/**
 * useQRScanner Hook
 * Shared QR scanning logic for Sentinel blockchain supply chain system.
 * Used by: Retailer (to receive shipments), Transporter (to scan and add to chain)
 * 
 * Flow:
 * 1. Scan shipment QR to load shipment details (expected item count)
 * 2. Manually scan each item one by one by clicking scan button
 * 3. Each item auto-confirms to blockchain after scan
 * 4. If exception occurs, user can report missing items
 */

import { useState, useCallback, useRef } from 'react'

/**
 * Scan states
 * - ready: Waiting for user to scan shipment QR
 * - loading_shipment: Loading shipment details from QR
 * - scanning_items: Ready to scan items one by one
 * - scanning_one: Currently scanning one item
 * - completed: All items scanned successfully
 * - exception: Stopped with exception/missing items
 */
const SCAN_STATES = {
  READY: 'ready',
  LOADING_SHIPMENT: 'loading_shipment',
  SCANNING_ITEMS: 'scanning_items',
  SCANNING_ONE: 'scanning_one',
  COMPLETED: 'completed',
  EXCEPTION: 'exception',
}

/**
 * Role types for different scan behaviors
 */
export const SCANNER_ROLES = {
  RETAILER: 'retailer',      // Confirms shipment receipt
  TRANSPORTER: 'transporter', // Adds shipment to chain (in transit)
}

/**
 * Shipment status based on role action
 */
const STATUS_BY_ROLE = {
  [SCANNER_ROLES.RETAILER]: 'Received',
  [SCANNER_ROLES.TRANSPORTER]: 'In Transit',
}

/**
 * Demo shipments data
 */
const DEMO_SHIPMENTS = [
  { id: 'SHP-4521', origin: 'Punjab Farms', batch: 'B-2024-1205', type: 'Shipment', expectedItems: 20, productName: 'Basmati Rice' },
  { id: 'SHP-4520', origin: 'Gujarat Oils', batch: 'B-2024-1198', type: 'Shipment', expectedItems: 15, productName: 'Groundnut Oil' },
  { id: 'SHP-4519', origin: 'Assam Gardens', batch: 'B-2024-1210', type: 'Shipment', expectedItems: 12, productName: 'Assam Tea' },
  { id: 'SHP-4518', origin: 'Mumbai Care', batch: 'B-2024-1215', type: 'Shipment', expectedItems: 18, productName: 'Health Supplements' },
]

/**
 * Generate item data for scanning
 */
const generateItemData = (shipment, itemIndex) => {
  return {
    itemId: `${shipment.id}-ITEM-${String(itemIndex + 1).padStart(3, '0')}`,
    shipmentId: shipment.id,
    productName: shipment.productName,
    origin: shipment.origin,
    batch: shipment.batch,
    itemNumber: itemIndex + 1,
    totalItems: shipment.expectedItems,
  }
}

/**
 * Simulate blockchain transaction for item
 */
const recordItemToBlockchain = async (itemData, role, walletAddress) => {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  return {
    success: true,
    txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    itemId: itemData.itemId,
  }
}

/**
 * useQRScanner Hook
 */
const useQRScanner = ({
  role = SCANNER_ROLES.RETAILER,
  walletAddress = '0x7a3d...f829',
  onScanProgress = null,
  onBatchComplete = null,
  onException = null,
} = {}) => {
  const [scanState, setScanState] = useState(SCAN_STATES.READY)
  const [shipmentData, setShipmentData] = useState(null)
  const [scannedItems, setScannedItems] = useState([])
  const [currentItem, setCurrentItem] = useState(null)
  const [exceptionMessage, setExceptionMessage] = useState('')
  const [error, setError] = useState(null)
  
  const scannedItemsRef = useRef([])

  /**
   * Start by scanning shipment QR - loads shipment details
   */
  const startShipmentScan = useCallback(async () => {
    setScanState(SCAN_STATES.LOADING_SHIPMENT)
    setError(null)
    setScannedItems([])
    scannedItemsRef.current = []
    setExceptionMessage('')
    
    // Simulate loading shipment from QR
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Get random demo shipment
    const shipment = DEMO_SHIPMENTS[Math.floor(Math.random() * DEMO_SHIPMENTS.length)]
    
    const shipmentInfo = {
      ...shipment,
      status: STATUS_BY_ROLE[role],
      scannedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      walletAddress,
    }
    
    setShipmentData(shipmentInfo)
    setScanState(SCAN_STATES.SCANNING_ITEMS)
  }, [role, walletAddress])

  /**
   * Scan one item manually - called when user clicks scan button
   */
  const scanOneItem = useCallback(async () => {
    if (!shipmentData) return
    if (scannedItemsRef.current.length >= shipmentData.expectedItems) return
    
    setScanState(SCAN_STATES.SCANNING_ONE)
    
    const itemIndex = scannedItemsRef.current.length
    const itemData = generateItemData(shipmentData, itemIndex)
    setCurrentItem(itemData)
    
    // Simulate scanning delay
    const scanDelay = 1000 + Math.random() * 500
    await new Promise(resolve => setTimeout(resolve, scanDelay))
    
    // Record to blockchain
    const txResult = await recordItemToBlockchain(itemData, role, walletAddress)
    
    // Create scanned item record
    const scannedItem = {
      ...itemData,
      txHash: txResult.txHash,
      scannedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
    
    // Update state
    scannedItemsRef.current = [...scannedItemsRef.current, scannedItem]
    setScannedItems(scannedItemsRef.current)
    setCurrentItem(null)
    
    // Notify progress
    if (onScanProgress) {
      onScanProgress(scannedItemsRef.current.length, shipmentData.expectedItems, scannedItem)
    }
    
    // Check if all items scanned
    if (scannedItemsRef.current.length >= shipmentData.expectedItems) {
      setScanState(SCAN_STATES.COMPLETED)
      if (onBatchComplete) {
        onBatchComplete(shipmentData, scannedItemsRef.current.length, scannedItemsRef.current)
      }
    } else {
      setScanState(SCAN_STATES.SCANNING_ITEMS)
    }
  }, [shipmentData, role, walletAddress, onScanProgress, onBatchComplete])

  /**
   * Report exception with missing items
   */
  const reportException = useCallback((message) => {
    setExceptionMessage(message)
    setScanState(SCAN_STATES.EXCEPTION)
    setCurrentItem(null)
    
    if (onException) {
      onException({
        shipment: shipmentData,
        scannedCount: scannedItemsRef.current.length,
        expectedCount: shipmentData?.expectedItems || 0,
        missingCount: (shipmentData?.expectedItems || 0) - scannedItemsRef.current.length,
        message,
        scannedItems: scannedItemsRef.current,
      })
    }
  }, [shipmentData, onException])

  /**
   * Reset scanner to ready state
   */
  const resetScanner = useCallback(() => {
    setScanState(SCAN_STATES.READY)
    setShipmentData(null)
    setScannedItems([])
    scannedItemsRef.current = []
    setCurrentItem(null)
    setExceptionMessage('')
    setError(null)
  }, [])

  // Calculate progress
  const progress = {
    scanned: scannedItems.length,
    total: shipmentData?.expectedItems || 0,
    percentage: shipmentData ? Math.round((scannedItems.length / shipmentData.expectedItems) * 100) : 0,
    missing: shipmentData ? shipmentData.expectedItems - scannedItems.length : 0,
  }

  return {
    // State
    scanState,
    shipmentData,
    scannedItems,
    currentItem,
    exceptionMessage,
    error,
    progress,
    
    // State checks
    isReady: scanState === SCAN_STATES.READY,
    isLoadingShipment: scanState === SCAN_STATES.LOADING_SHIPMENT,
    isReadyToScan: scanState === SCAN_STATES.SCANNING_ITEMS,
    isScanningOne: scanState === SCAN_STATES.SCANNING_ONE,
    isCompleted: scanState === SCAN_STATES.COMPLETED,
    hasException: scanState === SCAN_STATES.EXCEPTION,
    
    // Actions
    startShipmentScan,
    scanOneItem,
    reportException,
    resetScanner,
    setExceptionMessage,
    
    // Constants
    SCAN_STATES,
    role,
  }
}

export default useQRScanner
export { SCAN_STATES }
