import { useState, useEffect } from 'react';
import { SHIPMENT_STATUSES } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const UploadMetadata = ({ shipment, onUploadComplete, onDeleteDocument, walletAddress, isDarkMode = true }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({ show: false, docIndex: null });
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // Reset files when shipment changes
  useEffect(() => {
    setFiles([]);
  }, [shipment?.id, shipment?.shipmentHash]);

  // Auto-hide notification after 4 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Locked if blockchain confirmed (has txHash) or status is IN_TRANSIT/DELIVERED
  const isLocked = shipment?.txHash || 
                   shipment?.blockchainTxHash ||
                   shipment?.status === SHIPMENT_STATUSES.DELIVERED || 
                   shipment?.status === SHIPMENT_STATUSES.IN_TRANSIT;

  const handleFileChange = (e) => {
    if (isLocked) return;
    const newFiles = [...files, ...Array.from(e.target.files)];
    setFiles(newFiles);
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  // Upload files to Cloudinary immediately
  const handleUpload = async () => {
    if (!files.length || !shipment || isLocked) return;
    
    const shipmentHash = shipment.shipmentHash || shipment.id;
    setUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('supportingDocuments', file);
      });
      formData.append('uploadedBy', walletAddress || 'SYSTEM');
      
      const response = await fetch(
        `${API_URL}/api/shipments/${shipmentHash}/documents`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to upload documents:', error.message);
        setNotification({
          show: true,
          type: 'error',
          message: 'Failed to upload: ' + error.message
        });
      } else {
        const result = await response.json();
        console.log('Documents uploaded successfully:', result);
        const uploadedCount = files.length;
        setFiles([]);
        // Show success notification
        setNotification({
          show: true,
          type: 'success',
          message: `${uploadedCount} document${uploadedCount > 1 ? 's' : ''} uploaded successfully!`
        });
        // Call onUploadComplete to refresh shipment data and show uploaded docs
        if (onUploadComplete) {
          await onUploadComplete();
        }
      }
    } catch (err) {
      console.error('Failed to upload documents:', err);
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to upload documents. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };
  // Open delete confirmation modal
  const openDeleteModal = (docIndex) => {
    setDeleteModal({ show: true, docIndex });
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModal({ show: false, docIndex: null });
  };

  // Confirm and execute delete
  const confirmDelete = async () => {
    const docIndex = deleteModal.docIndex;
    if (docIndex === null || !onDeleteDocument || isLocked) return;
    
    closeDeleteModal();
    setDeleting(docIndex);
    
    try {
      await onDeleteDocument(shipment.shipmentHash || shipment.id, docIndex);
      setNotification({
        show: true,
        type: 'success',
        message: 'Document deleted successfully!'
      });
    } catch (err) {
      console.error('Failed to delete document:', err);
      setNotification({
        show: true,
        type: 'error',
        message: err.message || 'Failed to delete document. Please try again.'
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatSize = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

  // Delete Confirmation Modal Component
  const DeleteConfirmModal = () => {
    if (!deleteModal.show) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className={`
          max-w-sm w-full rounded-2xl p-6 shadow-2xl
          ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}
        `}>
          <div className="text-center mb-5">
            <div className="w-14 h-14 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              Delete Document?
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={closeDeleteModal}
              className={`
                flex-1 py-2.5 px-4 font-medium rounded-xl transition-colors
                ${isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }
              `}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Notification Toast Component
  const NotificationToast = () => {
    if (!notification.show) return null;
    
    const isSuccess = notification.type === 'success';
    
    return (
      <div className={`
        fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-xl shadow-2xl border flex items-center gap-3
        animate-[slideIn_0.3s_ease-out]
        ${isSuccess 
          ? isDarkMode 
            ? 'bg-emerald-500/20 border-emerald-500/30' 
            : 'bg-emerald-50 border-emerald-200'
          : isDarkMode 
            ? 'bg-red-500/20 border-red-500/30' 
            : 'bg-red-50 border-red-200'
        }
      `}>
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center shrink-0
          ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}
        `}>
          {isSuccess ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${
            isSuccess 
              ? isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
              : isDarkMode ? 'text-red-300' : 'text-red-700'
          }`}>
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => setNotification({ show: false, type: '', message: '' })}
          className={`p-1 rounded-lg transition-colors ${
            isSuccess
              ? 'hover:bg-emerald-500/20 text-emerald-400'
              : 'hover:bg-red-500/20 text-red-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

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
          Supporting Documents (Optional)
        </h2>
        <p className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Select a shipment to attach documents
        </p>
      </div>
    );
  }

  return (
    <div className={`
      border rounded-2xl p-6 transition-all duration-200
      ${isDarkMode 
        ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' 
        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
      }
    `}>
      <h2 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
        Supporting Documents (Optional)
      </h2>
      <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        Upload images for this shipment
      </p>

      {isLocked ? (
        <div className={`
          border rounded-xl p-4 text-center
          ${isDarkMode 
            ? 'bg-amber-500/20 border-amber-500/30' 
            : 'bg-amber-50 border-amber-200'
          }
        `}>
          <p className={isDarkMode ? 'text-amber-400' : 'text-amber-700'}>
            🔒 Shipment is in transit. Cannot modify documents.
          </p>
        </div>
      ) : (
        <>
          {/* Upload Area */}
          <label className={`
            block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${isDarkMode 
              ? 'border-slate-700 hover:border-blue-500 hover:bg-slate-800/50' 
              : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50'
            }
          `}>
            <input type="file" multiple onChange={handleFileChange} className="hidden" accept=".jpg,.jpeg,.png" />
            <span className="text-3xl">📎</span>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Click to upload files
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              JPG, PNG only
            </p>
          </label>

          {/* Pending Files (selected but not yet uploaded) */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                📋 Selected files:
              </p>
              {files.map((file, index) => (
                <div 
                  key={index} 
                  className={`
                    flex items-center justify-between p-3 border rounded-xl
                    ${isDarkMode 
                      ? 'bg-slate-800/50 border-slate-700' 
                      : 'bg-slate-50 border-slate-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📄</span>
                    <div>
                      <p className={`text-sm font-medium truncate max-w-45 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {file.name}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {formatSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(index)} 
                    className="text-red-400 hover:text-red-300 text-sm p-1 hover:bg-red-500/20 rounded-lg transition-all"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:hover:scale-100"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading to Cloudinary...
                  </span>
                ) : (
                  `Upload ${files.length} file(s)`
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Uploaded Documents (on Cloudinary) */}
      {shipment.supportingDocuments?.length > 0 && (
        <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            ☁️ Uploaded Files:
          </p>
          {shipment.supportingDocuments.map((doc, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-2"
            >
              <span className="text-emerald-400">✅</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  Document {index + 1}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* View Button */}
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all"
                  title="View document"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </a>
                {/* Delete Button */}
                {!isLocked && (
                  <button
                    onClick={() => openDeleteModal(index)}
                    disabled={deleting === index}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-50"
                    title="Delete document"
                  >
                    {deleting === index ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal />
      
      {/* Notification Toast */}
      <NotificationToast />
    </div>
  );
};

export default UploadMetadata;
