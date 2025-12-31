import { STATUS_COLORS, getTimeAgo } from '../constants';
import { BoxIcon, EyeIcon, CheckIcon } from '../icons/Icons';

const IncomingShipments = ({ 
  shipments, 
  selectedShipment, 
  onShipmentSelect, 
  onReceive,
  isDarkMode,
  compact = false,
  title = "Incoming Shipments"
}) => {
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      case 'high':
        return isDarkMode ? 'text-amber-400' : 'text-amber-600';
      case 'medium':
        return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      default:
        return isDarkMode ? 'text-slate-400' : 'text-slate-600';
    }
  };

  if (shipments.length === 0) {
    return (
      <div className={`
        rounded-2xl p-8 text-center border
        ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}
      `}>
        <BoxIcon className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
        <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No Shipments</h3>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
          No shipments match your current filter
        </p>
      </div>
    );
  }

  return (
    <div className={`
      rounded-2xl border overflow-hidden
      ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}
    `}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </h3>
          <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {shipments.length} shipment{shipments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Shipment List */}
      <div className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'} ${compact ? 'max-h-96 overflow-y-auto' : ''}`}>
        {shipments.map((shipment) => {
          const statusColor = STATUS_COLORS[shipment.status] || STATUS_COLORS.pending;
          const isSelected = selectedShipment?.id === shipment.id;

          return (
            <div
              key={shipment.id}
              onClick={() => onShipmentSelect(shipment)}
              className={`
                p-4 cursor-pointer transition-all
                ${isSelected 
                  ? isDarkMode 
                    ? 'bg-blue-500/10 border-l-2 border-l-blue-500' 
                    : 'bg-blue-50 border-l-2 border-l-blue-500'
                  : isDarkMode 
                    ? 'hover:bg-slate-800/50' 
                    : 'hover:bg-slate-50'
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Shipment ID & Status */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {shipment.id}
                    </span>
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-medium
                      ${statusColor.bg} ${statusColor.text}
                    `}>
                      {statusColor.label}
                    </span>
                  </div>

                  {/* Product Name */}
                  <p className={`text-sm truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {shipment.productName}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>
                      {shipment.supplier}
                    </span>
                    <span className={isDarkMode ? 'text-slate-600' : 'text-slate-400'}>•</span>
                    <span className={getPriorityColor(shipment.priority)}>
                      {shipment.priority} priority
                    </span>
                    <span className={isDarkMode ? 'text-slate-600' : 'text-slate-400'}>•</span>
                    <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>
                      {getTimeAgo(shipment.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {shipment.status === 'pending' && onReceive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReceive(shipment.id);
                      }}
                      className={`
                        p-2 rounded-lg transition-colors
                        ${isDarkMode 
                          ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }
                      `}
                      title="Mark as Received"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShipmentSelect(shipment);
                    }}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${isDarkMode 
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }
                    `}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncomingShipments;
