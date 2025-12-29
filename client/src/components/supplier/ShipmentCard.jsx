import { 
  STATUS_COLORS, 
  TRANSPORTER_AGENCIES, 
  CONCERN_STATUS,
  formatDate,
} from './supplier.constants';


const ShipmentCard = ({ shipment, onSelect, isSelected, isDarkMode = true }) => {
  const { 
    id, 
    batchId, 
    productName, 
    quantity, 
    unit,
    status, 
    createdAt, 
    transporterId,
    transporterName,
    concerns = [],
  } = shipment;
  
  const transporter = transporterName || TRANSPORTER_AGENCIES.find(t => t.id === transporterId)?.name;
  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.created;
  const formattedDate = formatDate(createdAt);
  
  // Count open concerns
  const openConcerns = concerns.filter(c => c.status === CONCERN_STATUS.OPEN).length;
  const acknowledgedConcerns = concerns.filter(c => c.status === CONCERN_STATUS.ACKNOWLEDGED).length;
  const hasPendingConcerns = openConcerns > 0 || acknowledgedConcerns > 0;

  return (
    <div
      onClick={() => onSelect?.(shipment)}
      className={`
        rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02]
        ${isDarkMode ? 'bg-slate-900/50' : 'bg-white shadow-sm'}
        ${isSelected 
          ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/20' 
          : `border ${isDarkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'}`
        }
      `}
    >
      {/* Header: ID and Status */}
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-mono px-2 py-1 rounded-lg truncate max-w-[60%] ${isDarkMode ? 'text-slate-500 bg-slate-700/50' : 'text-slate-500 bg-slate-100'}`}>
          {id}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
          {statusStyle.label}
        </span>
      </div>
      
      {/* Product Name */}
      <h3 className={`font-semibold text-lg mb-3 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{productName}</h3>
      
      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Batch ID:</span>
          <span className={`font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{batchId}</span>
        </div>
        <div className="flex justify-between">
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Quantity:</span>
          <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{quantity} {unit}</span>
        </div>
        <div className="flex justify-between">
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Transporter:</span>
          <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{transporter || 'Not assigned'}</span>
        </div>
      </div>

      {/* Concerns Badge */}
      {hasPendingConcerns && (
        <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-red-400">
              {openConcerns > 0 && `${openConcerns} open`}
              {openConcerns > 0 && acknowledgedConcerns > 0 && ', '}
              {acknowledgedConcerns > 0 && `${acknowledgedConcerns} pending resolution`}
            </span>
          </div>
        </div>
      )}
      
      {/* Footer: Created Date */}
      <div className={`mt-4 pt-3 ${!hasPendingConcerns ? `border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}` : ''}`}>
        <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Created: {formattedDate}</p>
      </div>
    </div>
  );
};

export default ShipmentCard;
