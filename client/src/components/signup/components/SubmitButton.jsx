import { ArrowRightIcon } from '../icons/Icons';
import { useSignupTheme } from '../context/ThemeContext';

const SubmitButton = ({ isValid, isSubmitting }) => {
  const { isDarkMode } = useSignupTheme();

  return (
    <button
      type="submit"
      disabled={!isValid || isSubmitting}
      className={`
        w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2
        transition-all duration-200
        ${
          isValid
            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25"
            : isDarkMode
            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }
      `}
    >
      {isSubmitting ? (
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          Submit for Approval
          <ArrowRightIcon className="w-5 h-5" />
        </>
      )}
    </button>
  );
};

export default SubmitButton;
