/**
 * Header Component
 * Retailer Dashboard header for Sentinel blockchain supply chain system.
 * Role-specific for retailers: receiving shipments, verifying products, fulfilling orders.
 */

// Primary retailer actions
const primaryActions = [
  { 
    id: 'accept', 
    label: 'Accept Shipment', 
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    primary: true 
  },
  { 
    id: 'received', 
    label: 'View Received', 
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    primary: false 
  },
  { 
    id: 'orders', 
    label: 'View Orders', 
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    primary: false 
  },
]

/**
 * Header Component
 * @param {Object} props
 * @param {Function} props.onAcceptShipment - Callback when Accept Shipment is clicked
 * @param {Function} props.onViewReceived - Callback when View Received is clicked
 * @param {Function} props.onViewOrders - Callback when View Orders is clicked
 */
function Header({ onAcceptShipment, onViewReceived, onViewOrders }) {
  // Handle action button clicks
  const handleActionClick = (actionId) => {
    switch (actionId) {
      case 'accept':
        if (onAcceptShipment) onAcceptShipment()
        break
      case 'received':
        if (onViewReceived) onViewReceived()
        break
      case 'orders':
        if (onViewOrders) onViewOrders()
        break
      default:
        break
    }
  }

  return (
    <header className="rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-700/50 shadow-lg shadow-cyan-500/5 overflow-hidden">
      {/* Top Bar - Dashboard Branding */}
      <div className="border-b border-slate-700/50 bg-slate-900/40 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/20">
              <svg className="h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Sentinel</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-medium text-slate-400">Retailer Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Blockchain Connected
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="px-6 py-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          
          {/* LEFT SECTION - Retailer Identity & Trust */}
          <div className="flex items-start gap-4 min-w-fit">
            {/* Store Icon with Verification Glow */}
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              {/* Verified Badge */}
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Store Details */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Alim Store</h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                  <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-400 font-mono">RET-2024-0847</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Mumbai, Maharashtra
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Receive shipments · Verify products · Fulfill orders</p>
            </div>
          </div>

          {/* RIGHT SECTION - Primary Retailer Actions */}
          <div className="flex items-center gap-3">
            {primaryActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                className={`group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  action.primary
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02]'
                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <svg className={`h-4 w-4 ${action.primary ? 'text-white' : 'text-cyan-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar - Blockchain Accountability Indicator */}
      <div className="border-t border-slate-700/50 bg-slate-900/40 px-6 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Last Wallet Action */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Last Signed Action</span>
                <span className="text-xs text-slate-300 font-medium">Product Verified · SKU-78432</span>
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-700/50"></div>
            <div className="hidden sm:flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-slate-400">2 minutes ago</span>
            </div>
          </div>

          {/* Wallet Address (truncated) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Wallet:</span>
            <code className="text-[11px] text-cyan-400/80 font-mono bg-slate-800/50 px-2 py-0.5 rounded">0x7a3d...f829</code>
            <div className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Connected"></div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
