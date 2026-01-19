/**
 * RetailerImageScanner Component
 * 
 * Upload or drag-drop a QR code image to scan and verify.
 * Theme-aware component matching the shared QRImageScanner design.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRetailerTheme } from '../context/ThemeContext';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileImage
} from 'lucide-react';

const RetailerImageScanner = ({ onScan, onError, disabled = false }) => {
  const { isDarkMode } = useRetailerTheme();
  
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
      const scannerId = `retailer-image-scanner-${Date.now()}`;
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
      
      setScanResult({ success: true, data: result });
      
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

  // Theme classes
  const bgCard = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const bgMuted = isDarkMode ? 'bg-slate-900' : 'bg-gray-50';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-gray-300';

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
            ? isDarkMode 
              ? 'border-emerald-500 bg-emerald-500/10' 
              : 'border-emerald-500 bg-emerald-50'
            : previewUrl 
              ? `${borderColor} ${bgMuted}` 
              : `${borderColor} hover:border-emerald-400 ${isDarkMode ? 'hover:bg-emerald-500/5' : 'hover:bg-emerald-50'}`
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
              className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-colors ${
                isDarkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                  : 'bg-white hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className={`rounded-xl p-4 flex items-center gap-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  <span className={`font-medium ${textPrimary}`}>Scanning QR Code...</span>
                </div>
              </div>
            )}

            {/* Result Overlay */}
            {scanResult && !isScanning && (
              <div className={`absolute bottom-0 left-0 right-0 p-4 ${
                scanResult.success 
                  ? 'bg-emerald-500/90' 
                  : 'bg-red-500/90'
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
              ${isDragging 
                ? isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100' 
                : isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
              }
            `}>
              {isDragging ? (
                <FileImage className={`w-8 h-8 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              ) : (
                <Upload className={`w-8 h-8 ${textMuted}`} />
              )}
            </div>
            
            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
              {isDragging ? 'Drop Image Here' : 'Upload QR Code Image'}
            </h3>
            
            <p className={`text-sm text-center mb-4 ${textMuted}`}>
              Drag and drop a QR code image, or click to browse
            </p>
            
            <div className={`flex items-center gap-2 text-xs ${textMuted}`}>
              <ImageIcon className="w-4 h-4" />
              <span>Supports JPG, PNG, GIF, WebP</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && !previewUrl && (
        <div className={`mt-3 p-3 rounded-lg border ${
          isDarkMode 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`} />
            <span className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={triggerFileSelect}
          disabled={disabled || isScanning}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Upload className="w-5 h-5" />
          {previewUrl ? 'Upload Another' : 'Select Image'}
        </button>
        
        {previewUrl && (
          <button
            onClick={clearScan}
            disabled={isScanning}
            className={`px-4 py-3 rounded-xl disabled:opacity-50 transition-colors font-medium ${
              isDarkMode 
                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default RetailerImageScanner;
