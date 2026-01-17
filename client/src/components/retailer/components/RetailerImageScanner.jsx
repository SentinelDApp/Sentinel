/**
 * RetailerImageScanner Component
 * 
 * Beautiful, theme-aware image upload scanner for retailer delivery scanning.
 * Features drag & drop, image preview, and smooth animations.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRetailerTheme } from '../context/ThemeContext';

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const UploadIcon = ({ className = "w-12 h-12" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const ImageIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ScanIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6 20h2M6 8h2m8 0h2M6 4h2m8 0h2" />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertCircleIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const RetailerImageScanner = ({
  onScan,
  onError,
  disabled = false,
}) => {
  const { isDarkMode } = useRetailerTheme();
  
  // State
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);
  const scannerId = useRef(`retailer-image-scanner-${Date.now()}`);

  // ═══════════════════════════════════════════════════════════════════════
  // FILE HANDLING
  // ═══════════════════════════════════════════════════════════════════════

  const handleFileSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      setScanError('Please select a valid image file');
      return;
    }
    
    // Reset states
    setScanResult(null);
    setScanError(null);
    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    setScanResult(null);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // SCANNING
  // ═══════════════════════════════════════════════════════════════════════

  const scanImage = useCallback(async () => {
    if (!selectedImage || isScanning || disabled) return;
    
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);
    
    try {
      // Initialize scanner
      if (!scannerRef.current) {
        // Create hidden container for scanner
        let container = document.getElementById(scannerId.current);
        if (!container) {
          container = document.createElement('div');
          container.id = scannerId.current;
          container.style.display = 'none';
          document.body.appendChild(container);
        }
        scannerRef.current = new Html5Qrcode(scannerId.current);
      }
      
      const result = await scannerRef.current.scanFile(selectedImage, true);
      
      if (result) {
        setScanResult(result);
        if (navigator.vibrate) navigator.vibrate(100);
        if (onScan) onScan(result);
      }
    } catch (err) {
      console.error('Image scan error:', err);
      
      const errorMsg = err.message?.includes('No QR code') || err.includes?.('No QR code')
        ? 'No QR code found in image'
        : 'Failed to scan image';
      
      setScanError(errorMsg);
      if (onError) onError(new Error(errorMsg));
    } finally {
      setIsScanning(false);
    }
  }, [selectedImage, isScanning, disabled, onScan, onError]);

  // Auto-scan when image is selected
  React.useEffect(() => {
    if (selectedImage && !scanResult && !scanError) {
      const timer = setTimeout(scanImage, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedImage, scanResult, scanError, scanImage]);

  // Cleanup
  React.useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {}
      }
      const container = document.getElementById(scannerId.current);
      if (container) container.remove();
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // THEME CLASSES
  // ═══════════════════════════════════════════════════════════════════════

  const bgClass = isDarkMode ? 'bg-slate-900' : 'bg-slate-100';
  const textClass = isDarkMode ? 'text-white' : 'text-slate-900';
  const mutedClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const borderClass = isDarkMode ? 'border-slate-700' : 'border-slate-300';
  const btnPrimary = 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600';
  const btnSecondary = isDarkMode 
    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
    : 'bg-slate-200 text-slate-700 hover:bg-slate-300';
  const btnDanger = isDarkMode
    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
    : 'bg-red-100 text-red-600 hover:bg-red-200';

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop Zone / Preview Area */}
      {!selectedImage ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
            min-h-[280px] flex flex-col items-center justify-center p-8
            ${isDragging 
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]' 
              : disabled
                ? `border-slate-500 ${bgClass} opacity-50 cursor-not-allowed`
                : `${borderClass} ${bgClass} hover:border-emerald-500/50 hover:bg-emerald-500/5`
            }
          `}
        >
          {/* Upload Animation */}
          <div className={`
            relative w-20 h-20 rounded-full flex items-center justify-center mb-4
            ${isDragging 
              ? 'bg-emerald-500/20' 
              : isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
            }
          `}>
            <UploadIcon className={`
              transition-transform duration-300
              ${isDragging ? 'text-emerald-400 scale-110 -translate-y-1' : mutedClass}
            `} />
            
            {/* Animated Ring */}
            {isDragging && (
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping" />
            )}
          </div>

          <h3 className={`text-lg font-semibold mb-2 ${textClass}`}>
            {isDragging ? 'Drop Image Here' : 'Upload QR Code Image'}
          </h3>
          
          <p className={`text-sm text-center max-w-xs ${mutedClass}`}>
            Drag & drop an image or <span className="text-emerald-500 font-medium">browse</span> to upload
          </p>

          <div className={`flex items-center gap-2 mt-4 text-xs ${mutedClass}`}>
            <ImageIcon className="w-4 h-4" />
            <span>Supports PNG, JPG, JPEG, GIF</span>
          </div>
        </div>
      ) : (
        <div className={`relative rounded-2xl overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'} border ${borderClass}`}>
          {/* Image Preview */}
          <div className="relative aspect-[4/3] max-h-[320px] overflow-hidden bg-slate-900 flex items-center justify-center">
            <img
              src={imagePreview}
              alt="QR Code Preview"
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin" />
                    <ScanIcon className="absolute inset-0 m-auto w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-white font-medium">Scanning Image...</p>
                </div>
              </div>
            )}

            {/* Success Badge */}
            {scanResult && (
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 text-white shadow-lg">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">QR Found</span>
                </div>
              </div>
            )}
          </div>

          {/* Result / Action Bar */}
          <div className={`p-4 border-t ${borderClass}`}>
            {scanResult ? (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-medium">QR Code Detected</span>
                </div>
                <div className={`p-3 rounded-lg font-mono text-sm break-all ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'} ${mutedClass}`}>
                  {scanResult.length > 100 ? `${scanResult.substring(0, 100)}...` : scanResult}
                </div>
              </div>
            ) : scanError ? (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  <AlertCircleIcon className="w-5 h-5" />
                  <span className="font-medium">{scanError}</span>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={clearImage}
                disabled={isScanning}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 ${btnDanger}`}
              >
                <TrashIcon className="w-4 h-4" />
                Clear
              </button>
              
              {scanError && (
                <button
                  onClick={scanImage}
                  disabled={isScanning}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 ${btnPrimary}`}
                >
                  <ScanIcon className="w-4 h-4" />
                  Retry Scan
                </button>
              )}
              
              {!scanResult && !scanError && !isScanning && (
                <button
                  onClick={scanImage}
                  disabled={isScanning}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 ${btnPrimary}`}
                >
                  <ScanIcon className="w-4 h-4" />
                  Scan QR Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {!selectedImage && !disabled && (
        <div className={`text-center text-xs ${mutedClass}`}>
          <p>Take a clear photo of the QR code for best results</p>
        </div>
      )}
    </div>
  );
};

export default RetailerImageScanner;
