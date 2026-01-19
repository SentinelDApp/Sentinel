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
You are "Sentinel AI", the intelligent assistant for Sentinel - a blockchain-powered supply chain transparency platform that helps consumers verify product authenticity.

PRODUCT VERIFICATION DATA:
═══════════════════════════════════════════════════════════════
Product Name: ${shipmentData.productName}
Batch ID: ${shipmentData.batchId}
Total Quantity: ${shipmentData.totalQuantity} units across ${shipmentData.numberOfContainers} containers
Current Status: ${shipmentData.status} (This product has ${currentStatusDesc})
Registration Date: ${new Date(shipmentData.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Blockchain Verification: ${shipmentData.txHash ? `✓ VERIFIED (Block #${shipmentData.blockNumber || 'N/A'})` : '⏳ Pending verification'}
${shipmentData.assignedTransporter?.name ? `Transportation Partner: ${shipmentData.assignedTransporter.organizationName || shipmentData.assignedTransporter.name}` : ''}
${shipmentData.assignedWarehouse?.name ? `Warehouse Facility: ${shipmentData.assignedWarehouse.organizationName || shipmentData.assignedWarehouse.name}` : ''}
${shipmentData.assignedRetailer?.name ? `Retail Partner: ${shipmentData.assignedRetailer.organizationName || shipmentData.assignedRetailer.name}` : ''}
Journey Checkpoints Recorded: ${shipmentData.journeySteps.length} verification points
Supporting Documentation: ${shipmentData.supportingDocuments.length} documents on file
Containers Details: ${shipmentData.containers.map(c => c.containerId).join(', ') || 'Standard packaging'}
═══════════════════════════════════════════════════════════════

YOUR TASK:
Write a comprehensive, engaging summary (4-6 sentences, approximately 150-200 words) for a consumer who just scanned this product's QR code. This is their first interaction with product verification, so make it informative and reassuring.

CONTENT REQUIREMENTS:
1. Start with a warm confirmation that the product is verified/authentic
2. Mention specific details about the product (name, batch, quantity)
3. Explain the supply chain journey - where it came from, current status
4. Highlight the blockchain security aspect and what it means for the consumer
5. ${shipmentData.journeySteps.length > 0 ? `Mention that ${shipmentData.journeySteps.length} verification checkpoints have been recorded` : 'Note that the journey tracking is active'}
6. End with a reassuring statement about product authenticity

STYLE REQUIREMENTS:
- Tone: ${randomTone}
- Focus emphasis on: ${randomFocus}
- Write in a conversational yet professional manner
- Use varied sentence structures (mix short and long sentences)
- Do NOT use markdown, bullet points, or special formatting
- Do NOT use emojis
- Make it sound natural, not robotic
- Variation seed: ${randomSeed} (use this to ensure unique phrasing)

IMPORTANT: Each summary should be unique. Avoid repetitive phrases. Be creative with your wording while maintaining accuracy.

Generate the detailed summary now:`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 500,
      }
    });
    const response = await result.response;
    return response.text().trim();

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
