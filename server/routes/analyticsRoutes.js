/**
 * Analytics Routes
 * API endpoints for AI-powered supply chain analytics
 * 
 * These routes provide direct access to analytics features
 * without going through the chatbot interface
 */

const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const analyticsService = require('../services/analyticsService');

/**
 * @route   GET /api/analytics/forecast
 * @desc    Get demand forecast and predictions
 * @access  Protected
 */
router.get('/forecast', protect, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const forecast = await analyticsService.generateDemandForecast(parseInt(days));
    
    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate forecast',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/inventory
 * @desc    Get inventory analysis and optimization recommendations
 * @access  Protected
 */
router.get('/inventory', protect, async (req, res) => {
  try {
    const inventory = await analyticsService.analyzeInventory();
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Inventory analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze inventory',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/performance
 * @desc    Get stakeholder performance analysis
 * @access  Protected
 */
router.get('/performance', protect, async (req, res) => {
  try {
    const { type = 'transporter' } = req.query; // transporter, supplier, warehouse
    const performance = await analyticsService.analyzeStakeholderPerformance(type);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Performance analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze performance',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/delivery/:shipmentId
 * @desc    Get delivery time prediction for specific shipment
 * @access  Protected
 */
router.get('/delivery/:shipmentId', protect, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const prediction = await analyticsService.predictDeliveryTime(shipmentId);
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Delivery prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict delivery',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/anomalies
 * @desc    Detect anomalies and issues in the supply chain
 * @access  Protected
 */
router.get('/anomalies', protect, async (req, res) => {
  try {
    const anomalies = await analyticsService.detectAnomalies();
    
    res.json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect anomalies',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/insights
 * @desc    Get comprehensive insights report
 * @access  Protected
 */
router.get('/insights', protect, async (req, res) => {
  try {
    const insights = await analyticsService.generateInsightsReport();
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/replenishment
 * @desc    Get replenishment plan and procurement recommendations
 * @access  Protected
 */
router.get('/replenishment', protect, async (req, res) => {
  try {
    const inventory = await analyticsService.analyzeInventory();
    
    // Extract replenishment recommendations
    const replenishment = {
      itemsNeedingRestock: inventory.replenishmentPlan?.recommendations || [],
      urgentItems: inventory.criticalItems?.map(item => ({
        productName: item.productName,
        currentStock: item.totalQuantity,
        status: 'CRITICAL',
        recommendedAction: 'Immediate procurement required'
      })) || [],
      summary: {
        totalItemsToRestock: inventory.replenishmentPlan?.totalItemsToRestock || 0,
        totalEstimatedCost: inventory.replenishmentPlan?.totalEstimatedCost || 0,
        criticalCount: inventory.criticalItems?.length || 0
      }
    };
    
    res.json({
      success: true,
      data: replenishment
    });
  } catch (error) {
    console.error('Replenishment plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate replenishment plan',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard summary with key metrics
 * @access  Protected
 */
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Fetch all analytics in parallel for dashboard
    const [forecast, inventory, anomalies] = await Promise.all([
      analyticsService.generateDemandForecast(7),
      analyticsService.analyzeInventory(),
      analyticsService.detectAnomalies()
    ]);
    
    const dashboard = {
      // Key metrics
      metrics: {
        totalShipments: forecast.historicalAnalysis?.totalShipments || 0,
        averageDailyShipments: forecast.historicalAnalysis?.avgDailyShipments || 0,
        inventoryHealth: inventory.healthScore || 'N/A',
        activeAlerts: anomalies.totalAnomalies || 0
      },
      
      // Trend indicator
      trend: {
        direction: forecast.historicalAnalysis?.trend || 'stable',
        percentChange: forecast.historicalAnalysis?.percentChange || 0
      },
      
      // Quick alerts
      alerts: {
        critical: anomalies.criticalCount || 0,
        warning: anomalies.warningCount || 0,
        info: anomalies.infoCount || 0
      },
      
      // Inventory overview
      inventory: {
        totalProducts: inventory.summary?.totalProducts || 0,
        warehousesWithStock: inventory.summary?.warehousesWithStock || 0,
        criticalItems: inventory.criticalItems?.length || 0,
        staleItems: inventory.staleItems?.length || 0
      },
      
      // Forecast preview (next 3 days)
      forecastPreview: forecast.forecast?.slice(0, 3) || [],
      
      // Top issues
      topIssues: anomalies.anomalies?.slice(0, 5) || [],
      
      generatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/supply-chain-score
 * @desc    Get overall supply chain health score
 * @access  Protected
 */
router.get('/supply-chain-score', protect, async (req, res) => {
  try {
    const insights = await analyticsService.generateInsightsReport();
    
    // Calculate overall score based on multiple factors
    let score = 100;
    const factors = [];
    
    // Deduct points for anomalies
    const anomalyCount = insights.anomalyReport?.totalAnomalies || 0;
    if (anomalyCount > 0) {
      const deduction = Math.min(anomalyCount * 5, 30);
      score -= deduction;
      factors.push({
        factor: 'Active Issues',
        impact: -deduction,
        detail: `${anomalyCount} anomalies detected`
      });
    }
    
    // Deduct points for critical inventory
    const criticalItems = insights.inventoryStatus?.criticalItems || 0;
    if (criticalItems > 0) {
      const deduction = Math.min(criticalItems * 3, 20);
      score -= deduction;
      factors.push({
        factor: 'Critical Inventory',
        impact: -deduction,
        detail: `${criticalItems} items at critical levels`
      });
    }
    
    // Deduct points for stale inventory
    const staleItems = insights.inventoryStatus?.staleItems || 0;
    if (staleItems > 0) {
      const deduction = Math.min(staleItems * 2, 15);
      score -= deduction;
      factors.push({
        factor: 'Stale Inventory',
        impact: -deduction,
        detail: `${staleItems} items sitting idle`
      });
    }
    
    // Bonus for positive trend
    if (insights.demandForecast?.trend === 'increasing') {
      score += 5;
      factors.push({
        factor: 'Growing Demand',
        impact: +5,
        detail: 'Positive demand trend detected'
      });
    }
    
    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    
    // Determine grade
    let grade, status;
    if (score >= 90) {
      grade = 'A';
      status = 'Excellent';
    } else if (score >= 80) {
      grade = 'B';
      status = 'Good';
    } else if (score >= 70) {
      grade = 'C';
      status = 'Fair';
    } else if (score >= 60) {
      grade = 'D';
      status = 'Needs Improvement';
    } else {
      grade = 'F';
      status = 'Critical';
    }
    
    res.json({
      success: true,
      data: {
        score,
        grade,
        status,
        factors,
        recommendations: insights.recommendations || [],
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Supply chain score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate supply chain score',
      error: error.message
    });
  }
});

module.exports = router;
