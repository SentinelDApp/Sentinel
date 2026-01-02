import { useSignupTheme } from '../context/ThemeContext';
import Header from './Header';
import Sidebar from './Sidebar';

const SignupLayout = ({ children }) => {
  const { isDarkMode } = useSignupTheme();

  return (
    <div
      className={`
        min-h-screen flex
        ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
        }
      `}
    >
      {/* Theme Toggle */}
      <Header />

      {/* Left Panel - Branding */}
      <Sidebar />

      {/* Right Panel - Content */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SignupLayout;
