import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import ShipmentTimeline from "../components/ShipmentTimeline";
import StatsCard from "../components/StatsCard";
import {
  SearchIcon,
  ShieldCheckIcon,
  BoxIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  TruckIcon,
  WarehouseIcon,
  BlockchainIcon,
  QRCodeIcon,
  EyeIcon,
  DocumentIcon,
  CheckCircleIcon,
  AlertIcon,
} from "../icons/Icons";

// Sample shipment data
const shipmentDetails = {
  id: "SHP-001234",
  product: "Premium Electronics Package",
  origin: "Shanghai, China",
  destination: "New York, USA",
  status: "in-transit",
  totalBoxes: 120,
  scannedBoxes: 95,
  createdAt: "2024-12-20T10:30:00",
  estimatedDelivery: "2024-12-28T15:00:00",
  transporter: "Global Express Logistics",
  blockchainTx: "0x7a8b9c...3f4e5d",
  supplier: "TechCorp Inc.",
};

const timelineEvents = [
  {
    type: "scan",
    title: "Box #95 scanned",
    description: "Scanned by John D. at Distribution Center",
    time: "2 hours ago",
  },
  {
    type: "location",
    title: "Location updated",
    description: "Shipment arrived at Los Angeles Port",
    time: "5 hours ago",
  },
  {
    type: "scan",
    title: "20 boxes verified",
    description: "Batch verification completed",
    time: "1 day ago",
  },
  {
    type: "status",
    title: "Status changed to In Transit",
    description: "Shipment departed from Shanghai",
    time: "3 days ago",
  },
];

const boxList = [
  {
    id: "BOX-001",
    status: "verified",
    scannedBy: "John D.",
    scannedAt: "2 hours ago",
  },
  {
    id: "BOX-002",
    status: "verified",
    scannedBy: "Sarah M.",
    scannedAt: "2 hours ago",
  },
  {
    id: "BOX-003",
    status: "verified",
    scannedBy: "John D.",
    scannedAt: "3 hours ago",
  },
  { id: "BOX-004", status: "pending", scannedBy: null, scannedAt: null },
  { id: "BOX-005", status: "pending", scannedBy: null, scannedAt: null },
];

const ShipmentTrackingPage = () => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "boxes", label: "Boxes" },
    { id: "history", label: "History" },
    { id: "documents", label: "Documents" },
  ];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div
        className={`
          rounded-2xl p-6
          ${
            isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
          }
        `}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h1
              className={`text-2xl font-bold tracking-tight ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Shipment Tracking
            </h1>
            <p
              className={`mt-1 text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Track shipments and verify product authenticity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl w-full md:w-80 transition-all duration-200
                ${
                  isDarkMode
                    ? "bg-slate-800/80 border border-slate-600/50 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20"
                    : "bg-white border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 shadow-sm"
                }
              `}
            >
              <SearchIcon
                className={`w-5 h-5 ${
                  isDarkMode ? "text-slate-400" : "text-slate-400"
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter shipment ID..."
                className={`
                  bg-transparent outline-none w-full text-sm
                  ${
                    isDarkMode
                      ? "text-white placeholder:text-slate-500"
                      : "text-slate-900 placeholder:text-slate-400"
                  }
                `}
              />
            </div>
            <button className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              Track
            </button>
          </div>
        </div>
      </div>

      {/* Shipment Details Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="xl:col-span-2 space-y-6">
          {/* Shipment Header Card */}
          <div
            className={`
              rounded-2xl p-6
              ${
                isDarkMode
                  ? "bg-slate-900/50 border border-slate-800/50"
                  : "bg-white border border-slate-200/50 shadow-sm"
              }
            `}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <TruckIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2
                    className={`text-2xl font-bold tracking-tight ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {shipmentDetails.id}
                  </h2>
                  <p
                    className={`text-sm mt-0.5 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {shipmentDetails.product}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full
                    ${
                      isDarkMode
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-green-50 border border-green-200"
                    }
                  `}
                >
                  <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                  <span
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    Blockchain Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Origin",
                  value: shipmentDetails.origin,
                  icon: MapPinIcon,
                },
                {
                  label: "Destination",
                  value: shipmentDetails.destination,
                  icon: MapPinIcon,
                },
                {
                  label: "Transporter",
                  value: shipmentDetails.transporter,
                  icon: TruckIcon,
                },
                {
                  label: "Est. Delivery",
                  value: "Dec 28, 2024",
                  icon: ClockIcon,
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl
                      ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}
                    `}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon
                        className={`w-4 h-4 ${
                          isDarkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-slate-500" : "text-slate-500"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Blockchain Info */}
            <div
              className={`
                mt-4 p-4 rounded-xl flex items-center justify-between
                ${
                  isDarkMode
                    ? "bg-slate-800/30 border border-slate-700/50"
                    : "bg-slate-50 border border-slate-200"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <BlockchainIcon
                  className={`w-5 h-5 ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <div>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    Transaction Hash
                  </p>
                  <p
                    className={`text-sm font-mono ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {shipmentDetails.blockchainTx}
                  </p>
                </div>
              </div>
              <button
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    isDarkMode
                      ? "text-blue-400 hover:bg-blue-500/10"
                      : "text-blue-600 hover:bg-blue-50"
                  }
                `}
              >
                <EyeIcon className="w-4 h-4" />
                View on Explorer
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            className={`
              rounded-2xl overflow-hidden
              ${
                isDarkMode
                  ? "bg-slate-900/50 border border-slate-800/50"
                  : "bg-white border border-slate-200/50 shadow-sm"
              }
            `}
          >
            <div
              className={`flex border-b ${
                isDarkMode ? "border-slate-800" : "border-slate-200"
              }`}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-4 text-sm font-medium transition-colors relative
                    ${
                      activeTab === tab.id
                        ? isDarkMode
                          ? "text-blue-400"
                          : "text-blue-600"
                        : isDarkMode
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-500 hover:text-slate-900"
                    }
                  `}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4
                        className={`font-medium ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        Scan Progress
                      </h4>
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {shipmentDetails.scannedBoxes} /{" "}
                        {shipmentDetails.totalBoxes} boxes
                      </span>
                    </div>
                    <div
                      className={`h-3 rounded-full overflow-hidden ${
                        isDarkMode ? "bg-slate-800" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{
                          width: `${
                            (shipmentDetails.scannedBoxes /
                              shipmentDetails.totalBoxes) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats using StatsCard component */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatsCard
                      title="Verified Boxes"
                      value="90"
                      subtitle="Successfully verified"
                      icon={CheckCircleIcon}
                      color="green"
                    />
                    <StatsCard
                      title="Pending Verification"
                      value="5"
                      subtitle="Awaiting scan"
                      icon={AlertIcon}
                      color="amber"
                    />
                    <StatsCard
                      title="Not Scanned"
                      value="25"
                      subtitle="Yet to be processed"
                      icon={BoxIcon}
                      color="blue"
                    />
                  </div>
                </div>
              )}

              {activeTab === "boxes" && (
                <div className="space-y-3">
                  {boxList.map((box) => (
                    <div
                      key={box.id}
                      className={`
                        flex items-center justify-between p-4 rounded-xl
                        ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                            w-10 h-10 rounded-lg flex items-center justify-center
                            ${
                              box.status === "verified"
                                ? isDarkMode
                                  ? "bg-green-500/10"
                                  : "bg-green-50"
                                : isDarkMode
                                ? "bg-slate-700"
                                : "bg-slate-200"
                            }
                          `}
                        >
                          <BoxIcon
                            className={`w-5 h-5 ${
                              box.status === "verified"
                                ? "text-green-500"
                                : isDarkMode
                                ? "text-slate-500"
                                : "text-slate-400"
                            }`}
                          />
                        </div>
                        <div>
                          <p
                            className={`font-medium ${
                              isDarkMode ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {box.id}
                          </p>
                          <p
                            className={`text-xs ${
                              isDarkMode ? "text-slate-500" : "text-slate-500"
                            }`}
                          >
                            {box.scannedBy
                              ? `Scanned by ${box.scannedBy}`
                              : "Not scanned yet"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {box.scannedAt && (
                          <span
                            className={`text-xs ${
                              isDarkMode ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            {box.scannedAt}
                          </span>
                        )}
                        <span
                          className={`
                            px-2.5 py-1 rounded-full text-xs font-medium
                            ${
                              box.status === "verified"
                                ? isDarkMode
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-green-50 text-green-600"
                                : isDarkMode
                                ? "bg-slate-700 text-slate-400"
                                : "bg-slate-200 text-slate-600"
                            }
                          `}
                        >
                          {box.status === "verified" ? "Verified" : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-4">
                  {timelineEvents.map((event, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div
                        className={`
                          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                          ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}
                        `}
                      >
                        {event.type === "scan" ? (
                          <QRCodeIcon
                            className={`w-5 h-5 ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          />
                        ) : event.type === "location" ? (
                          <MapPinIcon
                            className={`w-5 h-5 ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          />
                        ) : (
                          <ClockIcon
                            className={`w-5 h-5 ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {event.title}
                        </p>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-slate-500" : "text-slate-500"
                          }`}
                        >
                          {event.description}
                        </p>
                      </div>
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {event.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "documents" && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Bill of Lading",
                    "Customs Declaration",
                    "Packing List",
                    "Insurance",
                  ].map((doc, index) => (
                    <div
                      key={index}
                      className={`
                        p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-colors
                        ${
                          isDarkMode
                            ? "bg-slate-800/50 hover:bg-slate-800"
                            : "bg-slate-50 hover:bg-slate-100"
                        }
                      `}
                    >
                      <DocumentIcon
                        className={`w-8 h-8 ${
                          isDarkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      />
                      <div>
                        <p
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {doc}
                        </p>
                        <p
                          className={`text-xs ${
                            isDarkMode ? "text-slate-500" : "text-slate-500"
                          }`}
                        >
                          PDF • 2.4 MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Timeline */}
        <div className="xl:col-span-1">
          <ShipmentTimeline
            currentStage={shipmentDetails.status}
            events={timelineEvents}
            blockchainVerified={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ShipmentTrackingPage;
