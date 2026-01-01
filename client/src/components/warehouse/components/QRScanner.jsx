import { useState } from 'react';
import { QRCodeIcon, CheckCircleIcon } from '../icons/Icons';

const QRScanner = ({ onScanComplete, isDarkMode }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState(null);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      setScanResult(manualInput.trim());
      onScanComplete?.(manualInput.trim());
      setManualInput('');
    }
  };

  const simulateScan = () => {
    setIsScanning(true);
    // Simulate scanning delay - in production this will use actual QR scanner
    setTimeout(() => {
      // Return empty result - actual scanning will provide real shipment IDs
      setScanResult(null);
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className={`
      rounded-2xl border overflow-hidden
      ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}
    `}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <QRCodeIcon className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            QR Scanner
          </h3>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="p-5">
        {/* Scan Button / Preview */}
        <div 
          className={`
            relative aspect-square rounded-xl overflow-hidden mb-4 flex items-center justify-center
            ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}
          `}
        >
          {isScanning ? (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Scanning...
              </p>
            </div>
          ) : scanResult ? (
            <div className="text-center">
              <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
              <p className={`font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {scanResult}
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Scan Complete
              </p>
            </div>
          ) : (
            <div className="text-center">
              <QRCodeIcon className={`w-16 h-16 mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Click to scan QR code
              </p>
            </div>
          )}
        </div>

        {/* Scan Button */}
        <button
          onClick={simulateScan}
          disabled={isScanning}
          className={`
            w-full py-3 rounded-xl font-medium transition-all mb-4
            bg-linear-to-r from-blue-500 to-cyan-500 text-white
            hover:from-blue-600 hover:to-cyan-600
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isScanning ? 'Scanning...' : '📷 Scan QR Code'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex-1 h-px ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
          <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>or</span>
          <div className={`flex-1 h-px ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
        </div>

        {/* Manual Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Enter shipment ID..."
            className={`
              flex-1 px-4 py-2.5 rounded-xl text-sm
              ${isDarkMode 
                ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500' 
                : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400'
              }
            `}
            onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualInput.trim()}
            className={`
              px-4 py-2.5 rounded-xl font-medium text-sm transition-all
              ${isDarkMode 
                ? 'bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50' 
                : 'bg-slate-200 text-slate-900 hover:bg-slate-300 disabled:opacity-50'
              }
            `}
          >
            Go
          </button>
        </div>

        {/* Reset */}
        {scanResult && (
          <button
            onClick={() => setScanResult(null)}
            className={`
              w-full mt-3 py-2 text-sm transition-colors
              ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}
            `}
          >
            Scan Another
          </button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
