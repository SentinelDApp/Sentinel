/**
 * ShipmentActions Component
 * 
 * SYSTEM PRINCIPLE:
 * Shipment data is written to blockchain only after supplier confirmation
 * to ensure immutability and trust. This component handles shipment
 * actions including editing details, assigning transporter/warehouse, and
 * "Confirm & Lock" which writes the shipment to the blockchain irreversibly.
 */

import { useState, useEffect } from 'react';
import { 
  SHIPMENT_STATUSES, 
  CONCERN_STATUS,
  CONCERN_TYPE_LABELS,
  CONCERN_STATUS_COLORS,
  TRANSPORTER_AGENCIES,
  WAREHOUSES,
  formatDate,
} from '../constants';
import { useBlockchain } from '../../../hooks/useBlockchain';

const ShipmentActions = ({ 
  shipment, 
  onMarkReady,
  onAssignTransporter,
  onAcknowledgeConcern,
  onResolveConcern,
  isDarkMode = true,
}) => {
  // Blockchain integration hook
  const { 
    isProcessing: isBlockchainProcessing, 
    walletAddress,
    error: blockchainError,
    connectWallet,
    confirmAndLockShipment,
    clearError: clearBlockchainError,
    isWalletAvailable,
  } = useBlockchain();

  const [isProcessing, setIsProcessing] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [activeTab, setActiveTab] = useState('actions');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAssigningTransporter, setIsAssigningTransporter] = useState(false);
  const [selectedTransporterId, setSelectedTransporterId] = useState('');
  const [lockError, setLockError] = useState(null);

  // Reset state when switching to a different shipment
  useEffect(() => {
    setResolutionText('');
    setActiveTab('actions');
    setShowConfirmModal(false);
    setIsAssigningTransporter(false);
    setSelectedTransporterId(shipment?.transporterId || '');
    setLockError(null);
    clearBlockchainError();
  }, [shipment?.id, clearBlockchainError]);

  if (!shipment) {
    return (
      <div className={`
        border rounded-2xl p-6 transition-colors duration-200
        ${isDarkMode 
          ? 'bg-slate-900/50 border-slate-800' 
          : 'bg-white border-slate-200 shadow-sm'
        }
      `}>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
          Shipment Actions
        </h2>
        <p className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Select a shipment to view actions
        </p>
      </div>
    );
  }

  const isCreated = shipment.status === SHIPMENT_STATUSES.CREATED;
  const isLocked = shipment.isLocked === true;
  const hasConcerns = shipment.concerns && shipment.concerns.length > 0;
  const openConcerns = shipment.concerns?.filter(c => c.status === CONCERN_STATUS.OPEN) || [];
  const acknowledgedConcerns = shipment.concerns?.filter(c => c.status === CONCERN_STATUS.ACKNOWLEDGED) || [];
  const canMarkReady = isCreated && !isLocked;
  
  // Check if transporter is assigned using new format first, then fallback to legacy
  const hasTransporter = !!(shipment.assignedTransporter?.walletAddress || shipment.transporterId || shipment.transporterWallet);
  const canAssignTransporter = isCreated && !isLocked && !hasTransporter;
  
  // Get current transporter and warehouse info from the new assigned fields
  const currentTransporterName = shipment.assignedTransporter?.name || shipment.transporterName || null;
  const currentTransporterOrg = shipment.assignedTransporter?.organizationName || null;
  const currentWarehouseName = shipment.assignedWarehouse?.name || shipment.warehouseName || null;
  const currentWarehouseOrg = shipment.assignedWarehouse?.organizationName || null;

  // Assign transporter
  const handleSaveTransporter = async () => {
    if (!selectedTransporterId) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 500));
    
    const transporter = TRANSPORTER_AGENCIES.find(t => t.id === selectedTransporterId);
    onAssignTransporter?.(shipment.id, {
      transporterId: selectedTransporterId,
      transporterName: transporter?.name || null,
    });
    setIsAssigningTransporter(false);
    setIsProcessing(false);
  };

  // Cancel assigning transporter
  const handleCancelAssign = () => {
    setIsAssigningTransporter(false);
    setSelectedTransporterId(shipment?.transporterId || '');
  };

  const handleMarkReady = async () => {
    if (!canMarkReady) return;
    setLockError(null);
    clearBlockchainError();
    setShowConfirmModal(true);
  };

  /**
   * Confirm and lock shipment on blockchain
   * 
   * SYSTEM PRINCIPLE:
   * Shipment data is written to blockchain only after supplier confirmation
   * to ensure immutability and trust.
   */
  const confirmMarkReady = async () => {
    setIsProcessing(true);
    setLockError(null);
    
    try {
      // Pre-check: Ensure wallet is available
      if (!isWalletAvailable()) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask or Brave Wallet.');
      }

      // Pre-check: Ensure wallet is connected
      if (!walletAddress) {
        await connectWallet();
      }

      // Call the smart contract via the blockchain hook
      // This will trigger the wallet popup for user approval
      const result = await confirmAndLockShipment({
        shipmentHash: shipment.shipmentHash || shipment.id,
        batchId: shipment.batchId,
        numberOfContainers: shipment.numberOfContainers || shipment.containers?.length || 0,
        quantityPerContainer: shipment.quantityPerContainer || 0,
      });

      // Transaction successful - callback to parent with blockchain details
      setShowConfirmModal(false);
      onMarkReady?.(shipment.id, {
        txHash: result.txHash,
        blockNumber: result.blockNumber,
      });
      
    } catch (err) {
      console.error('Blockchain transaction failed:', err);
      setLockError(err.message || 'Transaction failed. Please try again.');
      // Don't close modal on error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcknowledge = async (concernId) => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 500));
    onAcknowledgeConcern?.(shipment.id, concernId);
    setIsProcessing(false);
  };

  const handleResolve = async (concernId) => {
    if (!resolutionText.trim()) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 500));
    onResolveConcern?.(shipment.id, concernId, resolutionText);
    setResolutionText('');
    setIsProcessing(false);
  };

  return (
    <div className={`
      border rounded-2xl p-6 transition-all duration-200
      ${isDarkMode 
        ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' 
        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
      }
    `}>
      <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
        Shipment Actions
      </h2>

      {/* Shipment Info */}
      <div className={`
        border rounded-xl p-4 mb-4
        ${isDarkMode 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-slate-50 border-slate-200'
        }
      `}>
        <p className={`font-semibold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
          {shipment.productName || 'Unnamed Product'}
        </p>
        <p className={`text-xs font-mono mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Batch: {shipment.batchId}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
            {shipment.shipmentHash || shipment.id}
          </span>
          {isLocked && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Locked
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <span className={`text-xs block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Containers</span>
            <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              {shipment.numberOfContainers || shipment.containers?.length || 0}
            </span>
          </div>
          <div>
            <span className={`text-xs block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Quantity</span>
            <span className={`text-sm font-medium text-emerald-400`}>
              {shipment.totalQuantity || 0} units
            </span>
          </div>
        </div>
      </div>

      {/* Tabs for Actions vs Concerns */}
      {hasConcerns && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all border ${
              activeTab === 'actions'
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : isDarkMode 
                  ? 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveTab('concerns')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all relative border ${
              activeTab === 'concerns'
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : isDarkMode 
                  ? 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            Concerns
            {openConcerns.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {openConcerns.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === 'actions' && (
        <>
          {isLocked ? (
            <div className={`
              border rounded-xl p-4
              ${isDarkMode 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-emerald-50 border-emerald-200'
              }
            `}>
              <div className="flex items-center gap-2">
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Blockchain Verified</p>
              </div>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-emerald-400/70' : 'text-emerald-600'}`}>
                This shipment has been finalized on the blockchain. Status: {shipment.status.replace(/_/g, ' ')}
              </p>
              {shipment.blockchainTxHash && (
                <p className={`text-xs mt-2 font-mono truncate ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  TX: {shipment.blockchainTxHash}
                </p>
              )}
              {/* Show assigned transporter/warehouse even when locked */}
              {(currentTransporterName || currentWarehouseName) && (
                <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  {currentTransporterName && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>🚚 Transporter:</span>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{currentTransporterName}</span>
                        {currentTransporterOrg && (
                          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{currentTransporterOrg}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {currentWarehouseName && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>🏭 Warehouse:</span>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{currentWarehouseName}</span>
                        {currentWarehouseOrg && (
                          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{currentWarehouseOrg}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isAssigningTransporter ? (
            /* Assign Transporter Form */
            <div className="space-y-4">
              <div className={`
                border rounded-xl p-4
                ${isDarkMode 
                  ? 'bg-blue-500/10 border-blue-500/30' 
                  : 'bg-blue-50 border-blue-200'
                }
              `}>
                <div className="flex items-center gap-2 mb-4">
                  <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Assign Transporter</p>
                </div>
                
                {/* Transporter Select */}
                <div className="mb-4">
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Select Transporter <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedTransporterId}
                    onChange={(e) => setSelectedTransporterId(e.target.value)}
                    className={`
                      w-full border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 transition-all
                      ${isDarkMode 
                        ? 'bg-slate-800/50 border-slate-700 text-slate-50 focus:border-blue-500 focus:ring-blue-500/20' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20'
                      }
                    `}
                  >
                    <option value="" className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>-- Select Transporter --</option>
                    {TRANSPORTER_AGENCIES.map(t => (
                      <option key={t.id} value={t.id} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>
                        {t.name} ({t.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCancelAssign}
                    disabled={isProcessing}
                    className={`
                      flex-1 py-2 text-sm font-medium rounded-lg transition-colors border
                      ${isDarkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }
                      disabled:opacity-50
                    `}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTransporter}
                    disabled={isProcessing || !selectedTransporterId}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all"
                  >
                    {isProcessing ? 'Assigning...' : 'Assign Transporter'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Assignments Display */}
              <div className={`
                border rounded-xl p-4
                ${isDarkMode 
                  ? 'bg-slate-800/30 border-slate-700' 
                  : 'bg-slate-50 border-slate-200'
                }
              `}>
                <p className={`text-xs font-medium mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Current Assignments
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>🏭 Warehouse:</span>
                    {currentWarehouseName ? (
                      <div className="text-right">
                        <span className="text-sm font-medium text-emerald-400">{currentWarehouseName}</span>
                        {currentWarehouseOrg && (
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{currentWarehouseOrg}</p>
                        )}
                      </div>
                    ) : (
                      <span className={`text-sm italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Not assigned</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>🚚 Transporter:</span>
                    {currentTransporterName ? (
                      <div className="text-right">
                        <span className="text-sm font-medium text-emerald-400">{currentTransporterName}</span>
                        {currentTransporterOrg && (
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{currentTransporterOrg}</p>
                        )}
                      </div>
                    ) : (
                      <span className={`text-sm italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Not assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assign Transporter Button - Only show if not assigned */}
              {canAssignTransporter && (
                <button
                  onClick={() => setIsAssigningTransporter(true)}
                  className={`
                    w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all border
                    ${isDarkMode 
                      ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30 hover:border-blue-500/50' 
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-300'
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  Assign Transporter
                </button>
              )}

              {/* Mark Ready Button */}
              <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  onClick={handleMarkReady}
                  disabled={!canMarkReady || isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Finalizing on Blockchain...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Mark Ready for Dispatch
                    </span>
                  )}
                </button>
                <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-amber-400/70' : 'text-amber-600'}`}>
                  ⚠️ This action is irreversible and will lock the shipment to the blockchain
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`
            w-full max-w-md border rounded-2xl p-6 shadow-2xl
            ${isDarkMode 
              ? 'bg-slate-900 border-slate-700' 
              : 'bg-white border-slate-200'
            }
          `}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                Confirm Blockchain Finalization
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                You are about to permanently lock this shipment to the blockchain. This action cannot be undone.
              </p>
            </div>

            <div className={`
              border rounded-xl p-4 mb-4
              ${isDarkMode 
                ? 'bg-slate-800/50 border-slate-700' 
                : 'bg-slate-50 border-slate-200'
              }
            `}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Batch ID:</span>
                  <span className={`font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{shipment.batchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Containers:</span>
                  <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{shipment.numberOfContainers || shipment.containers?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Total Quantity:</span>
                  <span className="text-emerald-400 font-medium">{shipment.totalQuantity || 0} units</span>
                </div>
              </div>
            </div>

            {/* Wallet Status Indicator */}
            <div className={`
              rounded-xl p-3 mb-4
              ${walletAddress 
                ? isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'
                : isDarkMode ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
              }
            `}>
              <div className="flex items-center gap-2 text-sm">
                {walletAddress ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className={isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}>
                      Wallet connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={isDarkMode ? 'text-blue-300' : 'text-blue-700'}>
                      Wallet will connect when you confirm
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Error Display */}
            {(lockError || blockchainError) && (
              <div className={`
                rounded-xl p-4 mb-4 border
                ${isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}
              `}>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                      Transaction Failed
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-red-200/70' : 'text-red-600'}`}>
                      {lockError || blockchainError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setLockError(null);
                  clearBlockchainError();
                }}
                disabled={isProcessing}
                className={`
                  flex-1 py-3 text-sm font-medium rounded-xl transition-colors border
                  ${isDarkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkReady}
                disabled={isProcessing}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Confirming...
                  </span>
                ) : (lockError || blockchainError) ? 'Retry' : 'Confirm & Lock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Concerns Tab */}
      {activeTab === 'concerns' && hasConcerns && (
        <div className="space-y-4">
          {/* Open Concerns - Need Acknowledgment */}
          {openConcerns.map(concern => (
            <div key={concern.id} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded ${CONCERN_STATUS_COLORS[concern.status].bg} ${CONCERN_STATUS_COLORS[concern.status].text}`}>
                    {CONCERN_STATUS_COLORS[concern.status].label}
                  </span>
                  <h4 className="font-medium text-red-400 mt-2">
                    {CONCERN_TYPE_LABELS[concern.type]}
                  </h4>
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  by {concern.raisedBy}
                </span>
              </div>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{concern.description}</p>
              <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Raised: {formatDate(concern.raisedAt)}
              </p>
              <button
                onClick={() => handleAcknowledge(concern.id)}
                disabled={isProcessing}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-medium rounded-lg border border-amber-500/30 transition-all disabled:opacity-50"
              >
                Acknowledge Concern
              </button>
            </div>
          ))}

          {/* Acknowledged Concerns - Need Resolution */}
          {acknowledgedConcerns.map(concern => (
            <div key={concern.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded ${CONCERN_STATUS_COLORS[concern.status].bg} ${CONCERN_STATUS_COLORS[concern.status].text}`}>
                    {CONCERN_STATUS_COLORS[concern.status].label}
                  </span>
                  <h4 className="font-medium text-amber-400 mt-2">
                    {CONCERN_TYPE_LABELS[concern.type]}
                  </h4>
                </div>
              </div>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{concern.description}</p>
              <div className="space-y-2">
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Enter resolution details..."
                  className={`
                    w-full border rounded-lg py-2 px-3 text-sm resize-none focus:outline-none
                    ${isDarkMode 
                      ? 'bg-slate-800/50 border-slate-700 text-slate-50 placeholder-slate-400 focus:border-amber-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                    }
                  `}
                  rows={2}
                />
                <button
                  onClick={() => handleResolve(concern.id)}
                  disabled={isProcessing || !resolutionText.trim()}
                  className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-medium rounded-lg border border-emerald-500/30 transition-all disabled:opacity-50"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          ))}

          {/* Resolved Concerns - Display Only */}
          {shipment.concerns
            .filter(c => c.status === CONCERN_STATUS.RESOLVED)
            .map(concern => (
              <div key={concern.id} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 opacity-75">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded ${CONCERN_STATUS_COLORS[concern.status].bg} ${CONCERN_STATUS_COLORS[concern.status].text}`}>
                      {CONCERN_STATUS_COLORS[concern.status].label}
                    </span>
                    <h4 className="font-medium text-emerald-400 mt-2">
                      {CONCERN_TYPE_LABELS[concern.type]}
                    </h4>
                  </div>
                </div>
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{concern.description}</p>
                <div className={`rounded-lg p-2 mt-2 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Resolution:</p>
                  <p className="text-sm text-emerald-400">{concern.resolution}</p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ShipmentActions;
