import { CloseIcon, BoxIcon, TruckIcon, ClockIcon, MapPinIcon, BuildingIcon, BlockchainIcon } from '../icons/Icons';
import { STATUS_COLORS, formatDateTime } from '../constants';

// DetailRow component - defined outside to avoid recreation during render
const DetailRow = ({ label, value, icon: Icon, isDarkMode }) => (
  <div className="flex items-start gap-3 py-3">
    {Icon && (
      <div className={`p-2 rounded-lg shrink-0 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
        <Icon className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
      </div>
    )}
    <div>
      <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{label}</p>
      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value || 'N/A'}</p>
    </div>
  </div>
);

const ShipmentDetails = ({ shipment, onClose, isModal = false, isDarkMode }) => {
  if (!shipment) return null;

  const statusColor = STATUS_COLORS[shipment.status] || STATUS_COLORS.pending;

  const content = (
    <div className={`
      rounded-2xl border overflow-hidden
      ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}
    `}>
      {/* Header */}
      <div className={`
        px-5 py-4 border-b flex items-center justify-between
        ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}
      `}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {shipment.id}
            </h3>
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-medium
              ${statusColor.bg} ${statusColor.text}
            `}>
              {statusColor.label}
            </span>
          </div>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {shipment.productName}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`
            p-2 rounded-lg transition-colors
            ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}
          `}
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Grid of Details */}
        <div className={`grid grid-cols-2 gap-x-6 divide-y divide-x-0 sm:divide-y-0 sm:divide-x ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
          <div className="space-y-1 sm:pr-6">
            <DetailRow label="Supplier" value={shipment.supplier} icon={BuildingIcon} isDarkMode={isDarkMode} />
            <DetailRow label="Quantity" value={`${shipment.quantity} units`} icon={BoxIcon} isDarkMode={isDarkMode} />
            <DetailRow label="Transporter" value={shipment.transporterName} icon={TruckIcon} isDarkMode={isDarkMode} />
            <DetailRow label="Temperature" value={shipment.temperature} icon={ClockIcon} isDarkMode={isDarkMode} />
          </div>
          <div className="space-y-1 sm:pl-6 pt-3 sm:pt-0">
            <DetailRow label="Expected Date" value={formatDateTime(shipment.expectedDate)} icon={ClockIcon} isDarkMode={isDarkMode} />
            <DetailRow label="Batch Number" value={shipment.batchNumber} isDarkMode={isDarkMode} />
            <DetailRow label="Origin" value={shipment.metadata?.origin} icon={MapPinIcon} isDarkMode={isDarkMode} />
            <DetailRow label="Storage Zone" value={shipment.storageZoneName || 'Not assigned'} isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Blockchain Info */}
        {shipment.blockchainTxId && (
          <div className={`
            mt-5 p-4 rounded-xl border
            ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}
          `}>
            <div className="flex items-center gap-2 mb-2">
              <BlockchainIcon className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Blockchain Record
              </span>
            </div>
            <p className={`text-xs font-mono break-all ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {shipment.blockchainTxId}
            </p>
          </div>
        )}

        {/* Concern Info */}
        {shipment.concern && (
          <div className={`
            mt-5 p-4 rounded-xl border
            ${isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}
          `}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                ⚠️ Concern Raised
              </span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs
                ${isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}
              `}>
                {shipment.concern.status}
              </span>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
              {shipment.concern.description}
            </p>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-red-400/70' : 'text-red-500'}`}>
              Raised: {formatDateTime(shipment.concern.raisedAt)}
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className={`mt-5 pt-5 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Timeline
          </h4>
          <div className="space-y-3">
            {shipment.createdAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Created: {formatDateTime(shipment.createdAt)}
                </span>
              </div>
            )}
            {shipment.receivedAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Received: {formatDateTime(shipment.receivedAt)}
                </span>
              </div>
            )}
            {shipment.verifiedAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Verified: {formatDateTime(shipment.verifiedAt)}
                </span>
              </div>
            )}
            {shipment.storedAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Stored: {formatDateTime(shipment.storedAt)}
                </span>
              </div>
            )}
            {shipment.dispatchedAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Dispatched: {formatDateTime(shipment.dispatchedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default ShipmentDetails;
