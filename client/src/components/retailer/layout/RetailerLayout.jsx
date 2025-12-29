/**
 * RetailerLayout Component
 * Main layout wrapper for retailer dashboard pages.
 * Provides consistent styling and structure.
 */

import { RetailerThemeProvider } from '../context/ThemeContext';

function RetailerLayout({ children }) {
  return (
    <RetailerThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Background Pattern Overlay */}
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjI4MzUiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20 pointer-events-none" />
        
        {/* Main Content */}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {children}
        </div>
      </div>
    </RetailerThemeProvider>
  );
}

export default RetailerLayout;
