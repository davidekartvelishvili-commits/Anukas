import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are a Georgian-speaking nutritionist AI. The user will describe food they ate (in Georgian or English) or send a photo of food.

Your job: estimate the calories and macronutrients for that food item.

ALWAYS respond in this exact JSON format, nothing else:
{
  "name": "food name in Georgian",
  "calories": <number>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "protein": <number in grams>,
  "portion": "portion description in Georgian (e.g. 1 თეფში, 100გ, 1 ცალი)"
}

Rules:
- Estimate for a typical single serving/portion unless the user specifies otherwise
- Be reasonably accurate based on common nutritional databases
- If the user mentions multiple items, return an array of objects
- If you cannot identify the food, return: {"error": "ვერ ამოვიცანი საკვები"}
- ONLY return valid JSON, no other text, no markdown, no code blocks`;

export async function POST(req: NextRequest) {
  try {
    const { text, image } = await req.json();

    const parts: Array<Record<string, unknown>> = [];

    // Add system instruction as first text part
    parts.push({ text: SYSTEM_PROMPT });

    if (image) {
      // image is base64 data URL like "data:image/jpeg;base64,..."
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
      parts.push({
        text: text || "რა საკვებია ამ ფოტოზე? გამოთვალე კალორიები და მაკროები.",
      });
    } else {
      parts.push({ text: text || "" });
    }

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Gemini error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const responseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean markdown code blocks if present
    const cleaned = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: "ვერ ამოვიცანი საკვები" },
        { status: 400 }
      );
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
