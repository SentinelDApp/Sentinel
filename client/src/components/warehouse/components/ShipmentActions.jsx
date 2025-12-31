import { useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, BoxIcon, TruckIcon } from '../icons/Icons';
import { SHIPMENT_STATUSES, CONCERN_TYPE_LABELS } from '../constants';

// Action Button component - defined outside to avoid recreation during render
const ActionButton = ({ onClick, disabled, variant = 'primary', isDarkMode, children }) => {
  const variants = {
    primary: isDarkMode 
      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50' 
      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50',
    secondary: isDarkMode
      ? 'bg-slate-700 text-white hover:bg-slate-600'
      : 'bg-slate-200 text-slate-900 hover:bg-slate-300',
    danger: isDarkMode
      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
      : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
    success: isDarkMode
      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all
        ${variants[variant]}
        disabled:cursor-not-allowed
      `}
    >
      {children}
    </button>
  );
};

const ShipmentActions = ({ 
  shipment, 
  onVerify, 
  onAssignStorage, 
  onMarkReady,
  onDispatch,
  onRaiseConcern,
  onResolveConcern,
  storageZones = [],
  retailers = [],
  isDarkMode 
}) => {
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [showConcernForm, setShowConcernForm] = useState(false);
  const [concernType, setConcernType] = useState('');
  const [concernDescription, setConcernDescription] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [resolution, setResolution] = useState('');

  const handleVerify = () => {
    onVerify(shipment.id, {
      notes: verificationNotes,
      verifiedBy: 'Warehouse Admin',
      timestamp: new Date().toISOString(),
    });
    setVerificationNotes('');
  };

  const handleAssignStorage = () => {
    if (selectedZone) {
      onAssignStorage(shipment.id, selectedZone);
      setSelectedZone('');
    }
  };

  const handleDispatch = () => {
    if (selectedRetailer) {
      onDispatch(shipment.id, selectedRetailer);
      setSelectedRetailer('');
    }
  };

  const handleRaiseConcern = () => {
    if (concernType && concernDescription) {
      onRaiseConcern(shipment.id, {
        type: concernType,
        description: concernDescription,
      });
      setConcernType('');
      setConcernDescription('');
      setShowConcernForm(false);
    }
  };

  const handleResolveConcern = () => {
    if (resolution) {
      onResolveConcern(shipment.id, resolution);
      setResolution('');
    }
  };

  return (
    <div className={`
      rounded-2xl border p-5 space-y-5
      ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}
    `}>
      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
        Actions for {shipment.id}
      </h3>

      {/* Verification Action */}
      {shipment.status === SHIPMENT_STATUSES.RECEIVED && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className={`w-5 h-5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Verify Shipment
            </span>
          </div>
          <textarea
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder="Add verification notes (optional)..."
            rows={2}
            className={`
              w-full px-3 py-2 rounded-xl text-sm resize-none
              ${isDarkMode 
                ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' 
                : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400'
              }
            `}
          />
          <ActionButton onClick={handleVerify} isDarkMode={isDarkMode}>
            ✓ Verify Shipment
          </ActionButton>
        </div>
      )}

      {/* Storage Assignment */}
      {shipment.status === SHIPMENT_STATUSES.VERIFIED && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BoxIcon className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Assign Storage Zone
            </span>
          </div>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className={`
              w-full px-3 py-2.5 rounded-xl text-sm
              ${isDarkMode 
                ? 'bg-slate-800 border border-slate-700 text-white' 
                : 'bg-slate-50 border border-slate-200 text-slate-900'
              }
            `}
          >
            <option value="">Select storage zone...</option>
            {storageZones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} - {zone.type} ({zone.available} slots available)
              </option>
            ))}
          </select>
          <ActionButton onClick={handleAssignStorage} disabled={!selectedZone} isDarkMode={isDarkMode}>
            📦 Assign Storage
          </ActionButton>
        </div>
      )}

      {/* Ready for Dispatch */}
      {shipment.status === SHIPMENT_STATUSES.STORED && onMarkReady && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TruckIcon className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Mark Ready for Dispatch
            </span>
          </div>
          <ActionButton onClick={() => onMarkReady(shipment.id)} variant="secondary" isDarkMode={isDarkMode}>
            🚀 Mark Ready
          </ActionButton>
        </div>
      )}

      {/* Dispatch */}
      {shipment.status === SHIPMENT_STATUSES.READY_FOR_DISPATCH && onDispatch && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TruckIcon className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Dispatch to Retailer
            </span>
          </div>
          <select
            value={selectedRetailer}
            onChange={(e) => setSelectedRetailer(e.target.value)}
            className={`
              w-full px-3 py-2.5 rounded-xl text-sm
              ${isDarkMode 
                ? 'bg-slate-800 border border-slate-700 text-white' 
                : 'bg-slate-50 border border-slate-200 text-slate-900'
              }
            `}
          >
            <option value="">Select retailer...</option>
            {retailers.map((retailer) => (
              <option key={retailer.id} value={retailer.id}>
                {retailer.name} - {retailer.location}
              </option>
            ))}
          </select>
          <ActionButton onClick={handleDispatch} disabled={!selectedRetailer} variant="success" isDarkMode={isDarkMode}>
            🚚 Dispatch Shipment
          </ActionButton>
        </div>
      )}

      {/* Resolve Concern */}
      {shipment.status === SHIPMENT_STATUSES.CONCERN_RAISED && shipment.concern?.status === 'open' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Resolve Concern
            </span>
          </div>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Describe how the concern was resolved..."
            rows={3}
            className={`
              w-full px-3 py-2 rounded-xl text-sm resize-none
              ${isDarkMode 
                ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' 
                : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400'
              }
            `}
          />
          <ActionButton onClick={handleResolveConcern} disabled={!resolution} variant="success" isDarkMode={isDarkMode}>
            ✓ Resolve Concern
          </ActionButton>
        </div>
      )}

      {/* Raise Concern */}
      {shipment.status !== SHIPMENT_STATUSES.CONCERN_RAISED && (
        <div className="space-y-3">
          {!showConcernForm ? (
            <button
              onClick={() => setShowConcernForm(true)}
              className={`
                w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all
                ${isDarkMode 
                  ? 'text-red-400 hover:bg-red-500/10 border border-red-500/30' 
                  : 'text-red-600 hover:bg-red-50 border border-red-200'
                }
              `}
            >
              ⚠️ Raise Concern
            </button>
          ) : (
            <div className={`
              p-4 rounded-xl border space-y-3
              ${isDarkMode ? 'bg-red-500/5 border-red-500/30' : 'bg-red-50 border-red-200'}
            `}>
              <div className="flex items-center justify-between">
                <span className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  Raise Concern
                </span>
                <button 
                  onClick={() => setShowConcernForm(false)}
                  className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}
                >
                  ✕
                </button>
              </div>
              <select
                value={concernType}
                onChange={(e) => setConcernType(e.target.value)}
                className={`
                  w-full px-3 py-2.5 rounded-xl text-sm
                  ${isDarkMode 
                    ? 'bg-slate-800 border border-slate-700 text-white' 
                    : 'bg-white border border-slate-200 text-slate-900'
                  }
                `}
              >
                <option value="">Select concern type...</option>
                {Object.entries(CONCERN_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <textarea
                value={concernDescription}
                onChange={(e) => setConcernDescription(e.target.value)}
                placeholder="Describe the concern..."
                rows={3}
                className={`
                  w-full px-3 py-2 rounded-xl text-sm resize-none
                  ${isDarkMode 
                    ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400'
                  }
                `}
              />
              <ActionButton 
                onClick={handleRaiseConcern} 
                disabled={!concernType || !concernDescription}
                variant="danger"
                isDarkMode={isDarkMode}
              >
                Submit Concern
              </ActionButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShipmentActions;
