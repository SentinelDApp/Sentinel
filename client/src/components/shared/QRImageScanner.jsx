/**
 * QRImageScanner Component
 * 
 * Upload or drag-drop a QR code image to scan and verify
 * Works without camera - perfect for testing and desktop use
 */

import React, { useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Camera,
  FileImage
} from 'lucide-react';

const QRImageScanner = ({ onScan, onError, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);

  // Initialize scanner
  const getScanner = useCallback(() => {
    if (!scannerRef.current) {
      // Create a hidden element for the scanner
      const scannerId = `qr-image-scanner-${Date.now()}`;
      let scannerElement = document.getElementById(scannerId);
      if (!scannerElement) {
        scannerElement = document.createElement('div');
        scannerElement.id = scannerId;
        scannerElement.style.display = 'none';
        document.body.appendChild(scannerElement);
      }
      scannerRef.current = new Html5Qrcode(scannerId);
    }
    return scannerRef.current;
  }, []);

  // Scan QR from image file
  const scanImage = useCallback(async (file) => {
    if (!file || disabled) return;

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const scanner = getScanner();
      const result = await scanner.scanFile(file, true);
      
      console.log('QR Code detected - Raw result:', result);
      console.log('QR Code type:', typeof result);
      console.log('QR Code length:', result?.length);
      
      setScanResult({ success: true, data: result });
      
      // Call parent handler
      if (onScan) {
        onScan(result);
      }
    } catch (err) {
      console.error('QR scan error:', err);
      const errorMessage = err?.message || 'No QR code found in image';
      setError(errorMessage);
      setScanResult({ success: false, error: errorMessage });
      
      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setIsScanning(false);
    }
  }, [disabled, getScanner, onScan, onError]);

  // Handle file selection
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      scanImage(file);
    }
  }, [scanImage]);

  // Handle drag events
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      scanImage(file);
    } else {
      setError('Please drop an image file');
    }
  }, [disabled, scanImage]);

  // Clear current scan
  const clearScan = useCallback(() => {
    setPreviewUrl(null);
    setScanResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Trigger file input click
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop Zone / Preview Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!previewUrl ? triggerFileSelect : undefined}
        className={`
          relative w-full min-h-[280px] rounded-xl border-2 border-dashed
          transition-all duration-200 overflow-hidden
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : previewUrl 
              ? 'border-gray-300 bg-gray-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
      >
        {/* Preview Image */}
        {previewUrl ? (
          <div className="relative w-full h-full min-h-[280px]">
            <img
              src={previewUrl}
              alt="QR Code"
              className="w-full h-full object-contain p-4"
            />
            
            {/* Clear Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearScan();
              }}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-xl p-4 flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="text-gray-700 font-medium">Scanning QR Code...</span>
                </div>
              </div>
            )}

            {/* Result Overlay */}
            {scanResult && !isScanning && (
              <div className={`absolute bottom-0 left-0 right-0 p-4 ${
                scanResult.success ? 'bg-green-500/90' : 'bg-red-500/90'
              }`}>
                <div className="flex items-center gap-2 text-white">
                  {scanResult.success ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">QR Code Detected!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">No QR Code Found</span>
                    </>
                  )}
                </div>
                {scanResult.success && (
                  <p className="text-white/90 text-sm mt-1 font-mono truncate">
                    {scanResult.data}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Upload Prompt */
          <div className="flex flex-col items-center justify-center h-full min-h-[280px] p-8">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4
              ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
            `}>
              {isDragging ? (
                <FileImage className="w-8 h-8 text-blue-600" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {isDragging ? 'Drop Image Here' : 'Upload QR Code Image'}
            </h3>
            
            <p className="text-sm text-gray-500 text-center mb-4">
              Drag and drop a QR code image, or click to browse
            </p>
            
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <ImageIcon className="w-4 h-4" />
              <span>Supports JPG, PNG, GIF, WebP</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && !previewUrl && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={triggerFileSelect}
          disabled={disabled || isScanning}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Upload className="w-5 h-5" />
          {previewUrl ? 'Upload Another' : 'Select Image'}
        </button>
        
        {previewUrl && (
          <button
            onClick={clearScan}
            disabled={isScanning}
            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default QRImageScanner;
