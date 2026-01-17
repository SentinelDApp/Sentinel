import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * AUTHENTICATION CONTEXT
 * 
 * SENTINEL WALLET-FIRST IDENTITY MODEL:
 * - Manages wallet connection via MetaMask
 * - Handles the 3-step login flow (check-role → nonce → verify)
 * - Stores JWT token for authenticated API calls
 * - Provides role-based access control
 */

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('sentinel_token');
    const storedUser = localStorage.getItem('sentinel_user');
    const storedWallet = localStorage.getItem('sentinel_wallet');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setWalletAddress(storedWallet);
    }
    setIsLoading(false);
  }, []);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          logout();
        } else if (accounts[0].toLowerCase() !== walletAddress?.toLowerCase()) {
          // User switched accounts - log out and require re-auth
          logout();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [walletAddress]);

  /**
   * Connect to MetaMask wallet
   * Returns the connected wallet address
   */
  const connectWallet = useCallback(async () => {
    setError(null);
    
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect a wallet.');
      }

      const address = accounts[0].toLowerCase();
      setWalletAddress(address);
      localStorage.setItem('sentinel_wallet', address);
      return address;
    } catch (err) {
      if (err.code === 4001) {
        throw new Error('Wallet connection rejected. Please approve the connection.');
      }
      throw err;
    }
  }, []);

  /**
   * Step 1: Check role/status for a wallet
   * Returns: { status, role, fullName, message }
   */
  const checkRole = useCallback(async (wallet) => {
    setError(null);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/check-role?wallet=${wallet}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to check role');
    }

    return data;
  }, []);

  /**
   * Full login flow:
   * 1. Connect wallet (if not already connected)
   * 2. Check role
   * 3. Get nonce
   * 4. Sign message with wallet
   * 5. Verify signature and get JWT
   */
  const login = useCallback(async (existingWallet = null) => {
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Connect wallet if not provided
      const wallet = existingWallet || await connectWallet();

      // Step 2: Check role
      const roleCheck = await checkRole(wallet);
      
      if (roleCheck.status === 'NOT_REGISTERED') {
        setIsLoading(false);
        return { success: false, status: 'NOT_REGISTERED', message: 'Please register first' };
      }

      if (roleCheck.status === 'PENDING') {
        setIsLoading(false);
        return { success: false, status: 'PENDING', message: 'Registration pending admin approval' };
      }

      if (roleCheck.status === 'REJECTED') {
        setIsLoading(false);
        return { success: false, status: 'REJECTED', message: roleCheck.reason || 'Registration was rejected' };
      }

      if (roleCheck.status === 'SUSPENDED') {
        setIsLoading(false);
        return { success: false, status: 'SUSPENDED', message: 'Account is suspended' };
      }

      if (roleCheck.status !== 'APPROVED') {
        setIsLoading(false);
        return { success: false, status: roleCheck.status, message: roleCheck.message };
      }

      // Step 3: Get nonce
      const nonceResponse = await fetch(`${API_BASE_URL}/api/auth/nonce?wallet=${wallet}`);
      const nonceData = await nonceResponse.json();

      if (!nonceResponse.ok) {
        throw new Error(nonceData.message || 'Failed to get nonce');
      }

      // Step 4: Sign message with MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [nonceData.message, wallet]
      });

      // Step 5: Verify signature
      const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, signature })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || 'Signature verification failed');
      }

      // Success! Store token and user data
      setToken(verifyData.token);
      setUser(verifyData.user);
      setWalletAddress(wallet);

      localStorage.setItem('sentinel_token', verifyData.token);
      localStorage.setItem('sentinel_user', JSON.stringify(verifyData.user));
      localStorage.setItem('sentinel_wallet', wallet);

      // Dispatch custom event to notify App component (for ChatBot visibility)
      window.dispatchEvent(new Event('sentinel-auth-change'));

      setIsLoading(false);
      return { 
        success: true, 
        user: verifyData.user, 
        role: verifyData.user.role 
      };

    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [connectWallet, checkRole]);

  /**
   * Logout - Clear all auth state
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setWalletAddress(null);
    setError(null);
    
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_user');
    localStorage.removeItem('sentinel_wallet');

    // Dispatch custom event to notify App component (for ChatBot visibility)
    window.dispatchEvent(new Event('sentinel-auth-change'));
  }, []);

  /**
   * Get authorization headers for API calls
   */
  const getAuthHeaders = useCallback(() => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, [token]);

  /**
   * Make an authenticated API call
   */
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...getAuthHeaders(),
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    // Handle 401 - token expired or invalid
    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  }, [getAuthHeaders, logout]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((allowedRoles) => {
    if (!user) return false;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.map(r => r.toLowerCase()).includes(user.role?.toLowerCase());
  }, [user]);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!token && !!user;

  const value = {
    // State
    user,
    token,
    walletAddress,
    isLoading,
    error,
    isAuthenticated,
    
    // Actions
    connectWallet,
    checkRole,
    login,
    logout,
    getAuthHeaders,
    authFetch,
    hasRole,
    
    // Helpers
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
