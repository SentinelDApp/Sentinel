/**
 * AnomalyDetectionModal Component
 * 
 * AI-Based Anomaly & Risk Detection Dashboard
 * Analyzes patterns like rejected scans, reassignments, delays, out-of-order scans
 * Generates actionable risk insights using LLM-style reasoning
 */

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Close: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),

  Warning: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),

  Shield: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),

  ShieldCheck: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),

  AlertTriangle: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),

  Clock: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),

  Refresh: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),

  Scan: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
    </svg>
  ),

  Truck: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),

  Warehouse: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  ),

  Package: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),

  Brain: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),

  TrendDown: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
    </svg>
  ),

  CheckCircle: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),

  XCircle: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),

  Eye: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),

  Lightning: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════════════════════

const AnimatedCounter = ({ value, duration = 1500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const startValue = 0;
    const endValue = parseInt(value) || 0;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(startValue + (endValue - startValue) * easeOutQuart));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{count}</span>;
};

// ═══════════════════════════════════════════════════════════════════════════
// RISK SCORE GAUGE
// ═══════════════════════════════════════════════════════════════════════════

const RiskGauge = ({ score, size = 160, isDarkMode }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius; // Half circle
  const offset = circumference - (animatedScore / 100) * circumference;

  const getColor = (s) => {
    if (s >= 70) return { gradient: 'from-red-500 to-rose-600', text: 'text-red-500', bg: 'bg-red-500' };
    if (s >= 40) return { gradient: 'from-amber-500 to-orange-500', text: 'text-amber-500', bg: 'bg-amber-500' };
    return { gradient: 'from-green-500 to-emerald-500', text: 'text-green-500', bg: 'bg-green-500' };
  };

  const color = getColor(animatedScore);
  const riskLevel = animatedScore >= 70 ? 'HIGH' : animatedScore >= 40 ? 'MEDIUM' : 'LOW';

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size * 0.65 }}>
      <svg width={size} height={size * 0.6} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${10} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - 10} ${size * 0.55}`}
          fill="none"
          stroke={isDarkMode ? '#1e293b' : '#e2e8f0'}
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d={`M ${10} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - 10} ${size * 0.55}`}
          fill="none"
          stroke={`url(#riskGradient)`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={animatedScore >= 70 ? '#ef4444' : animatedScore >= 40 ? '#f59e0b' : '#10b981'} />
            <stop offset="100%" stopColor={animatedScore >= 70 ? '#f43f5e' : animatedScore >= 40 ? '#f97316' : '#34d399'} />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className={`text-4xl font-bold ${color.text}`}>
          <AnimatedCounter value={score} />
        </span>
        <span className={`
          px-3 py-1 rounded-full text-xs font-bold mt-1
          ${animatedScore >= 70 ? 'bg-red-500/20 text-red-400' : animatedScore >= 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}
        `}>
          {riskLevel} RISK
        </span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPING ANIMATION FOR AI INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

const TypingText = ({ text, speed = 20, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        onComplete?.();
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      {!isComplete && <span className="animate-pulse">▋</span>}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ANOMALY CARD
// ═══════════════════════════════════════════════════════════════════════════

const AnomalyCard = ({ anomaly, isDarkMode, index, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimated(true), index * 100);
  }, [index]);

  const severityConfig = {
    critical: {
      bg: isDarkMode ? 'from-red-900/40 to-rose-900/40' : 'from-red-50 to-rose-50',
      border: 'border-red-500/50',
      badge: 'bg-red-500',
      icon: <Icons.XCircle className="w-5 h-5 text-red-500" />,
      glow: 'shadow-red-500/20'
    },
    high: {
      bg: isDarkMode ? 'from-orange-900/40 to-amber-900/40' : 'from-orange-50 to-amber-50',
      border: 'border-orange-500/50',
      badge: 'bg-orange-500',
      icon: <Icons.AlertTriangle className="w-5 h-5 text-orange-500" />,
      glow: 'shadow-orange-500/20'
    },
    medium: {
      bg: isDarkMode ? 'from-amber-900/40 to-yellow-900/40' : 'from-amber-50 to-yellow-50',
      border: 'border-amber-500/50',
      badge: 'bg-amber-500',
      icon: <Icons.Warning className="w-5 h-5 text-amber-500" />,
      glow: 'shadow-amber-500/20'
    },
    low: {
      bg: isDarkMode ? 'from-blue-900/40 to-cyan-900/40' : 'from-blue-50 to-cyan-50',
      border: 'border-blue-500/50',
      badge: 'bg-blue-500',
      icon: <Icons.AlertTriangle className="w-5 h-5 text-blue-500" />,
      glow: 'shadow-blue-500/20'
    }
  };

  const config = severityConfig[anomaly.severity] || severityConfig.medium;

  return (
    <div
      className={`
        relative p-5 rounded-2xl border-2 overflow-hidden cursor-pointer
        transition-all duration-500 transform
        ${animated ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}
        ${expanded ? 'scale-[1.02] shadow-xl ' + config.glow : 'hover:scale-[1.01]'}
        bg-gradient-to-br ${config.bg} ${config.border}
      `}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Pulse indicator for critical */}
      {anomaly.severity === 'critical' && (
        <div className="absolute top-4 right-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} shadow-lg`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${config.badge}`}>
              {anomaly.severity.toUpperCase()}
            </span>
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {anomaly.type}
            </span>
          </div>
          <h4 className={`font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {anomaly.title}
          </h4>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {anomaly.shipmentId}
          </p>
        </div>
      </div>

      {/* AI Analysis */}
      <div className={`
        mt-4 p-4 rounded-xl
        ${isDarkMode ? 'bg-slate-900/50' : 'bg-white/50'}
      `}>
        <div className="flex items-center gap-2 mb-2">
          <Icons.Brain className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <span className={`text-xs font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
            AI Analysis
          </span>
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          {anomaly.aiInsight}
        </p>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className={`
          mt-4 pt-4 border-t space-y-3
          ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}
        `}>
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {anomaly.metrics.map((metric, i) => (
              <div 
                key={i}
                className={`p-3 rounded-xl text-center ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/70'}`}
              >
                <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {metric.value}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icons.Lightning className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-green-500">Recommended Action</span>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
              {anomaly.recommendation}
            </p>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-2 text-xs">
            <Icons.Clock className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
              Detected: {anomaly.detectedAt}
            </span>
          </div>
        </div>
      )}

      {/* Expand indicator */}
      <div className={`
        absolute bottom-2 right-2 text-xs
        ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}
      `}>
        {expanded ? 'Click to collapse' : 'Click for details'}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DEMO ANOMALY DATA
// ═══════════════════════════════════════════════════════════════════════════

const generateDemoAnomalies = () => [
  {
    id: 1,
    severity: 'critical',
    type: 'Repeated Scan Failures',
    title: '5 Consecutive Rejected Scans Detected',
    shipmentId: 'Shipment #SHP-2024-0847',
    aiInsight: 'This shipment shows a pattern of repeated scan failures at the Mumbai warehouse checkpoint. The container QR codes may be damaged or the scanning equipment needs calibration. Historical data shows 89% of similar patterns resulted in delivery delays.',
    metrics: [
      { label: 'Failed Scans', value: '5' },
      { label: 'Success Rate', value: '28%' },
      { label: 'Delay Risk', value: '89%' }
    ],
    recommendation: 'Immediately inspect QR labels on containers #C-4521 to #C-4525. Consider reprinting labels and notify the warehouse supervisor.',
    detectedAt: '2 hours ago'
  },
  {
    id: 2,
    severity: 'high',
    type: 'Transporter Reassignment',
    title: 'Warehouse Reassigned Transporter 3 Times',
    shipmentId: 'Shipment #SHP-2024-0832',
    aiInsight: 'Unusual pattern detected: Central Warehouse has reassigned the transporter 3 times in the last 48 hours. This typically indicates route conflicts or vehicle availability issues. Combined with 2 rejected scans, there is elevated risk of significant delay.',
    metrics: [
      { label: 'Reassignments', value: '3' },
      { label: 'Rejected Scans', value: '2' },
      { label: 'Time Overdue', value: '18h' }
    ],
    recommendation: 'Contact warehouse manager to understand reassignment reasons. Consider assigning a dedicated transporter for this high-priority shipment.',
    detectedAt: '5 hours ago'
  },
  {
    id: 3,
    severity: 'high',
    type: 'Out-of-Order Scanning',
    title: 'Containers Scanned in Wrong Sequence',
    shipmentId: 'Shipment #SHP-2024-0819',
    aiInsight: 'Containers were scanned out of the expected FIFO order. Container #C-3892 was scanned before #C-3890 and #C-3891, suggesting possible mishandling or incorrect loading sequence. This pattern often correlates with inventory mix-ups.',
    metrics: [
      { label: 'Out of Order', value: '4' },
      { label: 'Total Containers', value: '12' },
      { label: 'Accuracy', value: '67%' }
    ],
    recommendation: 'Verify container loading order at source. Implement barcode sequence validation before dispatch.',
    detectedAt: '8 hours ago'
  },
  {
    id: 4,
    severity: 'medium',
    type: 'Abnormal Transit Delay',
    title: 'Transit Time 3x Longer Than Average',
    shipmentId: 'Shipment #SHP-2024-0805',
    aiInsight: 'The transit time from supplier to warehouse is significantly longer than the historical average (72 hours vs expected 24 hours). No scan activity recorded in the last 36 hours. This could indicate route deviation, vehicle breakdown, or driver-related issues.',
    metrics: [
      { label: 'Expected Time', value: '24h' },
      { label: 'Actual Time', value: '72h' },
      { label: 'Delay Factor', value: '3x' }
    ],
    recommendation: 'Contact the assigned transporter immediately to verify shipment location and ETA. Update customer about potential delay.',
    detectedAt: '12 hours ago'
  },
  {
    id: 5,
    severity: 'medium',
    type: 'Scan Gap Detected',
    title: 'Missing Checkpoint Scan',
    shipmentId: 'Shipment #SHP-2024-0791',
    aiInsight: 'Expected scan at Delhi distribution hub was not recorded. The shipment went directly from Noida supplier to Gurgaon warehouse, bypassing the standard checkpoint. This breaks chain of custody verification.',
    metrics: [
      { label: 'Missing Scans', value: '1' },
      { label: 'Route Deviation', value: 'Yes' },
      { label: 'Compliance', value: '85%' }
    ],
    recommendation: 'Verify with transporter why checkpoint was skipped. Update route compliance rules if this is a valid shortcut.',
    detectedAt: '1 day ago'
  },
  {
    id: 6,
    severity: 'low',
    type: 'Unusual Scan Timing',
    title: 'Late Night Scanning Activity',
    shipmentId: 'Shipment #SHP-2024-0778',
    aiInsight: 'Multiple containers were scanned between 2:00 AM - 4:00 AM, outside normal warehouse operating hours (6 AM - 10 PM). While not necessarily problematic, this warrants verification of authorized access.',
    metrics: [
      { label: 'Off-Hours Scans', value: '8' },
      { label: 'Time Window', value: '2 AM' },
      { label: 'User', value: 'WH-023' }
    ],
    recommendation: 'Review access logs for user WH-023. Confirm if night shift operations were authorized.',
    detectedAt: '2 days ago'
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ANOMALY DETECTION MODAL
// ═══════════════════════════════════════════════════════════════════════════

const AnomalyDetectionModal = ({ isOpen, onClose, shipments = [] }) => {
  const { isDarkMode } = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showInsight, setShowInsight] = useState(false);

  // Simulate AI analysis
  useEffect(() => {
    if (isOpen) {
      setIsAnalyzing(true);
      setShowInsight(false);
      
      const timer = setTimeout(() => {
        setAnomalies(generateDemoAnomalies());
        setIsAnalyzing(false);
        setTimeout(() => setShowInsight(true), 500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Calculate stats
  const stats = useMemo(() => {
    const critical = anomalies.filter(a => a.severity === 'critical').length;
    const high = anomalies.filter(a => a.severity === 'high').length;
    const medium = anomalies.filter(a => a.severity === 'medium').length;
    const low = anomalies.filter(a => a.severity === 'low').length;

    return { critical, high, medium, low, total: anomalies.length };
  }, [anomalies]);

  // Calculate dynamic risk score based on active filter
  const riskScore = useMemo(() => {
    // Risk percentages for each severity level
    const riskLevels = {
      critical: 85,  // Critical = 85% risk
      high: 65,      // High = 65% risk
      medium: 40,    // Medium = 40% risk
      low: 15,       // Low = 15% risk
      all: Math.min(75, Math.round(
        (stats.critical * 25 + stats.high * 18 + stats.medium * 8 + stats.low * 3)
      ))  // All = weighted average capped at 75%
    };
    return riskLevels[activeFilter] || riskLevels.all;
  }, [activeFilter, stats]);

  // Filter anomalies
  const filteredAnomalies = useMemo(() => {
    if (activeFilter === 'all') return anomalies;
    return anomalies.filter(a => a.severity === activeFilter);
  }, [anomalies, activeFilter]);

  const filters = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'critical', label: 'Critical', count: stats.critical, color: 'bg-red-500' },
    { id: 'high', label: 'High', count: stats.high, color: 'bg-orange-500' },
    { id: 'medium', label: 'Medium', count: stats.medium, color: 'bg-amber-500' },
    { id: 'low', label: 'Low', count: stats.low, color: 'bg-blue-500' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-3xl shadow-2xl
        ${isDarkMode ? 'bg-slate-900' : 'bg-white'}
        transform transition-all duration-500 animate-modalIn
      `}>
        {/* Header */}
        <div className={`
          sticky top-0 z-20 px-4 sm:px-6 py-4 border-b
          ${isDarkMode ? 'bg-slate-900/95 border-slate-800 backdrop-blur-xl' : 'bg-white/95 border-slate-200 backdrop-blur-xl'}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`
                  p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/25
                `}>
                  <Icons.Shield className="w-6 h-6 text-white" />
                </div>
                {stats.critical > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white items-center justify-center font-bold">
                      {stats.critical}
                    </span>
                  </span>
                )}
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  AI Anomaly Detection
                </h2>
                <p className={`text-sm hidden sm:block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Intelligent risk analysis & insights
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`
                p-2.5 rounded-xl transition-all duration-300 hover:scale-110
                ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}
              `}
            >
              <Icons.Close className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6" style={{ maxHeight: 'calc(95vh - 80px)' }}>
          {/* Analyzing State */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className={`
                  w-24 h-24 rounded-full border-4 border-t-transparent animate-spin
                  ${isDarkMode ? 'border-blue-500' : 'border-blue-600'}
                `} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icons.Brain className={`w-10 h-10 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} animate-pulse`} />
                </div>
              </div>
              <h3 className={`mt-6 text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Analyzing Supply Chain Data...
              </h3>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                AI is scanning {shipments.length || 31} shipments for anomalies
              </p>
              <div className={`mt-4 flex items-center gap-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Checking scan patterns, delays, reassignments...
              </div>
            </div>
          )}

          {/* Results */}
          {!isAnalyzing && (
            <div className="space-y-6">
              {/* Top Stats Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Risk Score */}
                <div className={`
                  p-6 rounded-2xl text-center
                  ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-gradient-to-br from-slate-50 to-white border border-slate-200'}
                `}>
                  <h4 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {activeFilter === 'all' ? 'Overall' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Risk Score
                  </h4>
                  <RiskGauge score={riskScore} size={180} isDarkMode={isDarkMode} />
                </div>

                {/* AI Insight */}
                <div className={`
                  lg:col-span-2 p-6 rounded-2xl
                  ${isDarkMode ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30' : 'bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200'}
                `}>
                  <div className="flex items-center gap-2 mb-4">
                    <Icons.Brain className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      AI Intelligence Summary
                    </h4>
                  </div>
                  <div className={`text-base leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {showInsight ? (
                      <TypingText 
                        text={`Based on analysis of ${shipments.length || 31} shipments, I've identified ${stats.total} potential anomalies requiring attention. ${stats.critical > 0 ? `⚠️ ${stats.critical} critical issue(s) detected with high delay risk. ` : ''}The most concerning patterns involve repeated scan failures and transporter reassignments at the Mumbai warehouse hub. Recommend prioritizing shipments SHP-2024-0847 and SHP-2024-0832 for immediate review.`}
                        speed={15}
                      />
                    ) : (
                      <span className="animate-pulse">Generating insights...</span>
                    )}
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-3 mt-6">
                    {[
                      { label: 'Critical', value: stats.critical, color: 'text-red-500', bg: 'bg-red-500/20' },
                      { label: 'High', value: stats.high, color: 'text-orange-500', bg: 'bg-orange-500/20' },
                      { label: 'Medium', value: stats.medium, color: 'text-amber-500', bg: 'bg-amber-500/20' },
                      { label: 'Low', value: stats.low, color: 'text-blue-500', bg: 'bg-blue-500/20' },
                    ].map((stat, i) => (
                      <div key={i} className={`p-3 rounded-xl text-center ${stat.bg}`}>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className={`
                flex gap-2 p-2 rounded-xl overflow-x-auto
                ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}
              `}>
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                      ${activeFilter === filter.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : isDarkMode
                          ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }
                    `}
                  >
                    {filter.color && <div className={`w-2 h-2 rounded-full ${filter.color}`} />}
                    {filter.label}
                    <span className={`
                      px-1.5 py-0.5 rounded text-xs
                      ${activeFilter === filter.id
                        ? 'bg-white/20'
                        : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                      }
                    `}>
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Anomaly Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredAnomalies.map((anomaly, index) => (
                  <AnomalyCard
                    key={anomaly.id}
                    anomaly={anomaly}
                    isDarkMode={isDarkMode}
                    index={index}
                  />
                ))}
              </div>

              {/* Empty State */}
              {filteredAnomalies.length === 0 && (
                <div className="text-center py-12">
                  <Icons.ShieldCheck className={`w-16 h-16 mx-auto ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  <h3 className={`mt-4 text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    No {activeFilter !== 'all' ? activeFilter : ''} anomalies found
                  </h3>
                  <p className={`mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    All clear for this category!
                  </p>
                </div>
              )}

              {/* Footer Note */}
              <div className={`
                flex items-center justify-between p-4 rounded-xl
                ${isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50'}
              `}>
                <div className="flex items-center gap-2">
                  <Icons.Clock className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Last analyzed: Just now
                  </span>
                </div>
                <button className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${isDarkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }
                `}>
                  <Icons.Refresh className="w-4 h-4" />
                  Re-analyze
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modalIn {
          animation: modalIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AnomalyDetectionModal;
