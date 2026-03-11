import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getToken } from "next-auth/jwt";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 3600000; // 1 hour

const SYSTEM_PROMPT = `You are a Next.js frontend engineer building components for RareImagery store owner storefronts.

RareImagery storefronts use a MySpace-era Y2K aesthetic. Components you generate must feel native to this visual language:
- Backgrounds: tiled emoji patterns, glitter textures, dark or neon gradients
- Typography: CSS blink, rainbow text, glitter-text animations, marquee elements
- Colors: hot pink, electric purple, cyber teal, scene gold, deep black — never neutral palettes
- Borders: pixel-art style, thick neon glows, dashed/dotted with color
- Layout: expressive, asymmetric, dense — not clean or minimal

Rules:
- Output only valid Next.js code (App Router, TypeScript)
- Use only Tailwind CSS utility classes for layout and spacing
- Use inline CSS or <style jsx> for Y2K animations (blink, marquee, glitter) — Tailwind cannot express these
- Never explain concepts — respond with code only
- Always include all necessary imports
- Output a single self-contained component per response
- If the request is unclear, default to a Y2K-styled card or section component`;

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (token.sub ?? token.xId ?? "anon") as string;

  const now = Date.now();
  const limit = rateLimitMap.get(userId) ?? { count: 0, reset: now + RATE_WINDOW };
  if (now > limit.reset) {
    limit.count = 0;
    limit.reset = now + RATE_WINDOW;
  }
  if (limit.count >= RATE_LIMIT) {
    return NextResponse.json(
      { error: "Rate limit reached. Try again in an hour." },
      { status: 429 }
    );
  }
  limit.count++;
  rateLimitMap.set(userId, limit);

  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: message }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return NextResponse.json({ result: text });
}
