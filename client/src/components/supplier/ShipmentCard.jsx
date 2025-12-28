import { 
  STATUS_COLORS, 
  TRANSPORTER_AGENCIES, 
  CONCERN_STATUS,
  formatDate,
} from './supplier.constants';


const ShipmentCard = ({ shipment, onSelect, isSelected }) => {
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
      className={`bg-slate-800 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
        isSelected 
          ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/20' 
          : 'border border-slate-700 hover:border-slate-600'
      }`}
    >
      {/* Header: ID and Status */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-mono text-slate-500 bg-slate-700/50 px-2 py-1 rounded-lg truncate max-w-[60%]">
          {id}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
          {statusStyle.label}
        </span>
      </div>
      
      {/* Product Name */}
      <h3 className="font-semibold text-slate-50 text-lg mb-3">{productName}</h3>
      
      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Batch ID:</span>
          <span className="font-mono text-slate-200">{batchId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Quantity:</span>
          <span className="font-medium text-slate-200">{quantity} {unit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Transporter:</span>
          <span className="font-medium text-slate-200">{transporter || 'Not assigned'}</span>
        </div>
      </div>

      {/* Concerns Badge */}
      {hasPendingConcerns && (
        <div className="mt-4 pt-3 border-t border-slate-700">
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
      <div className={`mt-4 pt-3 ${!hasPendingConcerns ? 'border-t border-slate-700' : ''}`}>
        <p className="text-xs text-slate-500">Created: {formattedDate}</p>
      </div>
    </div>
  );
};

export default ShipmentCard;
