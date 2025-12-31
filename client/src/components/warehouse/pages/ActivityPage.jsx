import { useTheme } from "../context/ThemeContext";
import BlockchainActivityLog from "../components/BlockchainActivityLog";
import { BlockchainIcon } from "../icons/Icons";

const ActivityPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-indigo-500/10" : "bg-indigo-50"}`}>
            <BlockchainIcon className={`w-6 h-6 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Activity Log
          </h1>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          View blockchain-recorded activity and transaction history
        </p>
      </div>

      <div className="max-w-3xl">
        <BlockchainActivityLog />
      </div>
    </div>
  );
};

export default ActivityPage;
