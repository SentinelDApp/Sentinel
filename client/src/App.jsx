/**
 * Sentinel - Smart Supply Chain Tracking
 * Main App Component
 * Uses React Router for navigation between role-based dashboards
 */

import { RouterProvider } from 'react-router-dom';
import router from './router';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
