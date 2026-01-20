/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL AI CHATBOT - CHAT ROUTES (Three-Layer Intelligence)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Three Layers of Intelligence:
 * 1. PROJECT KNOWLEDGE: Answers from faq.txt first
 * 2. GENERAL KNOWLEDGE: Falls back to AI's general knowledge
 * 3. ACTIONABLE TOOL: Uses blockchain tool for shipment tracking
 * 
 * Tech Stack: Node.js, Express, @google/generative-ai (Direct SDK)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getShipmentStatus, shipmentStatusTool } = require('../chatbot/blockchainTools');
const { allAnalyticsTools, executeAnalyticsTool } = require('../chatbot/analyticsTools');
const authMiddleware = require('../middleware/authMiddleware');

// ═══════════════════════════════════════════════════════════════════════════
// 1. LOAD SOURCE MATERIAL (FAQ File)
// ═══════════════════════════════════════════════════════════════════════════

let SOURCE_MATERIAL = '';

try {
  const faqPath = path.join(__dirname, '..', 'faq.txt');
  SOURCE_MATERIAL = fs.readFileSync(faqPath, 'utf-8');
  console.log('✅ [ChatBot] FAQ file loaded successfully');
} catch (error) {
  console.warn('⚠️ [ChatBot] FAQ file not found, using default knowledge');
  SOURCE_MATERIAL = `
    SENTINEL SUPPLY CHAIN PLATFORM - BASIC GUIDE
    
    How to Login:
    1. Install MetaMask browser extension
    2. Click "Connect Wallet" on the homepage
    3. Approve the connection in MetaMask
    4. Sign the verification message
    5. You'll be redirected to your dashboard
    
    How to Register:
    1. Click "Register" on the homepage
    2. Connect your MetaMask wallet
    3. Fill in your business details
    4. Select your role (Supplier, Transporter, Warehouse, Retailer)
    5. Wait for admin approval
    
    How to Track Shipment:
    - Use the search bar with your Shipment ID
    - Or scan the QR code on the package
    
    For other questions, please contact support@sentinel.com
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. INITIALIZE GOOGLE AI CLIENT
// ═══════════════════════════════════════════════════════════════════════════

const googleApiKey = process.env.GOOGLE_API_KEY;
if (!googleApiKey) {
  console.error('❌ [ChatBot] GOOGLE_API_KEY environment variable is not set. Please configure it before starting the server.');
  throw new Error('GOOGLE_API_KEY environment variable is required for GoogleGenerativeAI client initialization.');
}
const genAI = new GoogleGenerativeAI(googleApiKey);

// ═══════════════════════════════════════════════════════════════════════════
// 3. TOOL DEFINITIONS FOR GEMINI (Shipment + Analytics Tools)
// ═══════════════════════════════════════════════════════════════════════════

// Combine all tools: shipment tracking + analytics
const allTools = [
  shipmentStatusTool,
  ...allAnalyticsTools
];

const toolsDefinition = {
  functionDeclarations: allTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }))
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. TOOL EXECUTOR (Handles all tool types)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute the requested tool and return the result
 */
const executeTool = async (toolName, toolArgs) => {
  console.log(`🔧 [ChatBot] Executing tool: ${toolName}`, toolArgs);
  
  // Check if it's the shipment status tool
  if (toolName === 'get_shipment_status') {
    return await getShipmentStatus(toolArgs.shipment_id);
  }
  
  // Check if it's an analytics tool
  const analyticsToolNames = allAnalyticsTools.map(t => t.name);
  if (analyticsToolNames.includes(toolName)) {
    return await executeAnalyticsTool(toolName, toolArgs);
  }
  
  return JSON.stringify({ error: `Unknown tool: ${toolName}` });
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. MAIN CHAT ROUTE (Protected)
// ═══════════════════════════════════════════════════════════════════════════

router.post('/ask', authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        answer: 'Please provide a question.'
      });
    }

    // Get user context from authentication
    const userName = req.user?.fullName || req.user?.email || 'User';
    const userRole = req.user?.role || 'Unknown';

    console.log(`💬 [ChatBot] Question from ${userName} (${userRole}): ${question}`);

    // ─────────────────────────────────────────────────────────────────────
    // A. SETUP THE MODEL WITH SYSTEM INSTRUCTIONS
    // ─────────────────────────────────────────────────────────────────────
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      tools: toolsDefinition,
      systemInstruction: `
You are "Sentinel AI", an advanced AI-powered decision support system for the Sentinel Supply Chain Platform.
You provide intelligent insights, predictions, and recommendations to optimize supply chain operations.

CURRENT USER CONTEXT:
- Name: ${userName}
- Role: ${userRole}
- Timestamp: ${new Date().toISOString()}

═══════════════════════════════════════════════════════════════════════════════
YOUR REFERENCE MATERIAL (FAQ):
═══════════════════════════════════════════════════════════════════════════════
${SOURCE_MATERIAL}
═══════════════════════════════════════════════════════════════════════════════

YOUR CAPABILITIES (USE THESE TOOLS):

1. **SHIPMENT TRACKING** (get_shipment_status)
   - Track specific shipments by ID
   - Get current status, location, and details
   - Trigger: User mentions shipment ID or asks to track/find shipment

2. **DEMAND FORECASTING** (get_demand_forecast)
   - Predict future demand based on historical data
   - Identify trends and seasonal patterns
   - Trigger: "forecast", "predict demand", "what to expect", "trends"

3. **INVENTORY ANALYSIS** (analyze_inventory)
   - Analyze current stock levels
   - Identify stockout risks and overstocking
   - Trigger: "inventory", "stock levels", "warehouse capacity"

4. **DELIVERY PREDICTION** (predict_delivery)
   - Estimate delivery time for specific shipments
   - Provide timeline and progress
   - Trigger: "when will it arrive", "ETA", "delivery estimate"

5. **PERFORMANCE ANALYSIS** (analyze_performance)
   - Rate transporters and stakeholders
   - Identify top performers and issues
   - Trigger: "performance", "best transporter", "ratings", "rankings"

6. **ANOMALY DETECTION** (detect_anomalies)
   - Detect delays, issues, and problems
   - Identify supply chain risks
   - Trigger: "problems", "issues", "delays", "what's wrong", "alerts"

7. **INSIGHTS REPORT** (generate_insights_report)
   - Comprehensive supply chain overview
   - Executive summary with recommendations
   - Trigger: "report", "overview", "summary", "dashboard", "insights"

8. **REPLENISHMENT PLAN** (get_replenishment_plan)
   - Procurement recommendations
   - Reorder points and quantities
   - Trigger: "restock", "procurement", "what to order", "replenishment"

RULES (FOLLOW STRICTLY):

RULE 1 - DETECT INTENT AND USE APPROPRIATE TOOL:
Analyze user's question to determine which tool to use. If asking about:
- Specific shipment → get_shipment_status
- Future predictions/trends → get_demand_forecast
- Stock/warehouse → analyze_inventory
- Delivery time → predict_delivery
- Transporter/supplier performance → analyze_performance
- Problems/delays → detect_anomalies
- Overall status/report → generate_insights_report
- What to order → get_replenishment_plan

RULE 2 - PROJECT KNOWLEDGE FOR GENERAL QUESTIONS:
For "how to" questions (login, register, create shipment), use the REFERENCE MATERIAL above.

RULE 3 - EXPLAIN INSIGHTS CLEARLY:
When presenting analytics data:
- Summarize key findings first
- Highlight critical issues
- Provide actionable recommendations
- Use markdown formatting for readability
- Include relevant numbers and percentages

RULE 4 - PERSONALIZE FOR ROLE:
Tailor responses based on user's role:
- Supplier: Focus on shipment creation, dispatch, supplier-specific insights
- Transporter: Focus on pickup/delivery, route optimization
- Warehouse: Focus on inventory, receiving, storage optimization
- Retailer: Focus on incoming deliveries, stock replenishment
- Admin: Full access to all insights and reports

RESPONSE FORMAT:
- Use headers (##) for sections
- Use bullet points for lists
- Bold important numbers and status
- Include recommendations with priority levels
- Be concise but comprehensive

EXAMPLE INTERACTIONS:
User: "What's the demand forecast for next week?"
→ Use get_demand_forecast tool → Present predictions with trends

User: "Are there any problems I should know about?"
→ Use detect_anomalies tool → List issues by severity

User: "Give me an overview of the supply chain"
→ Use generate_insights_report tool → Present executive summary

User: "Which transporter should I use?"
→ Use analyze_performance tool → Recommend top performers
      `
    });

    // ─────────────────────────────────────────────────────────────────────
    // B. START CHAT AND SEND MESSAGE
    // ─────────────────────────────────────────────────────────────────────
    
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7
      }
    });

    let response = await chat.sendMessage(question);
    let result = response.response;

    // ─────────────────────────────────────────────────────────────────────
    // C. HANDLE TOOL CALLS (Function Calling)
    // ─────────────────────────────────────────────────────────────────────
    
    // Check if model wants to call a tool
    const functionCall = result.candidates?.[0]?.content?.parts?.find(
      part => part.functionCall
    )?.functionCall;

    if (functionCall) {
      console.log(`🔧 [ChatBot] Tool requested: ${functionCall.name}`);
      
      // Execute the tool
      const toolResult = await executeTool(functionCall.name, functionCall.args);
      
      console.log(`📦 [ChatBot] Tool result:`, toolResult);

      // Send tool result back to model for final response
      response = await chat.sendMessage([{
        functionResponse: {
          name: functionCall.name,
          response: { result: toolResult }
        }
      }]);
      
      result = response.response;
    }

    // ─────────────────────────────────────────────────────────────────────
    // D. EXTRACT AND RETURN FINAL ANSWER
    // ─────────────────────────────────────────────────────────────────────
    
    const answer = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text)
      .filter(Boolean)
      .join('\n') || 'I apologize, but I could not generate a response. Please try again.';

    console.log(`✅ [ChatBot] Response generated successfully`);

    return res.json({
      success: true,
      answer: answer.trim()
    });

  } catch (error) {
    console.error('❌ [ChatBot] Error:', error);
    
    // Handle specific API errors
    if (error.message?.includes('API key')) {
      return res.status(500).json({
        success: false,
        answer: 'AI service configuration error. Please contact support.'
      });
    }
    
    if (error.message?.includes('quota')) {
      return res.status(429).json({
        success: false,
        answer: 'AI service is temporarily busy. Please try again in a moment.'
      });
    }

    return res.status(500).json({
      success: false,
      answer: 'Sorry, I encountered an error processing your request. Please try again.'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. HEALTH CHECK ROUTE (Public)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'Sentinel AI is operational',
    faqLoaded: SOURCE_MATERIAL.length > 100,
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = router;
