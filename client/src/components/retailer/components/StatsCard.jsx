/**
 * StatsCard Component
 * Four simple shopkeeper-friendly cards: products, stock, orders, shipments.
 * Supports both dark and light mode with gradient backgrounds.
 */

import { useRetailerTheme } from '../context/ThemeContext';
import { STORE_STATS } from '../constants';

function StatsCard() {
  const { isDarkMode } = useRetailerTheme();

  // Card configurations with light mode gradients
  const cardConfigs = {
    products: {
      iconBg: isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-100',
      iconColor: isDarkMode ? 'text-cyan-400' : 'text-cyan-600',
      cardBg: isDarkMode ? '' : 'bg-gradient-to-br from-cyan-50 to-blue-50',
    },
    stock: {
      iconBg: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100',
      iconColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      cardBg: isDarkMode ? '' : 'bg-gradient-to-br from-blue-50 to-indigo-50',
    },
    orders: {
      iconBg: isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100',
      iconColor: isDarkMode ? 'text-amber-400' : 'text-amber-600',
      cardBg: isDarkMode ? '' : 'bg-gradient-to-br from-amber-50 to-yellow-50',
    },
    shipments: {
      iconBg: isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100',
      iconColor: isDarkMode ? 'text-emerald-400' : 'text-emerald-600',
      cardBg: isDarkMode ? '' : 'bg-gradient-to-br from-emerald-50 to-green-50',
    },
  };

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STORE_STATS.map((item) => {
        const config = cardConfigs[item.id] || cardConfigs.products;
        
        return (
          <article
            key={item.id}
            className={`
              group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] border
              ${isDarkMode 
                ? 'bg-slate-900/60 backdrop-blur-sm border-slate-700/50 shadow-xl shadow-cyan-500/5 hover:border-cyan-500/30 hover:shadow-cyan-500/15' 
                : `${config.cardBg} border-slate-200 shadow-sm hover:shadow-lg`
              }
            `}
          >
            {/* Soft glow accent - only in dark mode */}
            {isDarkMode && (
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/10 blur-2xl opacity-60 group-hover:opacity-90 transition-opacity" />
            )}

            {/* Icon */}
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.iconBg}`}>
              <svg className={`h-5 w-5 ${config.iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
              </svg>
            </div>

            {/* Text */}
            <div className="mt-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.title}</p>
              <p className={`mt-1 text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
              <p className={`mt-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{item.description}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default StatsCard;
