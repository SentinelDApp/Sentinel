import { useState } from 'react';
import QRCodeDisplay from './QRCodeDisplay';
import { 
  STATUS_COLORS, 
  CONCERN_STATUS,
  CONCERN_TYPE_LABELS,
  formatDate,
} from './supplier.constants';


const ShipmentDetails = ({ shipment, onClose }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'qrcode' | 'concerns'
  
  if (!shipment) return null;

  const {
    id,
    batchId,
    productName,
    quantity,
    unit,
    status,
    createdAt,
    transporterName,
    supplierWallet,
    metadata,
    concerns = [],
  } = shipment;

  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.created;

  // Count concerns by status
  const openConcerns = concerns.filter(c => c.status === CONCERN_STATUS.OPEN);
  const acknowledgedConcerns = concerns.filter(c => c.status === CONCERN_STATUS.ACKNOWLEDGED);
  const resolvedConcerns = concerns.filter(c => c.status === CONCERN_STATUS.RESOLVED);

  const tabs = [
    { id: 'details', label: 'Details', icon: '📋' },
    { id: 'qrcode', label: 'QR Code', icon: '📱' },
    { id: 'concerns', label: 'Concerns', badge: openConcerns.length + acknowledgedConcerns.length, icon: '⚠️' },
  ];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
            {statusStyle.label}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <h2 className="text-xl font-semibold text-slate-50 mb-1">{productName}</h2>
        <code className="text-xs font-mono text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
          {id}
        </code>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === tab.id 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-900/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
            {tab.badge > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Key Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                <span className="text-xs text-slate-400 block mb-1">Batch ID</span>
                <span className="font-mono text-slate-50">{batchId}</span>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                <span className="text-xs text-slate-400 block mb-1">Quantity</span>
                <span className="text-slate-50 font-medium">{quantity} {unit}</span>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                <span className="text-xs text-slate-400 block mb-1">Transporter</span>
                <span className="text-slate-50">{transporterName || 'Not assigned'}</span>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                <span className="text-xs text-slate-400 block mb-1">Created</span>
                <span className="text-slate-50">{formatDate(createdAt)}</span>
              </div>
            </div>

            {/* Supplier Wallet */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
              <span className="text-xs text-slate-400 block mb-1">Supplier Wallet</span>
              <code className="font-mono text-slate-300 text-sm">{supplierWallet}</code>
            </div>

            {/* Supporting Documents */}
            {metadata && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-400">Supporting Documents</span>
                  <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">
                    Off-Chain
                  </span>
                </div>
                {metadata.documents?.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {doc.name}
                  </div>
                ))}
                {metadata.notes && (
                  <p className="text-sm text-slate-400 mt-2 italic">{metadata.notes}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* QR Code Tab */}
        {activeTab === 'qrcode' && (
          <div className="py-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-slate-50 mb-1">Shipment QR Code</h3>
              <p className="text-sm text-slate-400">
                This QR code is permanently linked to this shipment and cannot be regenerated
              </p>
            </div>

            <QRCodeDisplay shipmentId={id} size={200} showActions={true} />

            {/* QR Info */}
            <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
              <h4 className="text-sm font-medium text-slate-200 mb-3">QR Code Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Encoded Data:</span>
                  <span className="text-slate-200">Shipment Hash Only</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Generated:</span>
                  <span className="text-slate-200">{formatDate(createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Regenerable:</span>
                  <span className="text-red-400">No (One-time generation)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Concerns Tab */}
        {activeTab === 'concerns' && (
          <div className="space-y-4">
            {concerns.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-slate-400">No concerns raised for this shipment</p>
              </div>
            ) : (
              <>
                {/* Concerns Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                    <span className="text-2xl font-bold text-red-400">{openConcerns.length}</span>
                    <p className="text-xs text-red-300 mt-1">Open</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                    <span className="text-2xl font-bold text-amber-400">{acknowledgedConcerns.length}</span>
                    <p className="text-xs text-amber-300 mt-1">Acknowledged</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                    <span className="text-2xl font-bold text-green-400">{resolvedConcerns.length}</span>
                    <p className="text-xs text-green-300 mt-1">Resolved</p>
                  </div>
                </div>

                {/* Concerns List */}
                <div className="space-y-3">
                  {concerns.map((concern, idx) => {
                    const concernLabel = CONCERN_TYPE_LABELS[concern.type] || concern.type;
                    const statusColors = {
                      [CONCERN_STATUS.OPEN]: 'bg-red-500/20 text-red-400 border-red-500/30',
                      [CONCERN_STATUS.ACKNOWLEDGED]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                      [CONCERN_STATUS.RESOLVED]: 'bg-green-500/20 text-green-400 border-green-500/30',
                    };
                    
                    return (
                      <div key={idx} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            <span className="font-medium text-slate-200">{concernLabel}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[concern.status]}`}>
                            {concern.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{concern.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Raised by: {concern.raisedBy}</span>
                          <span>{formatDate(concern.raisedAt)}</span>
                        </div>
                        {concern.resolution && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <p className="text-xs text-slate-400">
                              <span className="text-green-400">Resolution:</span> {concern.resolution}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentDetails;
