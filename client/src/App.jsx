/**
 * Sentinel - Smart Supply Chain Tracking
 * Main App Component
 * Uses React Router for navigation between role-based dashboards
 */

import { RouterProvider } from 'react-router-dom';
import { useEffect, useState } from 'react';
import router from './router';
import ChatBot from './components/chatbot';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('sentinel_token');
      setIsAuthenticated(!!token);
    };

    // Initial check
    checkAuth();

    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', checkAuth);
    
    // Custom event for same-tab login/logout
    window.addEventListener('sentinel-auth-change', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('sentinel-auth-change', checkAuth);
    };
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      {/* Global AI Chatbot - Only available for authenticated users */}
      {isAuthenticated && <ChatBot />}
    </>
  );
}

export default App;
