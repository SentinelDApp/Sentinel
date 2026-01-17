import { useTransporterTheme } from "../context/ThemeContext";
import {
  ChevronLeftIcon,
  MapPinIcon,
  ClockIcon,
  BoxIcon,
} from "../icons/Icons";
import { STATUS_COLORS } from "../constants/transporter.constants";

const JobDetailView = ({ job, onBack }) => {
  const { isDarkMode } = useTransporterTheme();
  
  // Handle status colors gracefully
  const statusStyle = STATUS_COLORS[job.status] || {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    lightBg: 'bg-slate-100',
    lightText: 'text-slate-600',
    lightBorder: 'border-slate-200',
    dot: 'bg-slate-500',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Route Card */}
          <div
            className={`
              rounded-2xl border p-5 transition-colors
              ${isDarkMode
                ? "bg-slate-900/50 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
              }
            `}
          >
            <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              Route Information
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <MapPinIcon className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Origin</p>
                    <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{job.origin || 'Supplier Warehouse'}</p>
                  </div>
                </div>
                <div className={`ml-5 w-px h-6 ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <MapPinIcon className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Destination</p>
                    <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{job.dest || 'Destination'}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                    <ClockIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Created</p>
                    <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{job.createdAt || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                    <BoxIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Expected Quantity</p>
                    <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {job.expectedQuantity || 0} items
                      {job.numberOfContainers > 0 && (
                        <span className={`text-sm ml-2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                          ({job.numberOfContainers} containers)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Details Card */}
          <div
            className={`
              rounded-2xl border p-5 transition-colors
              ${isDarkMode
                ? "bg-slate-900/50 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
              }
            `}
          >
            <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              Shipment Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Batch ID</p>
                <p className={`font-medium font-mono ${isDarkMode ? "text-white" : "text-slate-900"}`}>{job.batchId || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Containers</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{job.numberOfContainers || 0}</p>
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Qty per Container</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{job.quantityPerContainer || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Blockchain Status</p>
                <p className={`font-medium ${job.isLocked ? "text-emerald-500" : isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                  {job.isLocked ? "✓ Verified" : "Pending"}
                </p>
              </div>
            </div>
            {job.txHash && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Transaction Hash</p>
                <p className={`font-mono text-xs truncate ${isDarkMode ? "text-slate-400" : "text-slate-600"}`} title={job.txHash}>
                  {job.txHash}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-4">
          {/* Shipment Status Card */}
          <div
            className={`
              rounded-2xl border p-5 transition-colors
              ${isDarkMode
                ? "bg-slate-900/50 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
              }
            `}
          >
            <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              Shipment Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Status</span>
                <span
                  className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                    ${isDarkMode
                      ? `${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`
                      : `${statusStyle.lightBg} ${statusStyle.lightText} ${statusStyle.lightBorder}`
                    }
                  `}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  {job.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Total Quantity</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {job.expectedQuantity || 0} items
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Containers</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {job.numberOfContainers || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          {job.supplierWallet && (
            <div
              className={`
                rounded-2xl border p-5 transition-colors
                ${isDarkMode
                  ? "bg-slate-900/50 border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
                }
              `}
            >
              <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                Supplier
              </h3>
              <p className={`font-mono text-xs truncate ${isDarkMode ? "text-slate-400" : "text-slate-600"}`} title={job.supplierWallet}>
                {job.supplierWallet}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailView;
