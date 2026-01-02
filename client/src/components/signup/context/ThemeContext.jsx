import { createContext, useContext, useState } from 'react';

const SignupThemeContext = createContext();

export const SignupThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <SignupThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </SignupThemeContext.Provider>
  );
};

export const useSignupTheme = () => {
  const context = useContext(SignupThemeContext);
  if (!context) {
    throw new Error('useSignupTheme must be used within a SignupThemeProvider');
  }
  return context;
};
