import { useTransporterTheme } from "../context/ThemeContext";
import { ArrowRightIcon, TruckIcon } from "../icons/Icons";
import { STATUS_COLORS, STATUS_FILTERS } from "../constants/transporter.constants";

const ShipmentsTable = ({ jobs, filteredJobs, statusFilter, setStatusFilter, onJobSelect }) => {
  const { isDarkMode } = useTransporterTheme();

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
              Shipments
            </h2>
            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Showing {filteredJobs.length} of {jobs.length} shipments
            </p>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter === "All"
                  ? jobs.length
                  : jobs.filter((j) => j.status === filter).length;

              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${statusFilter === filter
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}>
              {["PRODUCT", "SHIPMENT ID", "QUANTITY", "ROUTE", "STATUS", "CREATED", "ACTION"].map(
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
            {filteredJobs.map((job) => (
              <tr
                key={job.id}
                className={`
                  transition-colors cursor-pointer
                  ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}
                `}
                onClick={() => onJobSelect(job)}
              >
                <td className="px-5 py-4">
                  <div>
                    <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {job.product}
                    </p>
                    <p
                      className={`text-xs mt-0.5 font-mono ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {job.id}
                    </p>
                  </div>
                </td>
                <td className={`px-5 py-4 text-sm font-mono ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {job.id}
                </td>
                <td className={`px-5 py-4 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  {job.expectedQuantity} items
                </td>
                <td className="px-5 py-4">
                  <div
                    className={`flex items-center gap-1.5 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                  >
                    <span className="truncate max-w-[80px]">{job.origin.split(" ")[0]}</span>
                    <ArrowRightIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[80px]">{job.dest.split(" ")[0]}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
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
                </td>
                <td className={`px-5 py-4 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {job.createdAt}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJobSelect(job);
                    }}
                    className={`
                      text-sm font-medium transition-colors
                      ${isDarkMode
                        ? "text-blue-400 hover:text-blue-300"
                        : "text-blue-600 hover:text-blue-700"
                      }
                    `}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredJobs.length === 0 && (
        <div className={`text-center py-16 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          <TruckIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            No Shipments Found
          </h3>
          <p className="text-sm">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};

export default ShipmentsTable;
