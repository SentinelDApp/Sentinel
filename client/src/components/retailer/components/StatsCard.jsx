/**
 * StatsCard Component
 * Four warehouse-style stats cards: Pending Arrival, Received, Verified & Stored, Concerns.
 * Matches the warehouse dashboard design with colored gradients.
 */

import { useRetailerTheme } from '../context/ThemeContext';
import { STORE_STATS } from '../constants';

// Icons for each stat type
const StatIcons = {
  pending: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  received: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  verified: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  concerns: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

// Color configurations for each stat type
const colorConfigs = {
  amber: {
    bg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    border: 'border-amber-500/30',
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
  },
  blue: {
    bg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    border: 'border-blue-500/30',
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
  },
  emerald: {
    bg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
  },
  rose: {
    bg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    border: 'border-rose-500/30',
    gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
  },
};

function StatsCard({ stats }) {
  const { isDarkMode } = useRetailerTheme();
  const displayStats = stats || STORE_STATS;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {displayStats.map((item) => {
        const colors = colorConfigs[item.color] || colorConfigs.blue;
        const Icon = StatIcons[item.id];
        
        return (
          <article
            key={item.id}
            className={`
              group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 border
              ${isDarkMode 
                ? `bg-gradient-to-br ${colors.gradient} backdrop-blur-sm border-slate-700/50 hover:${colors.border}` 
                : 'bg-white border-slate-200 shadow-sm hover:shadow-lg'
              }
            `}
          >
            {/* Icon */}
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.bg}`}>
              <div className={colors.iconColor}>
                {Icon}
              </div>
            </div>

            {/* Value & Text */}
            <div className="mt-4">
              <p className={`mt-1 text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {item.value}
              </p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {item.title}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default StatsCard;
