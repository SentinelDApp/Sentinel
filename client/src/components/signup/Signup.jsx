import { useState } from "react";
import { Link } from "react-router-dom";

// Icons
const ShieldCheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const FactoryIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M17 18h1" />
    <path d="M12 18h1" />
    <path d="M7 18h1" />
  </svg>
);

const TruckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 13.52 8H12" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </svg>
);

const WarehouseIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" />
    <path d="M6 18h12" />
    <path d="M6 14h12" />
    <rect x="6" y="10" width="12" height="12" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SunIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const ArrowRightIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const BlockchainIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="6" height="6" rx="1" />
    <rect x="16" y="2" width="6" height="6" rx="1" />
    <rect x="9" y="16" width="6" height="6" rx="1" />
    <path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
    <path d="M12 13v3" />
  </svg>
);

const LocationIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const UploadIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const roles = [
  {
    id: "MANUFACTURER",
    title: "Manufacturer",
    description: "Create shipments, manage products, and track deliveries",
    icon: FactoryIcon,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "TRANSPORTER",
    title: "Transporter",
    description: "Update shipment status and scan boxes during transit",
    icon: TruckIcon,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  {
    id: "WAREHOUSE",
    title: "Warehouse",
    description: "Receive shipments, manage inventory, and verify products",
    icon: WarehouseIcon,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    id: "RETAILER",
    title: "Retailer",
    description: "Receive shipments, verify products, and manage inventory",
    icon: UserIcon,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
];

export default function Signup() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [wallet, setWallet] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [document, setDocument] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWallet(accounts[0]);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!wallet) {
      alert("Connect wallet first");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("walletAddress", wallet);
    formData.append("fullName", name);
    formData.append("role", role);
    formData.append("verificationDoc", document);

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Submitted! Wait for Admin Approval.");
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup failed:", error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`
      min-h-screen flex
      ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
      }
    `}
    >
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`
          fixed top-6 right-6 p-3 rounded-xl transition-all duration-200 z-50
          ${
            isDarkMode
              ? "bg-slate-800 text-slate-400 hover:text-yellow-400"
              : "bg-white text-slate-600 hover:text-amber-500 shadow-lg"
          }
        `}
      >
        {isDarkMode ? (
          <SunIcon className="w-5 h-5" />
        ) : (
          <MoonIcon className="w-5 h-5" />
        )}
      </button>

      {/* Left Panel - Branding */}
      <div
        className={`
        hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-12
        ${isDarkMode ? "bg-slate-950 border-r border-slate-800" : "bg-sky-500"}
      `}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className={`
              w-14 h-14 rounded-2xl flex items-center justify-center
              ${
                isDarkMode
                  ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                  : "bg-white/20 backdrop-blur"
              }
            `}
            >
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Sentinel
              </h1>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-white/70"
                }`}
              >
                Blockchain Tracking Platform
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 space-y-6">
            <h2
              className={`text-3xl font-bold ${
                isDarkMode ? "text-white" : "text-white"
              }`}
            >
              Join Our Network
              <br />
              <span className={isDarkMode ? "text-blue-400" : "text-white/80"}>
                Powered by Blockchain
              </span>
            </h2>
            <p
              className={`text-lg max-w-md ${
                isDarkMode ? "text-slate-400" : "text-white/80"
              }`}
            >
              Register as a stakeholder to track shipments, verify product
              authenticity, and ensure transparency across your entire supply
              chain.
            </p>
          </div>

          {/* Feature List */}
          <div className="mt-12 space-y-5">
            {[
              {
                title: "End-to-end shipment tracking",
                icon: LocationIcon,
                color: "text-blue-400",
                bgColor: isDarkMode ? "bg-blue-500/10" : "bg-white/20",
              },
              {
                title: "Instant product verification",
                icon: CheckCircleIcon,
                color: "text-green-400",
                bgColor: isDarkMode ? "bg-green-500/10" : "bg-white/20",
              },
              {
                title: "Real-time status updates",
                icon: ChartIcon,
                color: "text-purple-400",
                bgColor: isDarkMode ? "bg-purple-500/10" : "bg-white/20",
              },
              {
                title: "Immutable audit trail",
                icon: ClockIcon,
                color: "text-amber-400",
                bgColor: isDarkMode ? "bg-amber-500/10" : "bg-white/20",
              },
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-4 group">
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${feature.bgColor}
                    transition-transform duration-200 group-hover:scale-110
                  `}
                >
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <span
                  className={`font-medium ${
                    isDarkMode ? "text-slate-300" : "text-white"
                  }`}
                >
                  {feature.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Blockchain Visual */}
        <div className="flex items-center gap-2 mt-12">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${isDarkMode ? "bg-slate-800" : "bg-white/20"}
              `}
              >
                <BlockchainIcon
                  className={`w-5 h-5 ${
                    isDarkMode ? "text-blue-400" : "text-white"
                  }`}
                />
              </div>
              {i < 4 && (
                <div
                  className={`w-8 h-0.5 ${
                    isDarkMode ? "bg-slate-700" : "bg-white/30"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-2xl">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <ShieldCheckIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1
                className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Sentinel
              </h1>
              <p
                className={`text-xs ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Blockchain Tracking
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2
              className={`text-2xl lg:text-3xl font-bold ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Stakeholder Signup
            </h2>
            <p
              className={`mt-2 ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Register as Manufacturer, Transporter, Warehouse, or Retailer
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Wallet Connection */}
            <div>
              <label
                className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Connect your wallet
              </label>
              <button
                type="button"
                onClick={connectWallet}
                disabled={isConnecting || wallet}
                className={`
                  w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-3
                  transition-all duration-200
                  ${
                    wallet
                      ? isDarkMode
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : isDarkMode
                      ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                      : "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm"
                  }
                `}
              >
                {isConnecting ? (
                  <div className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                ) : wallet ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-mono text-sm truncate max-w-xs">
                      {wallet.slice(0, 6)}...{wallet.slice(-4)}
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none">
                      <path
                        d="M8.33 13.89c6.48-6.35 16.99-6.35 23.47 0l.78.76c.32.32.32.83 0 1.15l-2.68 2.62c-.16.16-.42.16-.59 0l-1.07-1.05c-4.52-4.43-11.85-4.43-16.37 0l-1.15 1.12c-.16.16-.42.16-.59 0l-2.68-2.62c-.32-.32-.32-.83 0-1.15l.88-.83zm29 5.37l2.38 2.34c.32.32.32.83 0 1.15l-10.75 10.52c-.32.32-.85.32-1.17 0l-7.63-7.47c-.08-.08-.21-.08-.29 0l-7.63 7.47c-.32.32-.85.32-1.17 0L.32 22.75c-.32-.32-.32-.83 0-1.15l2.38-2.34c.32-.32.85-.32 1.17 0l7.63 7.47c.08.08.21.08.29 0l7.63-7.47c.32-.32.85-.32 1.17 0l7.63 7.47c.08.08.21.08.29 0l7.63-7.47c.35-.3.87-.3 1.19.01z"
                        fill="#3B99FC"
                      />
                    </svg>
                    Connect MetaMask
                  </>
                )}
              </button>
            </div>

            {/* Name Input */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className={`
                  w-full px-4 py-3 rounded-xl outline-none transition-all
                  ${
                    isDarkMode
                      ? "bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500"
                      : "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 shadow-sm"
                  }
                `}
              />
            </div>

            {/* Role Selection */}
            <div>
              <label
                className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Select your role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`
                        relative p-4 rounded-2xl text-left transition-all duration-200
                        ${
                          isSelected
                            ? `${r.bgColor} ${r.borderColor} border-2`
                            : isDarkMode
                            ? "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600"
                            : "bg-white border border-slate-200 hover:border-slate-300 shadow-sm"
                        }
                      `}
                    >
                      {isSelected && (
                        <div
                          className={`
                          absolute top-3 right-3 w-5 h-5 rounded-full 
                          bg-gradient-to-br ${r.color}
                          flex items-center justify-center
                        `}
                        >
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <div
                        className={`
                        w-10 h-10 rounded-xl flex items-center justify-center mb-3
                        bg-gradient-to-br ${r.color}
                      `}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3
                        className={`font-semibold ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {r.title}
                      </h3>
                      <p
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {r.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Verification Document
              </label>
              <label
                className={`
                  block w-full p-6 rounded-xl text-center cursor-pointer transition-all duration-200 border-2 border-dashed
                  ${
                    document
                      ? isDarkMode
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-emerald-50 border-emerald-200"
                      : isDarkMode
                      ? "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }
                `}
              >
                <input
                  type="file"
                  required
                  onChange={(e) => setDocument(e.target.files[0])}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      ${
                        document
                          ? "bg-emerald-500/20"
                          : isDarkMode
                          ? "bg-slate-700"
                          : "bg-slate-100"
                      }
                    `}
                  >
                    {document ? (
                      <CheckCircleIcon
                        className={`w-6 h-6 ${
                          isDarkMode ? "text-emerald-400" : "text-emerald-500"
                        }`}
                      />
                    ) : (
                      <UploadIcon
                        className={`w-6 h-6 ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      />
                    )}
                  </div>
                  {document ? (
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    >
                      {document.name}
                    </p>
                  ) : (
                    <>
                      <p
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                      >
                        Upload verification document
                      </p>
                      <p
                        className={`text-xs ${
                          isDarkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        PDF, JPG, PNG up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!wallet || !role || isSubmitting}
              className={`
                w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2
                transition-all duration-200
                ${
                  wallet && role
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25"
                    : isDarkMode
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }
              `}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Submit for Approval
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Approval Notice */}
            <div
              className={`
              flex items-center justify-center gap-2 p-3 rounded-xl
              ${isDarkMode ? "bg-amber-500/10" : "bg-amber-50"}
            `}
            >
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span
                className={`text-sm ${
                  isDarkMode ? "text-amber-400" : "text-amber-600"
                }`}
              >
                Approval required before accessing the dashboard
              </span>
            </div>

            {/* Sign In Link */}
            <p
              className={`text-center text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Already registered?{" "}
              <Link
                to="/login"
                className={`font-medium ${
                  isDarkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-500"
                }`}
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}