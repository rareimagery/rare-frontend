import type { Data } from "@measured/puck";

export type PreviewProduct = {
  id: string;
  title: string;
  price: number;
  image?: string;
  description?: string;
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

export const TEMPLATE_STARTERS: TemplateStarter[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start clean and build section by section.",
    createData: () => EMPTY_CANVAS,
  },
  {
    id: "modern-store",
    name: "Modern Storefront",
    description: "Balanced hero, product grid, and support section.",
    createData: ({ handle, bio, products }) => ({
      content: [
        {
          type: "Hero",
          props: {
            title: `@${handle} Store`,
            subtitle: bio || "Products, drops, and creator support in one place.",
            ctaLabel: "Shop New Drop",
          },
        },
        {
          type: "ProductGrid",
          props: {
            heading: "Featured Collection",
            subheading: `Now featuring ${topProducts(products)}.`,
          },
        },
        {
          type: "DonationBar",
          props: {
            title: "Support with X Money",
            progressText: "62% to monthly goal",
          },
        },
      ],
      root: { props: {} },
    }),
  },
  {
    id: "product-drop",
    name: "Product Drop",
    description: "High-conversion launch page focused on fast purchasing.",
    createData: ({ handle, products }) => ({
      content: [
        {
          type: "Hero",
          props: {
            title: `${handle} Limited Drop`,
            subtitle: "Limited inventory. Premium quality. Instant checkout.",
            ctaLabel: "Claim the Drop",
          },
        },
        {
          type: "ProductGrid",
          props: {
            heading: "Drop Inventory",
            subheading: products.length
              ? `Top picks: ${topProducts(products)}`
              : "Add products to show limited drop inventory.",
          },
        },
      ],
      root: { props: {} },
    }),
  },
  {
    id: "content-commerce",
    name: "Content + Commerce",
    description: "Posts-first layout that funnels readers into product purchases.",
    createData: ({ handle, posts, products }) => ({
      content: [
        {
          type: "Hero",
          props: {
            title: `@${handle} Updates`,
            subtitle: leadPost(posts),
            ctaLabel: "Read Latest",
          },
        },
        {
          type: "PostsList",
          props: {
            heading: "Latest Posts",
          },
        },
        {
          type: "ProductGrid",
          props: {
            heading: "Shop This Feed",
            subheading: products.length
              ? `Shoppable picks: ${topProducts(products)}`
              : "Attach products to convert post traffic.",
          },
        },
      ],
      root: { props: {} },
    }),
  },
  {
    id: "subscriber-funnel",
    name: "Subscriber Funnel",
    description: "Support-first layout for memberships and recurring revenue.",
    createData: ({ handle, bio }) => ({
      content: [
        {
          type: "Hero",
          props: {
            title: `${handle} Inner Circle`,
            subtitle:
              bio || "Unlock premium content, private drops, and behind-the-scenes access.",
            ctaLabel: "Join Membership",
          },
        },
        {
          type: "DonationBar",
          props: {
            title: "Subscriber Goal",
            progressText: "128 supporters this month",
          },
        },
        {
          type: "PostsList",
          props: {
            heading: "Subscriber Updates",
          },
        },
      ],
      root: { props: {} },
    }),
  },
];
