import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  PlusIcon,
  BoxIcon,
  MapPinIcon,
  TruckIcon,
  XMarkIcon,
  QRCodeIcon,
} from "../icons/Icons";

const CreateShipmentCard = ({ onCreateShipment, className = "" }) => {
  const { isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    productName: "",
    destination: "",
    boxes: "",
    transporter: "",
    notes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateShipment?.(formData);
    setFormData({
      productName: "",
      destination: "",
      boxes: "",
      transporter: "",
      notes: "",
    });
    setIsExpanded(false);
  };

  return (
    <div
      className={`
        rounded-2xl overflow-hidden transition-all duration-300
        ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800/50"
            : "bg-gradient-to-br from-white to-slate-50 border border-slate-200/50 shadow-sm"
        }
        ${className}
      `}
    >
      {!isExpanded ? (
        // Collapsed State
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-6 text-left group"
        >
          <div className="flex items-center gap-4">
            <div
              className={`
                w-14 h-14 rounded-2xl flex items-center justify-center
                bg-gradient-to-br from-blue-500 to-cyan-500
                group-hover:scale-110 transition-transform duration-300
                shadow-lg shadow-blue-500/25
              `}
            >
              <PlusIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3
                className={`font-semibold text-lg ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Create New Shipment
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Generate QR codes and start tracking
              </p>
            </div>
          </div>

          {/* Quick Stats Preview */}
          <div
            className={`
            mt-4 pt-4 border-t flex items-center gap-6
            ${isDarkMode ? "border-slate-800" : "border-slate-200"}
          `}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isDarkMode ? "bg-green-500" : "bg-green-500"
                } animate-pulse`}
              />
              <span
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Ready to create
              </span>
            </div>
            <div
              className={`text-sm ${
                isDarkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Click to expand form
            </div>
          </div>
        </button>
      ) : (
        // Expanded State
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3
              className={`font-semibold text-lg ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              New Shipment Details
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className={`
                p-2 rounded-lg transition-colors
                ${
                  isDarkMode
                    ? "text-slate-400 hover:text-white hover:bg-slate-800"
                    : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                }
              `}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Name */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Product Name
              </label>
              <div className="relative">
                <BoxIcon
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                />
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData({ ...formData, productName: e.target.value })
                  }
                  placeholder="Enter product name"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all
                    ${
                      isDarkMode
                        ? "bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500"
                        : "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                    }
                  `}
                />
              </div>
            </div>

            {/* Destination */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Destination
              </label>
              <div className="relative">
                <MapPinIcon
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                />
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  placeholder="Enter destination address"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all
                    ${
                      isDarkMode
                        ? "bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500"
                        : "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                    }
                  `}
                />
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Number of Boxes */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Number of Boxes
                </label>
                <input
                  type="number"
                  value={formData.boxes}
                  onChange={(e) =>
                    setFormData({ ...formData, boxes: e.target.value })
                  }
                  placeholder="0"
                  className={`
                    w-full px-4 py-3 rounded-xl outline-none transition-all
                    ${
                      isDarkMode
                        ? "bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500"
                        : "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                    }
                  `}
                />
              </div>

              {/* Transporter */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Transporter
                </label>
                <div className="relative">
                  <TruckIcon
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDarkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  />
                  <select
                    value={formData.transporter}
                    onChange={(e) =>
                      setFormData({ ...formData, transporter: e.target.value })
                    }
                    className={`
                      w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all appearance-none
                      ${
                        isDarkMode
                          ? "bg-slate-800/50 border border-slate-700/50 text-white focus:border-blue-500"
                          : "bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-500"
                      }
                    `}
                  >
                    <option value="">Select...</option>
                    <option value="express">Express Logistics</option>
                    <option value="standard">Standard Shipping</option>
                    <option value="freight">Freight Partners</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any special instructions..."
                rows={3}
                className={`
                  w-full px-4 py-3 rounded-xl outline-none transition-all resize-none
                  ${
                    isDarkMode
                      ? "bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500"
                      : "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                  }
                `}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                className={`
                  flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2
                  bg-gradient-to-r from-blue-500 to-cyan-500 text-white
                  hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200
                `}
              >
                <QRCodeIcon className="w-5 h-5" />
                Create & Generate QR
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className={`
                  px-6 py-3 rounded-xl font-medium transition-colors
                  ${
                    isDarkMode
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }
                `}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateShipmentCard;
