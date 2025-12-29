import { useState, useEffect, useMemo } from "react";
import { useTransporterTheme } from "../context/ThemeContext";
import { StatsGrid } from "../components/StatsCard";
import ShipmentsTable from "../components/ShipmentsTable";
import { NavigationTabs, DashboardHeader } from "../components/NavigationTabs";
import JobDetailView from "../components/JobDetailView";
import { MOCK_JOBS } from "../constants/transporter.constants";

const DashboardPage = () => {
  const { isDarkMode } = useTransporterTheme();
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate stats
  const stats = useMemo(() => ({
    total: jobs.length,
    new: jobs.filter((j) => j.status === "Pending").length,
    inTransit: jobs.filter((j) => j.status === "In Transit").length,
    delayed: jobs.filter((j) => j.status === "Delayed").length,
  }), [jobs]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "All" || job.status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        job.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.dest.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [jobs, statusFilter, searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleStatusChange = (jobId, newStatus) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: newStatus } : job
      )
    );
    setSelectedJob(null);
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
  };

  const handleBackToList = () => {
    setSelectedJob(null);
  };

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
                title="Shipments Overview"
                subtitle="Monitor and manage all your active shipments"
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
              />

              {/* Stats Grid */}
              <StatsGrid stats={stats} />

              {/* Shipments Table */}
              <ShipmentsTable
                jobs={jobs}
                filteredJobs={filteredJobs}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onJobSelect={handleJobSelect}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default DashboardPage;
