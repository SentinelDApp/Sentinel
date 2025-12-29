import { createContext, useContext, useState, useEffect } from "react";

const TransporterThemeContext = createContext();

export const useTransporterTheme = () => {
  const context = useContext(TransporterThemeContext);
  if (!context) {
    throw new Error("useTransporterTheme must be used within a TransporterThemeProvider");
  }
  return context;
};

export const TransporterThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("sentinel-transporter-theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    localStorage.setItem("sentinel-transporter-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <TransporterThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </TransporterThemeContext.Provider>
  );
};

export default TransporterThemeProvider;
