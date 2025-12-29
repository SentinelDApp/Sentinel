import { useState } from 'react';
import { 
  TRANSPORTER_AGENCIES, 
  SHIPMENT_STATUSES, 
  CONCERN_STATUS,
  CONCERN_TYPE_LABELS,
  CONCERN_STATUS_COLORS,
  formatDate,
} from './supplier.constants';

const ShipmentActions = ({ 
  shipment, 
  onAssignTransporter, 
  onMarkReady,
  onAcknowledgeConcern,
  onResolveConcern,
  isDarkMode = true,
}) => {
  const [selectedTransporter, setSelectedTransporter] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [activeTab, setActiveTab] = useState('actions');

  if (!shipment) {
    return (
      <div className={`
        border rounded-2xl p-6 transition-colors duration-200
        ${isDarkMode 
          ? 'bg-slate-900/50 border-slate-800' 
          : 'bg-white border-slate-200 shadow-sm'
        }
      `}>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
          Shipment Actions
        </h2>
        <p className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Select a shipment to view actions
        </p>
      </div>
    );
  }

  const isCreated = shipment.status === SHIPMENT_STATUSES.CREATED;
  const hasConcerns = shipment.concerns && shipment.concerns.length > 0;
  const openConcerns = shipment.concerns?.filter(c => c.status === CONCERN_STATUS.OPEN) || [];
  const acknowledgedConcerns = shipment.concerns?.filter(c => c.status === CONCERN_STATUS.ACKNOWLEDGED) || [];
  const currentTransporter = TRANSPORTER_AGENCIES.find(t => t.id === shipment.transporterId);
  const canMarkReady = shipment.transporterId && isCreated;

  const handleAssign = async () => {
    if (!selectedTransporter) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 500));
    onAssignTransporter(shipment.id, selectedTransporter);
    setSelectedTransporter('');
    setIsProcessing(false);
  };

  const handleMarkReady = async () => {
    if (!canMarkReady) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    onMarkReady(shipment.id);
    setIsProcessing(false);
  };

  const handleAcknowledge = async (concernId) => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 500));
    onAcknowledgeConcern?.(shipment.id, concernId);
    setIsProcessing(false);
  };

  const handleResolve = async (concernId) => {
    if (!resolutionText.trim()) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 500));
    onResolveConcern?.(shipment.id, concernId, resolutionText);
    setResolutionText('');
    setIsProcessing(false);
  };

  return (
    <div className={`
      border rounded-2xl p-6 transition-all duration-200
      ${isDarkMode 
        ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' 
        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
      }
    `}>
      <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
        Shipment Actions
      </h2>

      {/* Shipment Info */}
      <div className={`
        border rounded-xl p-4 mb-4
        ${isDarkMode 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-slate-50 border-slate-200'
        }
      `}>
        <p className={`font-semibold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
          {shipment.productName}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
            {shipment.id}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Batch:</span>
          <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{shipment.batchId}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Quantity:</span>
          <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{shipment.quantity} {shipment.unit}</span>
        </div>
      </div>

      {/* Tabs for Actions vs Concerns */}
      {hasConcerns && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all border ${
              activeTab === 'actions'
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : isDarkMode 
                  ? 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveTab('concerns')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all relative border ${
              activeTab === 'concerns'
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : isDarkMode 
                  ? 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            Concerns
            {openConcerns.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {openConcerns.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === 'actions' && (
        <>
          {!isCreated ? (
            <div className={`
              border rounded-xl p-4
              ${isDarkMode 
                ? 'bg-amber-500/20 border-amber-500/30' 
                : 'bg-amber-50 border-amber-200'
              }
            `}>
              <div className="flex items-center gap-2">
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>Shipment Locked</p>
              </div>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-amber-400/70' : 'text-amber-600'}`}>
                Status: {shipment.status.replace(/_/g, ' ')}. Assignment changes not allowed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Transporter Assignment */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Assign Transporter
                </label>
                {currentTransporter ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div>
                      <p className="font-medium text-emerald-400">{currentTransporter.name}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{currentTransporter.specialization}</p>
                    </div>
                    <span className="text-emerald-400 text-xl">✓</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={selectedTransporter}
                      onChange={(e) => setSelectedTransporter(e.target.value)}
                      className={`
                        flex-1 border rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all
                        ${isDarkMode 
                          ? 'bg-slate-800/50 border-slate-700 text-slate-50 focus:border-blue-500' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
                        }
                      `}
                    >
                      <option value="" className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>-- Select --</option>
                      {TRANSPORTER_AGENCIES.map(a => (
                        <option key={a.id} value={a.id} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedTransporter || isProcessing}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>

              {/* Mark Ready Button */}
              <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  onClick={handleMarkReady}
                  disabled={!canMarkReady || isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : '✓ Mark Ready for Dispatch'}
                </button>
                {!shipment.transporterId && (
                  <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Assign a transporter first
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Concerns Tab */}
      {activeTab === 'concerns' && hasConcerns && (
        <div className="space-y-4">
          {/* Open Concerns - Need Acknowledgment */}
          {openConcerns.map(concern => (
            <div key={concern.id} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded ${CONCERN_STATUS_COLORS[concern.status].bg} ${CONCERN_STATUS_COLORS[concern.status].text}`}>
                    {CONCERN_STATUS_COLORS[concern.status].label}
                  </span>
                  <h4 className="font-medium text-red-400 mt-2">
                    {CONCERN_TYPE_LABELS[concern.type]}
                  </h4>
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  by {concern.raisedBy}
                </span>
              </div>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{concern.description}</p>
              <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Raised: {formatDate(concern.raisedAt)}
              </p>
              <button
                onClick={() => handleAcknowledge(concern.id)}
                disabled={isProcessing}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-medium rounded-lg border border-amber-500/30 transition-all disabled:opacity-50"
              >
                Acknowledge Concern
              </button>
            </div>
          ))}

          {/* Acknowledged Concerns - Need Resolution */}
          {acknowledgedConcerns.map(concern => (
            <div key={concern.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded ${CONCERN_STATUS_COLORS[concern.status].bg} ${CONCERN_STATUS_COLORS[concern.status].text}`}>
                    {CONCERN_STATUS_COLORS[concern.status].label}
                  </span>
                  <h4 className="font-medium text-amber-400 mt-2">
                    {CONCERN_TYPE_LABELS[concern.type]}
                  </h4>
                </div>
              </div>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{concern.description}</p>
              <div className="space-y-2">
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Enter resolution details..."
                  className={`
                    w-full border rounded-lg py-2 px-3 text-sm resize-none focus:outline-none
                    ${isDarkMode 
                      ? 'bg-slate-800/50 border-slate-700 text-slate-50 placeholder-slate-400 focus:border-amber-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                    }
                  `}
                  rows={2}
                />
                <button
                  onClick={() => handleResolve(concern.id)}
                  disabled={isProcessing || !resolutionText.trim()}
                  className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-medium rounded-lg border border-emerald-500/30 transition-all disabled:opacity-50"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          ))}

          {/* Resolved Concerns - Display Only */}
          {shipment.concerns
            .filter(c => c.status === CONCERN_STATUS.RESOLVED)
            .map(concern => (
              <div key={concern.id} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 opacity-75">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded ${CONCERN_STATUS_COLORS[concern.status].bg} ${CONCERN_STATUS_COLORS[concern.status].text}`}>
                      {CONCERN_STATUS_COLORS[concern.status].label}
                    </span>
                    <h4 className="font-medium text-emerald-400 mt-2">
                      {CONCERN_TYPE_LABELS[concern.type]}
                    </h4>
                  </div>
                </div>
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{concern.description}</p>
                <div className={`rounded-lg p-2 mt-2 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Resolution:</p>
                  <p className="text-sm text-emerald-400">{concern.resolution}</p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ShipmentActions;
