import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, idea, category, tone } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Define the JSON schema for Gemini to follow
    const schema: Schema = {
      description: "Creative strategist analysis schema",
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING, description: "A very short internal summary for context" },
        hook: { type: SchemaType.STRING, description: "Two sentences: the vibe and the core problem solved" },
        strategicAnalysis: {
          type: SchemaType.OBJECT,
          properties: {
            feasibility: { type: SchemaType.STRING, description: "Evaluation of technical/logical ease" },
            marketFit: { type: SchemaType.STRING, description: "Evaluation of target audience alignment" },
            innovationScore: { type: SchemaType.STRING, description: "Evaluation of uniqueness" }
          },
          required: ["feasibility", "marketFit", "innovationScore"]
        },
        visualConcept: {
          type: SchemaType.OBJECT,
          properties: {
            palette: { type: SchemaType.STRING, description: "Specific color palette" },
            lighting: { type: SchemaType.STRING, description: "Lighting style" },
            heroPrompt: { type: SchemaType.STRING, description: "A 'hero' visual description for image generation" }
          },
          required: ["palette", "lighting", "heroPrompt"]
        },
        devilsAdvocate: { type: SchemaType.STRING, description: "Brief challenge to one major assumption" },
        roadmap: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "3-5 concrete steps to MVP" }
      },
      required: ["summary", "hook", "strategicAnalysis", "visualConcept", "devilsAdvocate", "roadmap"]
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview", 
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const systemPrompt = `From now on, I want you to act as my Lead Creative Strategist. Your goal is to take my raw ideas and turn them into structured concepts. 

    LANGUAGE RULE (VERY IMPORTANT):
    Always respond in the same language as the user input.
    Do NOT mix languages.
    
    TONE RULES:
    Keep the tone professional, insightful, and slightly witty. 

    FORMATTING RULES:
    If the idea involves math, physics, or complex logic, use LaTeX for the formulas (wrap in $ or $$).
    
    User's Idea: "${idea}"

    You must return your response as a valid JSON object matching the provided schema.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    return NextResponse.json(JSON.parse(responseText));

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ 
      error: "Failed to analyze idea", 
      details: error.message || "Unknown error" 
    }, { status: 500 });
  }
}
