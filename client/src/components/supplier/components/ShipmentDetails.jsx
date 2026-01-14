/**
 * ShipmentDetails Component
 * 
 * SYSTEM PRINCIPLE:
 * Sentinel records shipment identity on-chain while enabling container-level
 * traceability using off-chain QR codes. This component displays comprehensive
 * shipment details including container list, blockchain status, and QR codes.
 */

import { useState } from 'react';
import ContainerQRGrid from './ContainerQRGrid';
import { 
  STATUS_COLORS, 
  CONCERN_STATUS,
  CONCERN_TYPE_LABELS,
  formatDate,
} from '../constants';


const ShipmentDetails = ({ shipment, onClose, isDarkMode = true }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'containers' | 'concerns'
  
  if (!shipment) return null;

  const {
    id,
    shipmentHash,
    productName,
    batchId,
    numberOfContainers,
    quantityPerContainer,
    totalQuantity,
    status,
    createdAt,
    isLocked,
    blockchainTxHash,
    transporterName,
    warehouseName,
    containers = [],
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
    { id: 'containers', label: 'Containers', badge: containers.length, icon: '📦' },
    { id: 'concerns', label: 'Concerns', badge: openConcerns.length + acknowledgedConcerns.length, icon: '⚠️' },
  ];

  return (
    <div className={`
      border rounded-2xl overflow-hidden transition-colors duration-200
      ${isDarkMode 
        ? 'bg-slate-900/50 border-slate-800' 
        : 'bg-white border-slate-200 shadow-sm'
      }
    `}>
      {/* Header */}
      <div className={`
        p-4 border-b
        ${isDarkMode 
          ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-slate-700' 
          : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-slate-200'
        }
      `}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
              {statusStyle.label}
            </span>
            {isLocked && (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Locked
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
          >
            <svg className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <h2 className={`text-xl font-semibold mb-1 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
          {productName || 'Unnamed Product'}
        </h2>
        <div className={`text-xs font-mono mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Batch: {batchId}
        </div>
        <code className={`text-xs font-mono px-2 py-1 rounded ${isDarkMode ? 'text-slate-400 bg-slate-700/50' : 'text-slate-500 bg-slate-200'}`}>
          {shipmentHash || id}
        </code>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === tab.id 
                ? `text-blue-${isDarkMode ? '400' : '600'} border-b-2 border-blue-${isDarkMode ? '400' : '600'} ${isDarkMode ? 'bg-slate-900/30' : 'bg-blue-50/50'}` 
                : `${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
            {tab.badge > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                tab.id === 'concerns' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
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
            {/* Shipment Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`border rounded-xl p-3 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-xs block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Containers</span>
                <span className={`text-lg font-bold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                  {numberOfContainers || containers.length}
                </span>
              </div>
              <div className={`border rounded-xl p-3 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-xs block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Qty per Container</span>
                <span className={`font-medium ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                  {quantityPerContainer || 0} units
                </span>
              </div>
              <div className={`border rounded-xl p-3 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-xs block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Quantity</span>
                <span className={`text-lg font-bold text-emerald-400`}>
                  {totalQuantity || 0} units
                </span>
              </div>
              <div className={`border rounded-xl p-3 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-xs block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Created</span>
                <span className={isDarkMode ? 'text-slate-50' : 'text-slate-900'}>{formatDate(createdAt)}</span>
              </div>
            </div>

            {/* Transporter & Warehouse Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`border rounded-xl p-3 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-xs block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Transporter</span>
                <span className={`font-medium ${transporterName 
                  ? (isDarkMode ? 'text-blue-300' : 'text-blue-600') 
                  : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}>
                  {transporterName || 'Not assigned'}
                </span>
              </div>
              <div className={`border rounded-xl p-3 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-xs block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Warehouse</span>
                <span className={`font-medium ${warehouseName 
                  ? (isDarkMode ? 'text-purple-300' : 'text-purple-600') 
                  : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}>
                  {warehouseName || 'Not assigned'}
                </span>
              </div>
            </div>

            {/* Blockchain Status */}
            <div className={`
              border rounded-xl p-4
              ${blockchainTxHash 
                ? isDarkMode 
                  ? 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30' 
                  : 'bg-gradient-to-br from-emerald-50 to-cyan-50 border-emerald-200'
                : isDarkMode 
                  ? 'bg-slate-800/30 border-slate-700' 
                  : 'bg-slate-50 border-slate-200'
              }
            `}>
              <div className="flex items-center gap-2 mb-2">
                {blockchainTxHash ? (
                  <>
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      Blockchain Verified
                    </span>
                  </>
                ) : (
                  <>
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Pending Blockchain Registration
                    </span>
                  </>
                )}
              </div>
              {blockchainTxHash && (
                <p className={`text-xs font-mono truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  TX: {blockchainTxHash}
                </p>
              )}
            </div>

            {/* Supporting Documents */}
            {metadata && metadata.documents?.length > 0 && (
              <div className={`border rounded-xl p-3 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Supporting Documents</span>
                  <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">
                    Off-Chain
                  </span>
                </div>
                <div className="space-y-2">
                  {metadata.documents.map((doc, idx) => {
                    const docName = typeof doc === 'string' ? doc : doc.name;
                    return (
                      <div 
                        key={idx} 
                        className={`
                          flex items-center justify-between p-2.5 rounded-lg border transition-colors
                          ${isDarkMode 
                            ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center
                            ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}
                          `}>
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {docName}
                          </span>
                        </div>
                        <button 
                          className={`
                            flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                            ${isDarkMode 
                              ? 'text-blue-400 hover:bg-blue-500/20' 
                              : 'text-blue-600 hover:bg-blue-50'
                            }
                          `}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
                {metadata.notes && (
                  <p className={`text-sm mt-3 italic ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{metadata.notes}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Containers Tab */}
        {activeTab === 'containers' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                Container QR Codes
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Each container has a unique QR code for tracking and verification
              </p>
            </div>

            <ContainerQRGrid 
              containers={containers} 
              isDarkMode={isDarkMode}
              maxHeight={500}
            />
          </div>
        )}

        {/* Concerns Tab */}
        {activeTab === 'concerns' && (
          <div className="space-y-4">
            {concerns.length === 0 ? (
              <div className="text-center py-8">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <svg className={`w-8 h-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>No concerns raised for this shipment</p>
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
                      <div key={idx} className={`border rounded-xl p-4 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{concernLabel}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[concern.status]}`}>
                            {concern.status}
                          </span>
                        </div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{concern.description}</p>
                        <div className={`flex items-center gap-4 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span>Raised by: {concern.raisedBy}</span>
                          <span>{formatDate(concern.raisedAt)}</span>
                        </div>
                        {concern.resolution && (
                          <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
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
