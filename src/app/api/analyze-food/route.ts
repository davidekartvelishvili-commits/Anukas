import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

// Try multiple models in order of preference
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

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

    const body = JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    let data = null;
    let lastError = "";

    // Try each model, with one retry per model
    for (const model of MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetch(geminiUrl(model), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (response.ok) {
          data = await response.json();
          break;
        }

        lastError = await response.text();

        // If rate limited, wait and retry
        if (response.status === 429 && attempt === 0) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        break; // other error, try next model
      }
      if (data) break;
    }

    if (!data) {
      return NextResponse.json(
        { error: "სერვისი დროებით მიუწვდომელია. სცადე რამდენიმე წამში." },
        { status: 429 }
      );
    }
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
