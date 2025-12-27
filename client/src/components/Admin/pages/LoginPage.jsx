import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
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

const roles = [
  {
    id: "manufacturer",
    title: "Manufacturer",
    description: "Create shipments, manage products, and track deliveries",
    icon: FactoryIcon,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    features: ["Create shipments", "Product management", "Generate QR codes"],
  },
  {
    id: "transporter",
    title: "Transporter",
    description: "Update shipment status and scan boxes during transit",
    icon: TruckIcon,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    features: ["Update transit status", "Scan packages", "Route tracking"],
  },
  {
    id: "warehouse",
    title: "Warehouse",
    description: "Receive shipments, manage inventory, and verify products",
    icon: WarehouseIcon,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    features: ["Inventory management", "Receive shipments", "Quality check"],
  },
  {
    id: "retailer",
    title: "Retailer",
    description: "Receive shipments, verify products, and manage inventory",
    icon: UserIcon,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    features: ["Receive shipments", "Verify products", "Manage inventory"],
  },
];

const LoginPage = ({ onLogin }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      onLogin(selectedRole);
    }, 1500);
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

      {/* Right Panel - Login Form */}
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
              Welcome back
            </h2>
            <p
              className={`mt-2 ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Select your role and sign in to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;

                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`
                        relative p-4 rounded-2xl text-left transition-all duration-200
                        ${
                          isSelected
                            ? `${role.bgColor} ${role.borderColor} border-2`
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
                          bg-gradient-to-br ${role.color}
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
                        bg-gradient-to-br ${role.color}
                      `}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3
                        className={`font-semibold ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {role.title}
                      </h3>
                      <p
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {role.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
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

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Password
                </label>
                <button
                  type="button"
                  className={`text-sm ${
                    isDarkMode
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-500"
                  }`}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
              <label
                htmlFor="remember"
                className={`ml-2 text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedRole || isLoading}
              className={`
                w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2
                transition-all duration-200
                ${
                  selectedRole
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25"
                    : isDarkMode
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }
              `}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in as{" "}
                  {selectedRole
                    ? roles.find((r) => r.id === selectedRole)?.title
                    : "..."}
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>

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
                  Or continue with
                </span>
              </div>
            </div>

            {/* Wallet Connect */}
            <button
              type="button"
              className={`
                w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-3
                transition-all duration-200
                ${
                  isDarkMode
                    ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                    : "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm"
                }
              `}
            >
              <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none">
                <path
                  d="M8.33 13.89c6.48-6.35 16.99-6.35 23.47 0l.78.76c.32.32.32.83 0 1.15l-2.68 2.62c-.16.16-.42.16-.59 0l-1.07-1.05c-4.52-4.43-11.85-4.43-16.37 0l-1.15 1.12c-.16.16-.42.16-.59 0l-2.68-2.62c-.32-.32-.32-.83 0-1.15l.88-.83zm29 5.37l2.38 2.34c.32.32.32.83 0 1.15l-10.75 10.52c-.32.32-.85.32-1.17 0l-7.63-7.47c-.08-.08-.21-.08-.29 0l-7.63 7.47c-.32.32-.85.32-1.17 0L.32 22.75c-.32-.32-.32-.83 0-1.15l2.38-2.34c.32-.32.85-.32 1.17 0l7.63 7.47c.08.08.21.08.29 0l7.63-7.47c.32-.32.85-.32 1.17 0l7.63 7.47c.08.08.21.08.29 0l7.63-7.47c.35-.3.87-.3 1.19.01z"
                  fill="#3B99FC"
                />
              </svg>
              Connect Wallet
            </button>

            {/* Sign Up Link */}
            <p
              className={`text-center text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Don't have an account?{" "}
              <button
                type="button"
                className={`font-medium ${
                  isDarkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-500"
                }`}
              >
                Sign up
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
