import { NextRequest, NextResponse } from "next/server";

const XAI_API_KEY = process.env.XAI_API_KEY;

// Simple in-memory cache: userId -> { data, timestamp }
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const maxResults = Math.min(
    parseInt(searchParams.get("max_results") || "50", 10),
    100
  );
  const excludeReplies = searchParams.get("exclude_replies") === "true";

  const cacheKey = `${userId}:${maxResults}:${excludeReplies}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Cache": "HIT",
      },
    });
  }

  // Try xAI Grok API with built-in x_search tool
  if (XAI_API_KEY) {
    try {
      const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${XAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-3",
          messages: [
            {
              role: "system",
              content:
                "You fetch X/Twitter posts for a user. Return a JSON object with a 'posts' array. Each post has: id, text, created_at, media (array of {type, url, width, height}), metrics ({like_count, retweet_count, reply_count}), url. Return only valid JSON, no markdown.",
            },
            {
              role: "user",
              content: `Fetch the ${maxResults} most recent posts from X user ID ${userId}.${
                excludeReplies ? " Exclude replies." : ""
              } Return as JSON with a "posts" array.`,
            },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      });

      if (grokRes.ok) {
        const grokData = await grokRes.json();
        const content = grokData.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const result = {
            posts: parsed.posts || [],
            next_token: null,
            source: "grok",
          };

          cache.set(cacheKey, { data: result, timestamp: Date.now() });

          return NextResponse.json(result, {
            headers: {
              "Cache-Control":
                "public, s-maxage=300, stale-while-revalidate=600",
              "X-Cache": "MISS",
            },
          });
        }
      }
    } catch (err) {
      console.error("Grok X feed proxy error:", err);
    }
  }

  // Fallback: return empty feed
  return NextResponse.json(
    {
      posts: [],
      next_token: null,
      source: "none",
      error: "No X feed source configured",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60",
      },
    }
  );
}
