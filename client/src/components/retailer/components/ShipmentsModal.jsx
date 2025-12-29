/**
 * ShipmentsModal Component
 * Full-screen modal to display all received shipments
 */

import { useRetailerTheme } from '../context/ThemeContext';

function ShipmentsModal({ shipments = [], isOpen, onClose }) {
  const { isDarkMode } = useRetailerTheme();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        relative w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col border
        ${isDarkMode 
          ? 'bg-slate-900 border-slate-700/50 shadow-cyan-500/10' 
          : 'bg-white border-slate-200'
        }
      `}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`
              flex h-10 w-10 items-center justify-center rounded-xl border
              ${isDarkMode 
                ? 'bg-emerald-500/10 border-emerald-500/20' 
                : 'bg-emerald-100 border-emerald-200'
              }
            `}>
              <svg className={`h-5 w-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>All Received Shipments</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Shipments scanned and confirmed on blockchain</p>
            </div>
          </div>
          <button
            onClick={onClose}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shipments.map((shipment, index) => (
              <div 
                key={`modal-${shipment.id}-${index}`}
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
                      <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{shipment.exceptionNote}</p>
                    </div>
                  )}
                  {/* Blockchain TX Hash */}
                  <div className={`flex items-center gap-1.5 mt-2 pt-2 border-t ${isDarkMode ? 'border-slate-700/30' : 'border-slate-200'}`}>
                    <svg className={`h-3 w-3 ${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <code className={`text-[10px] font-mono truncate ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{shipment.txHash}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Total: <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{shipments.length}</span> shipments received
          </p>
          <button
            onClick={onClose}
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
  );
}

export default ShipmentsModal;
