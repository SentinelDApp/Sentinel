/**
 * WarehouseShipmentsTable Component
 * 
 * Displays shipments assigned to the warehouse with filtering and actions.
 * Similar to Transporter's ShipmentsTable.
 */

import { useState, useMemo } from 'react';
import { useWarehouseTheme } from '../context/ThemeContext';
import { 
  SHIPMENT_STATUSES, 
  STATUS_COLORS, 
  getStatusBadge, 
  getStatusLabel,
  canWarehouseScan,
  formatDateTime,
  getTimeAgo
} from '../constants';

const WarehouseShipmentsTable = ({ 
  shipments = [], 
  onShipmentSelect, 
  activeTab = 'dashboard',
  statusFilter = 'All',
  setStatusFilter = () => {}
}) => {
  const { isDarkMode } = useWarehouseTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter options based on active tab
  const filterOptions = useMemo(() => {
    if (activeTab === 'active') {
      return ['All', 'IN_TRANSIT', 'AT_WAREHOUSE'];
    } else if (activeTab === 'history') {
      return ['All', 'DELIVERED', 'READY_FOR_DISPATCH'];
    }
    return ['All', 'IN_TRANSIT', 'AT_WAREHOUSE', 'READY_FOR_DISPATCH', 'DELIVERED'];
  }, [activeTab]);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    let filtered = shipments;

    if (statusFilter !== 'All') {
      filtered = filtered.filter(s => s.status?.toUpperCase() === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.batchId?.toLowerCase().includes(query) ||
        s.shipmentHash?.toLowerCase().includes(query) ||
        s.id?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [shipments, statusFilter, searchQuery]);

  // Get row click handler
  const handleRowClick = (shipment) => {
    if (onShipmentSelect) {
      onShipmentSelect(shipment);
    }
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      isDarkMode 
        ? 'bg-slate-900/50 border-slate-700/50' 
        : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${
        isDarkMode ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {activeTab === 'active' ? 'Active Shipments' : 
               activeTab === 'history' ? 'Shipment History' : 
               'All Shipments'}
            </h3>
            <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {filteredShipments.length} shipment{filteredShipments.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-48 pl-9 pr-3 py-2 text-sm rounded-xl border transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              />
              <svg className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 text-sm rounded-xl border transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            >
              {filterOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All Status' : getStatusLabel(option)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredShipments.length === 0 ? (
        <div className="p-12 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
          }`}>
            <svg className={`w-8 h-8 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            No shipments found
          </h4>
          <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {searchQuery ? 'Try adjusting your search' : 'Shipments will appear here when assigned'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Batch ID
                </th>
                <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Containers
                </th>
                <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Quantity
                </th>
                <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Status
                </th>
                <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Created
                </th>
                <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {filteredShipments.map((shipment) => {
                const statusBadge = getStatusBadge(shipment.status);
                const canScan = canWarehouseScan(shipment.status?.toUpperCase());

                return (
                  <tr 
                    key={shipment.shipmentHash || shipment.id}
                    onClick={() => handleRowClick(shipment)}
                    className={`cursor-pointer transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-slate-800/50' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className={`font-mono font-medium text-sm ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {shipment.batchId || 'N/A'}
                        </p>
                        <p className={`text-xs font-mono truncate max-w-32 ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {shipment.shipmentHash?.slice(0, 16)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {shipment.numberOfContainers || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                        {shipment.totalQuantity || 0} units
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                        statusBadge.bg
                      } ${statusBadge.text} border ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {shipment.createdAt ? getTimeAgo(shipment.createdAt) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(shipment);
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            isDarkMode
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          View
                        </button>
                        {canScan && (
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                            isDarkMode 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-blue-50 text-blue-600'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            Scannable
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WarehouseShipmentsTable;
