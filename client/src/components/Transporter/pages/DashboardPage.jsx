import { useState, useMemo, useCallback } from "react";
import { useTransporterTheme } from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { StatsGrid } from "../components/StatsCard";
import ShipmentsTable from "../components/ShipmentsTable";
import JobDetailView from "../components/JobDetailView";
import LeftSidebar from "../layout/LeftSidebar";
import { useTransporterShipments } from "../hooks/useTransporterShipments";
import TransporterScanPage from "./TransporterScanPage";

const DashboardPage = () => {
  const { isDarkMode } = useTransporterTheme();
  const { walletAddress } = useAuth();
  const { jobs, isLoading, error, refreshShipments, updateJobStatus } = useTransporterShipments();
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showScanMode, setShowScanMode] = useState(false);

  // Calculate stats based on mapped transporter statuses
  const stats = useMemo(() => ({
    total: jobs.length,
    new: jobs.filter((j) => j.status === "Pending" || j.status === "Ready").length,
    inTransit: jobs.filter((j) => j.status === "In Transit").length,
    delayed: jobs.filter((j) => j.status === "At Warehouse").length,
  }), [jobs]);

  // Filter jobs based on tab and status
  const filteredJobs = useMemo(() => {
    let filtered = jobs;
    
    if (activeTab === 'active') {
      filtered = jobs.filter((job) => 
        job.status === "Pending" || job.status === "Ready" || job.status === "In Transit"
      );
    } else if (activeTab === 'history') {
      filtered = jobs.filter((job) => 
        job.status === "Delivered" || job.status === "At Warehouse"
      );
    }
    
    if (statusFilter !== "All") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter((job) =>
        (job.product && job.product.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.id && job.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.batchId && job.batchId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.origin && job.origin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.dest && job.dest.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  }, [jobs, statusFilter, searchQuery, activeTab]);

  // Get tab title and subtitle
  const getTabContent = () => {
    switch (activeTab) {
      case 'active':
        return {
          title: 'Active Jobs',
          subtitle: `${filteredJobs.length} active shipment${filteredJobs.length !== 1 ? 's' : ''} in progress`
        };
      case 'history':
        return {
          title: 'Shipment History',
          subtitle: `${filteredJobs.length} completed shipment${filteredJobs.length !== 1 ? 's' : ''}`
        };
      case 'manage':
        return {
          title: selectedShipment ? selectedShipment.batchId : 'Manage Shipments',
          subtitle: selectedShipment 
            ? showScanMode 
              ? `Scanning containers for shipment` 
              : `View and manage shipment details`
            : 'Select a shipment from Dashboard or Active Jobs'
        };
      case 'scan':
        return {
          title: 'Scan QR Code',
          subtitle: 'Scan shipment or container QR codes for verification'
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: `Monitor and manage ${jobs.length} assigned shipment${jobs.length !== 1 ? 's' : ''}`
        };
    }
  };

  const tabContent = getTabContent();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshShipments();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = (jobId, newStatus) => {
    updateJobStatus(jobId, newStatus);
    setSelectedJob(null);
  };

  const handleJobSelect = (job) => {
    // Navigate to manage tab with this shipment selected (like supplier)
    setSelectedShipment(job);
    setShowScanMode(false);
    setActiveTab("manage");
  };

  const handleBackToList = () => {
    setSelectedJob(null);
  };

  // Clear selection in manage tab
  const handleClearSelection = () => {
    setSelectedShipment(null);
    setShowScanMode(false);
  };

  // QR Scanner handlers
  const handleShipmentReceived = useCallback((shipment, txResult) => {
    console.log('Shipment received:', shipment, txResult);
    refreshShipments();
  }, [refreshShipments]);

  // Render loading state
  const renderLoading = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className={`animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-4 ${
          isDarkMode 
            ? 'border-purple-500 border-t-transparent' 
            : 'border-purple-600 border-t-transparent'
        }`} />
        <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
          Loading shipments...
        </p>
      </div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className={`rounded-2xl border p-8 text-center ${
      isDarkMode 
        ? 'bg-red-500/10 border-red-500/30' 
        : 'bg-red-50 border-red-200'
    }`}>
      <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
        Failed to load shipments
      </p>
      <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        {error}
      </p>
      <button
        onClick={handleRefresh}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium text-sm hover:shadow-lg transition-all"
      >
        Retry
      </button>
    </div>
  );

  // Render Dashboard Tab Content
  const renderDashboardContent = () => {
    if (selectedJob) {
      return (
        <JobDetailView
          job={selectedJob}
          onBack={handleBackToList}
          onStatusChange={handleStatusChange}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <StatsGrid stats={stats} />
        
        {/* Shipments Table */}
        <ShipmentsTable
          jobs={jobs}
          filteredJobs={filteredJobs}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onJobSelect={handleJobSelect}
          activeTab={activeTab}
        />
      </div>
    );
  };

  // Render Active Jobs Tab Content
  const renderActiveContent = () => {
    if (selectedJob) {
      return (
        <JobDetailView
          job={selectedJob}
          onBack={handleBackToList}
          onStatusChange={handleStatusChange}
        />
      );
    }

    return (
      <div className="space-y-6">
        <ShipmentsTable
          jobs={filteredJobs}
          filteredJobs={filteredJobs}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onJobSelect={handleJobSelect}
          activeTab={activeTab}
        />
      </div>
    );
  };

  // Render History Tab Content
  const renderHistoryContent = () => {
    if (selectedJob) {
      return (
        <JobDetailView
          job={selectedJob}
          onBack={handleBackToList}
          onStatusChange={handleStatusChange}
        />
      );
    }

    return (
      <div className="space-y-6">
        <ShipmentsTable
          jobs={filteredJobs}
          filteredJobs={filteredJobs}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onJobSelect={handleJobSelect}
          activeTab={activeTab}
        />
      </div>
    );
  };

  // Render Manage Tab Content - Similar to Supplier's Manage Tab
  const renderManageContent = () => {
    // No shipment selected - show empty state with go to dashboard button
    if (!selectedShipment) {
      return (
        <div className={`border rounded-2xl p-12 text-center transition-colors duration-200 ${
          isDarkMode
            ? "bg-slate-900/50 border-slate-800"
            : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
            isDarkMode
              ? "bg-gradient-to-br from-slate-800 to-slate-700"
              : "bg-gradient-to-br from-slate-100 to-slate-200"
          }`}>
            <svg className={`w-10 h-10 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-slate-50" : "text-slate-900"}`}>
            No Shipment Selected
          </h3>
          <p className={`mb-6 max-w-sm mx-auto ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Select a shipment from the Dashboard or Active Jobs to view details and scan containers
          </p>
          <button
            onClick={() => setActiveTab("dashboard")}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-cyan-600 transition-all shadow-lg shadow-purple-500/25"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    // Shipment selected - show header card with actions + content area
    return (
      <div className="space-y-6">
        {/* Selected Shipment Header Card */}
        <div className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
          isDarkMode
            ? "bg-slate-900/50 border-slate-700/50"
            : "bg-white border-slate-200 shadow-sm"
        }`}>
          {/* Gradient Header Bar */}
          <div className="h-1.5 bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500" />

          <div className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Shipment Info */}
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20"
                    : "bg-gradient-to-br from-purple-100 to-cyan-100"
                }`}>
                  <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className={`text-lg font-bold font-mono ${isDarkMode ? "text-slate-50" : "text-slate-900"}`}>
                      {selectedShipment.batchId || selectedShipment.id}
                    </h2>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                      selectedShipment.status === 'Ready' || selectedShipment.status === 'READY_FOR_DISPATCH'
                        ? isDarkMode 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : selectedShipment.status === 'In Transit' || selectedShipment.status === 'IN_TRANSIT'
                          ? isDarkMode 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                          : isDarkMode 
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {selectedShipment.status}
                    </span>
                    {(selectedShipment.isLocked || selectedShipment.txHash) && (
                      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        On Chain
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-mono mb-2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    {selectedShipment.shipmentHash || selectedShipment.id}
                  </p>
                  <div className={`flex items-center gap-3 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className={`font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                        {selectedShipment.numberOfContainers || selectedShipment.containers?.length || 0}
                      </span>
                      containers
                    </span>
                    {selectedShipment.totalQuantity && (
                      <>
                        <span className={`w-1 h-1 rounded-full ${isDarkMode ? "bg-slate-600" : "bg-slate-300"}`} />
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold text-emerald-400">
                            {selectedShipment.totalQuantity}
                          </span>
                          units total
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 lg:shrink-0 flex-wrap">
                <button
                  onClick={() => setShowScanMode(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    !showScanMode
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                      : isDarkMode
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Details
                </button>
                <button
                  onClick={() => setShowScanMode(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    showScanMode
                      ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25"
                      : isDarkMode
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scan QR
                </button>
                <button
                  onClick={handleClearSelection}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors border ${
                    isDarkMode
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                      : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area - Show Details or Scanner */}
        {showScanMode ? (
          <TransporterScanPage 
            key={selectedShipment.shipmentHash || selectedShipment.id} 
            shipmentFilter={selectedShipment.shipmentHash} 
            shipmentData={selectedShipment}
          />
        ) : (
          <JobDetailView
            job={selectedShipment}
            onBack={handleClearSelection}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    );
  };

  // Render QR Scanner Tab Content
  const renderScanContent = () => (
    <TransporterScanPage />
  );

  return (
    <div className="flex flex-1">
      {/* Left Sidebar Navigation */}
      <LeftSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-6 overflow-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {tabContent.title}
            </h1>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              {tabContent.subtitle}
            </p>
          </div>
          {activeTab !== 'scan' && !(activeTab === 'manage' && showScanMode) && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm"
                }
                disabled:opacity-50
              `}
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          )}
        </div>

        {/* Tab Content */}
        {isLoading ? renderLoading() : error ? renderError() : (
          <>
            {activeTab === 'dashboard' && renderDashboardContent()}
            {activeTab === 'active' && renderActiveContent()}
            {activeTab === 'history' && renderHistoryContent()}
            {activeTab === 'manage' && renderManageContent()}
            {activeTab === 'scan' && renderScanContent()}
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
