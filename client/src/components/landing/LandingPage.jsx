/**
 * Sentinel Landing Page
 *
 * Public-facing landing page for product verification and journey tracking.
 * Features:
 * - Hero section with product verification CTA
 * - QR code upload / Product ID input
 * - Product journey timeline
 * - Features showcase
 * - FAQ section
 */

import { useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { TextRotate } from "../ui/text-rotate";

// Skeleton Component for loading states with shimmer effect
const Skeleton = ({ className = "" }) => (
  <div
    className={`relative overflow-hidden bg-slate-700/50 rounded ${className}`}
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
  </div>
);

// AI Summary Skeleton Loader
const AISummarySkeleton = ({ darkMode }) => {
  const bgClass = darkMode ? "bg-slate-800/50" : "bg-slate-100";
  
  return (
    <div className="space-y-6">
      {/* Product Info Skeleton */}
      <div className={`${bgClass} rounded-xl p-6`}>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* Shipment Details Skeleton */}
      <div className={`${bgClass} rounded-xl p-6`}>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>

      {/* AI Summary Skeleton */}
      <div className={`${bgClass} rounded-xl p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Journey Skeleton */}
      <div className={`${bgClass} rounded-xl p-6`}>
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// AI Summary Display Component
const AISummaryDisplay = ({ summaryData, darkMode }) => {
  const bgClass = darkMode ? "bg-slate-800/50" : "bg-slate-100";
  const borderClass = darkMode ? "border-slate-700" : "border-slate-200";
  const mutedTextClass = darkMode ? "text-slate-400" : "text-slate-600";

  const getStatusColor = (status) => {
    const colors = {
      'CREATED': 'bg-blue-500',
      'READY_FOR_DISPATCH': 'bg-yellow-500',
      'IN_TRANSIT': 'bg-purple-500',
      'AT_WAREHOUSE': 'bg-orange-500',
      'DELIVERED': 'bg-green-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-green-500">✓ Product Verified</h3>
      </div>

      {/* Product Info Card */}
      <div className={`${bgClass} rounded-xl p-5 border ${borderClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h4 className="font-semibold">Product Information</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={mutedTextClass}>Product Name</span>
            <span className="font-medium">{summaryData.productInfo.name}</span>
          </div>
          <div className="flex justify-between">
            <span className={mutedTextClass}>Batch ID</span>
            <span className="font-mono text-xs">{summaryData.productInfo.batchId}</span>
          </div>
          <div className="flex justify-between">
            <span className={mutedTextClass}>Total Quantity</span>
            <span>{summaryData.productInfo.totalQuantity} {summaryData.productInfo.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className={mutedTextClass}>Containers</span>
            <span>{summaryData.productInfo.containers}</span>
          </div>
        </div>
      </div>

      {/* Shipment Status & Blockchain */}
      <div className="grid grid-cols-2 gap-4">
        {/* Status Card */}
        <div className={`${bgClass} rounded-xl p-4 border ${borderClass}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(summaryData.shipmentDetails.statusCode)}`}></div>
            <span className={`text-xs ${mutedTextClass}`}>Status</span>
          </div>
          <p className="font-semibold text-sm">{summaryData.shipmentDetails.status}</p>
        </div>

        {/* Blockchain Card */}
        <div className={`${bgClass} rounded-xl p-4 border ${borderClass}`}>
          <div className="flex items-center gap-2 mb-2">
            {summaryData.shipmentDetails.blockchainVerified ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <span className={`text-xs ${mutedTextClass}`}>Blockchain</span>
          </div>
          <p className="font-semibold text-sm">
            {summaryData.shipmentDetails.blockchainVerified ? 'Verified' : 'Pending'}
          </p>
        </div>
      </div>

      {/* AI Summary Card */}
      <div className={`${bgClass} rounded-xl p-5 border ${borderClass} bg-gradient-to-br ${darkMode ? 'from-purple-900/20 to-blue-900/20' : 'from-purple-50 to-blue-50'}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 className="font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">AI Summary</h4>
        </div>
        <p className={`text-sm leading-relaxed ${mutedTextClass}`}>
          {summaryData.aiSummary}
        </p>
      </div>

      {/* Journey Milestones */}
      {summaryData.journeyMilestones && summaryData.journeyMilestones.length > 0 && (
        <div className={`${bgClass} rounded-xl p-5 border ${borderClass}`}>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h4 className="font-semibold">Journey Milestones</h4>
          </div>
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {summaryData.journeyMilestones.map((milestone, index) => (
              <div key={index} className="flex flex-col items-center min-w-[80px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  milestone.status === 'completed' ? 'bg-green-500' : 
                  milestone.status === 'in-progress' ? 'bg-yellow-500 animate-pulse' : 
                  darkMode ? 'bg-slate-600' : 'bg-slate-300'
                }`}>
                  {milestone.status === 'completed' ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : milestone.status === 'in-progress' ? (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  )}
                </div>
                <span className={`text-xs text-center ${milestone.status === 'completed' ? 'text-green-500' : mutedTextClass}`}>
                  {milestone.stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {summaryData.certifications && summaryData.certifications.length > 0 && (
        <div className={`${bgClass} rounded-xl p-5 border ${borderClass}`}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h4 className="font-semibold">Certifications</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {summaryData.certifications.map((cert, index) => (
              <span key={index} className="px-3 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-medium rounded-full">
                {cert.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Supply Chain Info */}
      {(summaryData.supplyChain.supplier || summaryData.supplyChain.transporter || summaryData.supplyChain.warehouse) && (
        <div className={`${bgClass} rounded-xl p-5 border ${borderClass}`}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h4 className="font-semibold">Supply Chain Partners</h4>
          </div>
          <div className="space-y-2 text-sm">
            {summaryData.supplyChain.supplier && (
              <div className="flex justify-between">
                <span className={mutedTextClass}>Supplier</span>
                <span className="font-mono text-xs">{summaryData.supplyChain.supplier}</span>
              </div>
            )}
            {summaryData.supplyChain.transporter && (
              <div className="flex justify-between">
                <span className={mutedTextClass}>Transporter</span>
                <span>{summaryData.supplyChain.transporter}</span>
              </div>
            )}
            {summaryData.supplyChain.warehouse && (
              <div className="flex justify-between">
                <span className={mutedTextClass}>Warehouse</span>
                <span>{summaryData.supplyChain.warehouse}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipment Date */}
      <div className={`text-center text-xs ${mutedTextClass}`}>
        <span>Shipment created on </span>
        <span className="font-medium">
          {new Date(summaryData.shipmentDetails.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </span>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState("input"); // 'input' or 'upload'
  const [productId, setProductId] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [journeyData, setJourneyData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch AI Summary for a product
  const fetchAISummary = async (batchId) => {
    setIsLoadingSummary(true);
    setAiSummary(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/ai-summary/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ batchId }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAiSummary(data.data);
        }
      }
    } catch (error) {
      console.error("AI Summary fetch error:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Verify product authenticity
  const handleVerifyProduct = async () => {
    if (!productId.trim()) {
      alert("Please enter a product ID or batch ID");
      return;
    }

    setIsVerifying(true);
    setIsLoadingSummary(true);
    setAiSummary(null);
    try {
      // Use the tracking API to verify batch ID exists
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/shipments/track/${encodeURIComponent(productId.trim())}`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.shipment) {
          const shipment = data.data.shipment;
          setVerificationResult({
            status: "authentic",
            productName: shipment.productName || "Product",
            manufacturer: shipment.supplierWallet?.substring(0, 10) + "...",
            batchId: shipment.batchId,
            shipmentHash: shipment.shipmentHash,
          });
          // Fetch AI Summary in parallel
          fetchAISummary(shipment.batchId);
        } else {
          setVerificationResult({
            status: "not_found",
            batchId: productId.trim(),
            message:
              "This batch ID does not exist in our system. Please verify the ID and try again.",
          });
          setIsLoadingSummary(false);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setVerificationResult({
          status: "not_found",
          batchId: productId.trim(),
          message:
            errorData.message ||
            "This batch ID could not be found. Please check and try again.",
        });
        setIsLoadingSummary(false);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        status: "error",
        batchId: productId.trim(),
        message:
          "Unable to connect to the server. Please check your internet connection and try again.",
      });
      setIsLoadingSummary(false);
    } finally {
      setIsVerifying(false);
    }
  };

  // Fetch product journey
  const handleViewJourney = async () => {
    if (!verificationResult?.shipmentHash) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/shipments/${verificationResult.shipmentHash}`,
      );

      if (response.ok) {
        const data = await response.json();
        setJourneyData(data.data);
        setShowJourney(true);
      }
    } catch (error) {
      console.error("Journey fetch error:", error);
    }
  };

  // Handle QR image upload
  const handleQRUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const html5QrCode = new Html5Qrcode("qr-reader-hidden");
      const result = await html5QrCode.scanFile(file, true);

      // Check if the scanned result is a tracking URL
      // Expected format: http(s)://domain/:batchId/product-history
      const urlMatch = result.match(/\/([^/]+)\/product-history$/);
      if (urlMatch) {
        // Extract batch ID from URL and show AI summary instead of redirecting
        const batchId = decodeURIComponent(urlMatch[1]);
        setProductId(batchId);
        setVerificationMethod("input");
        await html5QrCode.clear();
        // Auto-verify after setting product ID
        setIsVerifying(true);
        setIsLoadingSummary(true);
        setAiSummary(null);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/shipments/track/${encodeURIComponent(batchId)}`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.shipment) {
              const shipment = data.data.shipment;
              setVerificationResult({
                status: "authentic",
                productName: shipment.productName || "Product",
                manufacturer: shipment.supplierWallet?.substring(0, 10) + "...",
                batchId: shipment.batchId,
                shipmentHash: shipment.shipmentHash,
              });
              fetchAISummary(shipment.batchId);
            } else {
              setVerificationResult({
                status: "not_found",
                batchId: batchId,
                message: "This batch ID does not exist in our system.",
              });
              setIsLoadingSummary(false);
            }
          } else {
            setVerificationResult({
              status: "not_found",
              batchId: batchId,
              message: "This batch ID could not be found.",
            });
            setIsLoadingSummary(false);
          }
        } catch (error) {
          console.error("Verification error:", error);
          setVerificationResult({
            status: "error",
            batchId: batchId,
            message: "Unable to connect to the server.",
          });
          setIsLoadingSummary(false);
        } finally {
          setIsVerifying(false);
        }
        return;
      }

      // Also check for old format (shipment-history) for backward compatibility
      const oldUrlMatch = result.match(/\/([^/]+)\/shipment-history$/);
      if (oldUrlMatch) {
        const batchId = decodeURIComponent(oldUrlMatch[1]);
        setProductId(batchId);
        setVerificationMethod("input");
        await html5QrCode.clear();
        // Auto-verify
        setIsVerifying(true);
        setIsLoadingSummary(true);
        setAiSummary(null);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/shipments/track/${encodeURIComponent(batchId)}`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.shipment) {
              const shipment = data.data.shipment;
              setVerificationResult({
                status: "authentic",
                productName: shipment.productName || "Product",
                manufacturer: shipment.supplierWallet?.substring(0, 10) + "...",
                batchId: shipment.batchId,
                shipmentHash: shipment.shipmentHash,
              });
              fetchAISummary(shipment.batchId);
            } else {
              setVerificationResult({
                status: "not_found",
                batchId: batchId,
                message: "This batch ID does not exist in our system.",
              });
              setIsLoadingSummary(false);
            }
          } else {
            setVerificationResult({
              status: "not_found",
              batchId: batchId,
              message: "This batch ID could not be found.",
            });
            setIsLoadingSummary(false);
          }
        } catch (error) {
          console.error("Verification error:", error);
          setVerificationResult({
            status: "error",
            batchId: batchId,
            message: "Unable to connect to the server.",
          });
          setIsLoadingSummary(false);
        } finally {
          setIsVerifying(false);
        }
        return;
      }

      // If it's not a URL, treat it as a batch ID and auto-verify
      setProductId(result);
      setVerificationMethod("input");
      await html5QrCode.clear();
      // Auto-verify the batch ID
      setIsVerifying(true);
      setIsLoadingSummary(true);
      setAiSummary(null);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/shipments/track/${encodeURIComponent(result)}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.shipment) {
            const shipment = data.data.shipment;
            setVerificationResult({
              status: "authentic",
              productName: shipment.productName || "Product",
              manufacturer: shipment.supplierWallet?.substring(0, 10) + "...",
              batchId: shipment.batchId,
              shipmentHash: shipment.shipmentHash,
            });
            fetchAISummary(shipment.batchId);
          } else {
            setVerificationResult({
              status: "not_found",
              batchId: result,
              message: "This batch ID does not exist in our system.",
            });
            setIsLoadingSummary(false);
          }
        } else {
          setVerificationResult({
            status: "not_found",
            batchId: result,
            message: "This batch ID could not be found.",
          });
          setIsLoadingSummary(false);
        }
      } catch (error) {
        console.error("Verification error:", error);
        setVerificationResult({
          status: "error",
          batchId: result,
          message: "Unable to connect to the server.",
        });
        setIsLoadingSummary(false);
      } finally {
        setIsVerifying(false);
      }
    } catch (error) {
      console.error("QR scan error:", error);
      alert(
        "Could not read QR code from image. Please try another image or enter the ID manually.",
      );
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const bgClass = darkMode ? "bg-slate-950" : "bg-slate-50";
  const textClass = darkMode ? "text-slate-100" : "text-slate-900";
  const mutedTextClass = darkMode ? "text-slate-400" : "text-slate-600";
  const cardBgClass = darkMode ? "bg-slate-900/50" : "bg-white";
  const borderClass = darkMode ? "border-slate-800" : "border-slate-200";

  return (
    <div
      className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}
    >
      {/* Navigation removed - header moved into hero */}

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        {/* Header inside hero */}
        <div className="absolute inset-x-0 top-10 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-blue-600">Sentinel</h1>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Transparency in your hands
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors focus:outline-none ${
                  darkMode ? "bg-yellow-400" : "bg-slate-200"
                }`}
              >
                {/* left icon (sun) */}
                <span className="absolute left-1 text-yellow-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05L5.636 5.636m12.728 0l-1.414 1.414M7.05 16.95l-1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z"
                    />
                  </svg>
                </span>

                {/* moving knob */}
                <span
                  className={`inline-block h-6 w-6 bg-white rounded-full transform transition-transform ${
                    darkMode ? "translate-x-8" : "translate-x-1"
                  }`}
                />

                {/* right icon removed */}
              </button>
            </div>
          </div>
        </div>
        {/* Background gradient blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-12 lg:pt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
                <span className={darkMode ? "text-white" : "text-slate-900"}>
                  VERIFY
                </span>
                <br />
                <span className={darkMode ? "text-white" : "text-slate-900"}>
                  ANY PRODUCT
                </span>
                <br />
                <TextRotate
                  texts={["INSTANTLY", "SECURELY", "RELIABLY", "EFFORTLESSLY"]}
                  mainClassName="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg transform -rotate-1"
                  staggerFrom="last"
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={2500}
                />
              </h1>

              <p className={`text-lg ${mutedTextClass} mb-8 max-w-lg`}>
                Scan QR codes or enter batch IDs to instantly verify product
                authenticity with blockchain-powered intelligence. Stay
                protected, trust verified.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowVerification(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-green-600 text-white rounded-none font-semibold transition-all hover:scale-105"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Verify Product Now
                </button>
                <a
                  href="#how-it-works"
                  className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-none font-semibold border-2 transition-all hover:scale-105 ${
                    darkMode
                      ? "border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-400"
                      : "border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600"
                  }`}
                >
                  See How It Works ?
                </a>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Hero Image */}
              <div className="relative max-w-md">
                <img
                  src="/hero.png"
                  alt="Product Verification"
                  className="w-full h-auto"
                />

                {/* Floating badges */}
                <div
                  className={`absolute -left-4 top-1/4 px-3 py-2 rounded-lg shadow-lg ${darkMode ? "bg-slate-800" : "bg-white"} animate-bounce`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold ${darkMode ? "text-white" : "text-slate-800"}`}
                      >
                        Verified!
                      </p>
                      <p className={`text-[10px] ${mutedTextClass}`}>
                        Authentic
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute -right-4 bottom-1/4 px-3 py-2 rounded-lg shadow-lg ${darkMode ? "bg-slate-800" : "bg-white"}`}
                  style={{
                    animationDelay: "0.5s",
                    animation: "bounce 2s infinite",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold ${darkMode ? "text-white" : "text-slate-800"}`}
                      >
                        Blockchain
                      </p>
                      <p className={`text-[10px] ${mutedTextClass}`}>Secured</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className={`relative overflow-hidden py-20 ${darkMode ? "bg-slate-950" : "bg-white"}`}
      >
        {/* Background gradient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-red-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-12">
            <h2 className="text-4xl lg:text-5xl font-black text-red-500 mb-4 uppercase tracking-tight">
              FEATURES THAT MATTER
            </h2>
            <p
              className={`text-lg ${darkMode ? "text-slate-400" : "text-slate-700"} max-w-3xl`}
            >
              Unlock clarity, speed, and control—Blockchain verification
              designed for your supply chain. Everything you need to stay
              informed and secure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-min">
            {/* Feature 1 - Spans 2 rows */}
            <div className="bg-red-100/95 rounded-3xl p-8 md:row-span-2">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="/blockchain.png"
                  alt="Blockchain"
                  className="w-16 h-16"
                />
                <h3 className="text-2xl font-bold text-black">
                  BLOCKCHAIN SECURED
                </h3>
              </div>
              <p className="text-slate-700 leading-relaxed mb-6">
                Built on Ethereum blockchain with immutable records. Every scan
                is verified, every journey tracked, no intermediaries—just
                configure your supply chain and start verifying
                immediately.Enjoy peace of mind knowing your products are
                protected by decentralized technology.
              </p>
              <div>
                <DotLottieReact
                  src="https://lottie.host/b0e85d63-724d-492e-ab97-700cd99b8746/EZaFt9fSbm.lottie"
                  loop
                  autoplay
                />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-red-100/95 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-2">
                <img src="/instant.png" alt="Instant" className="w-14 h-14" />
                <h3 className="text-2xl font-bold text-black">
                  INSTANT VERIFICATION
                </h3>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Scan QR codes or enter batch IDs to verify product authenticity
                in seconds. Get instant confirmation with detailed product
                information.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-red-100/95 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-2">
                <img
                  src="/traceability.png"
                  alt="Traceability"
                  className="w-14 h-14"
                />
                <h3 className="text-2xl font-bold text-black">
                  FULL TRACEABILITY
                </h3>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Track your product's complete journey from manufacturer to
                delivery. View every checkpoint, warehouse stop, and transport
                leg in real-time.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-red-100/95 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-2">
                <img
                  src="/anti-counterfiet.png"
                  alt="Anti-Counterfeit"
                  className="w-14 h-14"
                />
                <h3 className="text-2xl font-bold text-black">
                  ANTI-COUNTERFEIT
                </h3>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Protect against counterfeit products with tamper-proof
                blockchain verification. Each product has a unique digital
                identity that cannot be forged.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-red-100/95 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-2">
                <img src="/trust.png" alt="Trust" className="w-14 h-14" />
                <h3 className="text-2xl font-bold text-black">
                  CONSUMER TRUST
                </h3>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Build consumer confidence with transparent supply chain data.
                Customers can verify authenticity before purchase with no app
                required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className={`relative overflow-hidden py-20 ${darkMode ? "bg-slate-900/30" : "bg-slate-100/50"}`}
      >
        {/* Background gradient blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - SVG */}
            <div className="flex justify-center">
              <img
                src="/How-it-works.svg"
                alt="How It Works"
                className="w-full max-w-md h-auto"
              />
            </div>

            {/* Right side - Usage points with checkmarks */}
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-2">
                How It Works
              </h2>
              <p className={`text-lg ${mutedTextClass} mb-8`}>
                Simple, secure, and transparent verification in easy steps
              </p>

              <div className="space-y-3">
                {/* Point 1 */}
                <div
                  className={`flex items-center gap-4 p-4 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500 text-white">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Scan or Enter ID</h3>
                    <p className={`text-sm ${mutedTextClass} mt-1`}>
                      Scan the QR code on your product or enter the batch ID
                      manually
                    </p>
                  </div>
                </div>

                {/* Point 2 */}
                <div
                  className={`flex items-center gap-4 p-4 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500 text-white">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      Instant Verification
                    </h3>
                    <p className={`text-sm ${mutedTextClass} mt-1`}>
                      Our system verifies the product against blockchain records
                      in seconds
                    </p>
                  </div>
                </div>

                {/* Point 3 */}
                <div
                  className={`flex items-center gap-4 p-4 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500 text-white">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      View Complete Journey
                    </h3>
                    <p className={`text-sm ${mutedTextClass} mt-1`}>
                      See the complete journey from manufacturing to delivery
                      with full transparency
                    </p>
                  </div>
                </div>

                {/* Point 4 */}
                <div
                  className={`flex items-center gap-4 p-4 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500 text-white">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      Trust Verified Products
                    </h3>
                    <p className={`text-sm ${mutedTextClass} mt-1`}>
                      Get instant confirmation with detailed product
                      information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative overflow-hidden py-20">
        {/* Background gradient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6">
              <span className={darkMode ? "text-white" : "text-slate-900"}>
                FREQUENTLY{" "}
              </span>
              <span className="inline-block px-4 py-2 bg-red-500 text-white rounded-lg">
                ASKED QUESTIONS
              </span>
            </h2>
            <p className={`text-lg ${mutedTextClass} mt-6`}>
              Everything you need to know about product verification
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How do I verify a product?",
                a: "Simply scan the QR code on your product using our verification tool or manually enter the batch ID. You'll get instant results showing whether your product is authentic.",
              },
              {
                q: "What if my product QR code is damaged?",
                a: "You can manually enter the batch ID printed on your product packaging. The batch ID is also accepted for verification.",
              },
              {
                q: "Is my verification data secure?",
                a: "Yes! All verification data is stored on the blockchain, making it tamper-proof and secure. Your queries are encrypted and anonymous.",
              },
              {
                q: "Can I see where my product came from?",
                a: "Absolutely! After verification, you can view the product journey showing manufacturing, warehouse processing, and delivery stages with timestamps.",
              },
              {
                q: "What happens if a product is not found?",
                a: "If a product is not found in our system, it may be counterfeit or not part of our verified supply chain. We recommend contacting the seller for clarification.",
              },
            ].map((faq, index) => (
              <details
                key={index}
                className={`${cardBgClass} border ${borderClass} rounded-none p-6 group open:border-blue-500`}
              >
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-xl font-bold group-open:hidden">+</span>
                  <span className="text-xl font-bold hidden group-open:block">
                    −
                  </span>
                </summary>
                <p className={`mt-4 ${mutedTextClass}`}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${borderClass} py-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={mutedTextClass}>
            © 2026 Sentinel. Powered by Blockchain Technology.
          </p>
        </div>
      </footer>

      {/* Verification Modal */}
      {showVerification && (
        <VerificationModal
          darkMode={darkMode}
          onClose={() => {
            setShowVerification(false);
            setVerificationResult(null);
            setProductId("");
            setAiSummary(null);
            setIsLoadingSummary(false);
          }}
          verificationMethod={verificationMethod}
          setVerificationMethod={setVerificationMethod}
          productId={productId}
          setProductId={setProductId}
          handleVerifyProduct={handleVerifyProduct}
          isVerifying={isVerifying}
          verificationResult={verificationResult}
          handleViewJourney={handleViewJourney}
          handleQRUpload={handleQRUpload}
          isScanning={isScanning}
          fileInputRef={fileInputRef}
          aiSummary={aiSummary}
          isLoadingSummary={isLoadingSummary}
        />
      )}

      {/* Journey Modal */}
      {showJourney && journeyData && (
        <JourneyModal
          darkMode={darkMode}
          onClose={() => setShowJourney(false)}
          journeyData={journeyData}
        />
      )}
    </div>
  );
};

// Verification Modal Component
const VerificationModal = ({
  darkMode,
  onClose,
  verificationMethod,
  setVerificationMethod,
  productId,
  setProductId,
  handleVerifyProduct,
  isVerifying,
  verificationResult,
  handleViewJourney,
  handleQRUpload,
  isScanning,
  fileInputRef,
  aiSummary,
  isLoadingSummary,
}) => {
  const bgClass = darkMode ? "bg-slate-900" : "bg-white";
  const textClass = darkMode ? "text-slate-100" : "text-slate-900";
  const mutedTextClass = darkMode ? "text-slate-400" : "text-slate-600";
  const borderClass = darkMode ? "border-slate-700" : "border-slate-200";
  const inputBgClass = darkMode ? "bg-slate-800" : "bg-slate-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`${bgClass} ${textClass} max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${borderClass} flex items-center justify-between`}
        >
          <div>
            <h2 className="text-2xl font-bold">Verify Product</h2>
            <p className={`text-sm ${mutedTextClass} mt-1`}>
              Scan QR code or enter product/batch ID
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!verificationResult ? (
            <>
              {/* Method Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => setVerificationMethod("input")}
                  className={`flex-1 py-3 px-4 font-medium transition-colors ${
                    verificationMethod === "input"
                      ? "bg-blue-500 text-white"
                      : darkMode
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Enter ID
                </button>
                <button
                  onClick={() => setVerificationMethod("scan")}
                  className={`flex-1 py-3 px-4 font-medium transition-colors ${
                    verificationMethod === "scan"
                      ? "bg-blue-500 text-white"
                      : darkMode
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Upload QR
                </button>
              </div>

              {/* Hidden div for QR scanner */}
              <div id="qr-reader-hidden" style={{ display: "none" }} />

              {/* Input Method */}
              {verificationMethod === "input" ? (
                <div className="space-y-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${mutedTextClass}`}
                    >
                      Product ID or Batch ID
                    </label>
                    <input
                      type="text"
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      placeholder="e.g., 2010-001 or BATCH-2026-001"
                      className={`w-full px-4 py-3 border ${borderClass} ${inputBgClass} ${textClass} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleVerifyProduct()
                      }
                    />
                  </div>
                  <button
                    onClick={handleVerifyProduct}
                    disabled={isVerifying || !productId.trim()}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                  >
                    {isVerifying ? "Verifying..." : "Verify Product"}
                  </button>
                </div>
              ) : (
                // Upload QR Method
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleQRUpload}
                    className="hidden"
                    id="qr-upload"
                  />
                  <label
                    htmlFor="qr-upload"
                    className={`block w-full p-8 border-2 border-dashed cursor-pointer text-center transition-colors ${
                      darkMode
                        ? "border-slate-600 hover:border-blue-500 bg-slate-800/50"
                        : "border-slate-300 hover:border-blue-500 bg-slate-50"
                    }`}
                  >
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className={mutedTextClass}>Scanning QR code...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}
                        >
                          <svg
                            className="w-8 h-8 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-medium ${textClass}`}>
                            Upload QR Code Image
                          </p>
                          <p className={`text-sm ${mutedTextClass}`}>
                            Click to select or drag & drop
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                  <p className={`text-xs text-center ${mutedTextClass}`}>
                    Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              )}
            </>
          ) : (
            // Verification Result with AI Summary
            <div className="space-y-6">
              {verificationResult.status === "authentic" ? (
                <>
                  {/* Show Skeleton while loading AI Summary */}
                  {isLoadingSummary && !aiSummary ? (
                    <AISummarySkeleton darkMode={darkMode} />
                  ) : aiSummary ? (
                    /* Show AI Summary when loaded */
                    <>
                      <AISummaryDisplay summaryData={aiSummary} darkMode={darkMode} />
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => {
                            window.location.href = `/${verificationResult.batchId}/product-history`;
                          }}
                          className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold hover:shadow-lg transition-all rounded-lg"
                        >
                          View Full History
                        </button>
                        <button
                          onClick={onClose}
                          className={`px-6 py-3 ${darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-200 hover:bg-slate-300"} font-semibold transition-colors rounded-lg`}
                        >
                          Close
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Fallback to original result display if AI Summary fails */
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                        <svg
                          className="w-10 h-10 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-green-500">
                        ✓ Product Verified Successfully!
                      </h3>
                      <p className={mutedTextClass}>
                        This product has been verified and exists in our blockchain
                        system
                      </p>

                      <div className={`${inputBgClass} p-6 space-y-3 text-left`}>
                        <div className="flex justify-between">
                          <span className={mutedTextClass}>Product Name:</span>
                          <span className="font-semibold">
                            {verificationResult.productName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={mutedTextClass}>Manufacturer:</span>
                          <span className="font-mono text-sm">
                            {verificationResult.manufacturer}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={mutedTextClass}>Batch ID:</span>
                          <span className="font-mono text-sm">
                            {verificationResult.batchId}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            window.location.href = `/${verificationResult.batchId}/product-history`;
                          }}
                          className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold hover:shadow-lg transition-all"
                        >
                          View Shipment History
                        </button>
                        <button
                          onClick={onClose}
                          className={`px-6 py-3 ${darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-200 hover:bg-slate-300"} font-semibold transition-colors`}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      className="w-10 h-10 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-red-500">
                    ✗ Product Not Found
                  </h3>
                  <div
                    className={`${inputBgClass} rounded-xl p-6 text-left space-y-3`}
                  >
                    <p className={mutedTextClass}>
                      {verificationResult.message ||
                        "This batch ID does not exist in our system."}
                    </p>
                    <div className="pt-3 border-t border-slate-700/50">
                      <p className={`text-sm ${mutedTextClass}`}>
                        Searched Batch ID:{" "}
                        <span className="font-mono text-red-400">
                          {verificationResult.batchId}
                        </span>
                      </p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 mt-3">
                      <p className="text-sm text-amber-400">
                        <strong>⚠️ Note:</strong> Please double-check the batch
                        ID. If you believe this is an error, contact the
                        manufacturer.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className={`w-full py-3 px-6 ${darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"} font-semibold transition-colors rounded-lg`}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Journey Modal Component
const JourneyModal = ({ darkMode, onClose, journeyData }) => {
  const bgClass = darkMode ? "bg-slate-900" : "bg-white";
  const textClass = darkMode ? "text-slate-100" : "text-slate-900";
  const mutedTextClass = darkMode ? "text-slate-400" : "text-slate-600";
  const borderClass = darkMode ? "border-slate-700" : "border-slate-200";

  // Simplified journey stages for customers
  const stages = [
    {
      name: "Manufacturing",
      status: journeyData.status,
      date: journeyData.createdAt,
      completed: true,
      icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    },
    {
      name: "Warehouse",
      status: ["AT_WAREHOUSE", "DELIVERED"].includes(journeyData.status)
        ? "completed"
        : "pending",
      date: journeyData.warehouseReceivedAt,
      completed: ["AT_WAREHOUSE", "DELIVERED"].includes(journeyData.status),
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      name: "Delivered",
      status: journeyData.status === "DELIVERED" ? "completed" : "pending",
      date: journeyData.deliveredAt,
      completed: journeyData.status === "DELIVERED",
      icon: "M5 13l4 4L19 7",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`${bgClass} ${textClass} rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${borderClass} flex items-center justify-between`}
        >
          <div>
            <h2 className="text-2xl font-bold">Product Journey</h2>
            <p className={`text-sm ${mutedTextClass} mt-1`}>
              Track your product from manufacturing to delivery
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-8">
            {stages.map((stage, index) => (
              <div key={index} className="relative flex gap-4">
                {/* Timeline Line */}
                {index < stages.length - 1 && (
                  <div
                    className={`absolute left-6 top-14 bottom-0 w-0.5 ${stage.completed ? "bg-green-500" : darkMode ? "bg-slate-700" : "bg-slate-200"}`}
                  />
                )}

                {/* Icon */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    stage.completed
                      ? "bg-green-500 text-white"
                      : darkMode
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={stage.icon}
                    />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{stage.name}</h3>
                    {stage.completed && (
                      <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  {stage.date && (
                    <p className={`text-sm ${mutedTextClass}`}>
                      {new Date(stage.date).toLocaleString()}
                    </p>
                  )}
                  {!stage.completed && (
                    <p className={`text-sm ${mutedTextClass} mt-1`}>Pending</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Product Details */}
          <div
            className={`mt-8 p-4 rounded-xl ${darkMode ? "bg-slate-800/50" : "bg-slate-50"} border ${borderClass}`}
          >
            <h4 className="font-semibold mb-3">Shipment Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={mutedTextClass}>Batch ID:</span>
                <span className="font-mono">{journeyData.batchId}</span>
              </div>
              <div className="flex justify-between">
                <span className={mutedTextClass}>Containers:</span>
                <span>{journeyData.numberOfContainers}</span>
              </div>
              <div className="flex justify-between">
                <span className={mutedTextClass}>Total Quantity:</span>
                <span>{journeyData.totalQuantity} units</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
