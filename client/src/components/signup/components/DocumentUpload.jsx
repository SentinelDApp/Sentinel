import { useSignupTheme } from '../context/ThemeContext';
import { CheckCircleIcon, UploadIcon } from '../icons/Icons';
import { DOCUMENT_TYPES } from '../constants';

const DocumentUpload = ({ 
  document, 
  documentType, 
  onDocumentChange, 
  onDocumentTypeChange 
}) => {
  const { isDarkMode } = useSignupTheme();

  return (
    <div>
      <label
        className={`block text-sm font-medium mb-2 ${
          isDarkMode ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Verification Document
      </label>
      <label
        className={`
          block w-full p-6 rounded-xl text-center cursor-pointer transition-all duration-200 border-2 border-dashed
          ${
            document
              ? isDarkMode
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-emerald-50 border-emerald-200"
              : isDarkMode
              ? "bg-slate-800/50 border-slate-700 hover:border-slate-600"
              : "bg-white border-slate-200 hover:border-slate-300"
          }
        `}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          required
          onChange={(e) => onDocumentChange(e.target.files[0])}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <div
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              ${
                document
                  ? "bg-emerald-500/20"
                  : isDarkMode
                  ? "bg-slate-700"
                  : "bg-slate-100"
              }
            `}
          >
            {document ? (
              <CheckCircleIcon
                className={`w-6 h-6 ${
                  isDarkMode ? "text-emerald-400" : "text-emerald-500"
                }`}
              />
            ) : (
              <UploadIcon
                className={`w-6 h-6 ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              />
            )}
          </div>
          {document ? (
            <p
              className={`text-sm font-medium ${
                isDarkMode ? "text-emerald-400" : "text-emerald-600"
              }`}
            >
              {document.name}
            </p>
          ) : (
            <>
              <p
                className={`text-sm font-medium ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Upload verification document
              </p>
              <p
                className={`text-xs ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                JPG, PNG up to 1MB
              </p>
            </>
          )}
        </div>
      </label>
      
      {/* Document Type Dropdown */}
      <div className="mt-3">
        <label
          className={`block text-sm font-medium mb-2 ${
            isDarkMode ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Uploaded Document Type
        </label>
        <select
          value={documentType}
          onChange={(e) => onDocumentTypeChange(e.target.value)}
          required
          className={`
            w-full px-4 py-3 rounded-xl outline-none transition-all cursor-pointer
            ${isDarkMode
              ? "bg-slate-800/50 border border-slate-700/50 text-white focus:border-blue-500"
              : "bg-white border border-slate-200 text-slate-900 focus:border-blue-500 shadow-sm"
            }
            ${!documentType && (isDarkMode ? "text-slate-500" : "text-slate-400")}
          `}
        >
          <option value="" disabled>Select document type</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DocumentUpload;
