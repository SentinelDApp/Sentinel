import { useTheme } from "../context/ThemeContext";
import VerificationPanel from "../components/VerificationPanel";
import { ClipboardCheckIcon } from "../icons/Icons";

const VerificationPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-teal-500/10" : "bg-teal-50"}`}>
            <ClipboardCheckIcon className={`w-6 h-6 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Verification
          </h1>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          Verify shipment quantities and conditions
        </p>
      </div>

      <div className="max-w-2xl">
        <VerificationPanel />
      </div>
    </div>
  );
};

export default VerificationPage;
