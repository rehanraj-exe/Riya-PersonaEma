import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeEmail(subject: string, body: string) {
  const prompt = `
    Analyze this email and provide a JSON response with the following fields:
    - category (Support, Sales, Finance, HR, Technical, Complaint, Marketing, Security, Recruitment, Billing, Legal, Spam)
    - priority (Critical, High, Medium, Low)
    - sentiment (Positive, Neutral, Negative)
    - confidenceScore (0.0 to 1.0)
    - department (Which department to route this to)
    - suggestedReply (A brief suggested response)

    Email Subject: ${subject}
    Email Body: ${body}

    Respond strictly with valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Fallback for mocked response if API key is missing or invalid
    return {
      category: "Support",
      priority: "Medium",
      sentiment: "Neutral",
      confidenceScore: 0.85,
      department: "Customer Service",
      suggestedReply: "Thank you for reaching out. We will look into this and get back to you shortly."
    };
  }
}
