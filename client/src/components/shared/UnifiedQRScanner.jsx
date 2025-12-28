import React, { useState, useCallback } from 'react';
import { ScanLine, Zap } from 'lucide-react';

/**
 * UnifiedQRScanner
 * * A shared component used by Transporters, Warehouse, and Suppliers.
 * It simulates the action of scanning a UNIQUE QR code.
 * * @param {Function} onScan - Callback when a valid ID is scanned. Returns the String ID.
 * @param {boolean} disabled - Whether scanning is allowed.
 * @param {string} lastScannedId - The ID of the last item scanned (for visual feedback).
 */
const UnifiedQRScanner = ({ onScan, disabled, lastScannedId }) => {
  const [isScanning, setIsScanning] = useState(false);

  const handleSimulateScan = useCallback(() => {
    if (disabled) return;

    setIsScanning(true);
    
    // Simulate camera delay (300ms)
    setTimeout(() => {
      // GENERATE UNIQUE ID: In real app, this comes from camera.
      // Here we simulate reading a unique box ID based on timestamp
      const uniqueId = `BOX-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      onScan(uniqueId);
      setIsScanning(false);
    }, 300);
  }, [disabled, onScan]);

  return (
    <div className="space-y-3">
      {/* Visual Feedback Area */}
      <div className={`
        p-6 rounded-xl border-2 border-dashed text-center transition-all duration-300
        ${lastScannedId ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}
        ${isScanning ? 'scale-[0.98] opacity-80' : 'scale-100'}
      `}>
        {lastScannedId ? (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <ScanLine className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-800 font-bold">Last Scanned:</p>
            <p className="font-mono text-lg text-gray-900">{lastScannedId}</p>
          </div>
        ) : (
          <div className="text-gray-400">
            <ScanLine className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Ready to Scan</p>
          </div>
        )}
      </div>

      {/* Large Scan Trigger */}
      <button
        onClick={handleSimulateScan}
        disabled={disabled || isScanning}
        className="
          w-full py-5 px-6 rounded-xl font-bold text-xl
          bg-blue-600 hover:bg-blue-700 text-white
          shadow-lg shadow-blue-600/30
          active:scale-[0.98] transition-all
          flex items-center justify-center gap-3
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <Zap className={`w-6 h-6 ${isScanning ? 'animate-pulse' : ''}`} />
        {isScanning ? 'Scanning...' : 'Scan Item QR Code'}
      </button>
      
      <p className="text-xs text-center text-gray-400">
        Simulates reading unique IDs (e.g., BOX-9382)
      </p>
    </div>
  );
};

export default UnifiedQRScanner;