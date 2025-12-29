import { useState } from 'react';
import { SHIPMENT_STATUSES, STATUS_COLORS, CONCERN_STATUS, formatDate } from './supplier.constants';

const ITEMS_PER_PAGE = 10;

const ShipmentList = ({ shipments, selectedShipment, onShipmentSelect, isDarkMode = true }) => {
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredShipments = filter === 'all' 
    ? shipments 
    : shipments.filter(s => s.status === filter);

  // Pagination
  const totalPages = Math.ceil(filteredShipments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedShipments = filteredShipments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const statusFilters = [
    { value: 'all', label: 'All', count: shipments.length },
    ...Object.entries(SHIPMENT_STATUSES).map(([key, value]) => ({
      value,
      label: STATUS_COLORS[value]?.label || key,
      count: shipments.filter(s => s.status === value).length,
    })),
  ];

  return (
    <div className={`
      border rounded-2xl overflow-hidden transition-colors duration-200
      ${isDarkMode 
        ? 'bg-slate-900/50 border-slate-800' 
        : 'bg-white border-slate-200 shadow-sm'
      }
    `}>
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              Shipments
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Showing {paginatedShipments.length} of {filteredShipments.length} shipments
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map(({ value, label, count }) => (
              <button
                key={value}
                onClick={() => handleFilterChange(value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  filter === value 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25' 
                    : isDarkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === value 
                    ? 'bg-white/20' 
                    : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {paginatedShipments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
              <tr>
                <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Product
                </th>
                <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Batch ID
                </th>
                <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Quantity
                </th>
                <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Transporter
                </th>
                <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Status
                </th>
                <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Created
                </th>
                <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Concerns
                </th>
                <th className={`text-right text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginatedShipments.map((shipment) => {
                const statusStyle = STATUS_COLORS[shipment.status] || STATUS_COLORS.created;
                const openConcerns = shipment.concerns?.filter(c => 
                  c.status === CONCERN_STATUS.OPEN || c.status === CONCERN_STATUS.ACKNOWLEDGED
                ).length || 0;
                const isSelected = selectedShipment?.id === shipment.id;

                return (
                  <tr 
                    key={shipment.id}
                    className={`transition-colors ${
                      isSelected 
                        ? isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'
                        : isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                          {shipment.productName}
                        </p>
                        <p className={`text-xs font-mono truncate max-w-[120px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} title={shipment.id}>
                          {shipment.id.slice(0, 12)}...
                        </p>
                      </div>
                    </td>

                    {/* Batch ID */}
                    <td className="px-4 py-3">
                      <span className={`text-sm font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {shipment.batchId}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {shipment.quantity} {shipment.unit}
                      </span>
                    </td>

                    {/* Transporter */}
                    <td className="px-4 py-3">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {shipment.transporterName || (
                          <span className={isDarkMode ? 'text-slate-500 italic' : 'text-slate-400 italic'}>Not assigned</span>
                        )}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
                        {statusStyle.label}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {formatDate(shipment.createdAt)}
                      </span>
                    </td>

                    {/* Concerns */}
                    <td className="px-4 py-3">
                      {openConcerns > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {openConcerns}
                        </span>
                      ) : (
                        <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onShipmentSelect?.(shipment)}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'text-blue-400 hover:bg-blue-500/20'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Manage'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <svg className={`w-8 h-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>No shipments found</p>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Create your first shipment to get started</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`
          flex items-center justify-between px-4 py-3 border-t
          ${isDarkMode 
            ? 'border-slate-800 bg-slate-900/30' 
            : 'border-slate-200 bg-slate-50'
          }
        `}>
          <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${isDarkMode 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:hover:bg-slate-800' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:hover:bg-white'
                }
              `}
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-sm font-medium rounded-lg transition-all ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : isDarkMode 
                        ? 'text-slate-400 hover:bg-slate-700' 
                        : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${isDarkMode 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:hover:bg-slate-800' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:hover:bg-white'
                }
              `}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentList;
