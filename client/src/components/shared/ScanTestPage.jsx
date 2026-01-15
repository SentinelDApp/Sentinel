/**
 * QR Scan Test Page
 * 
 * Standalone page to test QR scanning functionality
 * Access at: /test-scan (add route to router.jsx)
 * 
 * For quick testing without modifying existing dashboards
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ScanVerification from '../shared/ScanVerification';
import { ArrowLeft, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ScanTestPage = () => {
  const { user, isLoading } = useAuth();
  const [completedScans, setCompletedScans] = useState([]);

  const handleComplete = (result) => {
    console.log('Scan completed:', result);
    setCompletedScans(prev => [...prev, {
      ...result,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleCancel = () => {
    console.log('Scan cancelled');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            Please login with your wallet to test the QR scanning feature.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-600" />
                  QR Scan Test
                </h1>
                <p className="text-sm text-gray-500">Testing QR verification workflow</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{user.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Scanner */}
          <div>
            <ScanVerification
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          </div>

          {/* Info & History */}
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Scanner Info</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Wallet</span>
                  <span className="font-mono text-sm">
                    {user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Role</span>
                  <span className="font-medium capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    {user.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Permissions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Scan Permissions</h2>
              <div className="space-y-2 text-sm">
                {user.role === 'transporter' && (
                  <>
                    <p className="text-green-600">✓ Can pickup READY_FOR_DISPATCH shipments</p>
                    <p className="text-green-600">✓ Can deliver AT_WAREHOUSE to retailer</p>
                    <p className="text-blue-600">◉ Can verify any shipment status</p>
                  </>
                )}
                {user.role === 'warehouse' && (
                  <>
                    <p className="text-green-600">✓ Can receive IN_TRANSIT shipments</p>
                    <p className="text-blue-600">◉ Can verify any shipment status</p>
                  </>
                )}
                {user.role === 'retailer' && (
                  <>
                    <p className="text-green-600">✓ Can confirm AT_WAREHOUSE deliveries</p>
                    <p className="text-blue-600">◉ Can verify any shipment (authenticity check)</p>
                    <p className="text-gray-500 text-xs mt-2">
                      Scan any QR to verify product authenticity and see shipment details
                    </p>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <p className="text-green-600">✓ Can verify any shipment status</p>
                    <p className="text-green-600">✓ Can view all scan history</p>
                  </>
                )}
              </div>
            </div>

            {/* Completed Scans */}
            {completedScans.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Completed Scans ({completedScans.length})
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {completedScans.map((scan, i) => (
                    <div key={i} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          {scan.shipment?.batchId || scan.scanId}
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {scan.transition?.currentStatus} → {scan.transition?.nextStatus}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>
      </main>
    </div>
  );
};

export default ScanTestPage;
