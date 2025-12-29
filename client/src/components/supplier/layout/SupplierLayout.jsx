import { SupplierThemeProvider, useSupplierTheme } from '../context/ThemeContext';
import Header from './Header';

const NavigationTabs = ({ tabs, activeTab, setActiveTab }) => {
  const { isDarkMode } = useSupplierTheme();

  return (
    <nav className={`
      backdrop-blur-xl border-b transition-colors duration-200
      ${isDarkMode 
        ? 'bg-slate-900/50 border-slate-800' 
        : 'bg-white/50 border-slate-200'
      }
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 py-3 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

const SupplierLayoutContent = ({ 
  children, 
  tabs, 
  activeTab, 
  setActiveTab, 
  searchQuery, 
  setSearchQuery 
}) => {
  const { isDarkMode } = useSupplierTheme();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-linear-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-linear-to-br from-slate-50 via-white to-slate-100'
    }`}>
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <NavigationTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

const SupplierLayout = (props) => {
  return (
    <SupplierThemeProvider>
      <SupplierLayoutContent {...props} />
    </SupplierThemeProvider>
  );
};

export { NavigationTabs };
export default SupplierLayout;
