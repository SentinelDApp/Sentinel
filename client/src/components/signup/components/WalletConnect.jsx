import { useSignupTheme } from '../context/ThemeContext';
import { CheckCircleIcon, MetaMaskIcon } from '../icons/Icons';

const WalletConnect = ({ wallet, isConnecting, onConnect }) => {
  const { isDarkMode } = useSignupTheme();

  return (
    <div>
      <label
        className={`block text-sm font-medium mb-3 ${
          isDarkMode ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Connect your wallet
      </label>
      <button
        type="button"
        onClick={onConnect}
        disabled={isConnecting || wallet}
        className={`
          w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-3
          transition-all duration-200
          ${
            wallet
              ? isDarkMode
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : isDarkMode
              ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
              : "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm"
          }
        `}
      >
        {isConnecting ? (
          <div className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
        ) : wallet ? (
          <>
            <CheckCircleIcon className="w-5 h-5" />
            <span className="font-mono text-sm truncate max-w-xs">
              {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </span>
          </>
        ) : (
          <>
            <MetaMaskIcon className="w-5 h-5" />
            Connect MetaMask
          </>
        )}
      </button>
    </div>
  );
};

export default WalletConnect;
