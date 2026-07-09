import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError: any = null;
  
  for (const model of models) {
    try {
      console.log(`Trying ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: "یک مقاله درباره ایمپلنت بنویس.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              category: { type: Type.STRING },
              readTime: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ["title", "excerpt", "category", "readTime", "imageUrl", "content"]
          }
        }
      });
      console.log(`Success with ${model}!`);
      try {
        JSON.parse(response.text || "{}");
        console.log("JSON PARSE OK!");
      } catch (e) {
        console.log("JSON PARSE FAILED!");
        console.log("Text was:");
        console.log(response.text);
      }
      return;
    } catch (e: any) {
      console.log(`Failed with ${model}:`, e?.message);
    }
  }
}
run();
