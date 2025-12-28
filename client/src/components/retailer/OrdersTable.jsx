/**
 * OrdersTable Component
 * Shopkeeper-friendly orders table with history modal
 * Adjusts display count based on scanner state for balanced layout
 */
import { useState } from 'react'

// All orders data
const allOrders = [
  { id: 'ORD-1045', customerName: 'Ayesha Khan', product: 'Basmati Rice (5kg)', status: 'Pending', date: 'Today' },
  { id: 'ORD-1044', customerName: 'Rohit Sharma', product: 'Sunflower Oil (1L)', status: 'In Delivery', date: 'Today' },
  { id: 'ORD-1043', customerName: 'Meera Patel', product: 'Toothpaste', status: 'Delivered', date: 'Today' },
  { id: 'ORD-1042', customerName: 'Arjun Singh', product: 'Tea Pack (500g)', status: 'Delivered', date: 'Yesterday' },
  { id: 'ORD-1041', customerName: 'Sara Ali', product: 'Hand Soap', status: 'Delivered', date: 'Yesterday' },
  { id: 'ORD-1040', customerName: 'Vikram Mehta', product: 'Coffee Powder', status: 'Delivered', date: '2 days ago' },
  { id: 'ORD-1039', customerName: 'Priya Nair', product: 'Sugar (1kg)', status: 'Delivered', date: '2 days ago' },
  { id: 'ORD-1038', customerName: 'Anil Kumar', product: 'Milk Powder', status: 'Delivered', date: '3 days ago' },
]

const statusStyles = {
  Pending: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  'In Delivery': 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  Delivered: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
}

/**
 * OrdersTable Component
 * @param {Object} props
 * @param {boolean} props.expandedMode - When true, shows more orders to balance with expanded scanner
 */
function OrdersTable({ expandedMode = false }) {
  const [showHistory, setShowHistory] = useState(false)
  
  // Show more orders when scanner is expanded (has result)
  const displayCount = expandedMode ? 5 : 3
  const recentOrders = allOrders.slice(0, displayCount)

  return (
    <>
      <section className="rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 p-6 shadow-xl shadow-cyan-500/5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
            <p className="text-sm text-slate-400 mt-0.5">Latest {displayCount} orders</p>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-800/60 border border-slate-600/40 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700/50 hover:border-cyan-500/30 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Order History
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-700/50 flex-1">
          <table className="min-w-full">
            <thead className="bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-white">{order.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-slate-300">{order.product}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-slate-300">{order.customerName}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing <span className="font-medium text-slate-300">{displayCount}</span> most recent
          </p>
          <button
            onClick={() => setShowHistory(true)}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
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
          <div className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/50 shadow-2xl shadow-cyan-500/10 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <div>
                <h3 className="text-lg font-semibold text-white">Order History</h3>
                <p className="text-sm text-slate-400">All your past orders</p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
              <table className="min-w-full">
                <thead className="bg-slate-800/60 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {allOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{order.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-300">{order.product}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-300">{order.customerName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-400">{order.date}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Total: <span className="font-medium text-slate-300">{allOrders.length}</span> orders
              </p>
              <button
                onClick={() => setShowHistory(false)}
                className="rounded-xl bg-slate-800/60 border border-slate-600/40 px-5 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default OrdersTable
