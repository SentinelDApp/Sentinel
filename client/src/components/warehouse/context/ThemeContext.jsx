import { createContext, useContext, useState, useEffect } from 'react';

// Theme Context
const WarehouseThemeContext = createContext();

export const WarehouseThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('warehouse-theme');
      if (saved !== null) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('warehouse-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <WarehouseThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </WarehouseThemeContext.Provider>
  );
};

export const useWarehouseTheme = () => {
  const context = useContext(WarehouseThemeContext);
  if (!context) {
    throw new Error('useWarehouseTheme must be used within a WarehouseThemeProvider');
  }
  return context;
};

export { WarehouseThemeContext };
export default WarehouseThemeContext;
