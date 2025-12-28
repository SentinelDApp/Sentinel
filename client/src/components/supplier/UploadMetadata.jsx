import { useState } from 'react';
import { SHIPMENT_STATUSES } from './supplier.constants';

const UploadMetadata = ({ shipment, onUploadComplete }) => {
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
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-50 mb-4">Supporting Documents (Optional)</h2>
        <p className="text-center py-8 text-slate-400">Select a shipment to attach documents</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all">
      <h2 className="text-lg font-semibold text-slate-50 mb-1">Supporting Documents (Optional)</h2>
      <p className="text-sm text-slate-400 mb-4">Upload certificates, invoices, or images</p>

      {isLocked ? (
        <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-amber-400">🔒 Shipment is locked. Cannot add documents.</p>
        </div>
      ) : (
        <>
          {/* Upload Area */}
          <label className="block border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-700/50 transition-all">
            <input type="file" multiple onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
            <span className="text-3xl">📎</span>
            <p className="text-sm text-slate-300 mt-2">Click to upload files</p>
            <p className="text-xs text-slate-500">PDF, DOC, JPG, PNG</p>
          </label>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 border border-slate-600 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📄</span>
                    <div>
                      <p className="text-sm font-medium text-slate-200 truncate max-w-[180px]">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
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
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:hover:scale-100"
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
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-sm font-medium text-slate-300 mb-2">Attached Files:</p>
          {shipment.metadata.documents.map((fileName, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-2">
              <span className="text-emerald-400">✅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{fileName}</p>
              </div>
              <span className="bg-slate-600 text-slate-200 text-xs px-2 py-1 rounded-full">
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
