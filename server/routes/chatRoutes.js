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

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// ═══════════════════════════════════════════════════════════════════════════
// 3. TOOL DEFINITION FOR GEMINI
// ═══════════════════════════════════════════════════════════════════════════

const toolsDefinition = {
  functionDeclarations: [{
    name: shipmentStatusTool.name,
    description: shipmentStatusTool.description,
    parameters: shipmentStatusTool.parameters
  }]
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. TOOL EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute the requested tool and return the result
 */
const executeTool = async (toolName, toolArgs) => {
  console.log(`🔧 [ChatBot] Executing tool: ${toolName}`, toolArgs);
  
  switch (toolName) {
    case 'get_shipment_status':
      return await getShipmentStatus(toolArgs.shipment_id);
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
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
      model: 'gemini-2.5-flash',
      tools: toolsDefinition,
      systemInstruction: `
You are "Sentinel AI", the official AI assistant for the Sentinel Supply Chain Platform.

CURRENT USER CONTEXT:
- Name: ${userName}
- Role: ${userRole}

═══════════════════════════════════════════════════════════════════════════════
YOUR REFERENCE MATERIAL (FAQ):
═══════════════════════════════════════════════════════════════════════════════
${SOURCE_MATERIAL}
═══════════════════════════════════════════════════════════════════════════════

RULES (FOLLOW STRICTLY):

RULE 1 - PROJECT KNOWLEDGE FIRST:
When the user asks a question, FIRST check if the answer exists in the REFERENCE MATERIAL above.
If found, answer using that information. Paraphrase it naturally, don't just copy-paste.

RULE 2 - GENERAL KNOWLEDGE FALLBACK:
If the answer is NOT in the reference material, use your general knowledge to answer helpfully.
For example, if asked "What is blockchain?", explain it clearly even though it's not in the FAQ.

RULE 3 - SHIPMENT TRACKING TOOL:
If the user provides a Shipment ID or asks to track/find a specific shipment, 
IGNORE the reference text and use the 'get_shipment_status' tool immediately.
Examples that trigger tool use:
- "Where is shipment 101?"
- "Track SHIP-ABC123"
- "What's the status of ID 42?"
- "Find my shipment 12345"

RESPONSE GUIDELINES:
- Be friendly, helpful, and concise
- Use markdown formatting (bold, lists, etc.) for readability
- Personalize responses based on user's role when relevant
- If unsure, ask clarifying questions
- Never make up shipment data - always use the tool

EXAMPLE INTERACTIONS:
User: "How do I login?"
→ Check reference material → Found → Answer from FAQ"

User: "What is a smart contract?"
→ Check reference material → Not found → Use general knowledge "

User: "Where is shipment 101?"
→ Shipment ID detected → Use get_shipment_status tool"
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
