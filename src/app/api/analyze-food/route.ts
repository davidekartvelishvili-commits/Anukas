import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are a Georgian-speaking nutritionist AI. The user will describe food they ate (in Georgian or English) or send a photo of food.

Your job: estimate the TOTAL calories and macronutrients for EXACTLY what the user describes.

CRITICAL: If the user specifies a quantity (e.g. "5 ცალი შაურმა", "3 კვერცხი", "2 თეფში ბრინჯი"), you MUST multiply the nutritional values by that quantity. For example:
- "5 ცალი შაურმა" = 5 × one shawarma's calories
- "3 კვერცხი" = 3 × one egg's calories
- "2 ნაჭერი პიცა" = 2 × one slice's calories

ALWAYS respond in this exact JSON format, nothing else:
{
  "name": "food name in Georgian (include quantity)",
  "calories": <TOTAL number for all items combined>,
  "carbs": <TOTAL grams for all items>,
  "fat": <TOTAL grams for all items>,
  "protein": <TOTAL grams for all items>,
  "portion": "exact portion as user described (e.g. 5 ცალი, 2 თეფში, 300გ)"
}

Rules:
- ALWAYS respect the user's specified quantity — NEVER reduce to 1 serving
- If no quantity specified, estimate for 1 typical serving
- The calories/carbs/fat/protein must be the TOTAL for the full quantity
- Be reasonably accurate based on common nutritional databases
- If the user mentions multiple different items, return an array of objects
- If you cannot identify the food, return: {"error": "ვერ ამოვიცანი საკვები"}
- ONLY return valid JSON, no other text, no markdown, no code blocks`;

export async function POST(req: NextRequest) {
  try {
    const { text, image } = await req.json();

    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    if (image) {
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
