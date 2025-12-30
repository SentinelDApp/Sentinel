import { useTheme } from "../context/ThemeContext";
import OutboundDispatchSection from "../components/OutboundDispatchSection";
import { ArrowUpTrayIcon } from "../icons/Icons";

const DispatchPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-orange-500/10" : "bg-orange-50"}`}>
            <ArrowUpTrayIcon className={`w-6 h-6 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`} />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Outbound Dispatch
          </h1>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          Manage and dispatch verified shipments to next stakeholders
        </p>
      </div>

      <div className="max-w-3xl">
        <OutboundDispatchSection />
      </div>
    </div>
  );
};

export default DispatchPage;
