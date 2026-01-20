/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL AI - ANALYTICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides data analytics and insights for the AI decision support system:
 * - Demand forecasting based on historical data
 * - Inventory optimization recommendations
 * - Supplier performance analysis
 * - Delivery time predictions
 * - Anomaly detection
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Shipment = require('../models/Shipment');
const Container = require('../models/Container');
const ScanLog = require('../models/ScanLog');
const User = require('../models/User');

// ═══════════════════════════════════════════════════════════════════════════
// DEMAND FORECASTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate demand forecast based on historical shipment data
 * Uses simple moving average and trend analysis
 */
const generateDemandForecast = async (options = {}) => {
  const { 
    productName = null, 
    days = 30, 
    forecastDays = 7 
  } = options;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    const query = { createdAt: { $gte: startDate } };
    if (productName) {
      query.productName = { $regex: productName, $options: 'i' };
    }

    // Get historical shipments
    const shipments = await Shipment.find(query)
      .sort({ createdAt: 1 })
      .lean();

    if (shipments.length === 0) {
      return {
        success: false,
        message: 'No historical data available for forecasting',
        forecast: null
      };
    }

    // Group by day
    const dailyData = {};
    shipments.forEach(s => {
      const day = s.createdAt.toISOString().split('T')[0];
      if (!dailyData[day]) {
        dailyData[day] = { shipments: 0, quantity: 0, products: {} };
      }
      dailyData[day].shipments += 1;
      dailyData[day].quantity += s.totalQuantity || 0;
      
      const pName = s.productName || 'Unknown';
      dailyData[day].products[pName] = (dailyData[day].products[pName] || 0) + (s.totalQuantity || 0);
    });

    // Calculate averages and trends
    const dailyValues = Object.values(dailyData);
    const avgShipmentsPerDay = dailyValues.reduce((sum, d) => sum + d.shipments, 0) / dailyValues.length;
    const avgQuantityPerDay = dailyValues.reduce((sum, d) => sum + d.quantity, 0) / dailyValues.length;

    // Simple trend calculation (comparing first half to second half)
    const midpoint = Math.floor(dailyValues.length / 2);
    const firstHalfAvg = dailyValues.slice(0, midpoint).reduce((sum, d) => sum + d.quantity, 0) / midpoint || 0;
    const secondHalfAvg = dailyValues.slice(midpoint).reduce((sum, d) => sum + d.quantity, 0) / (dailyValues.length - midpoint) || 0;
    const trendPercent = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    // Identify top products
    const productTotals = {};
    Object.values(dailyData).forEach(day => {
      Object.entries(day.products).forEach(([product, qty]) => {
        productTotals[product] = (productTotals[product] || 0) + qty;
      });
    });
    const topProducts = Object.entries(productTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity, avgDaily: quantity / dailyValues.length }));

    // Day of week patterns
    const dayOfWeekPatterns = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dayOfWeekCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    shipments.forEach(s => {
      const dow = s.createdAt.getDay();
      dayOfWeekPatterns[dow] += s.totalQuantity || 0;
      dayOfWeekCounts[dow] += 1;
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayAnalysis = Object.keys(dayOfWeekPatterns).map(dow => ({
      day: dayNames[dow],
      avgQuantity: dayOfWeekCounts[dow] > 0 ? Math.round(dayOfWeekPatterns[dow] / dayOfWeekCounts[dow]) : 0,
      shipmentCount: dayOfWeekCounts[dow]
    }));

    // Generate forecast for next N days
    const forecast = [];
    const today = new Date();
    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      const dow = forecastDate.getDay();
      
      // Apply trend and day-of-week adjustment
      const baseQuantity = avgQuantityPerDay;
      const trendAdjustment = baseQuantity * (trendPercent / 100) * (i / forecastDays);
      const dowAvg = dayOfWeekCounts[dow] > 0 ? dayOfWeekPatterns[dow] / dayOfWeekCounts[dow] : avgQuantityPerDay;
      const dowFactor = avgQuantityPerDay > 0 ? dowAvg / avgQuantityPerDay : 1;
      
      const predictedQuantity = Math.round((baseQuantity + trendAdjustment) * dowFactor);
      const predictedShipments = Math.round(avgShipmentsPerDay * dowFactor);

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        dayOfWeek: dayNames[dow],
        predictedQuantity: Math.max(0, predictedQuantity),
        predictedShipments: Math.max(0, predictedShipments),
        confidence: Math.max(50, 90 - (i * 5)) // Confidence decreases for further forecasts
      });
    }

    return {
      success: true,
      analysisperiod: { start: startDate.toISOString().split('T')[0], end: today.toISOString().split('T')[0], days },
      historicalStats: {
        totalShipments: shipments.length,
        totalQuantity: shipments.reduce((sum, s) => sum + (s.totalQuantity || 0), 0),
        avgShipmentsPerDay: Math.round(avgShipmentsPerDay * 10) / 10,
        avgQuantityPerDay: Math.round(avgQuantityPerDay * 10) / 10
      },
      trend: {
        direction: trendPercent > 5 ? 'INCREASING' : trendPercent < -5 ? 'DECREASING' : 'STABLE',
        percentChange: Math.round(trendPercent * 10) / 10
      },
      topProducts,
      weekdayAnalysis,
      forecast,
      recommendations: generateDemandRecommendations(trendPercent, avgQuantityPerDay, topProducts)
    };
  } catch (error) {
    console.error('Demand forecast error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate recommendations based on demand analysis
 */
const generateDemandRecommendations = (trendPercent, avgQuantity, topProducts) => {
  const recommendations = [];

  if (trendPercent > 10) {
    recommendations.push({
      type: 'CAPACITY',
      priority: 'HIGH',
      message: `Demand is increasing by ${Math.round(trendPercent)}%. Consider expanding warehouse capacity and transporter contracts.`
    });
  } else if (trendPercent < -10) {
    recommendations.push({
      type: 'OPTIMIZATION',
      priority: 'MEDIUM',
      message: `Demand is decreasing by ${Math.abs(Math.round(trendPercent))}%. Review inventory levels to avoid overstocking.`
    });
  }

  if (topProducts.length > 0) {
    recommendations.push({
      type: 'INVENTORY',
      priority: 'MEDIUM',
      message: `Top product "${topProducts[0].name}" accounts for significant volume. Ensure adequate stock levels.`
    });
  }

  return recommendations;
};

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyze inventory and provide optimization recommendations
 */
const analyzeInventory = async (warehouseWallet = null) => {
  try {
    // Get shipments at warehouse
    const query = { status: 'AT_WAREHOUSE' };
    if (warehouseWallet) {
      query['assignedWarehouse.walletAddress'] = warehouseWallet.toLowerCase();
    }

    const warehouseShipments = await Shipment.find(query).lean();
    const containers = await Container.find({ 
      status: 'AT_WAREHOUSE',
      shipmentHash: { $in: warehouseShipments.map(s => s.shipmentHash) }
    }).lean();

    // Get recent delivery patterns (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deliveredShipments = await Shipment.find({
      status: 'DELIVERED',
      updatedAt: { $gte: thirtyDaysAgo }
    }).lean();

    // Calculate metrics
    const currentInventory = containers.reduce((sum, c) => sum + (c.quantity || 0), 0);
    const avgDailyDemand = deliveredShipments.reduce((sum, s) => sum + (s.totalQuantity || 0), 0) / 30;
    const daysOfStock = avgDailyDemand > 0 ? Math.round(currentInventory / avgDailyDemand) : 999;

    // Group inventory by product
    const inventoryByProduct = {};
    warehouseShipments.forEach(s => {
      const product = s.productName || 'Unknown';
      if (!inventoryByProduct[product]) {
        inventoryByProduct[product] = { quantity: 0, shipments: 0, containers: 0 };
      }
      inventoryByProduct[product].quantity += s.totalQuantity || 0;
      inventoryByProduct[product].shipments += 1;
    });

    containers.forEach(c => {
      const shipment = warehouseShipments.find(s => s.shipmentHash === c.shipmentHash);
      if (shipment) {
        const product = shipment.productName || 'Unknown';
        if (inventoryByProduct[product]) {
          inventoryByProduct[product].containers += 1;
        }
      }
    });

    // Generate recommendations
    const recommendations = [];
    
    if (daysOfStock < 7) {
      recommendations.push({
        type: 'RESTOCK',
        priority: 'CRITICAL',
        message: `Only ${daysOfStock} days of stock remaining. Immediate replenishment required.`,
        action: 'Create procurement order'
      });
    } else if (daysOfStock < 14) {
      recommendations.push({
        type: 'RESTOCK',
        priority: 'HIGH',
        message: `${daysOfStock} days of stock remaining. Plan replenishment soon.`,
        action: 'Schedule procurement'
      });
    } else if (daysOfStock > 60) {
      recommendations.push({
        type: 'OVERSTOCK',
        priority: 'MEDIUM',
        message: `${daysOfStock} days of stock on hand. Consider reducing incoming orders.`,
        action: 'Review procurement schedule'
      });
    }

    // Check for stale inventory (shipments at warehouse > 7 days)
    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - 7);
    const staleShipments = warehouseShipments.filter(s => new Date(s.updatedAt) < staleThreshold);
    
    if (staleShipments.length > 0) {
      recommendations.push({
        type: 'STALE_INVENTORY',
        priority: 'HIGH',
        message: `${staleShipments.length} shipments have been at warehouse for over 7 days.`,
        action: 'Expedite delivery or investigate delays',
        shipments: staleShipments.map(s => s.shipmentHash)
      });
    }

    return {
      success: true,
      summary: {
        totalShipmentsAtWarehouse: warehouseShipments.length,
        totalContainersAtWarehouse: containers.length,
        totalInventoryQuantity: currentInventory,
        avgDailyDemand: Math.round(avgDailyDemand * 10) / 10,
        daysOfStock,
        staleShipmentCount: staleShipments.length
      },
      inventoryByProduct: Object.entries(inventoryByProduct).map(([name, data]) => ({
        productName: name,
        ...data
      })),
      recommendations,
      replenishmentPlan: generateReplenishmentPlan(avgDailyDemand, currentInventory, daysOfStock)
    };
  } catch (error) {
    console.error('Inventory analysis error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate automated replenishment plan
 */
const generateReplenishmentPlan = (avgDailyDemand, currentInventory, daysOfStock) => {
  const targetDaysOfStock = 21; // 3 weeks buffer
  const reorderPoint = avgDailyDemand * 7; // Reorder when 1 week stock left
  const optimalOrderQuantity = avgDailyDemand * targetDaysOfStock;

  return {
    reorderPoint: Math.round(reorderPoint),
    optimalOrderQuantity: Math.round(optimalOrderQuantity),
    currentStatus: daysOfStock < 7 ? 'REORDER_NOW' : daysOfStock < 14 ? 'REORDER_SOON' : 'ADEQUATE',
    suggestedOrderQuantity: Math.max(0, Math.round(optimalOrderQuantity - currentInventory)),
    nextReorderDate: daysOfStock > 7 
      ? new Date(Date.now() + (daysOfStock - 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : 'IMMEDIATE'
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLIER & TRANSPORTER PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyze supplier and transporter performance
 */
const analyzeStakeholderPerformance = async (options = {}) => {
  const { role = 'all', days = 30 } = options;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get shipments in the period
    const shipments = await Shipment.find({
      createdAt: { $gte: startDate }
    }).lean();

    // Get scan logs for timing analysis
    const scanLogs = await ScanLog.find({
      scannedAt: { $gte: startDate },
      result: 'ACCEPTED'
    }).lean();

    // Analyze suppliers
    const supplierStats = {};
    shipments.forEach(s => {
      const supplier = s.supplierWallet;
      if (!supplierStats[supplier]) {
        supplierStats[supplier] = {
          totalShipments: 0,
          deliveredShipments: 0,
          totalQuantity: 0,
          avgDeliveryTime: []
        };
      }
      supplierStats[supplier].totalShipments += 1;
      supplierStats[supplier].totalQuantity += s.totalQuantity || 0;
      if (s.status === 'DELIVERED') {
        supplierStats[supplier].deliveredShipments += 1;
      }
    });

    // Analyze transporters
    const transporterStats = {};
    shipments.forEach(s => {
      const transporter = s.assignedTransporter?.walletAddress;
      if (transporter) {
        if (!transporterStats[transporter]) {
          transporterStats[transporter] = {
            name: s.assignedTransporter?.name || 'Unknown',
            organization: s.assignedTransporter?.organizationName || 'Unknown',
            totalAssignments: 0,
            completedDeliveries: 0,
            avgPickupTime: [],
            scanCount: 0
          };
        }
        transporterStats[transporter].totalAssignments += 1;
        if (s.status === 'DELIVERED' || s.status === 'AT_WAREHOUSE') {
          transporterStats[transporter].completedDeliveries += 1;
        }
      }

      // Also check nextTransporter
      const nextTransporter = s.nextTransporter?.walletAddress;
      if (nextTransporter) {
        if (!transporterStats[nextTransporter]) {
          transporterStats[nextTransporter] = {
            name: s.nextTransporter?.name || 'Unknown',
            organization: s.nextTransporter?.organizationName || 'Unknown',
            totalAssignments: 0,
            completedDeliveries: 0,
            avgPickupTime: [],
            scanCount: 0
          };
        }
        transporterStats[nextTransporter].totalAssignments += 1;
      }
    });

    // Count scans per transporter
    scanLogs.forEach(log => {
      if (log.actor?.role === 'transporter' || log.actor?.role === 'assignedtransporter' || log.actor?.role === 'nexttransporter') {
        const wallet = log.actor?.walletAddress;
        if (wallet && transporterStats[wallet]) {
          transporterStats[wallet].scanCount += 1;
        }
      }
    });

    // Calculate performance scores
    const transporterRankings = Object.entries(transporterStats)
      .map(([wallet, stats]) => ({
        wallet,
        name: stats.name,
        organization: stats.organization,
        totalAssignments: stats.totalAssignments,
        completedDeliveries: stats.completedDeliveries,
        completionRate: stats.totalAssignments > 0 
          ? Math.round((stats.completedDeliveries / stats.totalAssignments) * 100) 
          : 0,
        scanCount: stats.scanCount,
        performanceScore: calculatePerformanceScore(stats)
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore);

    // Generate recommendations
    const recommendations = [];
    
    if (transporterRankings.length > 0) {
      const topTransporter = transporterRankings[0];
      recommendations.push({
        type: 'SUPPLIER_RECOMMENDATION',
        priority: 'INFO',
        message: `Top performing transporter: ${topTransporter.name} (${topTransporter.organization}) with ${topTransporter.completionRate}% completion rate.`,
        action: 'Consider prioritizing for critical shipments'
      });

      const lowPerformers = transporterRankings.filter(t => t.completionRate < 70 && t.totalAssignments >= 3);
      if (lowPerformers.length > 0) {
        recommendations.push({
          type: 'PERFORMANCE_ALERT',
          priority: 'MEDIUM',
          message: `${lowPerformers.length} transporter(s) have completion rates below 70%.`,
          action: 'Review and address performance issues'
        });
      }
    }

    return {
      success: true,
      period: { start: startDate.toISOString().split('T')[0], days },
      summary: {
        totalShipments: shipments.length,
        totalTransporters: Object.keys(transporterStats).length,
        avgCompletionRate: transporterRankings.length > 0
          ? Math.round(transporterRankings.reduce((sum, t) => sum + t.completionRate, 0) / transporterRankings.length)
          : 0
      },
      transporterRankings: transporterRankings.slice(0, 10),
      recommendations
    };
  } catch (error) {
    console.error('Stakeholder analysis error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate performance score (0-100)
 */
const calculatePerformanceScore = (stats) => {
  const completionWeight = 0.6;
  const activityWeight = 0.4;

  const completionScore = stats.totalAssignments > 0 
    ? (stats.completedDeliveries / stats.totalAssignments) * 100 
    : 0;
  
  const activityScore = Math.min(100, stats.scanCount * 10);

  return Math.round(completionScore * completionWeight + activityScore * activityWeight);
};

// ═══════════════════════════════════════════════════════════════════════════
// DELIVERY TIME PREDICTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Predict delivery time for a shipment
 */
const predictDeliveryTime = async (shipmentHash) => {
  try {
    const shipment = await Shipment.findOne({ shipmentHash }).lean();
    
    if (!shipment) {
      return { success: false, message: 'Shipment not found' };
    }

    // Get historical delivery times for similar shipments
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);
    
    const historicalShipments = await Shipment.find({
      status: 'DELIVERED',
      updatedAt: { $gte: thirtyDaysAgo }
    }).lean();

    // Calculate average delivery time
    const deliveryTimes = historicalShipments
      .map(s => {
        if (s.createdAt && s.updatedAt) {
          return (new Date(s.updatedAt) - new Date(s.createdAt)) / (1000 * 60 * 60); // hours
        }
        return null;
      })
      .filter(t => t !== null && t > 0 && t < 720); // Filter outliers (< 30 days)

    const avgDeliveryHours = deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, t) => sum + t, 0) / deliveryTimes.length
      : 48; // Default 48 hours

    // Adjust based on current status
    const statusProgress = {
      'CREATED': 0,
      'READY_FOR_DISPATCH': 0.1,
      'IN_TRANSIT': 0.5,
      'AT_WAREHOUSE': 0.7,
      'DELIVERED': 1
    };

    const progress = statusProgress[shipment.status] || 0;
    const remainingHours = avgDeliveryHours * (1 - progress);
    
    const estimatedDelivery = new Date();
    estimatedDelivery.setHours(estimatedDelivery.getHours() + remainingHours);

    // Determine confidence based on data
    const confidence = deliveryTimes.length > 10 ? 'HIGH' : deliveryTimes.length > 5 ? 'MEDIUM' : 'LOW';

    return {
      success: true,
      shipmentHash,
      currentStatus: shipment.status,
      progress: Math.round(progress * 100),
      prediction: {
        estimatedDeliveryDate: estimatedDelivery.toISOString(),
        estimatedDeliveryFormatted: estimatedDelivery.toLocaleString(),
        remainingHours: Math.round(remainingHours),
        confidence,
        basedOnSamples: deliveryTimes.length
      },
      statusTimeline: generateStatusTimeline(shipment, remainingHours)
    };
  } catch (error) {
    console.error('Delivery prediction error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate expected status timeline
 */
const generateStatusTimeline = (shipment, totalRemainingHours) => {
  const statusOrder = ['CREATED', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'AT_WAREHOUSE', 'DELIVERED'];
  const currentIndex = statusOrder.indexOf(shipment.status);
  
  const timeline = [];
  const now = new Date();
  const hoursPerStep = totalRemainingHours / (statusOrder.length - currentIndex - 1) || 0;

  statusOrder.forEach((status, index) => {
    if (index <= currentIndex) {
      timeline.push({
        status,
        completed: true,
        timestamp: index === currentIndex ? 'Current' : 'Completed'
      });
    } else {
      const hoursFromNow = hoursPerStep * (index - currentIndex);
      const expectedTime = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
      timeline.push({
        status,
        completed: false,
        expectedTimestamp: expectedTime.toLocaleString()
      });
    }
  });

  return timeline;
};

// ═══════════════════════════════════════════════════════════════════════════
// ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect anomalies in shipment patterns
 */
const detectAnomalies = async () => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const anomalies = [];

    // 1. Delayed shipments (IN_TRANSIT for > 3 days)
    const delayedInTransit = await Shipment.find({
      status: 'IN_TRANSIT',
      updatedAt: { $lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }
    }).lean();

    if (delayedInTransit.length > 0) {
      anomalies.push({
        type: 'DELAYED_SHIPMENTS',
        severity: 'HIGH',
        count: delayedInTransit.length,
        message: `${delayedInTransit.length} shipments have been IN_TRANSIT for over 3 days`,
        affectedShipments: delayedInTransit.map(s => ({
          shipmentHash: s.shipmentHash,
          batchId: s.batchId,
          daysSinceUpdate: Math.round((now - new Date(s.updatedAt)) / (24 * 60 * 60 * 1000))
        }))
      });
    }

    // 2. Stale warehouse inventory (AT_WAREHOUSE for > 5 days)
    const staleWarehouse = await Shipment.find({
      status: 'AT_WAREHOUSE',
      updatedAt: { $lt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) }
    }).lean();

    if (staleWarehouse.length > 0) {
      anomalies.push({
        type: 'STALE_WAREHOUSE_INVENTORY',
        severity: 'MEDIUM',
        count: staleWarehouse.length,
        message: `${staleWarehouse.length} shipments have been at warehouse for over 5 days without dispatch`,
        affectedShipments: staleWarehouse.map(s => ({
          shipmentHash: s.shipmentHash,
          batchId: s.batchId,
          daysSinceUpdate: Math.round((now - new Date(s.updatedAt)) / (24 * 60 * 60 * 1000))
        }))
      });
    }

    // 3. Rejected scans in last 7 days
    const rejectedScans = await ScanLog.countDocuments({
      scannedAt: { $gte: sevenDaysAgo },
      result: 'REJECTED'
    });

    const totalScans = await ScanLog.countDocuments({
      scannedAt: { $gte: sevenDaysAgo }
    });

    const rejectionRate = totalScans > 0 ? (rejectedScans / totalScans) * 100 : 0;
    
    if (rejectionRate > 10) {
      anomalies.push({
        type: 'HIGH_REJECTION_RATE',
        severity: 'MEDIUM',
        count: rejectedScans,
        message: `Scan rejection rate is ${Math.round(rejectionRate)}% (${rejectedScans}/${totalScans}) in the last 7 days`,
        recommendation: 'Investigate QR code quality or scanner issues'
      });
    }

    // 4. Unassigned shipments (CREATED status > 24 hours)
    const unassigned = await Shipment.find({
      status: 'CREATED',
      createdAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    }).lean();

    if (unassigned.length > 0) {
      anomalies.push({
        type: 'UNPROCESSED_SHIPMENTS',
        severity: 'LOW',
        count: unassigned.length,
        message: `${unassigned.length} shipments have been in CREATED status for over 24 hours`,
        recommendation: 'Confirm and dispatch these shipments'
      });
    }

    return {
      success: true,
      timestamp: now.toISOString(),
      totalAnomalies: anomalies.length,
      anomalies,
      overallHealth: anomalies.filter(a => a.severity === 'HIGH').length === 0 ? 'GOOD' : 'NEEDS_ATTENTION'
    };
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return { success: false, error: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE INSIGHTS REPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate comprehensive supply chain insights report
 */
const generateInsightsReport = async () => {
  try {
    const [demandForecast, inventoryAnalysis, performanceAnalysis, anomalies] = await Promise.all([
      generateDemandForecast({ days: 30, forecastDays: 7 }),
      analyzeInventory(),
      analyzeStakeholderPerformance({ days: 30 }),
      detectAnomalies()
    ]);

    // Get current snapshot
    const statusCounts = await Shipment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusSnapshot = {};
    statusCounts.forEach(s => {
      statusSnapshot[s._id] = s.count;
    });

    // Compile all recommendations
    const allRecommendations = [
      ...(demandForecast.recommendations || []),
      ...(inventoryAnalysis.recommendations || []),
      ...(performanceAnalysis.recommendations || [])
    ].sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      return (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5);
    });

    return {
      success: true,
      generatedAt: new Date().toISOString(),
      executiveSummary: {
        currentStatusSnapshot: statusSnapshot,
        totalActiveShipments: Object.values(statusSnapshot).reduce((sum, c) => sum + c, 0) - (statusSnapshot.DELIVERED || 0),
        overallHealth: anomalies.overallHealth,
        criticalIssues: anomalies.anomalies?.filter(a => a.severity === 'HIGH').length || 0
      },
      demandForecast: {
        trend: demandForecast.trend,
        nextWeekForecast: demandForecast.forecast,
        topProducts: demandForecast.topProducts
      },
      inventory: {
        summary: inventoryAnalysis.summary,
        replenishmentPlan: inventoryAnalysis.replenishmentPlan
      },
      performance: {
        summary: performanceAnalysis.summary,
        topTransporters: performanceAnalysis.transporterRankings?.slice(0, 3)
      },
      anomalies: anomalies.anomalies,
      recommendations: allRecommendations.slice(0, 10)
    };
  } catch (error) {
    console.error('Insights report error:', error);
    return { success: false, error: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  generateDemandForecast,
  analyzeInventory,
  analyzeStakeholderPerformance,
  predictDeliveryTime,
  detectAnomalies,
  generateInsightsReport
};
