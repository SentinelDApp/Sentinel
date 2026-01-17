/**
 * RetailerQRScanner Component
 * 
 * Beautiful, theme-aware QR scanner specifically designed for retailer delivery scanning.
 * Supports both camera and image upload modes with smooth animations.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useRetailerTheme } from '../context/ThemeContext';

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const CameraIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CameraOffIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const SwitchCameraIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const FlashIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CaptureIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <circle cx="12" cy="12" r="6" fill="currentColor" />
  </svg>
);

const AlertIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const QRCodeIcon = ({ className = "w-12 h-12" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6 20h2M6 8h2m8 0h2M6 4h2m8 0h2" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// SCANNER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SCANNER_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
  disableFlip: false,
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: true
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const RetailerQRScanner = ({
  onScan,
  onError,
  disabled = false,
  scanDelay = 1500,
}) => {
  const { isDarkMode } = useRetailerTheme();
  
  // State
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lastScannedData, setLastScannedData] = useState(null);
  
  // Refs
  const scannerRef = useRef(null);
  const scannerContainerId = useRef(`retailer-scanner-${Date.now()}`);
  const lastScanTime = useRef(0);

  // ═══════════════════════════════════════════════════════════════════════
  // CAMERA DETECTION
  // ═══════════════════════════════════════════════════════════════════════

  const detectCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      
      if (devices.length > 0) {
        // Prefer back camera
        const backCamera = devices.find(
          (device) => device.label.toLowerCase().includes('back') ||
                      device.label.toLowerCase().includes('rear')
        );
        setSelectedCamera(backCamera || devices[0]);
        return devices;
      } else {
        setError('No cameras found on this device');
        return [];
      }
    } catch (err) {
      console.error('Camera detection error:', err);
      
      if (err.message?.includes('Permission')) {
        setPermissionDenied(true);
        setError('Camera permission denied');
      } else {
        setError('Failed to detect cameras');
      }
      
      if (onError) onError(err);
      return [];
    }
  }, [onError]);

  // ═══════════════════════════════════════════════════════════════════════
  // SCANNER LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════

  const startScanner = useCallback(async () => {
    if (disabled || isScanning || isInitializing || !selectedCamera) return;
    
    setIsInitializing(true);
    setError(null);

    try {
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === Html5QrcodeScannerState.SCANNING || 
              state === Html5QrcodeScannerState.PAUSED) {
            await scannerRef.current.stop();
          }
        } catch (e) {}
        scannerRef.current = null;
      }
      
      scannerRef.current = new Html5Qrcode(scannerContainerId.current);

      const onScanSuccess = (decodedText) => {
        const now = Date.now();
        
        if (now - lastScanTime.current < scanDelay) return;
        if (decodedText === lastScannedData) return;

        lastScanTime.current = now;
        setLastScannedData(decodedText);

        if (navigator.vibrate) navigator.vibrate(100);
        if (onScan) onScan(decodedText);
      };

      const onScanError = () => {};

      await scannerRef.current.start(
        selectedCamera.id,
        SCANNER_CONFIG,
        onScanSuccess,
        onScanError
      );

      setIsScanning(true);
      setIsPaused(false);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      scannerRef.current = null;
      
      if (err.message?.includes('Permission') || err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Camera permission denied');
      } else if (err.message?.includes('in use')) {
        setError('Camera is in use by another application');
      } else {
        setError('Failed to start camera');
      }
      
      if (onError) onError(err);
    } finally {
      setIsInitializing(false);
    }
  }, [disabled, isScanning, isInitializing, selectedCamera, scanDelay, lastScannedData, onScan, onError]);

  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return;

    try {
      const state = scannerRef.current.getState();
      if (state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED) {
        await scannerRef.current.stop();
      }
      setIsScanning(false);
      setIsPaused(false);
    } catch (err) {
      console.error('Failed to stop scanner:', err);
    }
  }, []);

  const togglePause = useCallback(async () => {
    if (!scannerRef.current || !isScanning) return;

    try {
      if (isPaused) {
        await scannerRef.current.resume();
        setIsPaused(false);
      } else {
        await scannerRef.current.pause();
        setIsPaused(true);
      }
    } catch (err) {
      console.error('Failed to toggle pause:', err);
    }
  }, [isScanning, isPaused]);

  const switchCamera = useCallback(async () => {
    if (cameras.length < 2) return;

    const currentIndex = cameras.findIndex(c => c.id === selectedCamera?.id);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    await stopScanner();
    setSelectedCamera(nextCamera);
  }, [cameras, selectedCamera, stopScanner]);

  const restartScanner = useCallback(async () => {
    await stopScanner();
    setError(null);
    setLastScannedData(null);
    setTimeout(() => startScanner(), 500);
  }, [stopScanner, startScanner]);

  // ═══════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    detectCameras();
    return () => {
      if (scannerRef.current) {
        stopScanner().then(() => {
          scannerRef.current = null;
        });
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCamera && !isScanning && !disabled && !error && !isInitializing) {
      startScanner();
    }
  }, [selectedCamera, disabled, error, isInitializing]);

  useEffect(() => {
    if (disabled && isScanning) {
      stopScanner();
    }
  }, [disabled, isScanning, stopScanner]);

  // ═══════════════════════════════════════════════════════════════════════
  // THEME CLASSES
  // ═══════════════════════════════════════════════════════════════════════

  const bgClass = isDarkMode ? 'bg-slate-900' : 'bg-slate-100';
  const textClass = isDarkMode ? 'text-white' : 'text-slate-900';
  const mutedClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const borderClass = isDarkMode ? 'border-slate-700' : 'border-slate-300';
  const cardBg = isDarkMode ? 'bg-slate-800/80' : 'bg-white/80';
  const btnPrimary = 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600';
  const btnSecondary = isDarkMode 
    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
    : 'bg-slate-200 text-slate-700 hover:bg-slate-300';

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  // Permission denied
  if (permissionDenied) {
    return (
      <div className={`relative rounded-2xl overflow-hidden ${bgClass} p-8`}>
        <div className="flex flex-col items-center justify-center text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
            <CameraOffIcon className={`w-10 h-10 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${textClass}`}>Camera Access Required</h3>
          <p className={`text-sm mb-6 max-w-xs ${mutedClass}`}>
            Please allow camera access in your browser settings to scan QR codes.
          </p>
          <button
            onClick={() => {
              setPermissionDenied(false);
              setError(null);
              detectCameras();
            }}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${btnPrimary}`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No cameras
  if (cameras.length === 0 && !isInitializing && !error) {
    return (
      <div className={`relative rounded-2xl overflow-hidden ${bgClass} p-8`}>
        <div className="flex flex-col items-center justify-center text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <CameraOffIcon className={`w-10 h-10 ${mutedClass}`} />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${textClass}`}>No Camera Found</h3>
          <p className={`text-sm max-w-xs ${mutedClass}`}>
            Please connect a camera or use a device with a camera to scan QR codes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Scanner Container */}
      <div className={`relative rounded-2xl overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-900'}`}>
        {/* Video Element Container */}
        <div
          id={scannerContainerId.current}
          className="w-full aspect-[4/3] min-h-[320px]"
        />

        {/* Beautiful Scanning Overlay */}
        {isScanning && !isPaused && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
            
            {/* Scanning Frame */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Animated Corner Brackets */}
                <div className="absolute -top-1 -left-1 w-12 h-12">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-transparent rounded-full animate-pulse" />
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-transparent rounded-full animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-12 h-12">
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-emerald-400 to-transparent rounded-full animate-pulse" />
                  <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-transparent rounded-full animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-12 h-12">
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-transparent rounded-full animate-pulse" />
                  <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-t from-emerald-400 to-transparent rounded-full animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-12 h-12">
                  <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-emerald-400 to-transparent rounded-full animate-pulse" />
                  <div className="absolute bottom-0 right-0 w-1 h-full bg-gradient-to-t from-emerald-400 to-transparent rounded-full animate-pulse" />
                </div>
                
                {/* Scanning Line */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full animate-scanner-line" />
                
                {/* Center Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 border-2 border-emerald-400/50 rounded-full animate-ping" />
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className={`px-4 py-2 rounded-full backdrop-blur-md ${isDarkMode ? 'bg-black/40' : 'bg-white/40'} flex items-center gap-2`}>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-white">Scanning...</span>
              </div>
            </div>
          </div>
        )}

        {/* Initializing State */}
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin" />
                <div className="absolute inset-2 border-4 border-transparent border-b-teal-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <p className="text-white font-medium">Initializing camera...</p>
              <p className="text-slate-400 text-sm mt-1">Please wait</p>
            </div>
          </div>
        )}

        {/* Paused Overlay */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-slate-700`}>
                <CameraIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-medium">Scanner Paused</p>
              <p className="text-slate-400 text-sm mt-1">Tap resume to continue</p>
            </div>
          </div>
        )}

        {/* Floating Controls */}
        {isScanning && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {/* Pause/Resume */}
            <button
              onClick={togglePause}
              className={`p-3 rounded-full backdrop-blur-md transition-all ${
                isPaused 
                  ? 'bg-emerald-500 text-white' 
                  : isDarkMode ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-white/50 text-slate-900 hover:bg-white/70'
              }`}
            >
              <FlashIcon className="w-5 h-5" />
            </button>
            
            {/* Switch Camera */}
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                disabled={isInitializing}
                className={`p-3 rounded-full backdrop-blur-md transition-all disabled:opacity-50 ${
                  isDarkMode ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-white/50 text-slate-900 hover:bg-white/70'
                }`}
              >
                <SwitchCameraIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={`mt-4 p-4 rounded-xl border ${isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            <AlertIcon className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
              <button
                onClick={restartScanner}
                className={`mt-2 text-sm underline ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Controls (when not scanning) */}
      {!isScanning && !isInitializing && !error && selectedCamera && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={startScanner}
            disabled={disabled}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${btnPrimary}`}
          >
            <CameraIcon className="w-5 h-5" />
            Start Scanner
          </button>
        </div>
      )}

      {/* Instructions */}
      {isScanning && !isPaused && (
        <div className={`mt-4 p-3 rounded-xl text-center ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
          <p className={`text-sm ${mutedClass}`}>
            <span className="font-medium">Position the QR code</span> within the frame for automatic scanning
          </p>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes scanner-line {
          0%, 100% { top: 10%; opacity: 0.3; }
          50% { top: 85%; opacity: 1; }
        }
        .animate-scanner-line {
          animation: scanner-line 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default RetailerQRScanner;
