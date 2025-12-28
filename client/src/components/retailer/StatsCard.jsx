/**
 * StatsCard
 * Four simple shopkeeper-friendly cards: products, stock, orders, shipments.
 */

const stats = [
  {
    id: 'products',
    title: 'Total Products',
    description: 'Items available in your shop',
    value: '248',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'stock',
    title: 'Stock Available',
    description: 'Total quantity in store',
    value: '1,920',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    ),
  },
  {
    id: 'orders',
    title: 'Orders Pending',
    description: 'Orders waiting to be delivered',
    value: '17',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    id: 'shipments',
    title: 'Shipments Coming',
    description: 'Products arriving soon',
    value: '6',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 104 0m-4 0a2 2 0 114 0m6-10l2 2v6a2 2 0 01-2 2h-1m-6-1h6M3 5h11a2 2 0 012 2v10H3V5z" />
      </svg>
    ),
  },
]

function StatsCard() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <article
          key={item.id}
          className="group relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 p-5 shadow-xl shadow-cyan-500/5 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-cyan-500/15"
        >
          {/* Soft glow accent */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-linear-to-br from-cyan-500/20 to-blue-600/10 blur-2xl opacity-60 group-hover:opacity-90 transition-opacity" />

          {/* Icon */}
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
            {item.icon}
          </div>

          {/* Text */}
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-300">{item.title}</p>
            <p className="mt-1 text-3xl font-bold text-white tracking-tight">{item.value}</p>
            <p className="mt-2 text-xs text-slate-500">{item.description}</p>
          </div>
        </article>
      ))}
    </section>
  )
}

export default StatsCard
