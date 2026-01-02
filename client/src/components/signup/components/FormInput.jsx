import { useSignupTheme } from '../context/ThemeContext';

const FormInput = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required = false,
  helperText,
  isTextarea = false,
  rows = 3 
}) => {
  const { isDarkMode } = useSignupTheme();

  const inputClasses = `
    w-full px-4 py-3 rounded-xl outline-none transition-all
    ${
      isDarkMode
        ? "bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500"
        : "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 shadow-sm"
    }
    ${isTextarea ? "resize-none" : ""}
  `;

  return (
    <div>
      <label
        className={`block text-sm font-medium mb-2 ${
          isDarkMode ? "text-slate-300" : "text-slate-700"
        }`}
      >
        {label}
      </label>
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className={inputClasses}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={inputClasses}
        />
      )}
      {helperText && (
        <p className={`mt-1 text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormInput;
