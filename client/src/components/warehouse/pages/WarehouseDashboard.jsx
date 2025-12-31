import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import StatsCard from "../components/StatsCard";
import IncomingShipmentsTable from "../components/IncomingShipmentsTable";
import QRScanPanel from "../components/QRScanPanel";
import VerificationPanel from "../components/VerificationPanel";
import OutboundDispatchSection from "../components/OutboundDispatchSection";
import AlertsPanel from "../components/AlertsPanel";
import BlockchainActivityLog from "../components/BlockchainActivityLog";
import AnalyticsSnapshot from "../components/AnalyticsSnapshot";
import ShipmentDetailsPanel from "../components/ShipmentDetailsPanel";
import {
  ArrowDownTrayIcon,
  ClipboardCheckIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from "../icons/Icons";

const WarehouseDashboard = () => {
  const { isDarkMode } = useTheme();
  const [selectedShipment, setSelectedShipment] = useState(null);

  const stats = [
    {
      title: "Total Incoming",
      value: "0",
      subtitle: "Shipments today",
      icon: ArrowDownTrayIcon,
      color: "blue",
    },
    {
      title: "Pending Verifications",
      value: "0",
      subtitle: "Awaiting inspection",
      icon: ClipboardCheckIcon,
      color: "amber",
    },
    {
      title: "Dispatched",
      value: "0",
      subtitle: "Sent out today",
      icon: ArrowUpTrayIcon,
      color: "emerald",
    },
    {
      title: "Exceptions",
      value: "0",
      subtitle: "Requires attention",
      icon: ExclamationTriangleIcon,
      color: "red",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Warehouse Dashboard
          </h1>
          <p className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Monitor incoming shipments, verify goods, and manage dispatches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
            Last updated:
          </span>
          <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            {new Date().toLocaleTimeString()}
          </span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            trendValue={stat.trendValue}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Incoming Shipments & Details */}
        <div className="xl:col-span-2 space-y-6">
          {/* Incoming Shipments Table */}
          <IncomingShipmentsTable onSelectShipment={setSelectedShipment} />

          {/* Two Column Layout for QR Scan and Verification */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QRScanPanel />
            <VerificationPanel shipment={selectedShipment} />
          </div>

          {/* Outbound Dispatch */}
          <OutboundDispatchSection />
        </div>

        {/* Right Column - Details Panel, Alerts, Activity, Analytics */}
        <div className="space-y-6">
          {/* Shipment Details Panel (shown when shipment selected) */}
          {selectedShipment && (
            <ShipmentDetailsPanel
              shipment={selectedShipment}
              onClose={() => setSelectedShipment(null)}
            />
          )}

          {/* Alerts Panel */}
          <AlertsPanel />

          {/* Analytics Snapshot */}
          <AnalyticsSnapshot />

          {/* Blockchain Activity Log */}
          <BlockchainActivityLog />
        </div>
      </div>
    </div>
  );
};

export default WarehouseDashboard;
