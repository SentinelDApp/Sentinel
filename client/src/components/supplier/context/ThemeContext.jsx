import { createContext, useContext, useState, useEffect } from 'react';

// Theme Context
const SupplierThemeContext = createContext();

export const SupplierThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('supplier-theme');
      if (saved !== null) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('supplier-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <SupplierThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </SupplierThemeContext.Provider>
  );
};

export const useSupplierTheme = () => {
  const context = useContext(SupplierThemeContext);
  if (!context) {
    throw new Error('useSupplierTheme must be used within a SupplierThemeProvider');
  }
  return context;
};

export { SupplierThemeContext };
export default SupplierThemeContext;
