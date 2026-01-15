import {
  BoxIcon,
  TruckIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "../icons/Icons";
import { SHIPMENT_STATUSES } from "../constants";
import { useAuth } from "../../../context/AuthContext";
import PendingShipmentRequests from "./PendingShipmentRequests";

const WarehouseOverview = ({ shipments, isDarkMode }) => {
  const { user } = useAuth();
  const username = user?.fullName || "Warehouse User";

  // Calculate stats - handle empty array safely
  const stats = {
    pending:
      shipments?.filter((s) => s.status === SHIPMENT_STATUSES.PENDING).length ||
      0,
    received:
      shipments?.filter((s) => s.status === SHIPMENT_STATUSES.RECEIVED)
        .length || 0,
    verified:
      shipments?.filter(
        (s) =>
          s.status === SHIPMENT_STATUSES.VERIFIED ||
          s.status === SHIPMENT_STATUSES.STORED
      ).length || 0,
    concerns:
      shipments?.filter((s) => s.status === SHIPMENT_STATUSES.CONCERN_RAISED)
        .length || 0,
    total: shipments?.length || 0,
  };

  const cards = [
    {
      label: "Pending Arrival",
      value: stats.pending,
      icon: TruckIcon,
      color: "amber",
      bgLight: "bg-amber-50",
      bgDark: "bg-amber-500/10",
      textLight: "text-amber-600",
      textDark: "text-amber-400",
      borderLight: "border-amber-200",
      borderDark: "border-amber-500/30",
    },
    {
      label: "Received",
      value: stats.received,
      icon: BoxIcon,
      color: "blue",
      bgLight: "bg-blue-50",
      bgDark: "bg-blue-500/10",
      textLight: "text-blue-600",
      textDark: "text-blue-400",
      borderLight: "border-blue-200",
      borderDark: "border-blue-500/30",
    },
    {
      label: "Verified & Stored",
      value: stats.verified,
      icon: CheckCircleIcon,
      color: "emerald",
      bgLight: "bg-emerald-50",
      bgDark: "bg-emerald-500/10",
      textLight: "text-emerald-600",
      textDark: "text-emerald-400",
      borderLight: "border-emerald-200",
      borderDark: "border-emerald-500/30",
    },
    {
      label: "Concerns",
      value: stats.concerns,
      icon: AlertTriangleIcon,
      color: "red",
      bgLight: "bg-red-50",
      bgDark: "bg-red-500/10",
      textLight: "text-red-600",
      textDark: "text-red-400",
      borderLight: "border-red-200",
      borderDark: "border-red-500/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Welcome, {username} 👋
        </h1>
        <p
          className={`text-sm mt-1 ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Here's what's happening with your warehouse today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`
                rounded-2xl p-5 border transition-all duration-200 hover:scale-[1.02]
                ${
                  isDarkMode
                    ? `${card.bgDark} ${card.borderDark}`
                    : `${card.bgLight} ${card.borderLight} shadow-sm`
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`
                  p-2 rounded-xl
                  ${isDarkMode ? card.bgDark : card.bgLight}
                `}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isDarkMode ? card.textDark : card.textLight
                    }`}
                  />
                </div>
              </div>
              <p
                className={`text-3xl font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                {card.value}
              </p>
              <p
                className={`text-sm mt-1 ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Pending Shipment Requests */}
      <PendingShipmentRequests />
    </div>
  );
};

export default WarehouseOverview;
