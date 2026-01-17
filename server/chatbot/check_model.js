// server/chatbot/check_models.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  
  try {
    console.log("🔍 Checking available models for your API Key...");
    // This fetches the list from Google
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).apiKey; 
    // Actually, let's use the explicit list method if available, 
    // but the SDK handles this via direct fetch usually. 
    // Let's use the raw fetch to be 100% sure.
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
    const data = await response.json();

    if (data.error) {
      console.log("❌ API Error:", data.error.message);
      return;
    }

    console.log("\n✅ SUCCESS! Here are the EXACT names you must use in your code:\n");
    data.models.forEach(model => {
      if (model.supportedGenerationMethods.includes("generateContent")) {
        console.log(`👉 ${model.name.replace('models/', '')}`);
      }
    });

  } catch (error) {
    console.log("❌ Network Error:", error.message);
  }
}

listModels();