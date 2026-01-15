/**
 * CreateShipment Component
 *
 * SYSTEM PRINCIPLE:
 * Shipment data is written to blockchain only after supplier confirmation
 * to ensure immutability and trust. The blockchain serves as a source of
 * truth for shipment lifecycle events, not as a database for operational data.
 *
 * SHIPMENT CREATION MODEL:
 * - Supplier inputs: productName, batchId, numberOfContainers, quantityPerContainer
 * - Optional inputs: transporterId, warehouseId (can be assigned later via edit)
 * - System generates: shipmentHash, totalQuantity, containerIds
 * - Each container gets a unique QR code encoding only its containerId
 *
 * BLOCKCHAIN INTEGRATION:
 * - Shipment is created off-chain first (draft state)
 * - "Confirm & Lock" triggers on-chain registration via confirmAndLockShipment()
 * - Once locked, shipment becomes immutable and verifiable on-chain
 */

import { useState, useEffect } from "react";
import {
  SHIPMENT_STATUSES,
  CONTAINER_STATUSES,
  generateShipmentHash,
  generateContainers,
} from '../constants';
import { useAuth } from '../../../context/AuthContext';
import { useBlockchain } from '../../../hooks/useBlockchain';
import { fetchTransporters, fetchWarehouses } from '../../../services/shipmentApi';
import ContainerQRGrid from './ContainerQRGrid';
import UploadMetadata from './UploadMetadata';


const CreateShipment = ({
  onCreateShipment, onRefreshShipment, onDeleteDocument,
  isDarkMode = true,
  formData: externalFormData,
  onFormDataChange,
}) => {
  const { user } = useAuth();

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

  // Form state - use external state if provided, otherwise use internal state
  const [internalFormData, setInternalFormData] = useState({
    productName: "",
    batchId: "",
    numberOfContainers: "",
    quantityPerContainer: "",
    transporterWallet: "",  // Changed from transporterId to walletAddress
    warehouseWallet: "",    // Changed from warehouseId to walletAddress
  });

  // Use external form data if provided (for persistence), otherwise use internal
  const formData = externalFormData || internalFormData;
  const setFormData = onFormDataChange || setInternalFormData;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewShipment, setPreviewShipment] = useState(null); // Preview before confirming
  const [createdShipment, setCreatedShipment] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [lockError, setLockError] = useState(null);

  // Database-fetched transporters and warehouses
  const [transporters, setTransporters] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);

  // Fetch transporters and warehouses from database on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      setUsersError(null);
      try {
        // Use the correct token key from AuthContext
        const authToken = localStorage.getItem('sentinel_token');
        const [transporterList, warehouseList] = await Promise.all([
          fetchTransporters(authToken),
          fetchWarehouses(authToken)
        ]);
        setTransporters(transporterList);
        setWarehouses(warehouseList);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setUsersError('Failed to load transporters and warehouses. Please refresh.');
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Calculate total quantity (system-generated)
  const totalQuantity =
    formData.numberOfContainers && formData.quantityPerContainer
      ? parseInt(formData.numberOfContainers, 10) *
        parseInt(formData.quantityPerContainer, 10)
      : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Step 1: Generate preview for user to review
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Both transporter and warehouse are now required
    if (
      !formData.productName ||
      !formData.batchId ||
      !formData.numberOfContainers ||
      !formData.quantityPerContainer ||
      !formData.transporterWallet ||
      !formData.warehouseWallet
    )
      return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate shipment hash (system-generated, not editable)
    const supplierWallet = user?.walletAddress || user?.id || "supplier";
    const shipmentHash = generateShipmentHash(formData.batchId, supplierWallet);

    // Generate containers with unique IDs and QR codes
    const numberOfContainers = parseInt(formData.numberOfContainers, 10);
    const quantityPerContainer = parseInt(formData.quantityPerContainer, 10);
    const containers = generateContainers(
      shipmentHash,
      numberOfContainers,
      formData.batchId
    );

    // Get transporter and warehouse details from the fetched lists
    const transporter = transporters.find(
      (t) => t.walletAddress === formData.transporterWallet
    );
    const warehouse = warehouses.find((w) => w.walletAddress === formData.warehouseWallet);

    const shipmentPreview = {
      id: shipmentHash,
      shipmentHash,
      productName: formData.productName,
      batchId: formData.batchId,
      numberOfContainers,
      quantityPerContainer,
      totalQuantity: numberOfContainers * quantityPerContainer,
      containers,
      supplierWallet,
      status: SHIPMENT_STATUSES.CREATED,
      isLocked: false,
      createdAt: Date.now(),
      metadata: null,
      concerns: [],
      // Use wallet addresses for assignment
      assignedTransporterWallet: formData.transporterWallet,
      assignedTransporterName: transporter?.fullName || transporter?.organizationName || null,
      assignedWarehouseWallet: formData.warehouseWallet,
      assignedWarehouseName: warehouse?.fullName || warehouse?.organizationName || null,
      // Legacy fields for display compatibility
      transporterId: formData.transporterWallet,
      transporterName: transporter?.fullName || transporter?.organizationName || null,
      warehouseId: formData.warehouseWallet,
      warehouseName: warehouse?.fullName || warehouse?.organizationName || null,
      blockchainTxHash: null,
    };

    // Show preview for user confirmation
    setPreviewShipment(shipmentPreview);
    setIsSubmitting(false);
  };

  // Step 2: User confirms and shipment is actually created
  const [createSuccess, setCreateSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleConfirmCreate = async () => {
    if (!previewShipment) return;
    try {
      await onCreateShipment(previewShipment);
      // Show success message
      setSuccessMessage(`Shipment "${previewShipment.batchId}" created successfully!`);
      setCreateSuccess(true);
      // Reset form for new shipment
      setPreviewShipment(null);
      setCreatedShipment(null);
      setFormData({ productName: '', batchId: '', numberOfContainers: '', quantityPerContainer: '', transporterWallet: '', warehouseWallet: '' });
      // Clear success message after 5 seconds
      setTimeout(() => {
        setCreateSuccess(false);
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Failed to create shipment:', err);
    }
  };

  // Go back to edit from preview
  const handleBackToEdit = () => {
    setPreviewShipment(null);
  };

  // Handle "Mark Ready for Dispatch" - shows confirmation modal
  const handleMarkReadyClick = () => {
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
   *
   * This function:
   * 1. Validates wallet connection
   * 2. Calls the smart contract's confirmAndLockShipment()
   * 3. Awaits transaction confirmation
   * 4. Updates local state with blockchain transaction details
   */
  const handleConfirmLock = async () => {
    setIsLocking(true);
    setLockError(null);

    try {
      // Pre-check: Ensure wallet is available
      if (!isWalletAvailable()) {
        throw new Error(
          "No Ethereum wallet detected. Please install MetaMask or Brave Wallet."
        );
      }

      // Pre-check: Ensure wallet is connected
      if (!walletAddress) {
        await connectWallet();
      }

      // Call the smart contract via the blockchain hook
      // This will trigger the wallet popup for user approval
      const result = await confirmAndLockShipment({
        shipmentHash: createdShipment.shipmentHash,
        batchId: createdShipment.batchId,
        numberOfContainers: createdShipment.numberOfContainers,
        quantityPerContainer: createdShipment.quantityPerContainer,
      });

      // Transaction successful - update shipment with blockchain details
      const updatedShipment = {
        ...createdShipment,
        status: SHIPMENT_STATUSES.READY_FOR_DISPATCH,
        isLocked: true,
        blockchainTxHash: result.txHash,
        blockchainBlockNumber: result.blockNumber,
        containers: createdShipment.containers.map((c) => ({
          ...c,
          status: CONTAINER_STATUSES.LOCKED,
        })),
      };

      setCreatedShipment(updatedShipment);
      onCreateShipment(updatedShipment);
      setShowConfirmModal(false);
    } catch (err) {
      // Handle errors gracefully and show to user
      console.error("Blockchain transaction failed:", err);
      setLockError(err.message || "Transaction failed. Please try again.");
      // Don't close modal on error - let user see the error and retry
    } finally {
      setIsLocking(false);
    }
  };

  // Reset form to create another shipment
  const handleCreateAnother = () => {
    setCreatedShipment(null);
    setPreviewShipment(null);
    setFormData({
      productName: "",
      batchId: "",
      numberOfContainers: "",
      quantityPerContainer: "",
      transporterWallet: "",
      warehouseWallet: "",
    });
  };

  const inputClass = `w-full border rounded-xl py-3 px-4 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
    isDarkMode
      ? "bg-slate-800/50 border-slate-700 text-slate-50 focus:border-blue-500 focus:ring-blue-500/20"
      : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
  }`;

  // Confirmation Modal
  const ConfirmationModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`
        max-w-md w-full rounded-2xl p-6 shadow-2xl
        ${isDarkMode ? "bg-slate-900 border border-slate-700" : "bg-white"}
      `}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3
            className={`text-xl font-semibold mb-2 ${
              isDarkMode ? "text-slate-50" : "text-slate-900"
            }`}
          >
            Confirm Blockchain Registration
          </h3>
          <p
            className={`text-sm ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            This action is{" "}
            <strong className="text-amber-400">irreversible</strong>. Once
            registered on the blockchain:
          </p>
        </div>

        <div
          className={`
          rounded-xl p-4 mb-6 space-y-2
          ${
            isDarkMode
              ? "bg-slate-800/50 border border-slate-700"
              : "bg-slate-50 border border-slate-200"
          }
        `}
        >
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-red-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
              Shipment details cannot be edited
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-red-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
              Containers will be locked
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-green-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
              Shipment becomes verifiable on-chain
            </span>
          </div>
        </div>

        {/* Wallet Status Indicator */}
        <div
          className={`
          rounded-xl p-3 mb-4
          ${
            walletAddress
              ? isDarkMode
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : "bg-emerald-50 border border-emerald-200"
              : isDarkMode
              ? "bg-blue-500/10 border border-blue-500/30"
              : "bg-blue-50 border border-blue-200"
          }
        `}
        >
          <div className="flex items-center gap-2 text-sm">
            {walletAddress ? (
              <>
                <svg
                  className="w-4 h-4 text-emerald-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span
                  className={
                    isDarkMode ? "text-emerald-300" : "text-emerald-700"
                  }
                >
                  Wallet connected: {walletAddress.slice(0, 6)}...
                  {walletAddress.slice(-4)}
                </span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 text-blue-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span
                  className={isDarkMode ? "text-blue-300" : "text-blue-700"}
                >
                  Wallet will connect when you confirm
                </span>
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {(lockError || blockchainError) && (
          <div
            className={`
            rounded-xl p-4 mb-4 border
            ${
              isDarkMode
                ? "bg-red-500/10 border-red-500/30"
                : "bg-red-50 border-red-200"
            }
          `}
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  Transaction Failed
                </p>
                <p
                  className={`text-xs mt-1 ${
                    isDarkMode ? "text-red-200/70" : "text-red-600"
                  }`}
                >
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
            disabled={isLocking}
            className={`
              flex-1 py-3 px-4 font-medium rounded-xl transition-colors
              ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmLock}
            disabled={isLocking}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLocking ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Confirming on Blockchain...
              </span>
            ) : lockError || blockchainError ? (
              "Retry"
            ) : (
              "Confirm & Lock"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Preview State: Show shipment details for confirmation before creating
  if (previewShipment) {
    return (
      <div
        className={`
        border rounded-2xl p-6 transition-colors duration-200
        ${
          isDarkMode
            ? "bg-slate-900/50 border-slate-800"
            : "bg-white border-slate-200 shadow-sm"
        }
      `}
      >
        {/* Preview Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h2
            className={`text-xl font-semibold mb-1 ${
              isDarkMode ? "text-slate-50" : "text-slate-900"
            }`}
          >
            Review Shipment Details
          </h2>
          <p
            className={`text-sm ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Please verify all details before confirming. Once created, shipment
            details cannot be edited.
          </p>
        </div>

        {/* Preview Summary */}
        <div
          className={`
          border rounded-xl p-4 mb-6
          ${
            isDarkMode
              ? "bg-slate-800/50 border-slate-700"
              : "bg-slate-50 border-slate-200"
          }
        `}
        >
          <h3
            className={`text-sm font-semibold mb-3 ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Shipment Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-start">
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                Product Name
              </span>
              <span
                className={`font-medium text-right ${
                  isDarkMode ? "text-slate-50" : "text-slate-900"
                }`}
              >
                {previewShipment.productName}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                Batch ID
              </span>
              <span
                className={`font-mono font-medium ${
                  isDarkMode ? "text-slate-50" : "text-slate-900"
                }`}
              >
                {previewShipment.batchId}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                Containers
              </span>
              <span
                className={`font-medium ${
                  isDarkMode ? "text-slate-50" : "text-slate-900"
                }`}
              >
                {previewShipment.numberOfContainers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                Qty per Container
              </span>
              <span
                className={`font-medium ${
                  isDarkMode ? "text-slate-50" : "text-slate-900"
                }`}
              >
                {previewShipment.quantityPerContainer} units
              </span>
            </div>
            <div
              className={`flex justify-between items-center pt-2 border-t ${
                isDarkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                Total Quantity
              </span>
              <span
                className={`text-lg font-bold ${
                  isDarkMode ? "text-emerald-400" : "text-emerald-600"
                }`}
              >
                {previewShipment.totalQuantity} units
              </span>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div
          className={`
          border rounded-xl p-4 mb-6
          ${
            isDarkMode
              ? "bg-slate-800/50 border-slate-700"
              : "bg-slate-50 border-slate-200"
          }
        `}
        >
          <h3
            className={`text-sm font-semibold mb-3 ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Assignments
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                🏭 Warehouse
              </span>
              <span
                className={`font-medium ${
                  isDarkMode ? "text-purple-300" : "text-purple-600"
                }`}
              >
                {previewShipment.warehouseName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                🚚 Transporter
              </span>
              {previewShipment.transporterName ? (
                <span
                  className={`font-medium ${
                    isDarkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                >
                  {previewShipment.transporterName}
                </span>
              ) : (
                <span
                  className={`italic ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Not assigned
                </span>
              )}
            </div>
          </div>
        </div>

        {/* System Generated */}
        <div
          className={`
          border rounded-xl p-4 mb-6
          ${
            isDarkMode
              ? "bg-cyan-500/10 border-cyan-500/30"
              : "bg-cyan-50 border-cyan-200"
          }
        `}
        >
          <h3
            className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
              isDarkMode ? "text-cyan-300" : "text-cyan-700"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
            System Generated
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span
                className={`text-xs block mb-1 ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Shipment Hash
              </span>
              <code
                className={`text-xs font-mono block truncate ${
                  isDarkMode ? "text-cyan-300" : "text-cyan-700"
                }`}
              >
                {previewShipment.shipmentHash}
              </code>
            </div>
            <div>
              <span
                className={`text-xs block mb-1 ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Container IDs
              </span>
              <span
                className={`text-sm ${
                  isDarkMode ? "text-slate-200" : "text-slate-700"
                }`}
              >
                {previewShipment.numberOfContainers} unique IDs generated
              </span>
            </div>
          </div>
        </div>

        {/* Warning Notice */}
        <div
          className={`
          p-4 rounded-xl border mb-6
          ${
            isDarkMode
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-amber-50 border-amber-200"
          }
        `}
        >
          <div className="flex items-start gap-3">
            <svg
              className={`w-5 h-5 mt-0.5 shrink-0 ${
                isDarkMode ? "text-amber-400" : "text-amber-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p
                className={`text-sm font-medium ${
                  isDarkMode ? "text-amber-300" : "text-amber-700"
                }`}
              >
                Shipment details cannot be modified after creation
              </p>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-amber-200/70" : "text-amber-600"
                }`}
              >
                If you haven't assigned a transporter, you can do so later from
                the Manage tab before dispatching.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleBackToEdit}
            className={`
              flex-1 py-3 px-4 font-medium rounded-xl transition-colors border
              ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }
            `}
          >
            ← Back to Edit
          </button>
          <button
            onClick={handleConfirmCreate}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25"
          >
            Confirm & Create
          </button>
        </div>
      </div>
    );
  }

  // Success State: Show shipment summary with containers
  if (createdShipment) {
    return (
      <div
        className={`
        border rounded-2xl p-6 transition-colors duration-200
        ${isDarkMode 
          ? 'bg-slate-900/50 border-slate-800' 
          : 'bg-white border-slate-200 shadow-sm'
        }
      `}
      >
        {showConfirmModal && <ConfirmationModal />}
        
        {/* Success Toast Banner */}
        {createSuccess && (
          <div className={`
            mb-6 p-4 rounded-xl border flex items-center gap-3 animate-pulse
            ${isDarkMode 
              ? 'bg-emerald-500/20 border-emerald-500/30' 
              : 'bg-emerald-50 border-emerald-200'
            }
          `}>
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className={`font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                ✅ Shipment Created Successfully!
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-emerald-200/70' : 'text-emerald-600'}`}>
                Containers have been generated. You can now upload documents or mark ready for dispatch.
              </p>
            </div>
          </div>
        )}

        {/* Success Header */}
        <div className="text-center mb-6">
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              createdShipment.isLocked
                ? "bg-gradient-to-br from-amber-500 to-orange-600"
                : "bg-gradient-to-br from-green-500 to-emerald-600"
            }`}
          >
            {createdShipment.isLocked ? (
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <h2
            className={`text-xl font-semibold mb-1 ${
              isDarkMode ? "text-slate-50" : "text-slate-900"
            }`}
          >
            {createdShipment.isLocked
              ? "Shipment Locked on Blockchain"
              : "Shipment Created Successfully"}
          </h2>
          <p
            className={`text-sm ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {createdShipment.isLocked
              ? "This shipment is now immutable and ready for dispatch"
              : "Review the details and mark ready for dispatch when confirmed"}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <span
            className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border
            ${
              createdShipment.isLocked
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
            }
          `}
          >
            {createdShipment.isLocked ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                LOCKED
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                CREATED
              </>
            )}
          </span>
        </div>

        {/* Shipment Summary */}
        <div
          className={`
          border rounded-xl p-4 mb-6
          ${
            isDarkMode
              ? "bg-slate-800/50 border-slate-700"
              : "bg-slate-50 border-slate-200"
          }
        `}
        >
          <h3
            className={`text-sm font-semibold mb-3 ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Shipment Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                Batch ID
              </span>
              <p
                className={`font-mono font-medium ${
                  isDarkMode ? "text-slate-50" : "text-slate-900"
                }`}
              >
                {createdShipment.batchId}
              </p>
            </div>
            <div>
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                Shipment Hash
              </span>
              <p
                className={`font-mono text-xs truncate ${
                  isDarkMode ? "text-slate-50" : "text-slate-900"
                }`}
                title={createdShipment.shipmentHash}
              >
                {createdShipment.shipmentHash}
              </p>
            </div>
            <div>
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                Containers
              </span>
              <p
                className={`font-medium ${
                  isDarkMode ? "text-slate-50" : "text-slate-900"
                }`}
              >
                {createdShipment.numberOfContainers}
              </p>
            </div>
            <div>
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                Qty per Container
              </span>
              <p
                className={`font-medium ${
                  isDarkMode ? "text-slate-50" : "text-slate-900"
                }`}
              >
                {createdShipment.quantityPerContainer} units
              </p>
            </div>
            <div className="col-span-2">
              <span
                className={isDarkMode ? "text-slate-400" : "text-slate-500"}
              >
                Total Quantity
              </span>
              <p
                className={`text-lg font-bold ${
                  isDarkMode ? "text-emerald-400" : "text-emerald-600"
                }`}
              >
                {createdShipment.totalQuantity} units
              </p>
            </div>
          </div>
        </div>

        {/* Blockchain Status */}
        {createdShipment.blockchainTxHash && (
          <div
            className={`
            border rounded-xl p-4 mb-6
            ${
              isDarkMode
                ? "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30"
                : "bg-gradient-to-br from-emerald-50 to-cyan-50 border-emerald-200"
            }
          `}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span
                className={`text-sm font-medium ${
                  isDarkMode ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                Blockchain Verified
              </span>
            </div>
            <p
              className={`text-xs font-mono truncate ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              TX: {createdShipment.blockchainTxHash}
            </p>
          </div>
        )}

        {/* Container QR Grid */}
        <div className="mb-6">
          <h3
            className={`text-sm font-semibold mb-3 ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Container QR Codes ({createdShipment.containers.length})
          </h3>
          <ContainerQRGrid 
            containers={createdShipment.containers} 
            isDarkMode={isDarkMode} 
          />
        </div>

        {/* Upload Supporting Documents */}
        <div className="mb-6">
          <UploadMetadata
            shipment={createdShipment}
            onUploadComplete={async () => {
              if (onRefreshShipment) {
                const refreshedShipment = await onRefreshShipment(createdShipment.shipmentHash);
                if (refreshedShipment) {
                  setCreatedShipment(prev => ({
                    ...prev,
                    supportingDocuments: refreshedShipment.supportingDocuments || []
                  }));
                }
              }
            }}
            onDeleteDocument={async (shipmentHash, docIndex) => {
              if (onDeleteDocument) {
                await onDeleteDocument(shipmentHash, docIndex);
                // Refresh shipment data after delete
                if (onRefreshShipment) {
                  const refreshedShipment = await onRefreshShipment(createdShipment.shipmentHash);
                  if (refreshedShipment) {
                    setCreatedShipment(prev => ({
                      ...prev,
                      supportingDocuments: refreshedShipment.supportingDocuments || []
                    }));
                  }
                }
              }
            }}
            walletAddress={walletAddress}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Instructions */}
        <div
          className={`
          p-4 rounded-xl border mb-6
          ${
            isDarkMode
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-amber-50 border-amber-200"
          }
        `}
        >
          <div className="flex items-start gap-3">
            <svg
              className={`w-5 h-5 mt-0.5 shrink-0 ${
                isDarkMode ? "text-amber-400" : "text-amber-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p
                className={`text-sm font-medium ${
                  isDarkMode ? "text-amber-300" : "text-amber-700"
                }`}
              >
                Attach QR Codes to Physical Containers
              </p>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-amber-200/70" : "text-amber-600"
                }`}
              >
                Print or download each QR code and attach it to the
                corresponding physical container. Each QR code uniquely
                identifies its container for tracking and verification.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!createdShipment.isLocked && (
            <button
              onClick={handleMarkReadyClick}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/25"
            >
              Mark Ready for Dispatch
            </button>
          )}
          <button
            onClick={handleCreateAnother}
            className={`
              ${
                createdShipment.isLocked ? "flex-1" : ""
              } py-3 px-4 font-medium rounded-xl transition-colors
              ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }
            `}
          >
            Create Another Shipment
          </button>
        </div>
      </div>
    );
  }

  // Form State
  return (
    <div
      className={`
      border rounded-2xl p-6 transition-all duration-200
      ${
        isDarkMode
          ? "bg-slate-900/50 border-slate-800 hover:border-slate-700"
          : "bg-white border-slate-200 shadow-sm hover:shadow-md"
      }
    `}
    >
      {/* Success Toast */}
      {createSuccess && (
        <div className={`
          mb-6 p-4 rounded-xl border flex items-center gap-3
          ${isDarkMode 
            ? 'bg-emerald-500/20 border-emerald-500/30' 
            : 'bg-emerald-50 border-emerald-200'
          }
        `}>
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
              ✅ {successMessage}
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-emerald-200/70' : 'text-emerald-600'}`}>
              You can now upload documents from the Manage tab or create another shipment.
            </p>
          </div>
          <button
            onClick={() => { setCreateSuccess(false); setSuccessMessage(''); }}
            className={`p-1 rounded-lg transition-colors hover:bg-emerald-500/20 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <h2
        className={`text-lg font-semibold mb-1 ${
          isDarkMode ? "text-slate-50" : "text-slate-900"
        }`}
      >
        Create New Shipment
      </h2>
      <p
        className={`text-sm mb-6 ${
          isDarkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        Enter batch details and container configuration
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Product Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            required
            placeholder="e.g., Pharmaceutical Grade Chemicals"
            autoComplete="off"
            className={inputClass}
          />
        </div>

        {/* Batch ID */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Batch ID <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="batchId"
            value={formData.batchId}
            onChange={handleChange}
            required
            placeholder="e.g., BATCH-2026-001"
            autoComplete="off"
            className={inputClass}
          />
          <p
            className={`text-xs mt-1 ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Unique identifier for this product batch
          </p>
        </div>

        {/* Container Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Number of Containers <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="numberOfContainers"
              value={formData.numberOfContainers}
              onChange={handleChange}
              required
              min="1"
              max="100"
              placeholder="e.g., 10"
              className={inputClass}
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Quantity per Container <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="quantityPerContainer"
              value={formData.quantityPerContainer}
              onChange={handleChange}
              required
              min="1"
              placeholder="e.g., 50"
              className={inputClass}
            />
          </div>
        </div>

        {/* Destination Warehouse - Required */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Destination Warehouse <span className="text-red-400">*</span>
          </label>
          {isLoadingUsers ? (
            <div className={`w-full border rounded-xl py-3 px-4 ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-500"}`}>
              Loading warehouses...
            </div>
          ) : usersError ? (
            <div className={`w-full border rounded-xl py-3 px-4 ${isDarkMode ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
              {usersError}
            </div>
          ) : (
            <select
              name="warehouseWallet"
              value={formData.warehouseWallet}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option
                value=""
                className={isDarkMode ? "bg-slate-800" : "bg-white"}
              >
                -- Select Warehouse --
              </option>
              {warehouses.map((w) => (
                <option
                  key={w.walletAddress}
                  value={w.walletAddress}
                  className={isDarkMode ? "bg-slate-800" : "bg-white"}
                >
                  {w.fullName || w.organizationName} {w.organizationName && w.fullName ? `(${w.organizationName})` : ''}
                </option>
              ))}
            </select>
          )}
          {warehouses.length === 0 && !isLoadingUsers && !usersError && (
            <p className={`text-xs mt-1 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
              No warehouses available. Please contact admin.
            </p>
          )}
        </div>

        {/* Transporter - Now Required */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Transporter <span className="text-red-400">*</span>
          </label>
          {isLoadingUsers ? (
            <div className={`w-full border rounded-xl py-3 px-4 ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-500"}`}>
              Loading transporters...
            </div>
          ) : usersError ? (
            <div className={`w-full border rounded-xl py-3 px-4 ${isDarkMode ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
              {usersError}
            </div>
          ) : (
            <select
              name="transporterWallet"
              value={formData.transporterWallet}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option
                value=""
                className={isDarkMode ? "bg-slate-800" : "bg-white"}
              >
                -- Select Transporter --
              </option>
              {transporters.map((t) => (
                <option
                  key={t.walletAddress}
                  value={t.walletAddress}
                  className={isDarkMode ? "bg-slate-800" : "bg-white"}
                >
                  {t.fullName || t.organizationName} {t.organizationName && t.fullName ? `(${t.organizationName})` : ''}
                </option>
              ))}
            </select>
          )}
          {transporters.length === 0 && !isLoadingUsers && !usersError && (
            <p className={`text-xs mt-1 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
              No transporters available. Please contact admin.
            </p>
          )}
        </div>

        {/* System-Generated Preview */}
        {formData.productName &&
          formData.batchId &&
          formData.numberOfContainers &&
          formData.quantityPerContainer && (
            <div
              className={`
            border rounded-xl p-4
            ${
              isDarkMode
                ? "bg-slate-800/30 border-slate-700/50"
                : "bg-slate-50 border-slate-200"
            }
          `}
            >
              <p
                className={`text-xs mb-3 font-medium ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                System-Generated Values (Preview)
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Total Quantity:
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      isDarkMode ? "text-emerald-400" : "text-emerald-600"
                    }`}
                  >
                    {totalQuantity} units
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Container IDs:
                  </span>
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {formData.numberOfContainers} will be generated
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Shipment Hash:
                  </span>
                  <code className="text-xs text-emerald-400 font-mono">
                    SHP-[HASH]-[TIMESTAMP]
                  </code>
                </div>
              </div>
            </div>
          )}

        <button
          type="submit"
          disabled={
            isSubmitting ||
            isLoadingUsers ||
            !formData.productName ||
            !formData.batchId ||
            !formData.numberOfContainers ||
            !formData.quantityPerContainer ||
            !formData.transporterWallet ||
            !formData.warehouseWallet
          }
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Preparing Preview...
            </span>
          ) : (
            "Preview Shipment"
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateShipment;
