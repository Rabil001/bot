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

    // Define a much simpler, natural JSON schema
    const schema: Schema = {
      description: "Natural conversational response schema",
      type: SchemaType.OBJECT,
      properties: {
        message: { 
          type: SchemaType.STRING, 
          description: "A long, natural, conversational response. Use Markdown for structure and generous spacing. Talk like a real human mentor." 
        },
        visualConcept: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING, description: "A very short summary of the product (3-5 words)" },
            wireframe: { type: SchemaType.STRING, description: "A text-based wireframe or structural layout of the main screen. Use simple ASCII or a clear list of UI components." }
          },
          required: ["summary", "wireframe"]
        }
      },
      required: ["message", "visualConcept"]
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest", 
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const systemPrompt = `You are a startup mentor and a creative friend. Someone is sharing their raw idea with you. 

    YOUR GOAL: 
    Talk to them naturally. Don't use a fixed template or robotic sections. Just react to their idea, tell them what you find cool about it, and share some real-world advice on what to think about next.

    LANGUAGE RULE:
    Always respond in the same language as the user. No mixing.

    TONE:
    - Natural, warm, and human.
    - If you challenge them, do it like a friend ("I'm wondering if X might be a hurdle...").
    - Use "I" and "you".

    FORMATTING (VITAL FOR READABILITY):
    - Use Markdown Headers (###) for main topics.
    - Use bold text sparingly to highlight key concepts.
    - IMPORTANT: Add at least TWO newlines between paragraphs and sections for generous spacing.
    - Keep paragraphs short (2-3 sentences max).
    - Use bullet points for advice to make it scannable.
    
    User's Idea: "${idea}"

    VISUAL CONCEPT RULE:
    Instead of an image, provide a 'wireframe' field. This should be a clear, text-based description or ASCII-like structure of how the main interface should look. Focus on the user flow and placement of elements.

    Return a JSON object with a 'message' field and a 'visualConcept' field.`;

    const result = await model.generateContent(systemPrompt);
    let responseText = result.response.text();
    
    // Clean potential markdown formatting if the model ignores the MIME type
    if (responseText.includes("```json")) {
      responseText = responseText.split("```json")[1].split("```")[0].trim();
    } else if (responseText.includes("```")) {
      responseText = responseText.split("```")[1].split("```")[0].trim();
    }
    
    return NextResponse.json(JSON.parse(responseText));

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ 
      error: "Failed to analyze idea", 
      details: error.message || "Unknown error" 
    }, { status: 500 });
  }
}
