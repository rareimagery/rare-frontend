import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

type AIStudioRequest = {
  prompt?: string;
  handle?: string;
  drupalContext?: unknown;
};

function inferComponents(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const result: string[] = [];

  if (/(video|reel|clip|grok)/.test(lower)) result.push('grok-grid');
  if (/(product|shop|merch|bundle|checkout)/.test(lower)) result.push('product-showcase');
  if (/(subscribe|subscriber|membership|\$4|cta)/.test(lower)) result.push('subscriber-hero');

  return Array.from(new Set(result));
}

function inferCss(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (/(retro|myspace|y2k)/.test(lower)) {
    return `
:root {
  --ri-accent: #ff5db1;
}
[data-ri-preview] h1, [data-ri-preview] h2 {
  letter-spacing: 0.02em;
  text-shadow: 0 0 18px rgba(255, 93, 177, 0.45);
}
[data-ri-preview] .ri-card {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: linear-gradient(145deg, rgba(22, 18, 47, 0.9), rgba(62, 15, 68, 0.78));
}
`.trim();
  }

  if (/(minimal|clean|simple)/.test(lower)) {
    return `
[data-ri-preview] {
  --ri-surface: #f8fafc;
  --ri-text: #111827;
}
[data-ri-preview] .ri-card {
  background: var(--ri-surface);
  color: var(--ri-text);
  border: 1px solid rgba(17, 24, 39, 0.09);
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
}
`.trim();
  }

  return `
[data-ri-preview] .ri-card {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.16);
}
`.trim();
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start < 0 || end <= start) return null;

  const candidate = trimmed.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function generateWithGrok(input: AIStudioRequest): Promise<{ tailwindCode: string; componentsToAdd: string[] } | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;

  const userPrompt = (input.prompt || '').trim();
  const context = input.drupalContext ? JSON.stringify(input.drupalContext).slice(0, 5000) : '{}';

  const systemPrompt = [
    'You are an expert Next.js + Tailwind creator studio assistant.',
    'Return strict JSON only with shape:',
    '{"tailwindCode":"<css string>","componentsToAdd":["grok-grid","product-showcase","subscriber-hero"]}',
    'tailwindCode must be plain CSS text only (no markdown/code fences).',
    'componentsToAdd must only include known component ids.',
  ].join(' ');

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Handle: ${input.handle || 'unknown'}\nPrompt: ${userPrompt}\nDrupalContext: ${context}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) return null;

  const json = await response.json();
  const content = String(json?.choices?.[0]?.message?.content || '');
  const parsed = extractJsonObject(content);
  if (!parsed) return null;

  const tailwindCode = typeof parsed.tailwindCode === 'string' ? parsed.tailwindCode : '';
  const raw = Array.isArray(parsed.componentsToAdd) ? parsed.componentsToAdd : [];
  const componentsToAdd = Array.from(
    new Set(
      raw
        .map((value) => String(value))
        .filter((value) => value === 'grok-grid' || value === 'product-showcase' || value === 'subscriber-hero')
    )
  );

  return { tailwindCode, componentsToAdd };
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as AIStudioRequest;
  const prompt = (body.prompt || '').trim();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const heuristicComponents = inferComponents(prompt);
  const heuristicTailwindCode = inferCss(prompt);

  const grokResult = await generateWithGrok(body);
  const tailwindCode = grokResult?.tailwindCode || heuristicTailwindCode;
  const componentsToAdd = Array.from(
    new Set([...(grokResult?.componentsToAdd || []), ...heuristicComponents])
  );

  return NextResponse.json({
    tailwindCode,
    componentsToAdd,
    meta: {
      mode: grokResult ? 'grok-live-v1' : 'heuristic-v1',
      handle: body.handle || null,
      hasDrupalContext: Boolean(body.drupalContext),
    },
  });
}
