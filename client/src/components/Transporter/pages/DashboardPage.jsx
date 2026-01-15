import { useState, useMemo } from "react";
import { useTransporterTheme } from "../context/ThemeContext";
import { StatsGrid } from "../components/StatsCard";
import ShipmentsTable from "../components/ShipmentsTable";
import { NavigationTabs, DashboardHeader } from "../components/NavigationTabs";
import JobDetailView from "../components/JobDetailView";
import { useTransporterShipments } from "../hooks/useTransporterShipments";

const DashboardPage = () => {
  const { isDarkMode } = useTransporterTheme();
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
    delayed: jobs.filter((j) => j.status === "At Warehouse").length, // Using At Warehouse as a comparable metric
  }), [jobs]);

  // Filter jobs based on tab and status
  const filteredJobs = useMemo(() => {
    let filtered = jobs;
    
    // Filter by active tab
    if (activeTab === 'active') {
      // Active jobs: Pending, Ready, In Transit
      filtered = jobs.filter((job) => 
        job.status === "Pending" || job.status === "Ready" || job.status === "In Transit"
      );
    } else if (activeTab === 'history') {
      // History: Delivered, At Warehouse (completed jobs)
      filtered = jobs.filter((job) => 
        job.status === "Delivered" || job.status === "At Warehouse"
      );
    }
    
    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }
    
    // Apply search filter
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

  // Get jobs count for current tab (for display)
  const tabJobsCount = useMemo(() => {
    if (activeTab === 'active') {
      return jobs.filter((job) => 
        job.status === "Pending" || job.status === "Ready" || job.status === "In Transit"
      ).length;
    } else if (activeTab === 'history') {
      return jobs.filter((job) => 
        job.status === "Delivered" || job.status === "At Warehouse"
      ).length;
    }
    return jobs.length;
  }, [jobs, activeTab]);

  // Get tab title and subtitle
  const getTabContent = () => {
    switch (activeTab) {
      case 'active':
        return {
          title: 'Active Jobs',
          subtitle: `${tabJobsCount} active shipment${tabJobsCount !== 1 ? 's' : ''} in progress`
        };
      case 'history':
        return {
          title: 'Shipment History',
          subtitle: `${tabJobsCount} completed shipment${tabJobsCount !== 1 ? 's' : ''}`
        };
      default:
        return {
          title: 'Shipments Overview',
          subtitle: `Monitor and manage ${jobs.length} shipment${jobs.length !== 1 ? 's' : ''}`
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

  // Loading state
  if (isLoading) {
    return (
      <>
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className={`animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-4 ${
                  isDarkMode 
                    ? 'border-blue-500 border-t-transparent' 
                    : 'border-blue-600 border-t-transparent'
                }`} />
                <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Loading shipments...
                </p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium text-sm hover:shadow-lg transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {selectedJob ? (
            <JobDetailView
              job={selectedJob}
              onBack={handleBackToList}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Dashboard Header */}
              <DashboardHeader
                title={tabContent.title}
                subtitle={tabContent.subtitle}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
              />

              {/* Stats Grid - Only show on dashboard tab */}
              {activeTab === 'dashboard' && <StatsGrid stats={stats} />}

              {/* Shipments Table */}
              <ShipmentsTable
                jobs={activeTab === 'dashboard' ? jobs : filteredJobs}
                filteredJobs={filteredJobs}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onJobSelect={handleJobSelect}
                activeTab={activeTab}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default DashboardPage;
