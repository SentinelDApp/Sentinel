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
  const fileInputRef = useRef(null);

  // Verify product authenticity
  const handleVerifyProduct = async () => {
    if (!productId.trim()) {
      alert("Please enter a product ID or batch ID");
      return;
    }

    setIsVerifying(true);
    try {
      // Try to verify by batch ID first
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/shipments?batchId=${productId}`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const shipment = data.data[0];
          setVerificationResult({
            status: "authentic",
            productName: shipment.productName || "Product",
            manufacturer: shipment.supplierWallet?.substring(0, 10) + "...",
            batchId: shipment.batchId,
            shipmentHash: shipment.shipmentHash,
          });
        } else {
          setVerificationResult({
            status: "not_found",
            batchId: productId,
          });
        }
      } else {
        setVerificationResult({
          status: "not_found",
          batchId: productId,
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        status: "error",
        message: "Unable to verify product. Please try again.",
      });
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
      setProductId(result);
      setVerificationMethod("input");
      await html5QrCode.clear();
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

              <div className="space-y-4">
                {/* Point 1 */}
                <div className="flex items-start gap-4">
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
                  <div>
                    <h3 className="text-lg font-semibold">Scan or Enter ID</h3>
                    <p className={`text-sm ${mutedTextClass} mt-1`}>
                      Scan the QR code on your product or enter the batch ID
                      manually
                    </p>
                  </div>
                </div>

                {/* Point 2 */}
                <div className="flex items-start gap-4">
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
                  <div>
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
                <div className="flex items-start gap-4">
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
                  <div>
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
                <div className="flex items-start gap-4">
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
                  <div>
                    <h3 className="text-lg font-semibold">
                      Trust Verified Products
                    </h3>
                    <p className={`text-sm ${mutedTextClass} mt-1`}>
                      Get instant confirmation with detailed product information
                      and authenticity status
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
}) => {
  const bgClass = darkMode ? "bg-slate-900" : "bg-white";
  const textClass = darkMode ? "text-slate-100" : "text-slate-900";
  const mutedTextClass = darkMode ? "text-slate-400" : "text-slate-600";
  const borderClass = darkMode ? "border-slate-700" : "border-slate-200";
  const inputBgClass = darkMode ? "bg-slate-800" : "bg-slate-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`${bgClass} ${textClass} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}
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
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
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
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
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
                      className={`w-full px-4 py-3 rounded-xl border ${borderClass} ${inputBgClass} ${textClass} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleVerifyProduct()
                      }
                    />
                  </div>
                  <button
                    onClick={handleVerifyProduct}
                    disabled={isVerifying || !productId.trim()}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
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
                    className={`block w-full p-8 border-2 border-dashed rounded-xl cursor-pointer text-center transition-colors ${
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
            // Verification Result
            <div className="space-y-6">
              {verificationResult.status === "authentic" ? (
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
                    Authentic Product
                  </h3>
                  <p className={mutedTextClass}>
                    This product has been verified on the blockchain
                  </p>

                  <div
                    className={`${inputBgClass} rounded-xl p-6 space-y-3 text-left`}
                  >
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

                  <button
                    onClick={handleViewJourney}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    View Product Journey
                  </button>
                </div>
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
                    Product Not Found
                  </h3>
                  <p className={mutedTextClass}>
                    This product could not be verified in our system.
                    <br />
                    It may be counterfeit or not registered.
                  </p>
                  <div className={`${inputBgClass} rounded-xl p-4`}>
                    <p className={`text-sm ${mutedTextClass}`}>
                      Batch ID:{" "}
                      <span className="font-mono">
                        {verificationResult.batchId}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setVerificationResult(null);
                  setProductId("");
                }}
                className={`w-full py-3 px-6 ${darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"} rounded-xl font-semibold transition-colors`}
              >
                Verify Another Product
              </button>
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
