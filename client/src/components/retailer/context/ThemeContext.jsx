import { createContext, useContext, useState, useEffect } from 'react';

// Theme Context
const RetailerThemeContext = createContext();

export const RetailerThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('retailer-theme');
      if (saved !== null) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default to dark mode for retailer
  });

  useEffect(() => {
    localStorage.setItem('retailer-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <RetailerThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </RetailerThemeContext.Provider>
  );
};

export const useRetailerTheme = () => {
  const context = useContext(RetailerThemeContext);
  if (!context) {
    throw new Error('useRetailerTheme must be used within a RetailerThemeProvider');
  }
  return context;
};

export { RetailerThemeContext };
export default RetailerThemeContext;
