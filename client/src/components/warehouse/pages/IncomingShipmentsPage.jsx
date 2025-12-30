import { useTheme } from "../context/ThemeContext";
import IncomingShipmentsTable from "../components/IncomingShipmentsTable";
import ShipmentDetailsPanel from "../components/ShipmentDetailsPanel";
import { useState } from "react";
import { ArrowDownTrayIcon } from "../icons/Icons";

const IncomingShipmentsPage = () => {
  const { isDarkMode } = useTheme();
  const [selectedShipment, setSelectedShipment] = useState(null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-blue-500/10" : "bg-blue-50"}`}>
            <ArrowDownTrayIcon className={`w-6 h-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Incoming Shipments
          </h1>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          View and manage all incoming shipments to the warehouse
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <IncomingShipmentsTable onSelectShipment={setSelectedShipment} />
        </div>
        <div>
          {selectedShipment ? (
            <ShipmentDetailsPanel
              shipment={selectedShipment}
              onClose={() => setSelectedShipment(null)}
            />
          ) : (
            <div
              className={`
                rounded-2xl p-8 text-center
                ${isDarkMode
                  ? "bg-slate-900/50 border border-slate-800/50"
                  : "bg-white border border-slate-200/50 shadow-sm"
                }
              `}
            >
              <p className={`${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                Select a shipment to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomingShipmentsPage;
