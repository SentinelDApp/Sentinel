import { useSignupTheme } from '../context/ThemeContext';
import { ROLES } from '../constants';

const RoleSelector = ({ selectedRole, onRoleSelect }) => {
  const { isDarkMode } = useSignupTheme();

  return (
    <div>
      <label
        className={`block text-sm font-medium mb-3 ${
          isDarkMode ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Select your role
      </label>
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedRole === r.id;

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onRoleSelect(r.id)}
              className={`
                relative p-4 rounded-2xl text-left transition-all duration-200
                ${
                  isSelected
                    ? `${r.bgColor} ${r.borderColor} border-2`
                    : isDarkMode
                    ? "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600"
                    : "bg-white border border-slate-200 hover:border-slate-300 shadow-sm"
                }
              `}
            >
              {isSelected && (
                <div
                  className={`
                    absolute top-3 right-3 w-5 h-5 rounded-full 
                    bg-gradient-to-br ${r.color}
                    flex items-center justify-center
                  `}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <div
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center mb-3
                  bg-gradient-to-br ${r.color}
                `}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                {r.title}
              </h3>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {r.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelector;
