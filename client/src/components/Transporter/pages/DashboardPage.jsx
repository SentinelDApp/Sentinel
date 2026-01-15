import { useState, useMemo, useCallback } from "react";
import { useTransporterTheme } from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { StatsGrid } from "../components/StatsCard";
import ShipmentsTable from "../components/ShipmentsTable";
import JobDetailView from "../components/JobDetailView";
import LeftSidebar from "../layout/LeftSidebar";
import { useTransporterShipments } from "../hooks/useTransporterShipments";
import QRScannerUI from "../../shared/QRScannerUI";

const DashboardPage = () => {
  const { isDarkMode } = useTransporterTheme();
  const { walletAddress } = useAuth();
  const { jobs, isLoading, error, refreshShipments, updateJobStatus } = useTransporterShipments();
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    setSelectedJob(job);
  };

  const handleBackToList = () => {
    setSelectedJob(null);
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

  // Render QR Scanner Tab Content
  const renderScanContent = () => (
    <div className="max-w-3xl">
      <div
        className={`
          border rounded-2xl p-6 transition-colors
          ${isDarkMode
            ? "bg-slate-900/50 border-slate-800"
            : "bg-white border-slate-200 shadow-sm"
          }
        `}
      >
        <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          QR Code Scanner
        </h2>
        
        <QRScannerUI
          role="transporter"
          walletAddress={walletAddress}
          onShipmentReceived={handleShipmentReceived}
          isDarkMode={isDarkMode}
        />

        {/* Scanner Instructions */}
        <div className={`mt-6 p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Scanner Instructions
          </h3>
          <ul className={`text-sm space-y-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">1.</span>
              Scan the shipment QR code to load expected items
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">2.</span>
              Scan each container QR code to verify contents
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">3.</span>
              Each scan is automatically confirmed on blockchain
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">4.</span>
              Report any exceptions for missing or damaged items
            </li>
          </ul>
        </div>
      </div>
    </div>
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
          {activeTab !== 'scan' && (
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
            {activeTab === 'scan' && renderScanContent()}
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
