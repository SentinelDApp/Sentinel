/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL AI - ANALYTICS TOOLS FOR CHATBOT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides AI-callable tools for supply chain analytics:
 * - Demand forecasting
 * - Inventory optimization
 * - Delivery predictions
 * - Performance analysis
 * - Anomaly detection
 * 
 * These tools integrate with Google Gemini's function calling feature.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const analyticsService = require('../services/analyticsService');

// ═══════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS (for Gemini Function Calling)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Demand Forecast Tool
 */
const demandForecastTool = {
  name: 'get_demand_forecast',
  description: 'Generate demand forecast and predictions based on historical shipment data. Use this when user asks about demand trends, future predictions, sales forecast, or what to expect in coming days/weeks.',
  parameters: {
    type: 'object',
    properties: {
      product_name: {
        type: 'string',
        description: 'Optional product name to filter forecast (e.g., "Electronics", "Pharmaceuticals")'
      },
      days_history: {
        type: 'number',
        description: 'Number of historical days to analyze (default: 30)'
      },
      forecast_days: {
        type: 'number',
        description: 'Number of days to forecast ahead (default: 7)'
      }
    },
    required: []
  }
};

/**
 * Inventory Analysis Tool
 */
const inventoryAnalysisTool = {
  name: 'analyze_inventory',
  description: 'Analyze current inventory levels and provide optimization recommendations. Use when user asks about stock levels, warehouse inventory, restock needs, or inventory optimization.',
  parameters: {
    type: 'object',
    properties: {
      warehouse_wallet: {
        type: 'string',
        description: 'Optional wallet address of specific warehouse to analyze'
      }
    },
    required: []
  }
};

/**
 * Delivery Prediction Tool
 */
const deliveryPredictionTool = {
  name: 'predict_delivery',
  description: 'Predict estimated delivery time for a specific shipment. Use when user asks when a shipment will arrive, delivery estimate, or ETA.',
  parameters: {
    type: 'object',
    properties: {
      shipment_id: {
        type: 'string',
        description: 'The shipment hash or ID to predict delivery for'
      }
    },
    required: ['shipment_id']
  }
};

/**
 * Performance Analysis Tool
 */
const performanceAnalysisTool = {
  name: 'analyze_performance',
  description: 'Analyze transporter and stakeholder performance metrics. Use when user asks about transporter ratings, performance rankings, best transporters, or delivery success rates.',
  parameters: {
    type: 'object',
    properties: {
      days: {
        type: 'number',
        description: 'Number of days to analyze (default: 30)'
      }
    },
    required: []
  }
};

/**
 * Anomaly Detection Tool
 */
const anomalyDetectionTool = {
  name: 'detect_anomalies',
  description: 'Detect anomalies and issues in the supply chain. Use when user asks about problems, delays, issues, alerts, or what needs attention.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  }
};

/**
 * Insights Report Tool
 */
const insightsReportTool = {
  name: 'generate_insights_report',
  description: 'Generate a comprehensive supply chain insights report with demand forecast, inventory analysis, performance metrics, and recommendations. Use when user asks for overall analysis, dashboard summary, executive report, or comprehensive overview.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  }
};

/**
 * Replenishment Plan Tool
 */
const replenishmentPlanTool = {
  name: 'get_replenishment_plan',
  description: 'Generate procurement and replenishment recommendations. Use when user asks about restocking, procurement plans, what to order, or supplier recommendations.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// TOOL EXECUTORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute demand forecast
 */
const executeDemandForecast = async (args) => {
  const result = await analyticsService.generateDemandForecast({
    productName: args.product_name || null,
    days: args.days_history || 30,
    forecastDays: args.forecast_days || 7
  });

  if (!result.success) {
    return JSON.stringify({
      success: false,
      message: result.message || 'Unable to generate forecast'
    });
  }

  // Format for AI-friendly response
  return JSON.stringify({
    success: true,
    summary: `📊 **Demand Forecast Report**\n\n` +
      `**Analysis Period:** ${result.analysisperiod?.days || 30} days\n` +
      `**Trend:** ${result.trend?.direction} (${result.trend?.percentChange > 0 ? '+' : ''}${result.trend?.percentChange}%)\n\n` +
      `**Historical Stats:**\n` +
      `- Total Shipments: ${result.historicalStats?.totalShipments}\n` +
      `- Avg Daily Shipments: ${result.historicalStats?.avgShipmentsPerDay}\n` +
      `- Avg Daily Quantity: ${result.historicalStats?.avgQuantityPerDay}\n`,
    forecast: result.forecast,
    topProducts: result.topProducts,
    recommendations: result.recommendations,
    weekdayAnalysis: result.weekdayAnalysis
  });
};

/**
 * Execute inventory analysis
 */
const executeInventoryAnalysis = async (args) => {
  const result = await analyticsService.analyzeInventory(args.warehouse_wallet);

  if (!result.success) {
    return JSON.stringify({
      success: false,
      message: result.error || 'Unable to analyze inventory'
    });
  }

  return JSON.stringify({
    success: true,
    summary: `📦 **Inventory Analysis Report**\n\n` +
      `**Current Status:**\n` +
      `- Shipments at Warehouse: ${result.summary?.totalShipmentsAtWarehouse}\n` +
      `- Containers at Warehouse: ${result.summary?.totalContainersAtWarehouse}\n` +
      `- Total Inventory: ${result.summary?.totalInventoryQuantity} units\n` +
      `- Days of Stock: ${result.summary?.daysOfStock}\n` +
      `- Stale Shipments: ${result.summary?.staleShipmentCount}\n`,
    inventoryByProduct: result.inventoryByProduct,
    replenishmentPlan: result.replenishmentPlan,
    recommendations: result.recommendations
  });
};

/**
 * Execute delivery prediction
 */
const executeDeliveryPrediction = async (args) => {
  const result = await analyticsService.predictDeliveryTime(args.shipment_id);

  if (!result.success) {
    return JSON.stringify({
      success: false,
      message: result.message || 'Unable to predict delivery'
    });
  }

  return JSON.stringify({
    success: true,
    summary: `🚚 **Delivery Prediction**\n\n` +
      `**Shipment:** ${result.shipmentHash}\n` +
      `**Current Status:** ${result.currentStatus}\n` +
      `**Progress:** ${result.progress}%\n\n` +
      `**Estimated Delivery:** ${result.prediction?.estimatedDeliveryFormatted}\n` +
      `**Remaining Time:** ~${result.prediction?.remainingHours} hours\n` +
      `**Confidence:** ${result.prediction?.confidence}`,
    prediction: result.prediction,
    timeline: result.statusTimeline
  });
};

/**
 * Execute performance analysis
 */
const executePerformanceAnalysis = async (args) => {
  const result = await analyticsService.analyzeStakeholderPerformance({
    days: args.days || 30
  });

  if (!result.success) {
    return JSON.stringify({
      success: false,
      message: result.error || 'Unable to analyze performance'
    });
  }

  // Format transporter rankings
  const topTransporters = result.transporterRankings?.slice(0, 5).map((t, i) => 
    `${i + 1}. ${t.name} (${t.organization}) - ${t.completionRate}% completion, Score: ${t.performanceScore}`
  ).join('\n') || 'No data available';

  return JSON.stringify({
    success: true,
    summary: `📈 **Performance Analysis Report**\n\n` +
      `**Period:** Last ${result.period?.days} days\n` +
      `**Total Shipments:** ${result.summary?.totalShipments}\n` +
      `**Active Transporters:** ${result.summary?.totalTransporters}\n` +
      `**Avg Completion Rate:** ${result.summary?.avgCompletionRate}%\n\n` +
      `**Top Transporters:**\n${topTransporters}`,
    transporterRankings: result.transporterRankings,
    recommendations: result.recommendations
  });
};

/**
 * Execute anomaly detection
 */
const executeAnomalyDetection = async () => {
  const result = await analyticsService.detectAnomalies();

  if (!result.success) {
    return JSON.stringify({
      success: false,
      message: result.error || 'Unable to detect anomalies'
    });
  }

  // Format anomalies
  const anomalyList = result.anomalies?.map(a => 
    `⚠️ **${a.type}** (${a.severity}): ${a.message}`
  ).join('\n\n') || '✅ No anomalies detected!';

  return JSON.stringify({
    success: true,
    summary: `🔍 **Anomaly Detection Report**\n\n` +
      `**Overall Health:** ${result.overallHealth}\n` +
      `**Total Issues Found:** ${result.totalAnomalies}\n\n` +
      `**Details:**\n${anomalyList}`,
    anomalies: result.anomalies,
    overallHealth: result.overallHealth
  });
};

/**
 * Execute comprehensive insights report
 */
const executeInsightsReport = async () => {
  const result = await analyticsService.generateInsightsReport();

  if (!result.success) {
    return JSON.stringify({
      success: false,
      message: result.error || 'Unable to generate report'
    });
  }

  // Format executive summary
  const statusSummary = Object.entries(result.executiveSummary?.currentStatusSnapshot || {})
    .map(([status, count]) => `- ${status}: ${count}`)
    .join('\n');

  const topRecommendations = result.recommendations?.slice(0, 5).map(r =>
    `• [${r.priority}] ${r.message}`
  ).join('\n') || 'No recommendations';

  return JSON.stringify({
    success: true,
    summary: `📋 **Supply Chain Insights Report**\n` +
      `*Generated: ${new Date(result.generatedAt).toLocaleString()}*\n\n` +
      `**Executive Summary:**\n` +
      `- Overall Health: ${result.executiveSummary?.overallHealth}\n` +
      `- Active Shipments: ${result.executiveSummary?.totalActiveShipments}\n` +
      `- Critical Issues: ${result.executiveSummary?.criticalIssues}\n\n` +
      `**Shipment Status:**\n${statusSummary}\n\n` +
      `**Demand Trend:** ${result.demandForecast?.trend?.direction} (${result.demandForecast?.trend?.percentChange}%)\n\n` +
      `**Inventory Status:** ${result.inventory?.replenishmentPlan?.currentStatus}\n` +
      `- Days of Stock: ${result.inventory?.summary?.daysOfStock}\n\n` +
      `**Top Recommendations:**\n${topRecommendations}`,
    fullReport: result
  });
};

/**
 * Execute replenishment plan
 */
const executeReplenishmentPlan = async () => {
  const result = await analyticsService.analyzeInventory();

  if (!result.success) {
    return JSON.stringify({
      success: false,
      message: result.error || 'Unable to generate replenishment plan'
    });
  }

  const plan = result.replenishmentPlan;

  return JSON.stringify({
    success: true,
    summary: `🛒 **Replenishment Plan**\n\n` +
      `**Current Status:** ${plan?.currentStatus}\n` +
      `**Reorder Point:** ${plan?.reorderPoint} units\n` +
      `**Optimal Order Quantity:** ${plan?.optimalOrderQuantity} units\n` +
      `**Suggested Order Now:** ${plan?.suggestedOrderQuantity} units\n` +
      `**Next Reorder Date:** ${plan?.nextReorderDate}\n\n` +
      `**Recommendations:**\n` +
      result.recommendations?.map(r => `• ${r.message}`).join('\n'),
    replenishmentPlan: plan,
    inventoryByProduct: result.inventoryByProduct
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// TOOL EXECUTOR DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute any analytics tool by name
 */
const executeAnalyticsTool = async (toolName, args) => {
  console.log(`🔧 [Analytics] Executing tool: ${toolName}`, args);

  switch (toolName) {
    case 'get_demand_forecast':
      return await executeDemandForecast(args);
    case 'analyze_inventory':
      return await executeInventoryAnalysis(args);
    case 'predict_delivery':
      return await executeDeliveryPrediction(args);
    case 'analyze_performance':
      return await executePerformanceAnalysis(args);
    case 'detect_anomalies':
      return await executeAnomalyDetection();
    case 'generate_insights_report':
      return await executeInsightsReport();
    case 'get_replenishment_plan':
      return await executeReplenishmentPlan();
    default:
      return JSON.stringify({ error: `Unknown analytics tool: ${toolName}` });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Tool definitions for Gemini
  demandForecastTool,
  inventoryAnalysisTool,
  deliveryPredictionTool,
  performanceAnalysisTool,
  anomalyDetectionTool,
  insightsReportTool,
  replenishmentPlanTool,
  
  // All tools array
  allAnalyticsTools: [
    demandForecastTool,
    inventoryAnalysisTool,
    deliveryPredictionTool,
    performanceAnalysisTool,
    anomalyDetectionTool,
    insightsReportTool,
    replenishmentPlanTool
  ],
  
  // Executor
  executeAnalyticsTool
};
