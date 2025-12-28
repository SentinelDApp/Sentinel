import React, { useMemo } from 'react';
import { PackageCheck, AlertTriangle, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import UnifiedQRScanner from '../Shared/UnifiedQRScanner';

const CargoVerification = ({ 
  job, 
  scannedIds, // Now a Set or Array of strings, not just a number
  onScan, 
  onConfirm, 
  discrepancyReason, 
  setDiscrepancyReason 
}) => {
  
  // Calculate stats based on UNIQUE IDs
  const stats = useMemo(() => {
    const count = scannedIds.size; // Using Set for uniqueness
    const expected = job.expectedQuantity;
    const progress = Math.min((count / expected) * 100, 100);
    const missing = Math.max(0, expected - count);
    
    return { count, expected, progress, missing, isMatch: count === expected };
  }, [scannedIds, job]);

  const lastId = Array.from(scannedIds).pop(); // Get last scanned item

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <PackageCheck className="w-5 h-5 text-blue-600" />
        Cargo Verification
      </h2>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1 font-medium">
          <span>Progress</span>
          <span className={stats.isMatch ? 'text-green-600' : 'text-gray-600'}>
            {stats.count} / {stats.expected} Items
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              stats.isMatch ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>

      {/* The Shared Scanner */}
      {!stats.isMatch && (
        <UnifiedQRScanner 
          onScan={onScan} 
          disabled={stats.isMatch}
          lastScannedId={lastId}
        />
      )}

      {/* Success State */}
      {stats.isMatch && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-bold text-green-800">Verification Complete</h3>
          <p className="text-sm text-green-700">All unique IDs captured.</p>
        </div>
      )}

      {/* Discrepancy / Exception Handling */}
      {!stats.isMatch && stats.count > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
           <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
             <div className="flex gap-3">
               <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
               <div>
                 <h4 className="font-bold text-amber-800 text-sm">Missing Items?</h4>
                 <p className="text-xs text-amber-700 mt-1">
                   If you cannot find the remaining <strong>{stats.missing} items</strong>, 
                   state the reason below to proceed with an exception.
                 </p>
               </div>
             </div>
           </div>
           
           <textarea
             value={discrepancyReason}
             onChange={(e) => setDiscrepancyReason(e.target.value)}
             placeholder="Reason for missing items (e.g. 'Damaged at port')..."
             className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
             rows={2}
           />
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4">
        <button
          onClick={onConfirm}
          disabled={!stats.isMatch && !discrepancyReason.trim()}
          className={`
            w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors
            ${stats.isMatch 
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200' 
              : discrepancyReason.trim() 
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {stats.isMatch ? 'Confirm & Continue' : 'Submit Exception'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default CargoVerification;