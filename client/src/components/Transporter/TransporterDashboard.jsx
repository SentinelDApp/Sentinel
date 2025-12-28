/**
 * @file TransporterDashboard.jsx
 * @description Main dashboard for logistics transporters in the Sentinel supply chain system.
 * 
 * Design System: "Sentinel SaaS"
 * - Headers: bg-slate-900 (dark)
 * - Accents: Indigo-600
 * - Cards: rounded-2xl with deep shadows
 * - Animations: Smooth fade-in transitions
 * 
 * Architecture:
 * - scannedIds: Set<string> for unique QR code tracking
 * - Real GPS: navigator.geolocation API integration
 * - CargoVerification: Delegated scanning component
 */

import { useState, useCallback } from 'react';
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
} from 'lucide-react';
import JobCard from './JobCard';
import CargoVerification from './CargoVerification';

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
  },
  {
    id: 'TRK-002',
    product: 'Pharmaceutical Supplies',
    origin: 'Chennai Port',
    dest: 'Bangalore Medical Hub',
    status: 'In Transit',
    expectedQuantity: 100,
    weight: '120 kg',
  },
  {
    id: 'TRK-003',
    product: 'Automotive Parts',
    origin: 'Pune Factory',
    dest: 'Hyderabad Assembly',
    status: 'New',
    expectedQuantity: 200,
    weight: '350 kg',
  },
  {
    id: 'TRK-004',
    product: 'Textile Materials',
    origin: 'Surat Mills',
    dest: 'Kolkata Exports',
    status: 'Delayed',
    expectedQuantity: 75,
    weight: '80 kg',
  },
];

const CONDITION_OPTIONS = [
  {
    value: 'Good',
    label: 'Good',
    icon: CheckCircle,
    activeClasses: 'bg-emerald-600 text-white border-emerald-600',
    inactiveClasses: 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50',
  },
  {
    value: 'Damaged',
    label: 'Damaged',
    icon: AlertCircle,
    activeClasses: 'bg-red-600 text-white border-red-600',
    inactiveClasses: 'bg-white text-red-700 border-red-300 hover:bg-red-50',
  },
  {
    value: 'Delayed',
    label: 'Delayed',
    icon: Clock,
    activeClasses: 'bg-amber-500 text-white border-amber-500',
    inactiveClasses: 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TransporterDashboard = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
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

  // --- HANDLERS ---

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    // Reset all sub-states
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

  /**
   * Real GPS Handler using navigator.geolocation
   * On success: Sets locationInput to formatted coordinates
   * On error: Alerts user to enter location manually
   */
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter location manually.');
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        const { latitude, longitude } = position.coords;
        const formattedLocation = `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
        setLocationInput(formattedLocation);
        setGpsLoading(false);
      },
      // Error callback
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
      // Options
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

    // Simulate Blockchain Write
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

  // --- RENDER: LIST VIEW ---
  if (!selectedJob) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-slate-900 text-white px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Link to="/" className="p-2 bg-indigo-600 rounded-xl">
                  <Truck className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold">Transporter Dashboard</h1>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
            <p className="text-slate-400 ml-14">Welcome back! Select a shipment to update.</p>
          </div>
        </header>

        {/* Stats Summary */}
        <div className="max-w-4xl mx-auto px-6 -mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-4 text-center border border-slate-100">
              <p className="text-3xl font-bold text-indigo-600">
                {MOCK_JOBS.filter((j) => j.status === 'New').length}
              </p>
              <p className="text-sm text-slate-500 font-medium">New Jobs</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-4 text-center border border-slate-100">
              <p className="text-3xl font-bold text-amber-500">
                {MOCK_JOBS.filter((j) => j.status === 'In Transit').length}
              </p>
              <p className="text-sm text-slate-500 font-medium">In Transit</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-4 text-center border border-slate-100">
              <p className="text-3xl font-bold text-emerald-600">
                {MOCK_JOBS.filter((j) => j.status === 'Delivered').length}
              </p>
              <p className="text-sm text-slate-500 font-medium">Delivered</p>
            </div>
          </div>
        </div>

        {/* Job Grid */}
        <main className="max-w-4xl mx-auto px-6 py-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Your Shipments</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {MOCK_JOBS.map((job) => (
              <JobCard key={job.id} job={job} onSelect={handleJobSelect} />
            ))}
          </div>

          {MOCK_JOBS.length === 0 && (
            <div className="text-center py-16">
              <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Shipments Assigned</h3>
              <p className="text-slate-500">Check back later for new assignments.</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- RENDER: DETAIL VIEW ---
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Dark Header */}
      <header className="bg-slate-900 text-white px-4 pt-4 pb-20 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToList}
              disabled={isSubmitting}
              className="
                p-2 -ml-2 rounded-xl
                text-slate-400 hover:text-white hover:bg-slate-800
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              aria-label="Go back to job list"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <p className="text-xs font-mono text-slate-500">{selectedJob.id}</p>
              <h2 className="text-lg font-bold truncate">{selectedJob.product}</h2>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* White Container (overlapping dark header) */}
      <main className="bg-white rounded-t-3xl -mt-12 min-h-[calc(100vh-120px)] relative z-10">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Shipment Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Package className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">
                  Expected: <strong className="text-slate-900">{selectedJob.expectedQuantity} items</strong> •{' '}
                  {selectedJob.weight}
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span className="truncate">{selectedJob.origin}</span>
                  <span className="text-slate-300">→</span>
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span className="truncate">{selectedJob.dest}</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 1: VERIFICATION */}
          {!verificationComplete ? (
            <CargoVerification
              job={selectedJob}
              scannedIds={scannedIds}
              onScan={handleScan}
              onConfirm={handleConfirmVerification}
              discrepancyReason={discrepancyReason}
              setDiscrepancyReason={setDiscrepancyReason}
            />
          ) : (
            /* STEP 2: UPDATE FORM */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Verification Summary */}
              {scannedIds.size < selectedJob.expectedQuantity ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        ⚠️ Exception: {selectedJob.expectedQuantity - scannedIds.size} items missing
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Verified: {scannedIds.size}/{selectedJob.expectedQuantity} items
                      </p>
                      {discrepancyReason && (
                        <p className="text-xs text-amber-600 mt-1 italic">Reason: "{discrepancyReason}"</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-800">
                      ✓ Cargo Verified: {scannedIds.size}/{selectedJob.expectedQuantity} items
                    </p>
                  </div>
                </div>
              )}

              {/* Location Input */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100/50 p-5 mb-6">
                <label className="block text-sm font-bold text-slate-900 mb-3">
                  <MapPin className="w-4 h-4 inline-block mr-2 text-indigo-500" />
                  Current Location
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Enter location or use GPS..."
                    disabled={isSubmitting}
                    className="
                      flex-1 px-4 py-3
                      bg-slate-50 border border-slate-200 rounded-xl
                      text-slate-900 placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      disabled:bg-slate-100 disabled:cursor-not-allowed
                      text-base
                    "
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isSubmitting || gpsLoading}
                    className="
                      px-4 py-3
                      bg-indigo-600 hover:bg-indigo-700
                      text-white font-semibold
                      rounded-xl
                      transition-colors
                      disabled:bg-slate-300 disabled:cursor-not-allowed
                      flex items-center gap-2
                      min-w-[100px] justify-center
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
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100/50 p-5 mb-6">
                <label className="block text-sm font-bold text-slate-900 mb-3">
                  <ThermometerSun className="w-4 h-4 inline-block mr-2 text-indigo-500" />
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
                          ${isSelected ? opt.activeClasses : opt.inactiveClasses}
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
                  disabled:bg-slate-300 disabled:cursor-not-allowed
                  flex items-center justify-center gap-3
                  shadow-lg
                  ${
                    scannedIds.size < selectedJob.expectedQuantity
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
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
        </div>
      </main>
    </div>
  );
};

export default TransporterDashboard;