import { GoogleGenAI, Type } from "@google/genai";
import { AIInsight } from "../types";

const apiKey = process.env.API_KEY || '';

export const generateCountryInsight = async (countryName: string, stats: any): Promise<AIInsight> => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini.");
    return {
      summary: "API Key missing. Unable to generate real-time AI insights.",
      keyFactors: ["Data Unavailable"],
      outlook: "Neutral"
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Generate a concise economic and demographic analysis for ${countryName}. 
    Context data (simulated): Population ${stats.population}, GDP Per Capita $${stats.gdpPerCapita}, Growth ${stats.gdpGrowth}%.
    
    Provide:
    1. A 2-sentence summary of their current economic status.
    2. 3 bullet points of key factors influencing their development.
    3. A one-word outlook (Positive, Neutral, Negative).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyFactors: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            outlook: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] }
          },
          required: ["summary", "keyFactors", "outlook"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text) as AIInsight;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      summary: "Unable to retrieve AI insights at this moment.",
      keyFactors: ["Network Error", "API Limit Reached"],
      outlook: "Neutral"
    };
  }
};
