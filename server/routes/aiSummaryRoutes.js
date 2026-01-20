/**
 * AI Summary Routes
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * AI-POWERED PRODUCT SUMMARY GENERATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Generates comprehensive AI summaries for products based on their
 * shipment data, including:
 * - Product details and specifications
 * - Shipment timeline and journey
 * - Certification information
 * - Supply chain insights
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const Container = require('../models/Container');
const ScanLog = require('../models/ScanLog');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google AI Client
const googleApiKey = process.env.GOOGLE_API_KEY;
let genAI = null;

if (googleApiKey) {
  genAI = new GoogleGenerativeAI(googleApiKey);
  console.log('✅ [AI Summary] Google AI initialized');
} else {
  console.warn('⚠️ [AI Summary] GOOGLE_API_KEY not set, AI summaries will use fallback');
}

/**
 * Generate AI Summary for a product/shipment
 * POST /api/ai-summary/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { batchId, shipmentHash } = req.body;

    if (!batchId && !shipmentHash) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID or Shipment Hash is required'
      });
    }

    // Find the shipment
    const query = batchId 
      ? { batchId: batchId.trim() } 
      : { shipmentHash: shipmentHash.trim() };
    
    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Fetch containers
    const containers = await Container.find({ shipmentHash: shipment.shipmentHash });

    // Fetch scan logs for journey tracking
    const scanLogs = await ScanLog.find({ shipmentHash: shipment.shipmentHash })
      .sort({ scannedAt: 1 })
      .limit(50);

    // Build comprehensive shipment data
    const shipmentData = {
      productName: shipment.productName || `Batch ${shipment.batchId}`,
      batchId: shipment.batchId,
      shipmentHash: shipment.shipmentHash,
      status: shipment.status,
      totalQuantity: shipment.totalQuantity,
      numberOfContainers: shipment.numberOfContainers,
      quantityPerContainer: shipment.quantityPerContainer,
      createdAt: shipment.createdAt,
      blockchainTimestamp: shipment.blockchainTimestamp,
      txHash: shipment.txHash,
      blockNumber: shipment.blockNumber,
      supplierWallet: shipment.supplierWallet,
      assignedTransporter: shipment.assignedTransporter,
      assignedWarehouse: shipment.assignedWarehouse,
      assignedRetailer: shipment.assignedRetailer,
      supportingDocuments: shipment.supportingDocuments || [],
      containers: containers.map(c => ({
        containerId: c.containerId,
        status: c.status,
        quantity: c.quantity
      })),
      journeySteps: scanLogs.map(log => ({
        action: log.action,
        role: log.role,
        location: log.location,
        timestamp: log.scannedAt,
        notes: log.notes
      }))
    };

    // Generate AI Summary
    let aiSummary;
    
    if (genAI) {
      aiSummary = await generateAISummary(shipmentData);
    } else {
      aiSummary = generateFallbackSummary(shipmentData);
    }

    // Build structured response
    const response = {
      success: true,
      data: {
        productInfo: {
          name: shipmentData.productName,
          batchId: shipmentData.batchId,
          totalQuantity: shipmentData.totalQuantity,
          unit: 'units',
          containers: shipmentData.numberOfContainers,
          quantityPerContainer: shipmentData.quantityPerContainer
        },
        shipmentDetails: {
          status: getStatusLabel(shipmentData.status),
          statusCode: shipmentData.status,
          createdAt: shipmentData.createdAt,
          blockchainVerified: !!shipmentData.txHash,
          txHash: shipmentData.txHash,
          blockNumber: shipmentData.blockNumber
        },
        supplyChain: {
          supplier: shipmentData.supplierWallet ? formatWallet(shipmentData.supplierWallet) : null,
          transporter: shipmentData.assignedTransporter?.organizationName || shipmentData.assignedTransporter?.name || null,
          warehouse: shipmentData.assignedWarehouse?.organizationName || shipmentData.assignedWarehouse?.name || null,
          retailer: shipmentData.assignedRetailer?.organizationName || shipmentData.assignedRetailer?.name || null
        },
        certifications: extractCertifications(shipmentData.supportingDocuments),
        journeyMilestones: extractMilestones(shipmentData),
        aiSummary: aiSummary
      }
    };

    res.json(response);

  } catch (error) {
    console.error('[AI Summary] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI summary',
      error: error.message
    });
  }
});

/**
 * Generate AI Summary using Google Gemini
 */
async function generateAISummary(shipmentData) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Random elements for variety
    const toneStyles = ['professional and reassuring', 'friendly and informative', 'detailed and trustworthy', 'warm and confident'];
    const focusAreas = ['supply chain journey', 'authenticity verification', 'quality assurance', 'transparency and trust'];
    const randomTone = toneStyles[Math.floor(Math.random() * toneStyles.length)];
    const randomFocus = focusAreas[Math.floor(Math.random() * focusAreas.length)];
    const randomSeed = Math.floor(Math.random() * 10000);

    const statusDescriptions = {
      'CREATED': 'just been registered and is being prepared for dispatch',
      'READY_FOR_DISPATCH': 'been packaged and is ready for transportation',
      'IN_TRANSIT': 'currently on its way to the destination',
      'AT_WAREHOUSE': 'arrived safely at the warehouse facility',
      'DELIVERED': 'been successfully delivered to its final destination'
    };

    const currentStatusDesc = statusDescriptions[shipmentData.status] || 'being tracked in our system';

    const prompt = `
You are "Sentinel AI", the intelligent assistant for Sentinel - a blockchain-powered supply chain transparency platform.

PRODUCT DATA:
- Product: ${shipmentData.productName}
- Batch ID: ${shipmentData.batchId}
- Quantity: ${shipmentData.totalQuantity} units in ${shipmentData.numberOfContainers} containers
- Status: ${shipmentData.status} (${currentStatusDesc})
- Registered: ${new Date(shipmentData.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Blockchain: ${shipmentData.txHash ? `VERIFIED on Block #${shipmentData.blockNumber || 'confirmed'}` : 'Pending'}
- Checkpoints: ${shipmentData.journeySteps.length} recorded
- Documents: ${shipmentData.supportingDocuments.length} on file

STRICT INSTRUCTIONS - YOU MUST FOLLOW:

Write EXACTLY 5-7 sentences. The response MUST be between 180-250 words. Count your words carefully.

Structure your response in this EXACT order:
1. SENTENCE 1: Confirm the product "${shipmentData.productName}" with batch "${shipmentData.batchId}" is verified and authentic.
2. SENTENCE 2: Describe the quantity (${shipmentData.totalQuantity} units across ${shipmentData.numberOfContainers} containers) and packaging details.
3. SENTENCE 3: Explain current status - the product has ${currentStatusDesc}. Elaborate on what this means.
4. SENTENCE 4: Explain blockchain verification - how it ensures tamper-proof records and why consumers can trust it.
5. SENTENCE 5: Mention ${shipmentData.journeySteps.length > 0 ? `the ${shipmentData.journeySteps.length} verification checkpoints recorded` : 'that journey tracking is active'} and what this means for traceability.
6. SENTENCE 6: Mention registration date (${new Date(shipmentData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}) and complete documentation.
7. SENTENCE 7: End with a strong reassuring statement about authenticity and consumer safety.

STYLE:
- Tone: ${randomTone}
- Focus: ${randomFocus}
- NO markdown, NO bullet points, NO emojis
- Natural, flowing paragraph
- Seed for uniqueness: ${randomSeed}

CRITICAL: Your response MUST be 180-250 words. Do NOT write less. Do NOT write a single short sentence. Write a FULL detailed paragraph.

Generate now:`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 800,
      }
    });
    const response = await result.response;
    let summary = response.text().trim();
    
    // If summary is too short, use fallback
    if (summary.length < 300) {
      console.log('[AI Summary] Response too short, using fallback. Length:', summary.length);
      return generateFallbackSummary(shipmentData);
    }
    
    return summary;

  } catch (error) {
    console.error('[AI Summary] Gemini error:', error);
    return generateFallbackSummary(shipmentData);
  }
}

/**
 * Generate fallback summary without AI
 */
function generateFallbackSummary(shipmentData) {
  const productName = shipmentData.productName || 'This product';
  const batchId = shipmentData.batchId;
  const quantity = shipmentData.totalQuantity;
  const containers = shipmentData.numberOfContainers;
  const createdDate = new Date(shipmentData.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Opening statement based on blockchain verification
  const verifiedText = shipmentData.txHash 
    ? `Great news! ${productName} (Batch: ${batchId}) has been successfully verified on our blockchain network. This means every step of its journey from manufacturer to you has been securely recorded and cannot be tampered with.`
    : `${productName} (Batch: ${batchId}) is registered in our Sentinel supply chain tracking system. The product details have been recorded and are being monitored for complete transparency.`;
  
  // Quantity and container info
  const quantityText = `This shipment contains ${quantity} units distributed across ${containers} container${containers > 1 ? 's' : ''}, all carefully tracked from the point of origin.`;

  // Journey info
  const journeyText = shipmentData.journeySteps.length > 0
    ? `So far, ${shipmentData.journeySteps.length} verification checkpoint${shipmentData.journeySteps.length > 1 ? 's have' : ' has'} been recorded along its supply chain journey, each timestamp permanently stored for your peace of mind.`
    : 'The complete supply chain journey is being actively monitored, with each checkpoint recorded for full transparency and traceability.';

  // Status-specific ending
  const statusText = getStatusDescription(shipmentData.status);

  // Registration date
  const dateText = `Originally registered on ${createdDate}, this product maintains a complete audit trail that you can trust.`;

  return `${verifiedText} ${quantityText} ${journeyText} ${statusText} ${dateText}`;
}

/**
 * Extract certifications from supporting documents
 */
function extractCertifications(documents) {
  if (!documents || documents.length === 0) {
    return [];
  }

  // Common certification keywords to identify
  const certKeywords = ['iso', 'haccp', 'gmp', 'organic', 'halal', 'kosher', 'fda', 'ce', 'quality', 'certificate', 'compliance'];
  
  return documents
    .filter(doc => {
      const name = (doc.originalName || doc.name || '').toLowerCase();
      return certKeywords.some(keyword => name.includes(keyword));
    })
    .map(doc => ({
      name: doc.originalName || doc.name || 'Certificate',
      type: doc.mimeType || 'document',
      url: doc.url
    }));
}

/**
 * Extract journey milestones from shipment data
 */
function extractMilestones(shipmentData) {
  const milestones = [];

  // Add creation milestone
  milestones.push({
    stage: 'Created',
    status: 'completed',
    date: shipmentData.createdAt,
    description: 'Shipment registered in the system'
  });

  // Add blockchain verification milestone
  if (shipmentData.txHash) {
    milestones.push({
      stage: 'Blockchain Verified',
      status: 'completed',
      date: shipmentData.blockchainTimestamp ? new Date(shipmentData.blockchainTimestamp * 1000) : shipmentData.createdAt,
      description: 'Product authenticity locked on blockchain'
    });
  }

  // Add status-based milestones
  const statusOrder = ['CREATED', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'AT_WAREHOUSE', 'DELIVERED'];
  const currentIndex = statusOrder.indexOf(shipmentData.status);

  if (currentIndex >= 1) {
    milestones.push({
      stage: 'Ready for Dispatch',
      status: 'completed',
      description: 'Prepared for transportation'
    });
  }

  if (currentIndex >= 2) {
    milestones.push({
      stage: 'In Transit',
      status: currentIndex === 2 ? 'in-progress' : 'completed',
      description: 'Being transported to destination'
    });
  }

  if (currentIndex >= 3) {
    milestones.push({
      stage: 'At Warehouse',
      status: currentIndex === 3 ? 'in-progress' : 'completed',
      description: 'Received at warehouse facility'
    });
  }

  if (currentIndex >= 4) {
    milestones.push({
      stage: 'Delivered',
      status: 'completed',
      description: 'Successfully delivered to destination'
    });
  }

  return milestones;
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status) {
  const labels = {
    'CREATED': 'Created',
    'READY_FOR_DISPATCH': 'Ready for Dispatch',
    'IN_TRANSIT': 'In Transit',
    'AT_WAREHOUSE': 'At Warehouse',
    'DELIVERED': 'Delivered'
  };
  return labels[status] || status;
}

/**
 * Get status description
 */
function getStatusDescription(status) {
  const descriptions = {
    'CREATED': 'The shipment has been registered and is being prepared.',
    'READY_FOR_DISPATCH': 'The product is packaged and ready for transportation.',
    'IN_TRANSIT': 'Your product is currently being transported to its destination.',
    'AT_WAREHOUSE': 'The product has arrived at the warehouse for processing.',
    'DELIVERED': 'The product has been successfully delivered.'
  };
  return descriptions[status] || '';
}

/**
 * Format wallet address for display
 */
function formatWallet(wallet) {
  if (!wallet) return null;
  return `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;
}

module.exports = router;
