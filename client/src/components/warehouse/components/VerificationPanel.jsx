import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { ClipboardCheckIcon, BoxIcon, CheckIcon } from "../icons/Icons";

const VerificationPanel = ({ shipment }) => {
  const { isDarkMode } = useTheme();
  const [receivedQuantity, setReceivedQuantity] = useState("");
  const [condition, setCondition] = useState("intact");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const expectedQuantity = shipment?.quantity || 150;

  const conditions = [
    { id: "intact", label: "Intact", color: "green" },
    { id: "damaged", label: "Damaged", color: "red" },
    { id: "partial", label: "Partial", color: "amber" },
  ];

  const getConditionStyles = (conditionId, isSelected) => {
    const baseStyles = "px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer";
    
    if (!isSelected) {
      return `${baseStyles} ${isDarkMode 
        ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600" 
        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`;
    }

    switch (conditionId) {
      case "intact":
        return `${baseStyles} ${isDarkMode 
          ? "bg-green-500/10 border-green-500/30 text-green-400" 
          : "bg-green-50 border-green-200 text-green-600"}`;
      case "damaged":
        return `${baseStyles} ${isDarkMode 
          ? "bg-red-500/10 border-red-500/30 text-red-400" 
          : "bg-red-50 border-red-200 text-red-600"}`;
      case "partial":
        return `${baseStyles} ${isDarkMode 
          ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
          : "bg-amber-50 border-amber-200 text-amber-600"}`;
      default:
        return baseStyles;
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    }, 1500);
  };

  const quantityMismatch = receivedQuantity && parseInt(receivedQuantity) !== expectedQuantity;

  return (
    <div
      className={`
        rounded-2xl overflow-hidden
        ${isDarkMode
          ? "bg-slate-900/50 border border-slate-800/50"
          : "bg-white border border-slate-200/50 shadow-sm"
        }
      `}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-teal-500/10" : "bg-teal-50"}`}>
            <ClipboardCheckIcon className={`w-5 h-5 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Quantity & Condition Verification
            </h3>
            <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
              Verify received items against shipment manifest
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Quantity Section */}
        <div className="space-y-4">
          <h4 className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            Quantity Verification
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Expected Quantity */}
            <div
              className={`
                p-4 rounded-xl border
                ${isDarkMode 
                  ? "bg-slate-800/50 border-slate-700" 
                  : "bg-slate-50 border-slate-200"}
              `}
            >
              <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                Expected Quantity
              </p>
              <div className="flex items-center gap-2 mt-1">
                <BoxIcon className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                <span className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {expectedQuantity}
                </span>
                <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  units
                </span>
              </div>
            </div>

            {/* Received Quantity */}
            <div
              className={`
                p-4 rounded-xl border
                ${quantityMismatch
                  ? isDarkMode
                    ? "bg-amber-500/5 border-amber-500/30"
                    : "bg-amber-50 border-amber-200"
                  : isDarkMode
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-slate-50 border-slate-200"
                }
              `}
            >
              <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                Received Quantity
              </p>
              <input
                type="number"
                value={receivedQuantity}
                onChange={(e) => setReceivedQuantity(e.target.value)}
                placeholder="Enter count"
                className={`
                  w-full mt-1 text-2xl font-bold bg-transparent outline-none
                  ${quantityMismatch
                    ? isDarkMode ? "text-amber-400" : "text-amber-600"
                    : isDarkMode ? "text-white" : "text-slate-900"
                  }
                  placeholder:text-slate-500 placeholder:text-lg placeholder:font-normal
                `}
              />
            </div>
          </div>

          {quantityMismatch && (
            <div
              className={`
                px-4 py-2 rounded-lg text-sm
                ${isDarkMode 
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" 
                  : "bg-amber-50 text-amber-600 border border-amber-200"}
              `}
            >
              ⚠️ Quantity mismatch detected: Expected {expectedQuantity}, received {receivedQuantity}
            </div>
          )}
        </div>

        {/* Condition Section */}
        <div className="space-y-3">
          <h4 className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            Shipment Condition
          </h4>
          <div className="flex gap-3">
            {conditions.map((cond) => (
              <button
                key={cond.id}
                onClick={() => setCondition(cond.id)}
                className={getConditionStyles(cond.id, condition === cond.id)}
              >
                {condition === cond.id && <span className="mr-1">✓</span>}
                {cond.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <h4 className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            Notes (Optional)
          </h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes about the shipment..."
            rows={3}
            className={`
              w-full px-4 py-3 rounded-xl border resize-none outline-none transition-colors
              ${isDarkMode
                ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
                : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
              }
            `}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!receivedQuantity || isSubmitting}
          className={`
            w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2
            ${!receivedQuantity || isSubmitting
              ? isDarkMode
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
              : isSubmitted
              ? isDarkMode
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-green-50 text-green-600 border border-green-200"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
            }
          `}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : isSubmitted ? (
            <>
              <CheckIcon className="w-5 h-5" />
              Verification Submitted
            </>
          ) : (
            <>
              <ClipboardCheckIcon className="w-5 h-5" />
              Submit Verification
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VerificationPanel;
