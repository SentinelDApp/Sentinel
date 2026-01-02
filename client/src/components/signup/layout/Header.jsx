import { useSignupTheme } from '../context/ThemeContext';
import { ShieldCheckIcon, SunIcon, MoonIcon } from '../icons/Icons';

const Header = () => {
  const { isDarkMode, toggleTheme } = useSignupTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        fixed top-6 right-6 p-3 rounded-xl transition-all duration-200 z-50
        ${
          isDarkMode
            ? "bg-slate-800 text-slate-400 hover:text-yellow-400"
            : "bg-white text-slate-600 hover:text-amber-500 shadow-lg"
        }
      `}
    >
      {isDarkMode ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  );
};

export const MobileLogo = () => {
  const { isDarkMode } = useSignupTheme();

  return (
    <div className="lg:hidden flex items-center gap-3 mb-8">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
        <ShieldCheckIcon className="w-7 h-7 text-white" />
      </div>
      <div>
        <h1
          className={`text-xl font-bold ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Sentinel
        </h1>
        <p
          className={`text-xs ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Blockchain Tracking
        </p>
      </div>
    </div>
  );
};

export default Header;
