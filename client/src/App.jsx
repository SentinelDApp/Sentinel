import { useState } from "react";
import { AdminApp, ThemeProvider } from "./components/Admin";
import { LoginPage } from "./components/Login";

// Minimal App.jsx - Each team member's UI lives in their own component folder
// e.g. components/Admin, components/Login, components/Transporter, etc.

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);

  const handleLogin = (role) => {
    setCurrentRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentRole(null);
  };

  if (!isLoggedIn) {
    return (
      <ThemeProvider>
        <LoginPage onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  switch (currentRole) {
    case "manufacturer":
    case "admin":
      return <AdminApp role={currentRole} onLogout={handleLogout} />;

    default:
      return <AdminApp role={currentRole} onLogout={handleLogout} />;
  }
}

export default App;
