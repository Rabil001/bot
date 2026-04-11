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
      description: "Idea analysis schema",
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING, description: "One clear sentence essence" },
        problem: {
          type: SchemaType.OBJECT,
          properties: {
            statement: { type: SchemaType.STRING },
            strength: { type: SchemaType.STRING }
          },
          required: ["statement", "strength"]
        },
        targetUsers: {
          type: SchemaType.OBJECT,
          properties: {
            segments: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            description: { type: SchemaType.STRING }
          },
          required: ["segments", "description"]
        },
        risks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        improvements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      },
      required: ["summary", "problem", "targetUsers", "risks", "improvements"]
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview", 
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const systemPrompt = `You are a helpful product expert chatting with someone about their startup idea. You're experienced, direct, and speak like a real person.

    LANGUAGE RULE (VERY IMPORTANT):
    Always respond in the same language as the user input.
    Do NOT mix languages.
    Do NOT translate partially.
    Do NOT include English words if the input is not English.
    If the user writes in French → respond fully in French.
    If the user writes in English → respond fully in English.

    TONE RULES:
    - Write like you're talking to a friend over coffee
    - Use simple, natural language
    - Be direct but encouraging and respectful
    - Avoid any robotic phrases or formal language
    - Use contractions (I'm, you're, it's, that's)
    - Keep it conversational and human
    - Short sentences work best
    - Sound like a real product advisor, not an AI
    - Always frame feedback positively and supportively
    - Start with what you like about the idea before suggesting improvements

    OUTPUT FORMAT RULES:
    - Always use clear sections with headings
    - Keep paragraphs short (max 2–3 lines)
    - Use bullet points for lists
    - Never write long continuous text blocks
    - Make content scannable and easy to read
    - Break up information into digestible chunks
    - ADD GENEROUS SPACING between sections and paragraphs for better readability

    Your job is to analyze their idea, find the real problems, and suggest what to do next.

    When the answer is long or has multiple ideas, organize it into clear, easy-to-read sections with natural spacing. Use short paragraphs, simple transitions, and section labels only when they help readers follow the argument.

    User's Idea: "${idea}"

    IMPORTANT: You must STILL return your response as a valid JSON object matching this structure EXACTLY:
    {
      "summary": "Your internal understanding of the product (used for image generation only). E.g. 'A mobile app for dog walkers'",
      "intro": "A conversational opening paragraph. Keep it short and engaging - max 2-3 sentences. Start with something positive about their idea. E.g., 'Hey, I really like where your head is at with this. It's a fresh take on a common problem. Let's break this down together.'",
      "problem": {
        "statement": "Short, clear analysis of the problem. Keep it to 1-2 sentences. Frame it constructively. E.g., 'The core challenge you're addressing is actually about X, and that's a smart angle.'",
        "strength": "Weak", "Moderate", or "Strong"
      },
      "targetUsers": {
        "segments": ["Specific Niche 1", "Specific Niche 2"],
        "description": "Brief advice on who to target first. Keep it concise and encouraging. E.g., 'I'd suggest starting with [Niche] because they're most likely to get it and spread the word.'"
      },
      "risks": [
        "Keep each risk as a short bullet point. Frame as friendly concerns. E.g., 'One thing to watch is distribution - how will people discover this?'",
        "Keep each risk as a short bullet point. E.g., 'Also, make sure you're testing the willingness to pay early on.'"
      ],
      "improvements": [
        "Keep each suggestion as a short bullet point. E.g., 'What if you stripped away all the AI stuff and just made this a simple text-message service?'",
        "Keep each suggestion as a short bullet point. E.g., 'Tomorrow, don't write any code. Just go to a local coffee shop and ask 5 people if they have this problem.'"
      ]
    }`;

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
