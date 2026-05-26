import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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
- ONLY return valid JSON, no other text`;

export async function POST(req: NextRequest) {
  try {
    const { text, image } = await req.json();

    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    if (image) {
      // image is base64 data URL like "data:image/jpeg;base64,..."
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: match[2],
          },
        });
      }
      content.push({
        type: "text",
        text: text || "რა საკვებია ამ ფოტოზე? გამოთვალე კალორიები და მაკროები.",
      });
    } else {
      content.push({ type: "text", text: text || "" });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON from response
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ error: "ვერ ამოვიცანი საკვები" }, { status: 400 });
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
