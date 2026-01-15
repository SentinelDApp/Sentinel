/**
 * QRCodesView Component
 *
 * Standalone component to display QR codes for all containers in a shipment.
 * Wraps the ContainerQRGrid with a header and close functionality.
 */

import ContainerQRGrid from "./ContainerQRGrid";

const QRCodesView = ({ shipment, onClose, isDarkMode = true }) => {
  if (!shipment) return null;

  const containers = shipment.containers || [];

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
                isDarkMode ? "bg-emerald-500/20" : "bg-emerald-100"
              }`}
            >
              <svg
                className="w-5 h-5 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-slate-100" : "text-slate-800"
                }`}
              >
                QR Codes
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {shipment.productName} • {containers.length} containers
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
      <div className="p-4">
        {containers.length === 0 ? (
          <div className="text-center py-12">
            <div
              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-slate-700" : "bg-slate-200"
              }`}
            >
              <svg
                className={`w-10 h-10 ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h4
              className={`font-medium mb-2 ${
                isDarkMode ? "text-slate-200" : "text-slate-700"
              }`}
            >
              No Containers
            </h4>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              This shipment has no containers yet
            </p>
          </div>
        ) : (
          <ContainerQRGrid containers={containers} isDarkMode={isDarkMode} />
        )}
      </div>
    </div>
  );
};

export default QRCodesView;
