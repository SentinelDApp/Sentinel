/**
 * RetailerQRScanner Component
 * 
 * Camera-based QR scanner for retailer delivery scanning.
 * Theme-aware component matching the shared QRCameraScanner design.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useRetailerTheme } from '../context/ThemeContext';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  SwitchCamera, 
  Zap, 
  AlertCircle, 
  Aperture, 
  Loader2 
} from 'lucide-react';

// Scanner Configuration
const DEFAULT_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
  disableFlip: false,
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: true
  }
};

const RetailerQRScanner = ({
  onScan,
  onError,
  disabled = false,
  className = '',
  showControls = true,
  autoStart = true,
  scanDelay = 1500,
}) => {
  const { isDarkMode } = useRetailerTheme();
  
  // State
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [error, setError] = useState(null);
  const [lastScannedData, setLastScannedData] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  // Refs
  const scannerRef = useRef(null);
  const scannerContainerId = useRef(`retailer-qr-scanner-${Date.now()}`);
  const lastScanTime = useRef(0);

  // Detect cameras
  const detectCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      
      if (devices.length > 0) {
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
        setError('Camera permission denied. Please allow camera access.');
      } else {
        setError('Failed to detect cameras: ' + err.message);
      }
      
      if (onError) onError(err);
      return [];
    }
  }, [onError]);

  // Start scanner
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
        } catch (stopErr) {
          console.warn('Error stopping previous scanner:', stopErr);
        }
        scannerRef.current = null;
      }
      
      scannerRef.current = new Html5Qrcode(scannerContainerId.current);

      const onScanSuccess = (decodedText, decodedResult) => {
        const now = Date.now();
        
        if (now - lastScanTime.current < scanDelay) return;
        if (decodedText === lastScannedData) return;

        lastScanTime.current = now;
        setLastScannedData(decodedText);

        if (navigator.vibrate) navigator.vibrate(100);
        if (onScan) onScan(decodedText, decodedResult);
      };

      const onScanError = (errorMessage) => {
        // Ignore normal scan errors
      };

      await scannerRef.current.start(
        selectedCamera.id,
        DEFAULT_CONFIG,
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
      } else if (err.message?.includes('in use') || err.name === 'NotReadableError') {
        setError('Camera is in use by another application or tab.');
      } else if (err.message?.includes('transition')) {
        setError('Scanner busy, retrying...');
        setTimeout(() => {
          setError(null);
          setIsInitializing(false);
        }, 1000);
        return;
      } else {
        setError('Failed to start camera: ' + (err.message || 'Unknown error'));
      }
      
      if (onError) onError(err);
    } finally {
      setIsInitializing(false);
    }
  }, [disabled, isScanning, isInitializing, selectedCamera, scanDelay, lastScannedData, onScan, onError]);

  // Stop scanner
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

  // Pause/Resume
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

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (cameras.length < 2) return;

    const currentIndex = cameras.findIndex(c => c.id === selectedCamera?.id);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    await stopScanner();
    setSelectedCamera(nextCamera);
  }, [cameras, selectedCamera, stopScanner]);

  // Restart scanner
  const restartScanner = useCallback(async () => {
    await stopScanner();
    setError(null);
    setLastScannedData(null);
    setCapturedImage(null);
    
    setTimeout(() => {
      startScanner();
    }, 500);
  }, [stopScanner, startScanner]);

  // Capture and scan
  const captureAndScan = useCallback(async () => {
    if (!scannerRef.current || !isScanning) {
      setError('Camera not ready. Please start the scanner first.');
      return;
    }

    setIsCapturing(true);
    setError(null);
    setCapturedImage(null);

    try {
      const container = document.getElementById(scannerContainerId.current);
      const video = container?.querySelector('video');
      
      if (!video) throw new Error('Video element not found');

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });
      
      if (!blob) throw new Error('Failed to capture image');

      const file = new File([blob], 'capture.png', { type: 'image/png' });
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImage(imageUrl);

      const tempScannerId = `temp-scanner-${Date.now()}`;
      let tempElement = document.createElement('div');
      tempElement.id = tempScannerId;
      tempElement.style.display = 'none';
      document.body.appendChild(tempElement);

      const tempScanner = new Html5Qrcode(tempScannerId);
      
      try {
        const result = await tempScanner.scanFile(file, true);
        
        setLastScannedData(result);
        if (navigator.vibrate) navigator.vibrate(200);
        if (onScan) onScan(result);
      } finally {
        try {
          await tempScanner.clear();
        } catch (e) {}
        tempElement.remove();
      }
    } catch (err) {
      console.error('Capture and scan error:', err);
      
      if (err.message?.includes('No QR code') || err.message?.includes('No MultiFormat')) {
        setError('No QR code found in captured image. Try adjusting the camera position.');
      } else {
        setError('Failed to scan: ' + (err.message || 'Unknown error'));
      }
      
      if (onError) onError(err);
    } finally {
      setIsCapturing(false);
    }
  }, [isScanning, onScan, onError]);

  // Effects
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
    if (autoStart && selectedCamera && !isScanning && !disabled && !error && !isInitializing) {
      startScanner();
    }
  }, [selectedCamera, autoStart, disabled, error, isInitializing]);

  useEffect(() => {
    if (disabled && isScanning) {
      stopScanner();
    }
  }, [disabled, isScanning, stopScanner]);

  // Theme classes
  const bgMuted = isDarkMode ? 'bg-slate-900' : 'bg-gray-50';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-gray-500';

  // Permission denied
  if (permissionDenied) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 rounded-xl ${isDarkMode ? 'bg-red-500/10' : 'bg-red-50'} ${className}`}>
        <AlertCircle className={`w-12 h-12 mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>Camera Access Required</h3>
        <p className={`text-sm text-center mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          Please allow camera access in your browser settings to scan QR codes.
        </p>
        <button
          onClick={() => {
            setPermissionDenied(false);
            setError(null);
            detectCameras();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No cameras
  if (cameras.length === 0 && !isInitializing && !error) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 rounded-xl ${bgMuted} ${className}`}>
        <CameraOff className={`w-12 h-12 mb-4 ${textMuted}`} />
        <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>No Camera Found</h3>
        <p className={`text-sm text-center ${textMuted}`}>
          Please connect a camera or use a device with a camera.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Scanner Container */}
      <div className={`relative overflow-hidden rounded-xl ${isDarkMode ? 'bg-slate-950' : 'bg-black'}`}>
        {/* Video Element Container */}
        <div
          id={scannerContainerId.current}
          className="w-full aspect-square"
          style={{ minHeight: '300px' }}
        />

        {/* Scanning Overlay */}
        {isScanning && !isPaused && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner Markers - Emerald theme */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              
              {/* Scanning Line Animation */}
              <div className="absolute inset-x-2 h-0.5 bg-emerald-400 animate-scan-line" />
            </div>
          </div>
        )}

        {/* Loading State */}
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center">
              <RefreshCw className="w-10 h-10 text-white animate-spin mx-auto mb-2" />
              <p className="text-white text-sm">Initializing camera...</p>
            </div>
          </div>
        )}

        {/* Paused Overlay */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center">
              <Camera className="w-10 h-10 text-white mx-auto mb-2" />
              <p className="text-white text-sm">Scanner paused</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={`mt-3 p-3 rounded-lg border ${isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
          </div>
          <button
            onClick={restartScanner}
            className={`mt-2 text-sm underline ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
          >
            Try again
          </button>
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
          {/* Start/Stop Button */}
          <button
            onClick={isScanning ? stopScanner : startScanner}
            disabled={disabled || isInitializing}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${isScanning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isScanning ? (
              <>
                <CameraOff className="w-5 h-5" />
                Stop
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Start
              </>
            )}
          </button>

          {/* Pause/Resume Button */}
          {isScanning && (
            <button
              onClick={togglePause}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isDarkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <Zap className="w-5 h-5" />
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}

          {/* Capture Button */}
          {isScanning && !isPaused && (
            <button
              onClick={captureAndScan}
              disabled={isCapturing || disabled}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-teal-600 hover:bg-teal-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Aperture className="w-5 h-5" />
                  Capture
                </>
              )}
            </button>
          )}

          {/* Switch Camera Button */}
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              disabled={isInitializing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <SwitchCamera className="w-5 h-5" />
              Switch
            </button>
          )}
        </div>
      )}

      {/* Tip */}
      {isScanning && !lastScannedData && (
        <div className={`mt-3 p-2 rounded-lg border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
          <p className={`text-xs text-center ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
            💡 <strong>Tip:</strong> Position the QR code in the frame and press <strong>Capture</strong> to scan.
            Auto-scan may not work on all devices.
          </p>
        </div>
      )}

      {/* Last Scanned */}
      {lastScannedData && (
        <div className={`mt-4 p-3 rounded-lg border ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
          <p className={`text-xs mb-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Last scanned:</p>
          <p className={`text-sm font-mono break-all ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>{lastScannedData}</p>
        </div>
      )}

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className={`mt-4 p-3 rounded-lg border ${isDarkMode ? 'bg-teal-500/10 border-teal-500/30' : 'bg-teal-50 border-teal-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Captured frame:</p>
            <button 
              onClick={() => setCapturedImage(null)}
              className={`text-xs underline ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-800'}`}
            >
              Clear
            </button>
          </div>
          <img 
            src={capturedImage} 
            alt="Captured frame" 
            className={`w-full max-w-xs mx-auto rounded border ${isDarkMode ? 'border-teal-500/30' : 'border-teal-300'}`}
          />
        </div>
      )}

      {/* Camera Selector */}
      {cameras.length > 1 && (
        <div className="mt-4">
          <label className={`block text-sm font-medium mb-1 ${textPrimary}`}>
            Camera
          </label>
          <select
            value={selectedCamera?.id || ''}
            onChange={(e) => {
              const camera = cameras.find(c => c.id === e.target.value);
              if (camera) {
                stopScanner().then(() => setSelectedCamera(camera));
              }
            }}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Animation Style */}
      <style>{`
        @keyframes scan-line {
          0% { top: 5%; }
          50% { top: 95%; }
          100% { top: 5%; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default RetailerQRScanner;
