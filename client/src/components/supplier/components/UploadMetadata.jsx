import { useState } from 'react';
import { SHIPMENT_STATUSES } from '../constants';

const UploadMetadata = ({ shipment, onUploadComplete, isDarkMode = true }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const isLocked = shipment?.status === SHIPMENT_STATUSES.DELIVERED || 
                   shipment?.status === SHIPMENT_STATUSES.IN_TRANSIT;

  const handleFileChange = (e) => {
    if (isLocked) return;
    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));

  const handleUpload = async () => {
    if (!files.length || !shipment) return;
    setUploading(true);
    await new Promise(r => setTimeout(r, 1500));
    onUploadComplete(shipment.id, files);
    setFiles([]);
    setUploading(false);
  };

  const formatSize = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

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
        Upload certificates, invoices, or images
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
            🔒 Shipment is locked. Cannot add documents.
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
            <input type="file" multiple onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
            <span className="text-3xl">📎</span>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Click to upload files
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              PDF, DOC, JPG, PNG
            </p>
          </label>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
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
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:hover:scale-100"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  `Upload ${files.length} file(s)`
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Existing Metadata */}
      {shipment.metadata?.documents?.length > 0 && (
        <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Attached Files:
          </p>
          {shipment.metadata.documents.map((fileName, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-2"
            >
              <span className="text-emerald-400">✅</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {fileName}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'}`}>
                Off-Chain
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadMetadata;
