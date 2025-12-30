import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoxIcon,
  BlockchainIcon,
  AlertIcon,
} from "../icons/Icons";

const verificationStates = {
  idle: "idle",
  verifying: "verifying",
  verified: "verified",
  counterfeit: "counterfeit",
  notFound: "notFound",
};

const mockProductData = {
  id: "PRD-78234",
  name: "Premium Wireless Headphones",
  supplier: "TechCorp Electronics",
  supplierVerified: true,
  batchNumber: "BATCH-2024-1234",
  manufactureDate: "Oct 15, 2024",
  status: "Delivered",
  lastLocation: "Retail Store - NYC",
  blockchainTx: "0x8b7f9d4c2a1e5f8b3d6c9a7e2f4b1d8c5a3e2c",
};

const CustomerVerificationPage = () => {
  const { isDarkMode } = useTheme();
  const [productId, setProductId] = useState("");
  const [verificationState, setVerificationState] = useState(
    verificationStates.idle
  );
  const [productData, setProductData] = useState(null);

  const handleVerify = (e) => {
    e.preventDefault();
    if (!productId.trim()) return;

    setVerificationState(verificationStates.verifying);

    // Simulate verification delay
    setTimeout(() => {
      // Simulate different results based on input
      if (productId.toLowerCase().includes("fake")) {
        setVerificationState(verificationStates.counterfeit);
        setProductData(null);
      } else if (productId.toLowerCase().includes("unknown")) {
        setVerificationState(verificationStates.notFound);
        setProductData(null);
      } else {
        setVerificationState(verificationStates.verified);
        setProductData({ ...mockProductData, id: productId.toUpperCase() });
      }
    }, 1500);
  };

  const handleReset = () => {
    setProductId("");
    setVerificationState(verificationStates.idle);
    setProductData(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div
          className={`
            w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
            bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg
          `}
        >
          <ShieldCheckIcon className="w-8 h-8 text-white" />
        </div>
        <h1
          className={`text-2xl lg:text-3xl font-bold ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Product Verification
        </h1>
        <p
          className={`mt-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
        >
          Enter product ID or batch ID to verify authenticity
        </p>
      </div>

      {/* Verification Form */}
      <div
        className={`
          rounded-2xl p-6 lg:p-8
          ${
            isDarkMode
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-slate-200/50 shadow-sm"
          }
        `}
      >
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Product ID or Batch ID
            </label>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="e.g., PRD-78234 or BATCH-2024-1234"
              disabled={verificationState === verificationStates.verifying}
              className={`
                w-full px-4 py-3.5 rounded-xl text-lg outline-none transition-all
                ${
                  isDarkMode
                    ? "bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500"
                    : "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                }
                ${
                  verificationState === verificationStates.verifying
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
            />
          </div>

          <button
            type="submit"
            disabled={
              !productId.trim() ||
              verificationState === verificationStates.verifying
            }
            className={`
              w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3
              transition-all duration-200
              ${
                !productId.trim() ||
                verificationState === verificationStates.verifying
                  ? isDarkMode
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25"
              }
            `}
          >
            {verificationState === verificationStates.verifying ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="w-5 h-5" />
                Verify Product
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verification Result */}
      {verificationState === verificationStates.verified && productData && (
        <div
          className={`
            rounded-2xl overflow-hidden
            ${
              isDarkMode
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-slate-200/50 shadow-sm"
            }
          `}
        >
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Product Authentic</h2>
            <p className="text-white/80 text-sm mt-1">Verified on blockchain</p>
          </div>

          {/* Product Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <BoxIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3
                  className={`font-semibold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {productData.name}
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {productData.supplier}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Product ID", value: productData.id },
                { label: "Batch", value: productData.batchNumber },
                { label: "Manufactured", value: productData.manufactureDate },
                { label: "Status", value: productData.status },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl ${
                    isDarkMode ? "bg-slate-800/50" : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`font-medium mt-0.5 ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Blockchain TX */}
            <div
              className={`
                p-4 rounded-xl flex items-center gap-3
                ${
                  isDarkMode
                    ? "bg-slate-800/30 border border-slate-700/50"
                    : "bg-slate-50 border border-slate-200"
                }
              `}
            >
              <BlockchainIcon
                className={`w-5 h-5 ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-slate-500" : "text-slate-500"
                  }`}
                >
                  Blockchain Transaction
                </p>
                <p
                  className={`text-sm font-mono truncate ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {productData.blockchainTx}
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className={`
                w-full py-3 rounded-xl font-medium transition-colors
                ${
                  isDarkMode
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }
              `}
            >
              Verify Another Product
            </button>
          </div>
        </div>
      )}

      {/* Counterfeit Result */}
      {verificationState === verificationStates.counterfeit && (
        <div
          className={`
            rounded-2xl overflow-hidden
            ${
              isDarkMode
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-slate-200/50 shadow-sm"
            }
          `}
        >
          <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
              <XCircleIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Warning: Counterfeit
            </h2>
            <p className="text-white/80 text-sm mt-1">
              This product could not be verified
            </p>
          </div>
          <div className="p-6 text-center">
            <p
              className={`mb-4 ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Please contact support if you believe this is an error.
            </p>
            <button
              onClick={handleReset}
              className={`
                px-6 py-3 rounded-xl font-medium transition-colors
                ${
                  isDarkMode
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }
              `}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Not Found Result */}
      {verificationState === verificationStates.notFound && (
        <div
          className={`
            rounded-2xl overflow-hidden
            ${
              isDarkMode
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-slate-200/50 shadow-sm"
            }
          `}
        >
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
              <AlertIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Product Not Found</h2>
            <p className="text-white/80 text-sm mt-1">
              This ID is not registered in our system
            </p>
          </div>
          <div className="p-6 text-center">
            <p
              className={`mb-4 ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Please check the ID and try again.
            </p>
            <button
              onClick={handleReset}
              className={`
                px-6 py-3 rounded-xl font-medium transition-colors
                ${
                  isDarkMode
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }
              `}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerVerificationPage;
