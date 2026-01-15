/**
 * @file TransporterDashboard.jsx
 * @description Main dashboard for logistics transporters in the Sentinel supply chain system.
 * 
 * Design System: "Sentinel SaaS" - Matching Supplier Dashboard UI
 * - Theme: Dark/Light mode support
 * - Headers: Gradient backgrounds with glassmorphism
 * - Accents: Blue-Cyan gradients for CTAs
 * - Cards: rounded-2xl with subtle shadows
 * - Animations: Smooth fade-in transitions
 */

import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  ArrowLeft,
  Loader,
  Send,
  AlertTriangle,
  MapPin,
  Navigation,
  Package,
  CheckCircle,
  ThermometerSun,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import JobCard from './JobCard';
import CargoVerification from './CargoVerification';
import { useAuth } from '../../context/AuthContext';
import { fetchTransporterShipments } from '../../services/shipmentApi';

// ============================================================================
// ICONS
// ============================================================================

const SunIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const ShieldCheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const SearchIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const BellIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const BoxIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

// Theme Context for Transporter
const TransporterThemeContext = createContext();

export const useTransporterTheme = () => {
  const context = useContext(TransporterThemeContext);
  if (!context) {
    throw new Error('useTransporterTheme must be used within TransporterDashboard');
  }
  return context;
};

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_JOBS = [
  {
    id: 'TRK-001',
    product: 'Electronic Components (Fragile)',
    origin: 'Mumbai Warehouse',
    dest: 'Delhi Distribution Center',
    status: 'New',
    expectedQuantity: 50,
    weight: '45 kg',
    createdAt: 'Dec 26, 2025, 03:49 PM',
  },
  {
    id: 'TRK-002',
    product: 'Pharmaceutical Supplies',
    origin: 'Chennai Port',
    dest: 'Bangalore Medical Hub',
    status: 'In Transit',
    expectedQuantity: 100,
    weight: '120 kg',
    createdAt: 'Dec 24, 2025, 03:49 PM',
  },
  {
    id: 'TRK-003',
    product: 'Automotive Parts',
    origin: 'Pune Factory',
    dest: 'Hyderabad Assembly',
    status: 'New',
    expectedQuantity: 200,
    weight: '350 kg',
    createdAt: 'Dec 28, 2025, 03:49 PM',
  },
  {
    id: 'TRK-004',
    product: 'Textile Materials',
    origin: 'Surat Mills',
    dest: 'Kolkata Exports',
    status: 'Delayed',
    expectedQuantity: 75,
    weight: '80 kg',
    createdAt: 'Dec 27, 2025, 03:49 PM',
  },
];

const CONDITION_OPTIONS = [
  {
    value: 'Good',
    label: 'Good',
    icon: CheckCircle,
    activeClasses: 'bg-emerald-600 text-white border-emerald-600',
    inactiveClasses: 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50',
    darkInactiveClasses: 'bg-slate-800 text-emerald-400 border-emerald-500/30 hover:bg-slate-700',
  },
  {
    value: 'Damaged',
    label: 'Damaged',
    icon: AlertCircle,
    activeClasses: 'bg-red-600 text-white border-red-600',
    inactiveClasses: 'bg-white text-red-700 border-red-300 hover:bg-red-50',
    darkInactiveClasses: 'bg-slate-800 text-red-400 border-red-500/30 hover:bg-slate-700',
  },
  {
    value: 'Delayed',
    label: 'Delayed',
    icon: Clock,
    activeClasses: 'bg-amber-500 text-white border-amber-500',
    inactiveClasses: 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50',
    darkInactiveClasses: 'bg-slate-800 text-amber-400 border-amber-500/30 hover:bg-slate-700',
  },
];

const STATUS_CONFIG = {
  New: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    lightBg: 'bg-emerald-50',
    lightText: 'text-emerald-700',
    lightBorder: 'border-emerald-200',
  },
  'In Transit': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
    lightBorder: 'border-blue-200',
  },
  Delivered: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    lightBg: 'bg-slate-100',
    lightText: 'text-slate-600',
    lightBorder: 'border-slate-200',
  },
  Delayed: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-700',
    lightBorder: 'border-amber-200',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TransporterDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  // Shipment/Job State - Now fetched from API
  const [shipments, setShipments] = useState([]);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);
  const [shipmentsError, setShipmentsError] = useState(null);

  // Job State
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification State (using Set for unique IDs)
  const [scannedIds, setScannedIds] = useState(new Set());
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [discrepancyReason, setDiscrepancyReason] = useState('');

  // Form State
  const [locationInput, setLocationInput] = useState('');
  const [condition, setCondition] = useState('Good');

  // GPS State
  const [gpsLoading, setGpsLoading] = useState(false);

  // Fetch shipments assigned to this transporter
  const loadShipments = useCallback(async () => {
    if (!user?.walletAddress) return;
    
    setIsLoadingShipments(true);
    setShipmentsError(null);
    
    try {
      const result = await fetchTransporterShipments(user.walletAddress);
      // Transform shipments to job format for UI compatibility
      const jobs = result.shipments.map(shipment => ({
        id: shipment.shipmentHash,
        shipmentHash: shipment.shipmentHash,
        product: shipment.productName || `Batch ${shipment.batchId}`,
        batchId: shipment.batchId,
        origin: shipment.assignedWarehouse?.name || 'Supplier Location',
        dest: shipment.assignedWarehouse?.name || 'Destination',
        status: mapShipmentStatusToJobStatus(shipment.status),
        expectedQuantity: shipment.totalQuantity,
        numberOfContainers: shipment.numberOfContainers,
        weight: `${shipment.totalQuantity} units`,
        createdAt: new Date(shipment.createdAt).toLocaleString(),
        supplierWallet: shipment.supplierWallet,
        assignedTransporter: shipment.assignedTransporter,
        assignedWarehouse: shipment.assignedWarehouse,
      }));
      setShipments(jobs);
    } catch (error) {
      console.error('Failed to fetch transporter shipments:', error);
      setShipmentsError('Failed to load shipments. Please try again.');
    } finally {
      setIsLoadingShipments(false);
    }
  }, [user?.walletAddress]);

  // Map backend shipment status to UI job status
  const mapShipmentStatusToJobStatus = (status) => {
    switch (status) {
      case 'created':
      case 'ready_for_dispatch':
        return 'New';
      case 'in_transit':
        return 'In Transit';
      case 'at_warehouse':
      case 'delivered':
        return 'Delivered';
      default:
        return 'New';
    }
  };

  // Load shipments on mount and when user changes
  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  const notifications = [
    { id: 1, title: 'New shipment assigned', time: '5 min ago', type: 'success' },
    { id: 2, title: 'Delivery deadline approaching', time: '1 hour ago', type: 'warning' },
    { id: 3, title: 'Shipment ready for pickup', time: '3 hours ago', type: 'info' },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadShipments();
    setIsRefreshing(false);
  };

  // Filter jobs based on search and status - now uses real shipments
  const filteredJobs = shipments.filter(job => {
    const matchesSearch = searchQuery === '' || 
      job.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats calculation - now uses real shipments
  const stats = {
    total: shipments.length,
    new: shipments.filter(j => j.status === 'New').length,
    inTransit: shipments.filter(j => j.status === 'In Transit').length,
    delivered: shipments.filter(j => j.status === 'Delivered').length,
    delayed: shipments.filter(j => j.status === 'Delayed').length,
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'active', label: 'Active Jobs', icon: '🚚' },
    { id: 'history', label: 'History', icon: '📋' },
  ];

  const statusFilters = ['All', 'New', 'In Transit', 'Delivered', 'Delayed'];

  // --- HANDLERS ---

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setScannedIds(new Set());
    setVerificationComplete(false);
    setDiscrepancyReason('');
    setLocationInput('');
    setCondition('Good');
    setGpsLoading(false);
  };

  const handleBackToList = () => {
    setSelectedJob(null);
  };

  const handleScan = useCallback(
    (uniqueId) => {
      if (!selectedJob) return;

      setScannedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.size < selectedJob.expectedQuantity) {
          newSet.add(uniqueId);
        }
        return newSet;
      });
    },
    [selectedJob]
  );

  const handleConfirmVerification = () => {
    setVerificationComplete(true);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter location manually.');
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const formattedLocation = `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
        setLocationInput(formattedLocation);
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        let errorMessage = 'Unable to retrieve location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable GPS permissions or enter location manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Please enter location manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or enter manually.';
            break;
          default:
            errorMessage = 'An unknown error occurred. Please enter location manually.';
        }

        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleBlockchainUpdate = async () => {
    if (!locationInput.trim()) {
      alert('Please enter or fetch your current location.');
      return;
    }

    setIsSubmitting(true);

    await new Promise((r) => setTimeout(r, 2000));

    const updateData = {
      shipmentId: selectedJob.id,
      scannedCount: scannedIds.size,
      location: locationInput,
      condition,
      hasException: scannedIds.size < selectedJob.expectedQuantity,
      exceptionReason: discrepancyReason || null,
      timestamp: new Date().toISOString(),
    };

    console.log('Blockchain Update:', updateData);

    alert(
      `✅ Update Successful!\n\nShipment: ${selectedJob.id}\nItems Verified: ${scannedIds.size}/${selectedJob.expectedQuantity}\nLocation: ${locationInput}\nCondition: ${condition}`
    );

    setIsSubmitting(false);
    setSelectedJob(null);
  };

  // --- RENDER: DETAIL VIEW (When a job is selected) ---
  if (selectedJob) {
    return (
      <TransporterThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
        <div className={`min-h-screen transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
            : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
        }`}>
          {/* Header */}
          <header className={`
            backdrop-blur-xl border-b sticky top-0 z-30 px-4 lg:px-6 py-4 transition-colors duration-200
            ${isDarkMode 
              ? 'bg-slate-900/80 border-slate-700/50' 
              : 'bg-white/80 border-slate-200'
            }
          `}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToList}
                  disabled={isSubmitting}
                  className={`
                    p-2 rounded-xl transition-colors
                    ${isDarkMode 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  aria-label="Go back to job list"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <p className={`text-xs font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {selectedJob.id}
                  </p>
                  <h2 className={`text-lg font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {selectedJob.product}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`
                    p-2.5 rounded-xl transition-all duration-200
                    ${isDarkMode 
                      ? 'text-slate-400 hover:text-yellow-400 hover:bg-slate-800' 
                      : 'text-slate-600 hover:text-amber-500 hover:bg-slate-100'
                    }
                  `}
                >
                  {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all
                    ${isDarkMode 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Shipment Summary Card */}
            <div className={`
              rounded-2xl p-5 mb-6 border transition-colors duration-200
              ${isDarkMode 
                ? 'bg-slate-900/50 border-slate-800' 
                : 'bg-white border-slate-200 shadow-sm'
              }
            `}>
              <div className="flex items-start gap-4">
                <div className={`
                  p-3 rounded-xl
                  ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}
                `}>
                  <Package className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`
                      text-xs font-medium px-2.5 py-1 rounded-full border
                      ${isDarkMode 
                        ? `${STATUS_CONFIG[selectedJob.status]?.bg} ${STATUS_CONFIG[selectedJob.status]?.text} ${STATUS_CONFIG[selectedJob.status]?.border}`
                        : `${STATUS_CONFIG[selectedJob.status]?.lightBg} ${STATUS_CONFIG[selectedJob.status]?.lightText} ${STATUS_CONFIG[selectedJob.status]?.lightBorder}`
                      }
                    `}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Expected: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-900'}>
                      {selectedJob.expectedQuantity} items
                    </strong> • {selectedJob.weight}
                  </p>
                  <div className={`flex items-center gap-2 mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <MapPin className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <span className="truncate">{selectedJob.origin}</span>
                    <ArrowRight className={`w-4 h-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                    <MapPin className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    <span className="truncate">{selectedJob.dest}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification or Update Form */}
            {!verificationComplete ? (
              <div className={`
                rounded-2xl border transition-colors duration-200
                ${isDarkMode 
                  ? 'bg-slate-900/50 border-slate-800' 
                  : 'bg-white border-slate-200 shadow-sm'
                }
              `}>
                <CargoVerification
                  job={selectedJob}
                  scannedIds={scannedIds}
                  onScan={handleScan}
                  onConfirm={handleConfirmVerification}
                  discrepancyReason={discrepancyReason}
                  setDiscrepancyReason={setDiscrepancyReason}
                />
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Verification Summary */}
                {scannedIds.size < selectedJob.expectedQuantity ? (
                  <div className={`
                    rounded-2xl p-4 border
                    ${isDarkMode 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'bg-amber-50 border-amber-200'
                    }
                  `}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                      <div>
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                          ⚠️ Exception: {selectedJob.expectedQuantity - scannedIds.size} items missing
                        </p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
                          Verified: {scannedIds.size}/{selectedJob.expectedQuantity} items
                        </p>
                        {discrepancyReason && (
                          <p className={`text-xs mt-1 italic ${isDarkMode ? 'text-amber-400/60' : 'text-amber-600'}`}>
                            Reason: "{discrepancyReason}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`
                    rounded-2xl p-4 border
                    ${isDarkMode 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-emerald-50 border-emerald-200'
                    }
                  `}>
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
                        ✓ Cargo Verified: {scannedIds.size}/{selectedJob.expectedQuantity} items
                      </p>
                    </div>
                  </div>
                )}

                {/* Location Input */}
                <div className={`
                  rounded-2xl border p-5 transition-colors duration-200
                  ${isDarkMode 
                    ? 'bg-slate-900/50 border-slate-800' 
                    : 'bg-white border-slate-200 shadow-sm'
                  }
                `}>
                  <label className={`block text-sm font-bold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                    <MapPin className={`w-4 h-4 inline-block mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    Current Location
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      placeholder="Enter location or use GPS..."
                      disabled={isSubmitting}
                      className={`
                        flex-1 px-4 py-3 rounded-xl text-base
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${isDarkMode 
                          ? 'bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500' 
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                        }
                      `}
                    />
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isSubmitting || gpsLoading}
                      className="
                        px-4 py-3
                        bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600
                        text-white font-semibold
                        rounded-xl
                        transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center gap-2
                        min-w-[100px] justify-center
                        shadow-lg shadow-blue-500/25
                      "
                      aria-label="Get GPS location"
                    >
                      {gpsLoading ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Navigation className="w-5 h-5" />
                          <span className="hidden sm:inline">GPS</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Condition Selection */}
                <div className={`
                  rounded-2xl border p-5 transition-colors duration-200
                  ${isDarkMode 
                    ? 'bg-slate-900/50 border-slate-800' 
                    : 'bg-white border-slate-200 shadow-sm'
                  }
                `}>
                  <label className={`block text-sm font-bold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                    <ThermometerSun className={`w-4 h-4 inline-block mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    Shipment Condition
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {CONDITION_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = condition === opt.value;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCondition(opt.value)}
                          disabled={isSubmitting}
                          className={`
                            flex flex-col items-center justify-center
                            p-4 rounded-xl border-2
                            font-semibold text-sm
                            transition-all duration-150
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${isSelected 
                              ? opt.activeClasses 
                              : isDarkMode 
                                ? opt.darkInactiveClasses 
                                : opt.inactiveClasses
                            }
                          `}
                          aria-pressed={isSelected}
                        >
                          <Icon className="w-5 h-5 mb-1" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleBlockchainUpdate}
                  disabled={isSubmitting || !locationInput.trim()}
                  className={`
                    w-full py-4 px-6
                    text-white font-bold text-lg
                    rounded-2xl
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-3
                    shadow-lg
                    ${scannedIds.size < selectedJob.expectedQuantity
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/25'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-6 h-6 animate-spin" />
                      <span>Writing to Blockchain...</span>
                    </>
                  ) : scannedIds.size < selectedJob.expectedQuantity ? (
                    <>
                      <AlertTriangle className="w-5 h-5" />
                      <span>Submit with Exception</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Update On-Chain</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </main>
        </div>
      </TransporterThemeContext.Provider>
    );
  }

  // --- RENDER: LIST VIEW (Dashboard) ---
  return (
    <TransporterThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <div className={`min-h-screen transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}>
        {/* Header */}
        <header className={`
          backdrop-blur-xl border-b sticky top-0 z-30 px-4 lg:px-6 py-4 transition-colors duration-200
          ${isDarkMode 
            ? 'bg-slate-900/80 border-slate-700/50' 
            : 'bg-white/80 border-slate-200'
          }
        `}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left Section - Logo & Search */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
              </Link>

              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl w-80
                  ${isDarkMode 
                    ? 'bg-slate-800/50 border border-slate-700/50' 
                    : 'bg-slate-100 border border-slate-200'
                  }
                `}>
                  <SearchIcon className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    placeholder="Search shipments, products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`
                      bg-transparent outline-none w-full text-sm
                      ${isDarkMode 
                        ? 'text-white placeholder:text-slate-500' 
                        : 'text-slate-900 placeholder:text-slate-400'
                      }
                    `}
                  />
                  <kbd className={`
                    hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded text-xs
                    ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}
                  `}>
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Role Badge */}
              <div className={`
                hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                ${isDarkMode 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }
              `}>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Transporter
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`
                  p-2.5 rounded-xl transition-all duration-200
                  ${isDarkMode 
                    ? 'text-slate-400 hover:text-yellow-400 hover:bg-slate-800' 
                    : 'text-slate-600 hover:text-amber-500 hover:bg-slate-100'
                  }
                `}
              >
                {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfile(false);
                  }}
                  className={`
                    relative p-2.5 rounded-xl transition-all duration-200
                    ${isDarkMode 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }
                  `}
                >
                  <BellIcon className="w-5 h-5" />
                  <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${isDarkMode ? 'border-slate-900' : 'border-white'}`} />
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className={`
                    absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-50
                    ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}
                  `}>
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`
                            px-4 py-3 border-b last:border-0 cursor-pointer transition-colors
                            ${isDarkMode ? 'border-slate-700/50 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`
                              w-2 h-2 mt-2 rounded-full shrink-0
                              ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}
                            `} />
                            <div>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{notif.title}</p>
                              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                      <button className="text-sm text-blue-500 hover:text-blue-400 font-medium w-full text-center">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfile(!showProfile);
                    setShowNotifications(false);
                  }}
                  className={`
                    flex items-center gap-2 p-1.5 pr-3 rounded-xl transition-all duration-200
                    ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}
                  `}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                </button>

                {/* Profile Dropdown */}
                {showProfile && (
                  <div className={`
                    absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl overflow-hidden z-50
                    ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}
                  `}>
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Driver John</p>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>driver@sentinel.io</p>
                    </div>
                    <div className="p-2">
                      {['Profile', 'Settings', 'Help'].map((item) => (
                        <button
                          key={item}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                            ${isDarkMode 
                              ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                            }
                          `}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className={`p-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                      <button
                        onClick={() => navigate('/login')}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                          ${isDarkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}
                        `}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className={`
          backdrop-blur-xl border-b transition-colors duration-200
          ${isDarkMode 
            ? 'bg-slate-900/50 border-slate-800' 
            : 'bg-white/50 border-slate-200'
          }
        `}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 py-3 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Dashboard
              </h1>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Welcome back! Here's your shipment overview.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' 
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm'
                }
                disabled:opacity-50
              `}
            >
              <RefreshIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Shipments', value: stats.total, icon: BoxIcon, color: 'blue', trend: '↑ 12%', trendUp: true },
              { label: 'New Jobs', value: stats.new, icon: Package, color: 'emerald', trend: '↑ 8%', trendUp: true },
              { label: 'In Transit', value: stats.inTransit, icon: Truck, color: 'amber', trend: '↑ 23%', trendUp: true },
              { label: 'Delayed', value: stats.delayed, icon: AlertTriangle, color: 'red', trend: '↓ 5%', trendUp: false },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`
                  rounded-2xl p-5 border transition-colors duration-200
                  ${isDarkMode 
                    ? 'bg-slate-900/50 border-slate-800' 
                    : 'bg-white border-slate-200 shadow-sm'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {stat.label}
                  </p>
                  <div className={`
                    p-2 rounded-xl
                    ${stat.color === 'blue' ? (isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100') : ''}
                    ${stat.color === 'emerald' ? (isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100') : ''}
                    ${stat.color === 'amber' ? (isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100') : ''}
                    ${stat.color === 'red' ? (isDarkMode ? 'bg-red-500/20' : 'bg-red-100') : ''}
                  `}>
                    <stat.icon className={`w-5 h-5 
                      ${stat.color === 'blue' ? 'text-blue-500' : ''}
                      ${stat.color === 'emerald' ? 'text-emerald-500' : ''}
                      ${stat.color === 'amber' ? 'text-amber-500' : ''}
                      ${stat.color === 'red' ? 'text-red-500' : ''}
                    `} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {stat.value}
                </p>
                <p className={`text-xs mt-2 ${stat.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.trend} <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>vs last month</span>
                </p>
              </div>
            ))}
          </div>

          {/* Shipments Section */}
          <div className={`
            rounded-2xl border transition-colors duration-200 overflow-hidden
            ${isDarkMode 
              ? 'bg-slate-900/50 border-slate-800' 
              : 'bg-white border-slate-200 shadow-sm'
            }
          `}>
            {/* Shipments Header */}
            <div className={`px-5 py-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Shipments
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Showing {filteredJobs.length} of {MOCK_JOBS.length} shipments
                  </p>
                </div>

                {/* Status Filters */}
                <div className="flex flex-wrap gap-2">
                  {statusFilters.map((filter) => {
                    const count = filter === 'All' 
                      ? MOCK_JOBS.length 
                      : MOCK_JOBS.filter(j => j.status === filter).length;
                    
                    return (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                          ${statusFilter === filter
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                            : isDarkMode
                              ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                          }
                        `}
                      >
                        {filter}
                        <span className={`
                          text-xs px-1.5 py-0.5 rounded-full
                          ${statusFilter === filter
                            ? 'bg-white/20'
                            : isDarkMode
                              ? 'bg-slate-700'
                              : 'bg-slate-200'
                          }
                        `}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Shipments Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                    {['PRODUCT', 'SHIPMENT ID', 'QUANTITY', 'ROUTE', 'STATUS', 'CREATED', 'ACTION'].map((header) => (
                      <th
                        key={header}
                        className={`
                          px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider
                          ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}
                        `}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      className={`
                        transition-colors cursor-pointer
                        ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}
                      `}
                      onClick={() => handleJobSelect(job)}
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {job.product}
                          </p>
                          <p className={`text-xs mt-0.5 font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {job.id}
                          </p>
                        </div>
                      </td>
                      <td className={`px-5 py-4 text-sm font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {job.id}
                      </td>
                      <td className={`px-5 py-4 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {job.expectedQuantity} items
                      </td>
                      <td className="px-5 py-4">
                        <div className={`flex items-center gap-1.5 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          <span className="truncate max-w-[80px]">{job.origin.split(' ')[0]}</span>
                          <ArrowRight className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[80px]">{job.dest.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                          ${isDarkMode 
                            ? `${STATUS_CONFIG[job.status]?.bg} ${STATUS_CONFIG[job.status]?.text} ${STATUS_CONFIG[job.status]?.border}`
                            : `${STATUS_CONFIG[job.status]?.lightBg} ${STATUS_CONFIG[job.status]?.lightText} ${STATUS_CONFIG[job.status]?.lightBorder}`
                          }
                        `}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            job.status === 'New' ? 'bg-emerald-500' :
                            job.status === 'In Transit' ? 'bg-blue-500' :
                            job.status === 'Delivered' ? 'bg-slate-500' :
                            'bg-amber-500'
                          }`} />
                          {job.status}
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {job.createdAt}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJobSelect(job);
                          }}
                          className={`
                            text-sm font-medium transition-colors
                            ${isDarkMode 
                              ? 'text-blue-400 hover:text-blue-300' 
                              : 'text-blue-600 hover:text-blue-700'
                            }
                          `}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredJobs.length === 0 && (
              <div className={`text-center py-16 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <Truck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  No Shipments Found
                </h3>
                <p className="text-sm">
                  {searchQuery ? 'Try adjusting your search or filters.' : 'Check back later for new assignments.'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </TransporterThemeContext.Provider>
  );
};

export default TransporterDashboard;