/**
 * useBlockchain Hook
 * 
 * SYSTEM PRINCIPLE:
 * Shipment data is written to blockchain only after supplier confirmation
 * to ensure immutability and trust. This hook provides a clean interface
 * for blockchain interactions using ethers.js.
 * 
 * The blockchain serves as a source of truth for locked shipments,
 * not as a database for operational data.
 */

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import SentinelShipmentRegistryABI from '../contracts/SentinelShipmentRegistry.json';

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Contract address from Ganache deployment
// Update this after each new deployment with: truffle migrate --reset
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0xD4cA017e2313014074c3eeC5e423F3183D9238A2';

// Expected chain ID for Ganache local network
const EXPECTED_CHAIN_ID = import.meta.env.VITE_CHAIN_ID || '0x539'; // 1337 in hex

// ═══════════════════════════════════════════════════════════════════════════
// ERROR MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

const ERROR_MESSAGES = {
  NO_WALLET: 'No Ethereum wallet detected. Please install MetaMask or Brave Wallet.',
  NOT_CONNECTED: 'Wallet not connected. Please connect your wallet first.',
  USER_REJECTED: 'Transaction was rejected by user.',
  NETWORK_MISMATCH: 'Please connect to the correct network (Ganache local).',
  DUPLICATE_SHIPMENT: 'This shipment already exists on the blockchain.',
  INVALID_CONTAINERS: 'Number of containers must be greater than zero.',
  INVALID_QUANTITY: 'Quantity per container must be greater than zero.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export const useBlockchain = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Check if MetaMask or another Ethereum wallet is available
   */
  const isWalletAvailable = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  /**
   * Connect to the user's Ethereum wallet
   * @returns {Promise<string>} Connected wallet address
   */
  const connectWallet = useCallback(async () => {
    setError(null);
    
    if (!isWalletAvailable()) {
      setError(ERROR_MESSAGES.NO_WALLET);
      throw new Error(ERROR_MESSAGES.NO_WALLET);
    }

    setIsConnecting(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error(ERROR_MESSAGES.NOT_CONNECTED);
      }

      const address = accounts[0];
      setWalletAddress(address);
      
      return address;
    } catch (err) {
      // Handle user rejection
      if (err.code === 4001) {
        setError(ERROR_MESSAGES.USER_REJECTED);
        throw new Error(ERROR_MESSAGES.USER_REJECTED);
      }
      setError(err.message || ERROR_MESSAGES.UNKNOWN_ERROR);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [isWalletAvailable]);

  /**
   * Verify the connected network matches expected chain
   * @returns {Promise<boolean>} True if network matches
   */
  const verifyNetwork = useCallback(async () => {
    if (!isWalletAvailable()) {
      return false;
    }

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return chainId === EXPECTED_CHAIN_ID;
    } catch {
      return false;
    }
  }, [isWalletAvailable]);

  /**
   * Get the contract instance with signer for write operations
   * @returns {Promise<ethers.Contract>} Contract instance
   */
  const getContract = useCallback(async () => {
    if (!isWalletAvailable()) {
      throw new Error(ERROR_MESSAGES.NO_WALLET);
    }

    // Create provider from window.ethereum
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Get signer for write operations
    const signer = await provider.getSigner();
    
    // Create contract instance
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      SentinelShipmentRegistryABI.abi,
      signer
    );

    return contract;
  }, [isWalletAvailable]);

  /**
   * Confirm and lock a shipment on the blockchain
   * 
   * SYSTEM PRINCIPLE:
   * This is the only write operation in Phase 1. Once called, the shipment
   * becomes immutable on-chain, ensuring tamper-proof audit trails.
   * 
   * @param {Object} shipmentData - Shipment details to lock
   * @param {string} shipmentData.shipmentHash - Unique identifier
   * @param {string} shipmentData.batchId - Batch identifier
   * @param {number} shipmentData.numberOfContainers - Container count
   * @param {number} shipmentData.quantityPerContainer - Units per container
   * @returns {Promise<Object>} Transaction result with hash and block number
   */
  const confirmAndLockShipment = useCallback(async (shipmentData) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Pre-check: Ensure wallet is connected
      if (!walletAddress) {
        await connectWallet();
      }

      // Pre-check: Verify network
      const isCorrectNetwork = await verifyNetwork();
      if (!isCorrectNetwork) {
        throw new Error(ERROR_MESSAGES.NETWORK_MISMATCH);
      }

      // Validate required fields
      const { shipmentHash, batchId, numberOfContainers, quantityPerContainer } = shipmentData;
      
      if (!shipmentHash || !batchId) {
        throw new Error('Shipment hash and batch ID are required.');
      }

      if (!numberOfContainers || numberOfContainers <= 0) {
        throw new Error(ERROR_MESSAGES.INVALID_CONTAINERS);
      }

      if (!quantityPerContainer || quantityPerContainer <= 0) {
        throw new Error(ERROR_MESSAGES.INVALID_QUANTITY);
      }

      // Get contract instance
      const contract = await getContract();

      // Call the smart contract function
      // This will trigger the wallet popup for user approval
      const tx = await contract.confirmAndLockShipment(
        shipmentHash,
        batchId,
        numberOfContainers,
        quantityPerContainer
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Extract transaction details
      const result = {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
      };

      return result;
    } catch (err) {
      // Parse error messages from contract reverts
      let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;

      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        errorMessage = ERROR_MESSAGES.USER_REJECTED;
      } else if (err.message?.includes('Shipment already exists')) {
        errorMessage = ERROR_MESSAGES.DUPLICATE_SHIPMENT;
      } else if (err.message?.includes('Number of containers')) {
        errorMessage = ERROR_MESSAGES.INVALID_CONTAINERS;
      } else if (err.message?.includes('Quantity per container')) {
        errorMessage = ERROR_MESSAGES.INVALID_QUANTITY;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [walletAddress, connectWallet, verifyNetwork, getContract]);

  /**
   * Check if a shipment exists on the blockchain
   * @param {string} shipmentHash - Shipment identifier
   * @returns {Promise<boolean>} True if shipment exists
   */
  const checkShipmentExists = useCallback(async (shipmentHash) => {
    try {
      const contract = await getContract();
      const exists = await contract.shipmentExists(shipmentHash);
      return exists;
    } catch {
      return false;
    }
  }, [getContract]);

  /**
   * Get shipment details from the blockchain
   * @param {string} shipmentHash - Shipment identifier
   * @returns {Promise<Object|null>} Shipment details or null
   */
  const getShipmentFromBlockchain = useCallback(async (shipmentHash) => {
    try {
      const contract = await getContract();
      const shipment = await contract.getShipment(shipmentHash);
      
      return {
        supplier: shipment[0],
        batchId: shipment[1],
        numberOfContainers: Number(shipment[2]),
        quantityPerContainer: Number(shipment[3]),
        createdAt: Number(shipment[4]),
        status: Number(shipment[5]),
      };
    } catch {
      return null;
    }
  }, [getContract]);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isConnecting,
    isProcessing,
    walletAddress,
    error,
    
    // Methods
    isWalletAvailable,
    connectWallet,
    verifyNetwork,
    confirmAndLockShipment,
    checkShipmentExists,
    getShipmentFromBlockchain,
    clearError,
    
    // Constants
    CONTRACT_ADDRESS,
  };
};

export default useBlockchain;
