import type { Data } from "@measured/puck";

export type PreviewProduct = {
  id: string;
  title: string;
  price: number;
  image?: string;
  description?: string;
};

export type ProductCardPayload = {
  id: string;
  title: string;
  price: number;
  image?: string;
};

export type PreviewPost = {
  id: string;
  text: string;
};

export type TemplatePreviewPayload = {
  handle: string;
  avatar?: string | null;
  banner?: string | null;
  bio?: string | null;
  products?: PreviewProduct[];
  posts?: PreviewPost[];
};

export type StarterInput = {
  handle: string;
  bio: string;
  avatar?: string | null;
  banner?: string | null;
  products: PreviewProduct[];
  posts: PreviewPost[];
};

export type TemplateStarter = {
  id: string;
  name: string;
  description: string;
  createData: (input: StarterInput) => Data;
};

export const EMPTY_CANVAS: Data = {
  content: [],
  root: { props: {} },
};

function topProducts(products: PreviewProduct[]): string {
  if (products.length === 0) return "curated creator essentials";
  return products
    .slice(0, 3)
    .map((product) => product.title)
    .join(", ");
}

function leadPost(posts: PreviewPost[]): string {
  return posts[0]?.text || "Latest updates and curated drops for your audience.";
}

function displayHandle(handle: string): string {
  return handle.startsWith("@") ? handle : `@${handle}`;
}

function productCards(products: PreviewProduct[]): ProductCardPayload[] {
  return products.slice(0, 3).map((product) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    image: product.image,
  }));
}

export const TEMPLATE_STARTERS: TemplateStarter[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start clean and build section by section.",
    createData: () => EMPTY_CANVAS,
  },
  {
    id: "modern-cart",
    name: "Modern",
    description: "Balanced hero, product grid, and support section.",
    createData: ({ handle, bio, products, avatar, banner }) => ({
      content: [
        {
          type: "Hero",
          props: {
            title: `${displayHandle(handle)} Studio Store`,
            subtitle: bio || "Products, drops, and creator support in one place.",
            ctaLabel: "Shop New Drop",
            stylePreset: "studio",
            avatarUrl: avatar || undefined,
            bannerUrl: banner || undefined,
          },
        },
        {
          type: "ProductGrid",
          props: {
            heading: "Featured Collection",
            subheading: `Now featuring ${topProducts(products)}.`,
            stylePreset: "studio",
            productCards: productCards(products),
          },
        },
        {
          type: "DonationBar",
          props: {
            title: "Support the Studio",
            progressText: "62% to this month's creator goal",
            stylePreset: "studio",
          },
        },
      ],
      root: { props: {} },
    }),
  },
  {
    id: "ai-video-store",
    name: "Drops",
    description: "High-conversion launch page focused on fast purchasing.",
    createData: ({ handle, products, avatar, banner }) => ({
      content: [
        {
          type: "Hero",
          props: {
            title: `${displayHandle(handle)} Limited Drop`,
            subtitle: "Flash release. Limited units. Fast checkout.",
            ctaLabel: "Claim the Drop",
            stylePreset: "drop",
            avatarUrl: avatar || undefined,
            bannerUrl: banner || undefined,
          },
        },
        {
          type: "DonationBar",
          props: {
            title: "Drop Momentum",
            progressText: "73% sold in first wave",
            stylePreset: "drop",
          },
        },
        {
          type: "ProductGrid",
          props: {
            heading: "Drop Inventory: Live",
            subheading: products.length
              ? `Selling now: ${topProducts(products)}`
              : "Add products to show limited drop inventory.",
            stylePreset: "drop",
            productCards: productCards(products),
          },
        },
      ],
      root: { props: {} },
    }),
  },
  {
    id: "latest-posts",
    name: "Editorial",
    description: "Posts-first layout that funnels readers into product purchases.",
    createData: ({ handle, posts, products, avatar, banner }) => ({
      content: [
        {
          type: "PostsList",
          props: {
            heading: `${displayHandle(handle)} Feed Highlights`,
            stylePreset: "editorial",
          },
        },
        {
          type: "Hero",
          props: {
            title: `${displayHandle(handle)} Storyline`,
            subtitle: leadPost(posts),
            ctaLabel: "Read + Shop",
            stylePreset: "editorial",
            avatarUrl: avatar || undefined,
            bannerUrl: banner || undefined,
          },
        },
        {
          type: "ProductGrid",
          props: {
            heading: "Shop the Conversation",
            subheading: products.length
              ? `Shoppable picks: ${topProducts(products)}`
              : "Attach products to convert post traffic.",
            stylePreset: "editorial",
            productCards: productCards(products),
          },
        },
      ],
      root: { props: {} },
    }),
  },
  {
    id: "retro",
    name: "Retro",
    description: "Support-first layout for memberships and recurring revenue.",
    createData: ({ handle, bio, avatar, banner, products }) => ({
      content: [
        {
          type: "Hero",
          props: {
            title: `${displayHandle(handle)} Inner Circle`,
            subtitle:
              bio || "Unlock premium content, private drops, and behind-the-scenes access.",
            ctaLabel: "Join Membership",
            stylePreset: "members",
            avatarUrl: avatar || undefined,
            bannerUrl: banner || undefined,
          },
        },
        {
          type: "DonationBar",
          props: {
            title: "Subscriber Drive",
            progressText: "128 active supporters this month",
            stylePreset: "members",
          },
        },
        {
          type: "PostsList",
          props: {
            heading: "Members-Only Updates",
            stylePreset: "members",
          },
        },
        {
          type: "ProductGrid",
          props: {
            heading: "Member Picks",
            subheading: products.length
              ? `Featured products: ${topProducts(products)}`
              : "Add products to populate member picks.",
            stylePreset: "members",
            productCards: productCards(products),
          },
        },
      ],
      root: { props: {} },
    }),
  },
];
