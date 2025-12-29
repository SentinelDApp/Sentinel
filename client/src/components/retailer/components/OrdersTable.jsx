/**
 * OrdersTable Component
 * Shopkeeper-friendly orders table with history modal
 * Adjusts display count based on scanner state for balanced layout
 */
import { useState } from 'react';
import { useRetailerTheme } from '../context/ThemeContext';
import { DEMO_ORDERS, ORDER_STATUS_COLORS } from '../constants';

/**
 * OrdersTable Component
 * @param {Object} props
 * @param {boolean} props.expandedMode - When true, shows more orders to balance with expanded scanner
 */
function OrdersTable({ expandedMode = false }) {
  const { isDarkMode } = useRetailerTheme();
  const [showHistory, setShowHistory] = useState(false);
  
  // Show more orders when scanner is expanded (has result)
  const displayCount = expandedMode ? 5 : 3;
  const recentOrders = DEMO_ORDERS.slice(0, displayCount);

  // Get status styles based on theme
  const getStatusStyles = (status) => {
    if (status === 'Pending') {
      return isDarkMode 
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
        : 'bg-amber-50 text-amber-600 border-amber-200';
    } else if (status === 'In Delivery') {
      return isDarkMode 
        ? 'bg-blue-500/15 text-blue-300 border-blue-500/25'
        : 'bg-blue-50 text-blue-600 border-blue-200';
    } else if (status === 'Delivered') {
      return isDarkMode 
        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
        : 'bg-emerald-50 text-emerald-600 border-emerald-200';
    }
    return isDarkMode 
      ? 'bg-slate-500/15 text-slate-300 border-slate-500/25'
      : 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <>
      <section className={`
        rounded-2xl p-6 flex flex-col transition-colors border
        ${isDarkMode 
          ? 'bg-slate-900/60 backdrop-blur-sm border-slate-700/50 shadow-xl shadow-cyan-500/5' 
          : 'bg-white border-slate-200 shadow-sm'
        }
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent Orders</h2>
            <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Latest {displayCount} orders</p>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className={`
              flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all border
              ${isDarkMode 
                ? 'bg-slate-800/60 border-slate-600/40 text-slate-200 hover:bg-slate-700/50 hover:border-cyan-500/30' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }
            `}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Order History
          </button>
        </div>

        {/* Table */}
        <div className={`overflow-hidden rounded-xl flex-1 border ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <table className="min-w-full">
            <thead className={isDarkMode ? 'bg-slate-800/60' : 'bg-slate-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Order ID</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Product</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Customer</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
              {recentOrders.map((order) => {
                const styles = getStatusStyles(order.status);
                return (
                  <tr key={order.id} className={`transition-colors ${isDarkMode ? 'bg-slate-900/30 hover:bg-slate-800/50' : 'bg-white hover:bg-slate-50'}`}>
                    <td className="px-4 py-4">
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{order.id}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.product}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.customerName}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Showing <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{displayCount}</span> most recent
          </p>
          <button
            onClick={() => setShowHistory(true)}
            className={`text-xs font-semibold transition-colors flex items-center gap-1 ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
          >
            See all orders
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Order History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          />

          {/* Modal */}
          <div className={`
            relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col border
            ${isDarkMode 
              ? 'bg-slate-900 border-slate-700/50 shadow-cyan-500/10' 
              : 'bg-white border-slate-200'
            }
          `}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Order History</h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>All your past orders</p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className={`
                  flex h-9 w-9 items-center justify-center rounded-lg transition-colors
                  ${isDarkMode 
                    ? 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/50 hover:text-white' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                  }
                `}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
              <table className="min-w-full">
                <thead className={`sticky top-0 ${isDarkMode ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Order ID</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Product</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Customer</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Date</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                  {DEMO_ORDERS.map((order) => {
                    const styles = getStatusStyles(order.status);
                    return (
                      <tr key={order.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-3">
                          <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{order.id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.product}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.customerName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.date}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-4 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Total: <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{DEMO_ORDERS.length}</span> orders
              </p>
              <button
                onClick={() => setShowHistory(false)}
                className={`
                  rounded-xl px-5 py-2 text-sm font-medium transition-colors border
                  ${isDarkMode 
                    ? 'bg-slate-800/60 border-slate-600/40 text-slate-200 hover:bg-slate-700/50' 
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }
                `}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrdersTable;
