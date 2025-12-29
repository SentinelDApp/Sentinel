import { useState } from "react";
import { useTransporterTheme } from "../context/ThemeContext";
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  MapPinIcon,
  ClockIcon,
  BoxIcon,
  ThermometerIcon,
  DropletIcon,
  TruckIcon,
  UserIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon,
  CameraIcon,
} from "../icons/Icons";
import { STATUS_COLORS, CONDITION_OPTIONS } from "../constants/transporter.constants";

const JobDetailView = ({ job, onBack, onStatusChange }) => {
  const { isDarkMode } = useTransporterTheme();
  const [expanded, setExpanded] = useState({ pickup: true, delivery: false, cargo: true });
  const [verifiedQuantity, setVerifiedQuantity] = useState(job.expectedQuantity);
  const [selectedCondition, setSelectedCondition] = useState("good");
  const [notes, setNotes] = useState("");
  const [temperature] = useState(job.temperature || "-5°C");
  const [humidity] = useState(job.humidity || "45%");

  const toggleSection = (section) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleVerification = (accepted) => {
    onStatusChange(job.id, accepted ? "In Transit" : "Rejected");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={onBack}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${isDarkMode
              ? "text-slate-400 hover:text-white hover:bg-slate-800"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }
          `}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Shipments
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {job.product}
            </h1>
            <span
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                ${isDarkMode
                  ? `${STATUS_COLORS[job.status]?.bg} ${STATUS_COLORS[job.status]?.text} ${STATUS_COLORS[job.status]?.border}`
                  : `${STATUS_COLORS[job.status]?.lightBg} ${STATUS_COLORS[job.status]?.lightText} ${STATUS_COLORS[job.status]?.lightBorder}`
                }
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[job.status]?.dot}`} />
              {job.status}
            </span>
          </div>
          <p className={`text-sm mt-1 font-mono ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
            {job.id}
          </p>
        </div>
      </div>

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
                    <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{job.origin}</p>
                  </div>
                </div>
                <div className={`ml-5 w-px h-6 ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <MapPinIcon className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Destination</p>
                    <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{job.dest}</p>
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
                    <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{job.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                    <BoxIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Expected Quantity</p>
                    <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{job.expectedQuantity} items</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo Conditions */}
          <div
            className={`
              rounded-2xl border overflow-hidden transition-colors
              ${isDarkMode
                ? "bg-slate-900/50 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
              }
            `}
          >
            <button
              onClick={() => toggleSection("cargo")}
              className={`
                w-full flex items-center justify-between p-5 text-left transition-colors
                ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}
              `}
            >
              <h3 className={`text-sm font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                Cargo Conditions
              </h3>
              <ChevronDownIcon
                className={`w-5 h-5 transition-transform ${expanded.cargo ? "rotate-180" : ""} ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              />
            </button>
            {expanded.cargo && (
              <div className={`px-5 pb-5 border-t ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <ThermometerIcon className="w-4 h-4 text-blue-500" />
                      <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Temperature</span>
                    </div>
                    <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{temperature}</p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <DropletIcon className="w-4 h-4 text-cyan-500" />
                      <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Humidity</span>
                    </div>
                    <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{humidity}</p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <TruckIcon className="w-4 h-4 text-amber-500" />
                      <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Vehicle</span>
                    </div>
                    <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Truck A</p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <UserIcon className="w-4 h-4 text-purple-500" />
                      <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Driver</span>
                    </div>
                    <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>You</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Verification Panel */}
        <div className="space-y-4">
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
              Cargo Verification
            </h3>

            {/* Quantity */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Verified Quantity
              </label>
              <input
                type="number"
                value={verifiedQuantity}
                onChange={(e) => setVerifiedQuantity(Number(e.target.value))}
                className={`
                  w-full px-4 py-3 rounded-xl text-sm transition-colors
                  ${isDarkMode
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }
                  border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                `}
              />
            </div>

            {/* Condition */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Cargo Condition
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CONDITION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedCondition(opt.value)}
                    className={`
                      p-2 rounded-lg text-xs font-medium transition-all border
                      ${selectedCondition === opt.value
                        ? `${opt.bg} ${opt.text} ${opt.border}`
                        : isDarkMode
                          ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any observations..."
                className={`
                  w-full px-4 py-3 rounded-xl text-sm resize-none transition-colors
                  ${isDarkMode
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }
                  border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                `}
              />
            </div>

            {/* Photo Upload */}
            <button
              className={`
                w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed mb-4 transition-colors
                ${isDarkMode
                  ? "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-600"
                }
              `}
            >
              <CameraIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Upload Photo</span>
            </button>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleVerification(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 text-red-500 font-medium text-sm hover:bg-red-500/30 transition-colors"
              >
                <XCircleIcon className="w-5 h-5" />
                Reject
              </button>
              <button
                onClick={() => handleVerification(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Accept
              </button>
            </div>
          </div>

          {/* Quick Stats */}
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
              Quick Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Priority</span>
                <span className={`text-sm font-medium ${job.priority === "High" ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {job.priority || "Normal"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>ETA</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {job.eta || "2 hours"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Distance</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {job.distance || "45 km"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailView;
