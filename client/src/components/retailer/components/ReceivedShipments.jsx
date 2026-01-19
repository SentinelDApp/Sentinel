/**
 * ReceivedShipments Component
 * Displays shipments that are assigned to the retailer from database
 */

import { useRetailerTheme } from '../context/ThemeContext';

function ReceivedShipments({ shipments = [], onViewAll, isLoading = false, onManageShipment }) {
  const { isDarkMode } = useRetailerTheme();

  return (
    <section className={`
      rounded-2xl p-6 transition-colors border
      ${isDarkMode 
        ? 'bg-slate-900/60 backdrop-blur-sm border-slate-700/50 shadow-xl shadow-cyan-500/5' 
        : 'bg-white border-slate-200 shadow-sm'
      }
    `}>
      {isLoading ? (
        /* Loading State */
        <div className="text-center py-8">
          <div className={`
            flex h-14 w-14 mx-auto items-center justify-center rounded-2xl mb-4 border
            ${isDarkMode 
              ? 'bg-slate-800/60 border-slate-700/50' 
              : 'bg-slate-50 border-slate-200'
            }
          `}>
            <svg className={`h-7 w-7 animate-spin ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Loading shipments...</p>
        </div>
      ) : shipments.length === 0 ? (
        /* Empty State */
        <div className="text-center py-8">
          <div className={`
            flex h-14 w-14 mx-auto items-center justify-center rounded-2xl mb-4 border
            ${isDarkMode 
              ? 'bg-slate-800/60 border-slate-700/50' 
              : 'bg-slate-50 border-slate-200'
            }
          `}>
            <svg className={`h-7 w-7 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>No shipments assigned yet</p>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Shipments assigned to you will appear here</p>
        </div>
      ) : (
        /* Shipments Grid */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shipments.slice(0, 3).map((shipment, index) => (
              <div 
                key={`${shipment.id}-${index}`}
                className={`
                  flex items-start gap-4 p-4 rounded-xl transition-all border
                  ${shipment.hasException 
                    ? isDarkMode 
                      ? 'bg-slate-800/40 border-amber-500/30 hover:border-amber-500/50' 
                      : 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                    : isDarkMode 
                      ? 'bg-slate-800/40 border-slate-700/40 hover:border-emerald-500/30' 
                      : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                  }
                `}
              >
                <div className={`
                  flex h-12 w-12 items-center justify-center rounded-xl shrink-0 border
                  ${shipment.hasException 
                    ? isDarkMode 
                      ? 'bg-amber-500/10 border-amber-500/20' 
                      : 'bg-amber-100 border-amber-200'
                    : isDarkMode 
                      ? 'bg-emerald-500/10 border-emerald-500/20' 
                      : 'bg-emerald-100 border-emerald-200'
                  }
                `}>
                  <svg className={`h-6 w-6 ${shipment.hasException ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') : (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{shipment.productName || shipment.id}</p>
                    <span className={`
                      inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border
                      ${shipment.hasException 
                        ? isDarkMode 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                          : 'bg-amber-100 border-amber-200 text-amber-700'
                        : isDarkMode 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-emerald-100 border-emerald-200 text-emerald-700'
                      }
                    `}>
                      {shipment.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>From: {shipment.origin}</span>
                    <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>•</span>
                    <span className={`text-sm font-semibold ${shipment.hasException ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') : (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')}`}>
                      {shipment.itemCount}{shipment.expectedItems ? `/${shipment.expectedItems}` : ''} items
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{shipment.id}</span>
                    <div className="flex items-center gap-1">
                      <svg className={`h-3 w-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{shipment.receivedAt}</span>
                    </div>
                  </div>
                  {shipment.exceptionNote && (
                    <div className={`mt-2 px-2 py-1 rounded-md border ${isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                      <p className={`text-xs truncate ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{shipment.exceptionNote}</p>
                    </div>
                  )}
                  {/* Manage Button */}
                  {onManageShipment && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onManageShipment(shipment);
                      }}
                      className={`
                        mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all
                        ${isDarkMode 
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
                        }
                      `}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Manage
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* View All Link */}
          {shipments.length > 3 && onViewAll && (
            <div className="mt-4 flex justify-end">
              <button 
                onClick={onViewAll}
                className={`text-xs font-semibold transition-colors flex items-center gap-1 ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
              >
                View all {shipments.length} shipments
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ReceivedShipments;
