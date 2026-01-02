import { useSignupTheme } from '../context/ThemeContext';
import { 
  ShieldCheckIcon, 
  BlockchainIcon, 
  LocationIcon, 
  CheckCircleIcon, 
  ChartIcon, 
  ClockIcon 
} from '../icons/Icons';

const FEATURE_ICONS = {
  location: LocationIcon,
  checkCircle: CheckCircleIcon,
  chart: ChartIcon,
  clock: ClockIcon,
};

const Sidebar = () => {
  const { isDarkMode } = useSignupTheme();

  const features = [
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
  ];

  return (
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
          {features.map((feature, index) => (
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
  );
};

export default Sidebar;
