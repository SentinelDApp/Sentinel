import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import {
  ShieldCheckIcon,
  FactoryIcon,
  TruckIcon,
  WarehouseIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  BlockchainIcon,
  LocationIcon,
  CheckCircleIcon,
  ChartIcon,
  ClockIcon,
} from "../icons/Icons";

// Role display configuration for the UI
const roleDisplayConfig = {
  manufacturer: {
    title: "Manufacturer",
    description: "Create shipments, manage products, and track deliveries",
    icon: FactoryIcon,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    dashboard: "/supplier/dashboard",
  },
  supplier: {
    title: "Supplier",
    description: "Create shipments, manage products, and track deliveries",
    icon: FactoryIcon,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    dashboard: "/supplier/dashboard",
  },
  transporter: {
    title: "Transporter",
    description: "Update shipment status and scan boxes during transit",
    icon: TruckIcon,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    dashboard: "/transporter/dashboard",
  },
  warehouse: {
    title: "Warehouse",
    description: "Receive shipments, manage inventory, and verify products",
    icon: WarehouseIcon,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    dashboard: "/admin/dashboard",
  },
  retailer: {
    title: "Retailer",
    description: "Receive shipments, verify products, and manage inventory",
    icon: UserIcon,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    dashboard: "/retailer/dashboard",
  },
  admin: {
    title: "Admin",
    description: "Manage users, approve requests, and oversee operations",
    icon: ShieldCheckIcon,
    color: "from-red-500 to-rose-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    dashboard: "/admin/dashboard",
  },
};

const LoginPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { login, isAuthenticated, user, connectWallet, checkRole, isLoading: authLoading } = useAuth();
  
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletStatus, setWalletStatus] = useState(null); // Role check result
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('connect'); // 'connect' | 'status' | 'sign'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const config = roleDisplayConfig[user.role] || roleDisplayConfig.admin;
      navigate(config.dashboard);
    }
  }, [isAuthenticated, user, navigate]);

  // Handle wallet connection
  const handleConnectWallet = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const address = await connectWallet();
      setWalletAddress(address);

      // Check role/status
      const status = await checkRole(address);
      setWalletStatus(status);
      setStep('status');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle full login (sign message)
  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(walletAddress);

      if (result.success) {
        const config = roleDisplayConfig[result.role] || roleDisplayConfig.admin;
        navigate(config.dashboard);
      } else {
        setError(result.message || result.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to signup
  const handleGoToSignup = () => {
    navigate('/signup');
  };

  // Get status message and UI based on wallet status
  const getStatusUI = () => {
    if (!walletStatus) return null;

    switch (walletStatus.status) {
      case 'APPROVED':
        const config = roleDisplayConfig[walletStatus.role] || roleDisplayConfig.admin;
        const Icon = config.icon;
        return (
          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${config.color}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Welcome back!</p>
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {walletStatus.fullName || config.title}
                </h3>
              </div>
            </div>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Your wallet is registered as <span className="font-semibold">{walletStatus.role}</span>. 
              Sign a message to verify ownership and login.
            </p>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/25 transition-all"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign & Login
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        );

      case 'PENDING':
        return (
          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              <ClockIcon className={`w-6 h-6 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <h3 className={`font-semibold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                Pending Approval
              </h3>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Your registration is pending admin approval. You'll be able to login once approved.
            </p>
          </div>
        );

      case 'REJECTED':
        return (
          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
              Registration Rejected
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {walletStatus.reason || 'Your registration was rejected. Please contact support.'}
            </p>
          </div>
        );

      case 'SUSPENDED':
        return (
          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
              Account Suspended
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Your account has been suspended. Please contact the administrator.
            </p>
          </div>
        );

      case 'NOT_REGISTERED':
        return (
          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Wallet Not Registered
            </h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              This wallet is not registered in Sentinel. Sign up to request access.
            </p>
            <button
              onClick={handleGoToSignup}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Sign Up
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        );

      default:
        return null;
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
              Secure Supply Chain
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
              Track shipments, verify product authenticity, and ensure
              transparency across your entire supply chain with immutable
              blockchain records.
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

      {/* Right Panel - Wallet Login */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
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
              {step === 'connect' ? 'Connect Your Wallet' : 'Sign In'}
            </h2>
            <p
              className={`mt-2 ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {step === 'connect' 
                ? 'Connect your MetaMask wallet to access Sentinel' 
                : 'Verify your wallet ownership to continue'}
            </p>
          </div>

          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
              </div>
            )}

            {/* Step 1: Connect Wallet Button */}
            {step === 'connect' && (
              <>
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={isLoading}
                  className={`
                    w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3
                    transition-all duration-200 bg-gradient-to-r from-blue-500 to-cyan-500 
                    text-white hover:shadow-lg hover:shadow-blue-500/25
                  `}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
                        <path
                          d="M8.33 13.89c6.48-6.35 16.99-6.35 23.47 0l.78.76c.32.32.32.83 0 1.15l-2.68 2.62c-.16.16-.42.16-.59 0l-1.07-1.05c-4.52-4.43-11.85-4.43-16.37 0l-1.15 1.12c-.16.16-.42.16-.59 0l-2.68-2.62c-.32-.32-.32-.83 0-1.15l.88-.83zm29 5.37l2.38 2.34c.32.32.32.83 0 1.15l-10.75 10.52c-.32.32-.85.32-1.17 0l-7.63-7.47c-.08-.08-.21-.08-.29 0l-7.63 7.47c-.32.32-.85.32-1.17 0L.32 22.75c-.32-.32-.32-.83 0-1.15l2.38-2.34c.32-.32.85-.32 1.17 0l7.63 7.47c.08.08.21.08.29 0l7.63-7.47c.32-.32.85-.32 1.17 0l7.63 7.47c.08.08.21.08.29 0l7.63-7.47c.35-.3.87-.3 1.19.01z"
                          fill="currentColor"
                        />
                      </svg>
                      Connect MetaMask
                    </>
                  )}
                </button>

                <p className={`text-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  No MetaMask?{' '}
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                  >
                    Install it here
                  </a>
                </p>
              </>
            )}

            {/* Step 2: Show Status */}
            {step === 'status' && (
              <>
                {/* Connected Wallet Display */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                  <p className={`text-xs mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Connected Wallet</p>
                  <p className={`font-mono text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                </div>

                {/* Status-based UI */}
                {getStatusUI()}

                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('connect');
                    setWalletStatus(null);
                    setError(null);
                  }}
                  className={`w-full py-3 rounded-xl font-medium ${
                    isDarkMode 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  } transition-all`}
                >
                  Use Different Wallet
                </button>
              </>
            )}

            {/* Divider */}
            <div className="relative">
              <div className={`absolute inset-0 flex items-center`}>
                <div
                  className={`w-full border-t ${
                    isDarkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                />
              </div>
              <div className="relative flex justify-center text-sm">
                <span
                  className={`px-4 ${
                    isDarkMode
                      ? "bg-slate-950 text-slate-500"
                      : "bg-slate-50 text-slate-500"
                  }`}
                >
                  New to Sentinel?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link
              to="/signup"
              className={`
                w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2
                transition-all duration-200
                ${
                  isDarkMode
                    ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                    : "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm"
                }
              `}
            >
              Create an Account
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
