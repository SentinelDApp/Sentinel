/**
 * ConcernsView Component
 *
 * Standalone component to display concerns for a shipment.
 * Shows summary statistics and detailed list of all concerns.
 */

import { CONCERN_STATUS, CONCERN_TYPE_LABELS } from "../constants";

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ConcernsView = ({ shipment, onClose, isDarkMode = true }) => {
  if (!shipment) return null;

  const concerns = shipment.concerns || [];

  // Count concerns by status
  const openConcerns = concerns.filter((c) => c.status === CONCERN_STATUS.OPEN);
  const acknowledgedConcerns = concerns.filter(
    (c) => c.status === CONCERN_STATUS.ACKNOWLEDGED
  );
  const resolvedConcerns = concerns.filter(
    (c) => c.status === CONCERN_STATUS.RESOLVED
  );

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
        isDarkMode
          ? "bg-slate-900/50 border-slate-800"
          : "bg-white border-slate-200 shadow-sm"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          isDarkMode
            ? "border-slate-800 bg-slate-800/50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDarkMode ? "bg-amber-500/20" : "bg-amber-100"
              }`}
            >
              <svg
                className="w-5 h-5 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-slate-100" : "text-slate-800"
                }`}
              >
                Concerns
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {shipment.productName} • {shipment.batchId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-slate-200 text-slate-500"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {concerns.length === 0 ? (
          <div className="text-center py-12">
            <div
              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-slate-700" : "bg-slate-200"
              }`}
            >
              <svg
                className={`w-10 h-10 ${
                  isDarkMode ? "text-green-400" : "text-green-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h4
              className={`font-medium mb-2 ${
                isDarkMode ? "text-slate-200" : "text-slate-700"
              }`}
            >
              No Concerns
            </h4>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              No concerns have been raised for this shipment
            </p>
          </div>
        ) : (
          <>
            {/* Concerns Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <span className="text-3xl font-bold text-red-400">
                  {openConcerns.length}
                </span>
                <p className="text-sm text-red-300 mt-1">Open</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                <span className="text-3xl font-bold text-amber-400">
                  {acknowledgedConcerns.length}
                </span>
                <p className="text-sm text-amber-300 mt-1">Acknowledged</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <span className="text-3xl font-bold text-green-400">
                  {resolvedConcerns.length}
                </span>
                <p className="text-sm text-green-300 mt-1">Resolved</p>
              </div>
            </div>

            {/* Concerns List */}
            <div className="space-y-3">
              {concerns.map((concern, idx) => {
                const concernLabel =
                  CONCERN_TYPE_LABELS[concern.type] || concern.type;
                const statusColors = {
                  [CONCERN_STATUS.OPEN]:
                    "bg-red-500/20 text-red-400 border-red-500/30",
                  [CONCERN_STATUS.ACKNOWLEDGED]:
                    "bg-amber-500/20 text-amber-400 border-amber-500/30",
                  [CONCERN_STATUS.RESOLVED]:
                    "bg-green-500/20 text-green-400 border-green-500/30",
                };

                return (
                  <div
                    key={idx}
                    className={`border rounded-xl p-4 ${
                      isDarkMode
                        ? "bg-slate-800/50 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <span
                          className={`font-semibold ${
                            isDarkMode ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          {concernLabel}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-medium ${
                          statusColors[concern.status]
                        }`}
                      >
                        {concern.status}
                      </span>
                    </div>
                    <p
                      className={`text-sm mb-3 ${
                        isDarkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {concern.description}
                    </p>
                    <div
                      className={`flex items-center gap-4 text-xs ${
                        isDarkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {concern.raisedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatDate(concern.raisedAt)}
                      </span>
                    </div>
                    {concern.resolution && (
                      <div
                        className={`mt-3 pt-3 border-t ${
                          isDarkMode ? "border-slate-700" : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-4 h-4 text-green-400 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            {concern.resolution}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConcernsView;
