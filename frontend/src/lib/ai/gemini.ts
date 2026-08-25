import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize the Google Gen AI SDK
// It automatically picks up the GEMINI_API_KEY from the environment
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({}) : null;

// Define the expected output schema using the SDK's Type enum
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      description: "The primary category of the email (e.g., Support, Sales, Finance, HR, Technical, Complaint, Marketing, Security, Recruitment, Billing, Legal, Spam)",
    },
    priority: {
      type: Type.STRING,
      description: "The urgency/priority of the email. Must be exactly one of: Critical, High, Medium, Low",
    },
    sentiment: {
      type: Type.STRING,
      description: "The emotional tone of the email (e.g., Angry, Frustrated, Neutral, Happy, Urgent)",
    },
    suggestedReply: {
      type: Type.STRING,
      description: "A professional, helpful, and concise suggested reply to the email.",
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "A score from 0.0 to 1.0 indicating confidence in the classification.",
    },
    department: {
      type: Type.STRING,
      description: "The department this email should be routed to (e.g., Customer Success, Engineering, Billing, Sales)",
    }
  },
  required: ["category", "priority", "sentiment", "suggestedReply", "confidenceScore", "department"],
};

export async function analyzeEmail(subject: string, body: string, sender: string) {
  if (!ai) {
    console.warn("GEMINI_API_KEY is not set. Using mock analysis.");
    return {
      category: "Support",
      priority: body.toLowerCase().includes("urgent") ? "High" : "Medium",
      sentiment: "Neutral",
      suggestedReply: "Thank you for reaching out. Our team is looking into this and will get back to you shortly.",
      confidenceScore: 0.85,
      department: "Customer Success"
    };
  }

  const prompt = `
    Analyze the following email and categorize it.
    
    Sender: ${sender}
    Subject: ${subject}
    Body:
    ${body}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for more consistent classification
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("Empty response from Gemini");

  } catch (error) {
    console.error("Error analyzing email with Gemini:", error);
    // Fallback if the API fails
    return {
      category: "Unclassified",
      priority: "Medium",
      sentiment: "Unknown",
      suggestedReply: "Thank you for your message. We have received it and will review it shortly.",
      confidenceScore: 0.0,
      department: "General"
    };
  }
}
