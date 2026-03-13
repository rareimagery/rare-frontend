import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getToken } from "next-auth/jwt";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 3600000; // 1 hour

// ---------------------------------------------------------------------------
// Base rules (shared across all themes)
// ---------------------------------------------------------------------------

const BASE_RULES = `You are a Next.js frontend engineer building components for RareImagery creator storefronts.

Rules:
- Output only valid React/JSX code that can run in a browser with Babel standalone
- Use Tailwind CSS utility classes for layout and spacing
- Use inline styles or <style> tags for custom animations — Tailwind cannot express these
- Never explain concepts — respond with code only
- Always export a default function component
- Output a single self-contained component per response
- Do not use import statements (React is available globally in the preview)
- If the request is unclear, default to a styled card or section component`;

// ---------------------------------------------------------------------------
// Theme-specific style instructions
// ---------------------------------------------------------------------------

const THEME_PROMPTS: Record<string, string> = {
  xai3: `Visual language: Dark, premium, X-inspired.
- Backgrounds: zinc-950, zinc-900, pure black
- Accent colors: indigo-500, purple-500, gold/amber highlights
- Typography: clean sans-serif, monospace for stats/numbers
- Borders: subtle zinc-800, rounded-xl containers
- Layout: centered column (max 600px), card-based, generous padding
- Vibe: sleek, data-driven, premium creator platform`,

  minimal: `Visual language: Clean, light, whitespace-forward.
- Backgrounds: white, gray-50, warm neutrals
- Accent colors: black text, subtle gray borders, one pop color (indigo or teal)
- Typography: system font stack, light weights, generous line height
- Borders: thin (1px), light gray, large border-radius
- Layout: max-width containers, lots of whitespace, grid-based
- Vibe: elegant, calm, editorial simplicity`,

  neon: `Visual language: Cyberpunk, dark, neon glow.
- Backgrounds: pure black (#000), very dark grays
- Accent colors: cyan (#00ffff), magenta (#ff00ff), neon green (#00ff80), electric blue
- Typography: bold sans-serif, uppercase headers, glow text-shadows
- Borders: neon glow effects (box-shadow with color), thick colored borders
- Layout: asymmetric, bold sections, full-bleed color blocks
- Animations: pulse, glow transitions, color cycling
- Vibe: synthwave, cyberpunk, high-energy`,

  editorial: `Visual language: Magazine-style, warm, sophisticated.
- Backgrounds: cream (#faf8f5), warm white, soft beige
- Accent colors: deep navy, burgundy, forest green, warm gold
- Typography: serif headings (Georgia/Times), sans body text, large type sizes
- Borders: thin rules, editorial dividers, minimal decoration
- Layout: magazine grid, pull quotes, asymmetric columns, generous margins
- Vibe: editorial, curated, gallery-like, intellectual`,

  myspace: `Visual language: MySpace-era Y2K, maximalist, nostalgic.
- Backgrounds: tiled emoji patterns, glitter textures, dark or neon gradients
- Typography: CSS blink, rainbow text, glitter-text animations, marquee elements
- Colors: hot pink (#ff0080), electric purple, cyber teal (#00ffff), scene gold, deep black
- Borders: pixel-art style, thick neon glows, dashed/dotted with color
- Layout: expressive, asymmetric, dense — not clean or minimal
- Animations: blink, rainbow color cycling, glitter sparkle, marquee scroll
- Vibe: chaotic, fun, deeply personal, peak MySpace energy`,

  xmimic: `Visual language: X/Twitter clone, timeline-focused.
- Backgrounds: black (#000), zinc-900 cards
- Accent colors: blue-500 (X blue), white text, gray-500 secondary
- Typography: system sans-serif, 15px body, bold display names
- Borders: 1px zinc-800 dividers, rounded-2xl cards
- Layout: single column (600px max), timeline cards, avatar + content rows
- Vibe: social media, familiar, content-first, conversation-threaded`,
};

function getSystemPrompt(theme: string): string {
  const themeBlock = THEME_PROMPTS[theme] || THEME_PROMPTS.xai3;
  return `${BASE_RULES}\n\nStore theme: "${theme}"\n${themeBlock}`;
}

// ---------------------------------------------------------------------------
// Route handler — streaming with prompt caching
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (token.sub ?? token.xId ?? "anon") as string;

  // Rate limiting
  const now = Date.now();
  const limit = rateLimitMap.get(userId) ?? {
    count: 0,
    reset: now + RATE_WINDOW,
  };
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

  const { message, theme } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const systemPrompt = getSystemPrompt(theme || "xai3");

  // Stream the response for faster perceived speed
  const stream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    system: [
      {
        type: "text" as const,
        text: systemPrompt,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [{ role: "user", content: message }],
  });

  // Create a ReadableStream that forwards text deltas
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        const encoder = new TextEncoder();
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}
