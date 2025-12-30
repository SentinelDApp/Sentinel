import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  TruckIcon,
  UserIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from "../icons/Icons";

const OutboundDispatchSection = () => {
  const { isDarkMode } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const verifiedShipments = [
    {
      id: "SHP-2024-001",
      product: "Electronic Components Batch A",
      quantity: 150,
      nextStakeholder: "QuickShip Transport",
      stakeholderType: "Transporter",
      destination: "Pune Distribution Center",
      verifiedAt: "2024-12-30 10:30",
    },
    {
      id: "SHP-2024-006",
      product: "Pharmaceutical Supplies",
      quantity: 200,
      nextStakeholder: "MediDist Pvt Ltd",
      stakeholderType: "Distributor",
      destination: "Chennai Medical Hub",
      verifiedAt: "2024-12-30 11:15",
    },
    {
      id: "SHP-2024-007",
      product: "Industrial Equipment",
      quantity: 75,
      nextStakeholder: "FastMove Logistics",
      stakeholderType: "Transporter",
      destination: "Bangalore Factory",
      verifiedAt: "2024-12-30 12:00",
    },
  ];

  const handleDispatch = (shipment) => {
    setSelectedShipment(shipment);
    setShowModal(true);
  };

  const confirmDispatch = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setShowModal(false);
      setSelectedShipment(null);
    }, 2000);
  };

  return (
    <>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-orange-500/10" : "bg-orange-50"}`}>
                <ArrowUpTrayIcon className={`w-5 h-5 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Outbound Dispatch
                </h3>
                <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  Verified shipments ready for dispatch
                </p>
              </div>
            </div>
            <span
              className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${isDarkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"}
              `}
            >
              {verifiedShipments.length} ready
            </span>
          </div>
        </div>

        {/* Shipment Cards */}
        <div className="p-4 space-y-3">
          {verifiedShipments.map((shipment) => (
            <div
              key={shipment.id}
              className={`
                p-4 rounded-xl border transition-all hover:scale-[1.01]
                ${isDarkMode
                  ? "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {shipment.id}
                    </span>
                    <span
                      className={`
                        px-2 py-0.5 rounded-full text-xs font-medium
                        ${isDarkMode
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : "bg-green-50 text-green-600 border border-green-200"
                        }
                      `}
                    >
                      <CheckCircleIcon className="w-3 h-3 inline mr-1" />
                      Verified
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    {shipment.product}
                  </p>
                </div>
                <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  {shipment.quantity} units
                </span>
              </div>

              {/* Next Stakeholder Preview */}
              <div
                className={`
                  p-3 rounded-lg mb-3
                  ${isDarkMode ? "bg-slate-900/50" : "bg-white"}
                `}
              >
                <p className={`text-xs mb-2 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  Next Stakeholder
                </p>
                <div className="flex items-center gap-2">
                  {shipment.stakeholderType === "Transporter" ? (
                    <TruckIcon className={`w-4 h-4 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                  ) : (
                    <UserIcon className={`w-4 h-4 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
                  )}
                  <span className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {shipment.nextStakeholder}
                  </span>
                  <span
                    className={`
                      px-2 py-0.5 rounded text-xs
                      ${isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-600"}
                    `}
                  >
                    {shipment.stakeholderType}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  → {shipment.destination}
                </p>
              </div>

              {/* Dispatch Button */}
              <button
                onClick={() => handleDispatch(shipment)}
                className={`
                  w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                  bg-gradient-to-r from-emerald-500 to-teal-500 text-white
                  hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20
                `}
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                Dispatch Shipment
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div
            className={`
              relative w-full max-w-md rounded-2xl p-6
              ${isDarkMode
                ? "bg-slate-900 border border-slate-700"
                : "bg-white border border-slate-200 shadow-2xl"
              }
            `}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className={`
                absolute top-4 right-4 p-1 rounded-lg transition-colors
                ${isDarkMode ? "text-slate-500 hover:text-white hover:bg-slate-800" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"}
              `}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="text-center mb-6">
              <div
                className={`
                  w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4
                  ${isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50"}
                `}
              >
                <PaperAirplaneIcon className={`w-8 h-8 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Confirm Dispatch
              </h3>
              <p className={`text-sm mt-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Are you sure you want to dispatch this shipment?
              </p>
            </div>

            {/* Shipment Details */}
            <div
              className={`
                p-4 rounded-xl mb-6
                ${isDarkMode ? "bg-slate-800" : "bg-slate-50"}
              `}
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>Shipment ID</span>
                  <span className={`font-mono font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {selectedShipment.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>Product</span>
                  <span className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {selectedShipment.product}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>Quantity</span>
                  <span className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {selectedShipment.quantity} units
                  </span>
                </div>
                <div className={`pt-3 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                      Next: {selectedShipment.stakeholderType}
                    </span>
                    <span className={`font-medium ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                      {selectedShipment.nextStakeholder}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className={`
                  flex-1 py-3 rounded-xl font-medium transition-colors
                  ${isDarkMode
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }
                `}
              >
                Cancel
              </button>
              <button
                onClick={confirmDispatch}
                disabled={isDispatching}
                className={`
                  flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                  bg-gradient-to-r from-emerald-500 to-teal-500 text-white
                  hover:from-emerald-600 hover:to-teal-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isDispatching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Confirm Dispatch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OutboundDispatchSection;
