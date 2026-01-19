/**
 * RetailerShipmentsTable Component
 * 
 * Table-based display for retailer's incoming shipments
 * Similar to TransporterShipmentsTable for consistent UI pattern
 */

import { useRetailerTheme } from "../context/ThemeContext";

// Status Colors for shipments - matching actual DB statuses
const STATUS_COLORS = {
  'Pending': {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    lightBg: 'bg-slate-100',
    lightText: 'text-slate-600',
    lightBorder: 'border-slate-200',
    dot: 'bg-slate-500',
  },
  'Ready': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    lightBg: 'bg-cyan-50',
    lightText: 'text-cyan-600',
    lightBorder: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
  'In Transit': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-600',
    lightBorder: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  'At Warehouse': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-600',
    lightBorder: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  'Delivered': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    lightBg: 'bg-emerald-50',
    lightText: 'text-emerald-600',
    lightBorder: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

// Icons
const ArrowRightIcon = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const PackageIcon = ({ className = "w-16 h-16" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

// Status filters matching actual DB statuses
const STATUS_FILTERS = ['All', 'Pending', 'Ready', 'In Transit', 'At Warehouse', 'Delivered'];

const RetailerShipmentsTable = ({ 
  shipments = [], 
  filteredShipments = null,
  statusFilter = 'All', 
  setStatusFilter = () => {}, 
  onShipmentSelect,
  isLoading = false 
}) => {
  const { isDarkMode } = useRetailerTheme();

  // Use provided filtered shipments or filter locally
  const displayShipments = filteredShipments || (
    statusFilter === 'All' 
      ? shipments 
      : shipments.filter(s => s.status === statusFilter)
  );

  return (
    <div
      className={`
        rounded-2xl border transition-colors duration-200 overflow-hidden
        ${isDarkMode
          ? "bg-slate-900/50 border-slate-800"
          : "bg-white border-slate-200 shadow-sm"
        }
      `}
    >
      {/* Header */}
      <div className={`px-5 py-4 border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Incoming Shipments
            </h2>
            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              {isLoading ? "Loading..." : `Showing ${displayShipments.length} of ${shipments.length} shipments`}
            </p>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter === "All"
                  ? shipments.length
                  : shipments.filter((s) => s.status === filter).length;

              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${statusFilter === filter
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                      : isDarkMode
                        ? "bg-slate-800 text-slate-400 hover:text-slate-200"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900"
                    }
                  `}
                >
                  {filter}
                  <span
                    className={`
                      text-xs px-1.5 py-0.5 rounded-full
                      ${statusFilter === filter
                        ? "bg-white/20"
                        : isDarkMode
                          ? "bg-slate-700"
                          : "bg-slate-200"
                      }
                    `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Loading shipments...</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && displayShipments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}>
                {["PRODUCT", "SHIPMENT ID", "QUANTITY", "ROUTE", "STATUS", "ASSIGNED", "ACTION"].map(
                  (header) => (
                    <th
                      key={header}
                      className={`
                        px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider
                        ${isDarkMode ? "text-slate-400" : "text-slate-500"}
                      `}
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-slate-800" : "divide-slate-100"}`}>
              {displayShipments.map((shipment) => {
                // Handle potential missing status colors gracefully
                const statusStyle = STATUS_COLORS[shipment.status] || {
                  bg: 'bg-slate-500/10',
                  text: 'text-slate-400',
                  border: 'border-slate-500/30',
                  lightBg: 'bg-slate-100',
                  lightText: 'text-slate-600',
                  lightBorder: 'border-slate-200',
                  dot: 'bg-slate-500',
                };
                
                return (
                  <tr
                    key={shipment.id || shipment.shipmentHash}
                    className={`
                      transition-colors cursor-pointer
                      ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}
                    `}
                    onClick={() => onShipmentSelect && onShipmentSelect(shipment)}
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                          {shipment.productName || `Batch ${shipment.batchId}`}
                        </p>
                        <p
                          className={`text-xs mt-0.5 font-mono ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                        >
                          {shipment.batchId || shipment.id?.slice(0, 12) + '...'}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className={`text-sm font-mono truncate max-w-[120px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`} title={shipment.shipmentHash || shipment.id}>
                          {(shipment.shipmentHash || shipment.id)?.slice(0, 12)}...
                        </p>
                        {shipment.isLocked && (
                          <span className="text-xs text-emerald-500">🔗 On-chain</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-5 py-4 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      <div>
                        <p>{shipment.itemCount || shipment.numberOfContainers || 0} containers</p>
                        {shipment.totalQuantity && (
                          <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                            {shipment.totalQuantity} items
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div
                        className={`flex items-center gap-1.5 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                      >
                        <span className="truncate max-w-[80px]">{(shipment.origin || 'Origin').split(" ")[0]}</span>
                        <ArrowRightIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[80px]">You</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
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
                        {shipment.status}
                      </span>
                    </td>
                    <td className={`px-5 py-4 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {shipment.assignedAt || shipment.createdAt || 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShipmentSelect && onShipmentSelect(shipment);
                        }}
                        className={`
                          text-sm font-medium transition-colors
                          ${isDarkMode
                            ? "text-emerald-400 hover:text-emerald-300"
                            : "text-emerald-600 hover:text-emerald-700"
                          }
                        `}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayShipments.length === 0 && (
        <div className={`text-center py-16 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          <PackageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            No Shipments Found
          </h3>
          <p className="text-sm">
            {statusFilter !== 'All' 
              ? 'Try adjusting your filter to see more shipments.'
              : 'No shipments have been assigned to you yet.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default RetailerShipmentsTable;
