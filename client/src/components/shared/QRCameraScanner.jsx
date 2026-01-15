/**
 * QRCameraScanner Component
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * REAL-TIME QR CODE SCANNER USING DEVICE CAMERA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This component provides real camera-based QR code scanning using the
 * html5-qrcode library. It handles:
 * 
 * - Camera access and permissions
 * - Real-time QR code detection
 * - Multiple camera selection (front/back)
 * - Scanning feedback (visual and audio)
 * - Error handling for camera issues
 * 
 * USAGE:
 * <QRCameraScanner
 *   onScan={(qrData) => handleScan(qrData)}
 *   onError={(error) => handleError(error)}
 *   disabled={false}
 * />
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, SwitchCamera, Zap, AlertCircle, Aperture, Loader2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// SCANNER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  fps: 10,                          // Frames per second for scanning
  qrbox: { width: 250, height: 250 }, // Scanning box size
  aspectRatio: 1.0,                 // Square aspect ratio for mobile
  disableFlip: false,               // Allow image flip
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: true  // Use native API if available
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const QRCameraScanner = ({
  onScan,
  onError,
  disabled = false,
  className = '',
  showControls = true,
  autoStart = true,
  scanDelay = 1500,  // Delay between scans to prevent duplicates
}) => {
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
  const scannerContainerId = useRef(`qr-scanner-${Date.now()}`);
  const lastScanTime = useRef(0);
  const canvasRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // CAMERA DETECTION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get available cameras
   */
  const detectCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      
      if (devices.length > 0) {
        // Prefer back camera on mobile devices
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

  // ═══════════════════════════════════════════════════════════════════════
  // SCANNER LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Start the QR scanner
   */
  const startScanner = useCallback(async () => {
    // Guard against multiple starts or invalid state
    if (disabled || isScanning || isInitializing || !selectedCamera) return;
    
    setIsInitializing(true);
    setError(null);

    try {
      // Stop any existing scanner first to prevent state conflicts
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
      
      // Create fresh scanner instance
      scannerRef.current = new Html5Qrcode(scannerContainerId.current);

      // Success callback - called when QR code is detected
      const onScanSuccess = (decodedText, decodedResult) => {
        const now = Date.now();
        
        // Prevent duplicate scans within scanDelay
        if (now - lastScanTime.current < scanDelay) {
          return;
        }
        
        // Prevent same QR from being scanned twice in a row
        if (decodedText === lastScannedData) {
          return;
        }

        lastScanTime.current = now;
        setLastScannedData(decodedText);

        // Trigger vibration feedback on mobile
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }

        // Call the parent handler
        if (onScan) {
          onScan(decodedText, decodedResult);
        }
      };

      // Error callback (called frequently for non-QR frames)
      const onScanError = (errorMessage) => {
        // Ignore "No QR code found" errors - these are normal
        if (!errorMessage.includes('No MultiFormat Readers') &&
            !errorMessage.includes('No QR code found')) {
          console.warn('Scan error:', errorMessage);
        }
      };

      // Start scanning
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
      
      // Reset scanner ref on error
      scannerRef.current = null;
      
      if (err.message?.includes('Permission') || err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Camera permission denied');
      } else if (err.message?.includes('in use') || err.name === 'NotReadableError') {
        setError('Camera is in use by another application or tab. Please close other apps using the camera.');
      } else if (err.message?.includes('transition')) {
        // State transition error - retry after delay
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

  /**
   * Stop the QR scanner
   */
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

  /**
   * Pause/Resume scanning
   */
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

  /**
   * Switch between cameras
   */
  const switchCamera = useCallback(async () => {
    if (cameras.length < 2) return;

    const currentIndex = cameras.findIndex(c => c.id === selectedCamera?.id);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    await stopScanner();
    setSelectedCamera(nextCamera);
    // Will auto-restart due to useEffect dependency
  }, [cameras, selectedCamera, stopScanner]);

  /**
   * Restart scanner (useful after errors)
   */
  const restartScanner = useCallback(async () => {
    await stopScanner();
    setError(null);
    setLastScannedData(null);
    setCapturedImage(null);
    
    // Small delay before restart
    setTimeout(() => {
      startScanner();
    }, 500);
  }, [stopScanner, startScanner]);

  /**
   * Capture current frame from camera and scan for QR code
   * This is more reliable than continuous scanning on some devices
   */
  const captureAndScan = useCallback(async () => {
    if (!scannerRef.current || !isScanning) {
      setError('Camera not ready. Please start the scanner first.');
      return;
    }

    setIsCapturing(true);
    setError(null);
    setCapturedImage(null);

    try {
      // Get the video element from the scanner container
      const container = document.getElementById(scannerContainerId.current);
      const video = container?.querySelector('video');
      
      if (!video) {
        throw new Error('Video element not found');
      }

      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob for scanning
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });
      
      if (!blob) {
        throw new Error('Failed to capture image');
      }

      // Create file from blob
      const file = new File([blob], 'capture.png', { type: 'image/png' });
      
      // Save captured image for preview
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImage(imageUrl);

      // Create a new scanner instance for file scanning
      const tempScannerId = `temp-scanner-${Date.now()}`;
      let tempElement = document.createElement('div');
      tempElement.id = tempScannerId;
      tempElement.style.display = 'none';
      document.body.appendChild(tempElement);

      const tempScanner = new Html5Qrcode(tempScannerId);
      
      try {
        const result = await tempScanner.scanFile(file, true);
        
        console.log('QR Code captured and scanned:', result);
        setLastScannedData(result);
        
        // Trigger vibration feedback
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        
        // Call parent handler
        if (onScan) {
          onScan(result);
        }
      } finally {
        // Cleanup temp scanner
        try {
          await tempScanner.clear();
        } catch (e) { /* ignore */ }
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

  // ═══════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════

  // Initialize cameras on mount
  useEffect(() => {
    detectCameras();
    
    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        stopScanner().then(() => {
          scannerRef.current = null;
        });
      }
    };
  }, []);

  // Auto-start when camera is selected
  useEffect(() => {
    if (autoStart && selectedCamera && !isScanning && !disabled && !error && !isInitializing) {
      startScanner();
    }
  }, [selectedCamera, autoStart, disabled, error, isInitializing]);

  // Stop scanner when disabled
  useEffect(() => {
    if (disabled && isScanning) {
      stopScanner();
    }
  }, [disabled, isScanning, stopScanner]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  // Permission denied state
  if (permissionDenied) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-red-50 rounded-xl ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Camera Access Required</h3>
        <p className="text-sm text-red-600 text-center mb-4">
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

  // No cameras found
  if (cameras.length === 0 && !isInitializing && !error) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl ${className}`}>
        <CameraOff className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Camera Found</h3>
        <p className="text-sm text-gray-500 text-center">
          Please connect a camera or use a device with a camera.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Scanner Container */}
      <div className="relative overflow-hidden rounded-xl bg-black">
        {/* Video Element Container */}
        <div
          id={scannerContainerId.current}
          className="w-full aspect-square"
          style={{ minHeight: '300px' }}
        />

        {/* Scanning Overlay */}
        {isScanning && !isPaused && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner Markers */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
              
              {/* Scanning Line Animation */}
              <div className="absolute inset-x-2 h-0.5 bg-green-400 animate-scan-line" />
            </div>
          </div>
        )}

        {/* Loading/Initializing State */}
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
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={restartScanner}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {/* Start/Stop Button */}
          <button
            onClick={isScanning ? stopScanner : startScanner}
            disabled={disabled || isInitializing}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${isScanning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all"
            >
              {isPaused ? (
                <>
                  <Zap className="w-5 h-5" />
                  Resume
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Pause
                </>
              )}
            </button>
          )}

          {/* Capture Button - Manual snapshot scanning */}
          {isScanning && !isPaused && (
            <button
              onClick={captureAndScan}
              disabled={isCapturing || disabled}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all disabled:opacity-50"
            >
              <SwitchCamera className="w-5 h-5" />
              Switch
            </button>
          )}
        </div>
      )}

      {/* Tip for capture mode */}
      {isScanning && !lastScannedData && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 text-center">
            💡 <strong>Tip:</strong> Position the QR code in the frame and press <strong>Capture</strong> to scan.
            Auto-scan may not work on all devices.
          </p>
        </div>
      )}

      {/* Last Scanned Display */}
      {lastScannedData && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-600 mb-1">Last scanned:</p>
          <p className="text-sm font-mono text-green-800 break-all">{lastScannedData}</p>
        </div>
      )}

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-blue-600">Captured frame:</p>
            <button 
              onClick={() => setCapturedImage(null)}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear
            </button>
          </div>
          <img 
            src={capturedImage} 
            alt="Captured frame" 
            className="w-full max-w-xs mx-auto rounded border border-blue-300"
          />
        </div>
      )}

      {/* Camera Selector (if more than one camera) */}
      {cameras.length > 1 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Inline Styles for Animation */}
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

export default QRCameraScanner;
