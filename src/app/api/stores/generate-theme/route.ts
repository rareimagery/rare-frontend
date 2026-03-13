import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();

// Top-rated creation insights the bot can learn from (from docs/best_creations.json)
const BEST_CREATION_INSIGHTS = [
  {
    subculture: "scene",
    insight: "The contrast between near-black page bg and hot pink accent creates instant scene recognition. Stars tiled at 0.15 opacity add texture without killing readability. Boogaloo at tracking-widest makes the store title feel like a band name.",
  },
  {
    subculture: "skate",
    insight: "Bebas Neue at tracking-widest in all-caps transforms any storefront into a streetwear drop page. White background with a single red accent makes products pop with zero distraction.",
  },
  {
    subculture: "goth",
    insight: "Cinzel Decorative with glow text shadow on a near-black background is the fastest way to signal dark romanticism without any imagery. Deep purple borders create a velvet feel.",
  },
];

// ─── SYSTEM PROMPT (from MYSPACE_THEME_BOT_RULES.md Section 10) ──────────────

const SYSTEM_PROMPT = `You are the RareImagery theme bot. You generate MySpace-era storefront themes for X creators.

You output ONLY valid JSON matching the schema below.
You never write JSX, CSS, or HTML.
You never explain your choices unless asked.
You never produce placeholder values — every field must have a real value.
You MUST never violate these 8 hard limits:
1. Products must appear in positions 1–3 of mobile.stack_order (top8 or products)
2. layout.structure must be one of: two_col_left | two_col_right | three_col | sidebar_heavy
3. player.type must be one of: x_spaces_link | x_post_embed | disabled (never a raw audio URL)
4. mobile.touch_target_size must be "comfortable" or "compact"
5. animation.reduced_motion_fallback is always true
6. decorations.show_blinkies can only be true for scene, Y2K, or pop_princess subcultures — and only if explicitly requested
7. All hex values must be valid 6-character hex codes (e.g. #ff00cc, not #fff or "white")
8. meta.version is always "1.0"

Peak era: 2006–2008 MySpace. Maximum self-expression. Fixed grid.

Your inputs are:
1. Creator X profile data (provided as JSON)
2. Quiz answers (provided as key-value pairs)
3. Optional named preset (a string like "emo" or "scene queen")

Your output is one JSON object. Nothing else.

Reference the subculture presets to set defaults.
Apply X profile signal rules to modify defaults.
Apply quiz answers to further modify.
If a named preset is given, it overrides signal detection but quiz answers still apply on top.

COMPLETE JSON SCHEMA (every key required):
{
  "meta": {
    "preset_name": "string",
    "subculture": "string",
    "generated_from": "x_profile | quiz | named_preset | combined",
    "version": "1.0"
  },
  "layout": {
    "structure": "two_col_left | two_col_right | three_col | sidebar_heavy",
    "sidebar_width": "narrow | medium | wide",
    "content_density": "sparse | balanced | packed",
    "section_order": ["header", "player", "about", "top8", "products", "reviews"]
  },
  "background": {
    "type": "solid | gradient | tiled_pattern | image_url",
    "color_primary": "#hex",
    "color_secondary": "#hex",
    "gradient_direction": "to-b | to-br | to-r | null",
    "pattern_style": "stars | hearts | skulls | plaid | dots | lightning | null",
    "pattern_opacity": 0.0
  },
  "colors": {
    "page_bg": "#hex",
    "sidebar_bg": "#hex",
    "content_bg": "#hex",
    "card_bg": "#hex",
    "border": "#hex",
    "accent_primary": "#hex",
    "accent_secondary": "#hex",
    "text_body": "#hex",
    "text_heading": "#hex",
    "text_link": "#hex",
    "text_link_hover": "#hex",
    "scrollbar_track": "#hex",
    "scrollbar_thumb": "#hex"
  },
  "typography": {
    "font_heading": "string",
    "font_body": "string",
    "font_accent": "string",
    "heading_size": "text-2xl | text-3xl | text-4xl | text-5xl",
    "body_size": "text-sm | text-base | text-lg",
    "letter_spacing": "tracking-tight | tracking-normal | tracking-wide | tracking-widest",
    "text_transform": "none | uppercase | lowercase",
    "text_shadow": "none | soft | glow | hard"
  },
  "header": {
    "layout": "banner_behind | banner_above | no_banner | split",
    "avatar_shape": "circle | square | rounded | hexagon",
    "avatar_border_style": "solid | dashed | double | glitter | none",
    "avatar_border_color": "#hex",
    "avatar_size": "sm | md | lg | xl",
    "username_style": "plain | glitter | outlined | shadow | neon",
    "show_follower_count": true,
    "show_x_handle": true,
    "show_mood": true,
    "mood_icon": "emoji or null",
    "mood_text": "string or null"
  },
  "player": {
    "enabled": true,
    "type": "x_spaces_link | x_post_embed | disabled",
    "position": "sidebar_top | sidebar_bottom | header_inline | floating_bottom",
    "style": "retro_cassette | pill | minimal | chunky_button",
    "label": "string",
    "color_bg": "#hex",
    "color_text": "#hex",
    "color_button": "#hex",
    "show_waveform_decoration": true
  },
  "about": {
    "enabled": true,
    "title": "string",
    "source": "x_bio | custom | null",
    "box_style": "bordered | shadowed | transparent | glassy",
    "show_top_posts": true,
    "top_posts_count": 3,
    "show_interests": true
  },
  "top8": {
    "enabled": true,
    "title": "string",
    "count": 8,
    "grid_cols": "2 | 4 | 8",
    "card_style": "polaroid | flat | rounded | bordered | floating",
    "card_hover": "scale | glow | shake | none",
    "show_product_name": true,
    "show_price": true,
    "label_style": "tag | badge | inline | none"
  },
  "products": {
    "grid_cols_desktop": "2 | 3 | 4",
    "grid_cols_mobile": "1 | 2",
    "card_style": "flat | raised | polaroid | bordered",
    "card_bg": "#hex",
    "card_border_color": "#hex",
    "card_border_radius": "none | sm | md | lg | xl | full",
    "image_aspect": "square | portrait | landscape",
    "hover_effect": "scale | shadow | border_glow | flip | none",
    "show_add_to_cart": true,
    "add_to_cart_style": "pill | square | ghost | chunky",
    "add_to_cart_color": "#hex",
    "add_to_cart_text": "string"
  },
  "decorations": {
    "use_sparkle_dividers": true,
    "use_animated_border": false,
    "cursor_style": "default | star | heart | skull | crosshair",
    "show_blinkies": false,
    "corner_decoration": "none | stars | hearts | skulls | lightning",
    "section_divider_style": "none | line | dotted | hearts | stars | zigzag",
    "section_divider_color": "#hex",
    "glitter_text_on": ["username"],
    "badge_style": "pixel | rounded | sticker | minimal"
  },
  "animation": {
    "page_entrance": "none | fade_in | slide_up | glitch",
    "header_animation": "none | pulse | float | shimmer",
    "product_card_entrance": "none | stagger_fade | pop_in",
    "reduced_motion_fallback": true
  },
  "mobile": {
    "stack_order": ["header", "player", "top8", "products", "about"],
    "sidebar_collapse": "hide | accordion | drawer",
    "touch_target_size": "comfortable | compact"
  }
}`;

// ─── SUBCULTURE SIGNAL RULES (from Section 6) ────────────────────────────────

function buildUserMessage(
  quizAnswers: Record<string, string>,
  preset?: string,
  xProfileData?: Record<string, unknown>
): string {
  const parts: string[] = [];

  if (preset) {
    parts.push(`NAMED PRESET: "${preset}"`);
  }

  if (xProfileData) {
    parts.push(`X PROFILE DATA:\n${JSON.stringify(xProfileData, null, 2)}`);
  }

  if (Object.keys(quizAnswers).length > 0) {
    parts.push(
      `QUIZ ANSWERS:\n${Object.entries(quizAnswers)
        .map(([q, a]) => `- ${q}: ${a}`)
        .join("\n")}`
    );
  }

  // Include top-rated best creation insights as inspiration
  const presetLower = (preset || "").toLowerCase();
  const relevantInsights = BEST_CREATION_INSIGHTS.filter(
    (c) => !preset || presetLower.includes(c.subculture) || c.subculture.includes(presetLower.split(" ")[0])
  ).slice(0, 2);

  if (relevantInsights.length > 0) {
    parts.push(
      `INSPIRATION FROM BEST CREATIONS:\n${relevantInsights
        .map((c) => `(${c.subculture}): ${c.insight}`)
        .join("\n\n")}`
    );
  }

  parts.push(
    "Generate a complete theme JSON config for this creator. Output ONLY the JSON object, no explanation, no markdown code blocks."
  );

  return parts.join("\n\n");
}

// ─── ROUTE HANDLER ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { quizAnswers = {}, preset, xProfileData } = body as {
    quizAnswers?: Record<string, string>;
    preset?: string;
    xProfileData?: Record<string, unknown>;
  };

  const userMessage = buildUserMessage(quizAnswers, preset, xProfileData);

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip any accidental markdown code fences
    const jsonText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let themeConfig: unknown;
    try {
      themeConfig = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse theme JSON:", jsonText.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: jsonText.slice(0, 500) },
        { status: 500 }
      );
    }

    return NextResponse.json({ themeConfig });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Theme generation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
