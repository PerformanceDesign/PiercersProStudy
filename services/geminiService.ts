
import { GoogleGenAI, Type } from "@google/genai";
import { LessonContent, Topic } from "../types";

export const generateLesson = async (topicTitle: string, isDeepDive: boolean = false): Promise<LessonContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const basePrompt = isDeepDive 
    ? `Generate a master-level technical analysis for the specific body piercing: "${topicTitle}". 
       This is for a professional piercer reference database.
       Include clinical details for every section. Be extremely specific about jewelry gauges, lengths, and materials.
       For "Procedure", provide a step-by-step clinical walkthrough.`
    : `Generate a detailed, professional, and well-researched lesson for a body piercing student about the topic: "${topicTitle}". 
       The content must be structured clinically and educationally.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: basePrompt,
    config: {
      temperature: 0.6,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          overview: { type: Type.STRING },
          anatomy: { type: Type.STRING, description: "Detailed anatomical structures involved" },
          tools: { type: Type.STRING, description: "Instruments required (clamps, needles, etc.)" },
          procedure: { type: Type.STRING, description: "Step-by-step clinical execution" },
          aftercare: { type: Type.STRING, description: "Detailed cleaning and lifestyle instructions" },
          complications: { type: Type.STRING, description: "Potential clinical issues and signs" },
          // Deep dive fields
          jewelrySpecs: { type: Type.STRING, description: "Standard gauges, lengths, diameters, and biocompatible materials" },
          painAndHealing: { type: Type.STRING, description: "Expected pain levels (1-10) and comprehensive healing timeline" },
          difficulty: { type: Type.STRING, description: "Technical difficulty rating (1-10) with reasoning" },
          setup: { type: Type.STRING, description: "Full instrument and tool tray setup layout" },
          faqs: { type: Type.STRING, description: "Common professional and client questions" },
          prosCons: { type: Type.STRING, description: "Technical advantages and physiological risks" },
          redFlags: { type: Type.STRING, description: "Anatomical contraindications to decline service" },
          clientDiscussion: { type: Type.STRING, description: "Clinical consultation script and expectation setting" },
          commonIssues: { type: Type.STRING, description: "Typical healing hurdles like irritation bumps or migration" }
        },
        required: ["title", "overview", "anatomy", "tools", "procedure", "aftercare", "complications"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate content");
  }

  return JSON.parse(response.text.trim());
};

export const suggestTopics = async (existingTopics: string[]): Promise<Topic[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `Based on this existing body piercing curriculum: [${existingTopics.join(', ')}], 
  suggest 3-5 new, advanced, or niche technical topics that would be valuable for a professional piercer to study. 
  Focus on high-level clinical, technical, or historical aspects.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["id", "title"]
        }
      },
    },
  });

  if (!response.text) return [];
  return JSON.parse(response.text.trim());
};
