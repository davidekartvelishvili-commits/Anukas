import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are a Georgian-speaking fitness AI. The user will describe a physical activity they did (in Georgian or English).

Your job: estimate the calories burned based on the activity description.

ALWAYS respond in this exact JSON format, nothing else:
{
  "name": "activity name in Georgian",
  "duration": <minutes as number>,
  "caloriesBurned": <number>
}

Rules:
- Estimate calories burned based on average body weight (~70kg) and moderate intensity
- Common calorie burn rates per minute: running 10, walking 4, swimming 8, cycling 7, yoga 3, weight training 6, football 9, tennis 8, basketball 8, dancing 5, boxing 10, skiing 7, climbing 9, gymnastics 5
- If the user mentions duration, use it. If not, assume 30 minutes
- If you cannot understand the activity, return: {"error": "ვერ ამოვიცანი აქტივობა"}
- ONLY return valid JSON, no other text, no markdown, no code blocks`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text || "" }],
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
        { error: "ვერ ამოვიცანი აქტივობა" },
        { status: 400 }
      );
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
