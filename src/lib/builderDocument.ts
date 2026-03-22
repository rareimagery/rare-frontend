export type BuilderBlockType =
  | "profile-header"
  | "top-menu"
  | "sidebar"
  | "friends-list"
  | "post-feed"
  | "product-grid"
  | "media-widget"
  | "custom-embed";

export interface BuilderFriend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  followerCount?: number;
}

export interface BuilderPost {
  id: string;
  text: string;
  image?: string;
}

export interface BuilderProduct {
  id: string;
  title: string;
  price: number;
  image?: string;
  description?: string;
}

export interface BuilderPreviewData {
  handle: string;
  bio: string;
  avatar: string | null;
  banner: string | null;
  followerCount: number;
  friends: BuilderFriend[];
  posts: BuilderPost[];
  products: BuilderProduct[];
}

export interface BuilderTheme {
  pageBg: string;
  menuBg: string;
  sidebarBg: string;
  surface: string;
  surfaceMuted: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

export interface ProfileHeaderBlock {
  id: string;
  type: "profile-header";
  title: string;
  subtitle: string;
  ctaLabel: string;
  showBanner: boolean;
  showAvatar: boolean;
}

export interface TopMenuBlock {
  id: string;
  type: "top-menu";
  items: string[];
}

export interface SidebarBlock {
  id: string;
  type: "sidebar";
  heading: string;
  description: string;
  ctaLabel: string;
}

export interface FriendsListBlock {
  id: string;
  type: "friends-list";
  title: string;
  maxItems: number;
}

export interface PostFeedBlock {
  id: string;
  type: "post-feed";
  title: string;
  maxItems: number;
}

export interface ProductGridBlock {
  id: string;
  type: "product-grid";
  title: string;
  maxItems: number;
  columns: 2 | 3;
}

export interface MediaWidgetBlock {
  id: string;
  type: "media-widget";
  title: string;
  embedUrl: string;
  caption: string;
}

export interface CustomEmbedBlock {
  id: string;
  type: "custom-embed";
  title: string;
  html: string;
}

export type BuilderBlock =
  | ProfileHeaderBlock
  | TopMenuBlock
  | SidebarBlock
  | FriendsListBlock
  | PostFeedBlock
  | ProductGridBlock
  | MediaWidgetBlock
  | CustomEmbedBlock;

export interface BuilderDocument {
  schemaVersion: 3;
  meta: {
    name: string;
    handle: string;
    updatedAt: string;
  };
  theme: BuilderTheme;
  blocks: BuilderBlock[];
}

type LegacyPuckNode = {
  type?: string;
  props?: Record<string, unknown>;
};

type LegacyPuckBuild = {
  type?: string;
  version?: number;
  handle?: string;
  data?: {
    content?: LegacyPuckNode[];
  };
};

export const DEFAULT_BUILDER_THEME: BuilderTheme = {
  pageBg: "#090f1d",
  menuBg: "#0f172a",
  sidebarBg: "#101827",
  surface: "#131c2e",
  surfaceMuted: "#1c2740",
  accent: "#60a5fa",
  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  border: "#334155",
};

function createId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `${prefix}-${uuid}` : `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyPreviewData(handle = "creator"): BuilderPreviewData {
  return {
    handle,
    bio: "Creator bio will appear here after X data sync.",
    avatar: null,
    banner: null,
    followerCount: 0,
    friends: [],
    posts: [],
    products: [],
  };
}

export function createBlock(type: BuilderBlockType): BuilderBlock {
  switch (type) {
    case "profile-header":
      return {
        id: createId("profile"),
        type,
        title: "Creator profile",
        subtitle: "Posts, products, and community in one storefront.",
        ctaLabel: "Explore the drop",
        showBanner: true,
        showAvatar: true,
      };
    case "top-menu":
      return {
        id: createId("menu"),
        type,
        items: ["Home", "Shop", "Posts", "Friends", "Media"],
      };
    case "sidebar":
      return {
        id: createId("sidebar"),
        type,
        heading: "About this page",
        description: "Use the sidebar for a bio, CTA, schedule, links, or supporter perks.",
        ctaLabel: "Join the circle",
      };
    case "friends-list":
      return {
        id: createId("friends"),
        type,
        title: "Friends",
        maxItems: 6,
      };
    case "post-feed":
      return {
        id: createId("posts"),
        type,
        title: "Recent posts",
        maxItems: 4,
      };
    case "product-grid":
      return {
        id: createId("products"),
        type,
        title: "Shop the drop",
        maxItems: 6,
        columns: 3,
      };
    case "media-widget":
      return {
        id: createId("media"),
        type,
        title: "Now playing",
        embedUrl: "",
        caption: "Add a Spotify, YouTube, or Spaces link.",
      };
    case "custom-embed":
      return {
        id: createId("embed"),
        type,
        title: "Custom embed",
        html: "<div style=\"padding:16px;border-radius:16px;background:#0f172a;color:#f8fafc;\">Paste custom HTML or iframe embed markup here.</div>",
      };
  }
}

export function createDefaultBuilderDocument(handle = "creator"): BuilderDocument {
  return {
    schemaVersion: 3,
    meta: {
      name: `@${handle} storefront`,
      handle,
      updatedAt: new Date().toISOString(),
    },
    theme: { ...DEFAULT_BUILDER_THEME },
    blocks: [
      createBlock("top-menu"),
      createBlock("profile-header"),
      createBlock("sidebar"),
      createBlock("friends-list"),
      createBlock("post-feed"),
      createBlock("product-grid"),
    ],
  };
}

export function touchDocument(document: BuilderDocument): BuilderDocument {
  return {
    ...document,
    meta: {
      ...document.meta,
      updatedAt: new Date().toISOString(),
    },
  };
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mapLegacyPuckNode(node: LegacyPuckNode): BuilderBlock | null {
  const props = node.props || {};

  switch (node.type) {
    case "Hero":
      return {
        id: createId("profile"),
        type: "profile-header",
        title: asString(props.title, "Creator profile"),
        subtitle: asString(props.subtitle, "Posts, products, and community in one storefront."),
        ctaLabel: asString(props.ctaLabel, "Explore the drop"),
        showBanner: !!asString(props.bannerUrl),
        showAvatar: !!asString(props.avatarUrl, "1"),
      };
    case "ProductGrid":
      return {
        id: createId("products"),
        type: "product-grid",
        title: asString(props.heading, "Shop the drop"),
        maxItems: Math.max(1, Math.min(12, Array.isArray(props.productCards) ? props.productCards.length || 6 : 6)),
        columns: 3,
      };
    case "DonationBar":
      return {
        id: createId("sidebar"),
        type: "sidebar",
        heading: asString(props.title, "Support this creator"),
        description: asString(props.progressText, "Support, subscriptions, and community momentum live here."),
        ctaLabel: "Support now",
      };
    case "PostsList":
      return {
        id: createId("posts"),
        type: "post-feed",
        title: asString(props.heading, "Recent posts"),
        maxItems: 4,
      };
    default:
      return null;
  }
}

function parseLegacyPuckBuild(parsed: unknown): BuilderDocument | null {
  if (!parsed || typeof parsed !== "object") return null;

  const candidate = parsed as LegacyPuckBuild;
  if (candidate.type !== "puck" || !candidate.data || !Array.isArray(candidate.data.content)) {
    return null;
  }

  const handle = asString(candidate.handle, "creator");
  const mappedBlocks = candidate.data.content
    .map((node) => mapLegacyPuckNode(node))
    .filter((block): block is BuilderBlock => block !== null);

  const blocks = mappedBlocks.length > 0
    ? mappedBlocks
    : [createBlock("top-menu"), createBlock("profile-header"), createBlock("post-feed"), createBlock("product-grid")];

  if (!blocks.some((block) => block.type === "top-menu")) {
    blocks.unshift(createBlock("top-menu"));
  }

  if (!blocks.some((block) => block.type === "friends-list")) {
    blocks.splice(Math.min(2, blocks.length), 0, createBlock("friends-list"));
  }

  return {
    schemaVersion: 3,
    meta: {
      name: `@${handle} imported builder`,
      handle,
      updatedAt: new Date().toISOString(),
    },
    theme: { ...DEFAULT_BUILDER_THEME },
    blocks,
  };
}

export function parseBuilderDocument(raw: string | null | undefined): BuilderDocument | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const candidate = parsed as Partial<BuilderDocument> & { blocks?: unknown };
    if (candidate.schemaVersion !== 3 || !Array.isArray(candidate.blocks) || !candidate.meta || !candidate.theme) {
      return null;
    }

    return candidate as BuilderDocument;
  } catch {
    return null;
  }
}

export function parseStoredBuilderDocument(raw: string | null | undefined): BuilderDocument | null {
  if (!raw) return null;

  const current = parseBuilderDocument(raw);
  if (current) return current;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseLegacyPuckBuild(parsed);
  } catch {
    return null;
  }
}