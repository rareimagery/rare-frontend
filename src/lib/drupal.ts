const DRUPAL_API_URL = process.env.DRUPAL_API_URL || "http://72.62.80.155";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TopPost {
  id: string;
  text: string;
  image_url?: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  date: string;
}

export interface TopFollower {
  username: string;
  display_name: string;
  profile_image_url?: string;
  follower_count: number;
  verified: boolean;
}

export interface Metrics {
  engagement_score: number;
  avg_likes: number;
  avg_retweets: number;
  avg_views: number;
  top_themes: string[];
  recommended_products: string[];
  posting_frequency: string;
  audience_sentiment: string;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductVariation {
  id: string;
  sku: string;
  price: string;
  currency: string;
  list_price: string | null;
  image_url: string | null;
  stock: number | null;
  on_sale: boolean;
  attributes: Record<string, string>;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  sku: string;
  image_url: string | null;
}

export interface ProductDetail {
  id: string;
  drupal_internal_id: number;
  title: string;
  body: string;
  short_description: string;
  product_type: string;
  slug: string;
  price: string;
  list_price: string | null;
  currency: string;
  sku: string;
  images: ProductImage[];
  variations: ProductVariation[];
  store_name: string;
  store_slug: string;
  store_logo: string | null;
  // Shared fields
  categories: string[];
  tags: string[];
  seo_title: string;
  seo_description: string;
  featured: boolean;
  // Clothing fields
  brand: string | null;
  gender: string | null;
  material: string | null;
  care_instructions: string | null;
  country_of_origin: string | null;
  sustainability: string | null;
  size_guide: string | null;
  // Digital fields
  file_formats: string[];
  file_size: string | null;
  license_type: string | null;
  license_details: string | null;
  instant_download: boolean;
  software_required: string | null;
  dimensions_resolution: string | null;
  page_count: number | null;
  language: string | null;
  version: string | null;
  changelog: string | null;
  // Craft fields
  handmade: boolean;
  made_to_order: boolean;
  production_time: string | null;
  materials_used: string | null;
  craft_dimensions: string | null;
  customizable: boolean;
  customization_details: string | null;
  craft_technique: string | null;
  occasion: string | null;
  safety_info: string | null;
  maker: string | null;
  gift_wrap: boolean;
  // Shipping
  shipping_weight: string | null;
  shipping_class: string | null;
  // Printful POD
  printful_product_id: string | null;
  print_technique: string | null;
  // Related
  related_product_ids: string[];
}

export interface CreatorProfile {
  id: string;
  drupal_internal__nid: number;
  title: string;
  x_username: string;
  bio: string;
  follower_count: number;
  profile_picture_url: string | null;
  banner_url: string | null;
  top_posts: TopPost[];
  top_followers: TopFollower[];
  metrics: Metrics | null;
  linked_store_id: string | null;
  linked_store_path: string | null;
  store_theme: string;
  store_theme_config: Record<string, any> | null;
  myspace_background: string | null;
  myspace_music_url: string | null;
  myspace_glitter_color: string | null;
  myspace_accent_color: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function drupalAbsoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${DRUPAL_API_URL}${path}`;
}

function parseJsonField<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function mapCreatorProfile(node: any, included: any[] = []): CreatorProfile {
  const attrs = node.attributes;
  const rels = node.relationships;

  // Resolve profile picture from included
  let profilePicUrl: string | null = null;
  const pfpData = rels?.field_profile_picture?.data;
  if (pfpData) {
    const fileId = pfpData.id;
    const fileEntity = included.find(
      (inc: any) => inc.id === fileId && inc.type === "file--file"
    );
    if (fileEntity) {
      profilePicUrl = drupalAbsoluteUrl(fileEntity.attributes?.uri?.url);
    }
  }

  // Resolve banner from included
  let bannerUrl: string | null = null;
  const bannerData = rels?.field_background_banner?.data;
  if (bannerData) {
    const fileId = bannerData.id;
    const fileEntity = included.find(
      (inc: any) => inc.id === fileId && inc.type === "file--file"
    );
    if (fileEntity) {
      bannerUrl = drupalAbsoluteUrl(fileEntity.attributes?.uri?.url);
    }
  }

  // Parse multi-value JSON text fields
  const topPostsRaw: string[] = attrs.field_top_posts ?? [];
  const topPosts: TopPost[] = topPostsRaw
    .map((v: string) => parseJsonField<TopPost>(v))
    .filter(Boolean) as TopPost[];

  const topFollowersRaw: string[] = attrs.field_top_followers ?? [];
  const topFollowers: TopFollower[] = topFollowersRaw
    .map((v: string) => parseJsonField<TopFollower>(v))
    .filter(Boolean) as TopFollower[];

  const metrics = parseJsonField<Metrics>(attrs.field_metrics);

  // Linked store
  const storeRel = rels?.field_linked_store?.data;
  const linkedStoreId = storeRel?.id ?? null;
  let linkedStorePath: string | null = null;
  if (linkedStoreId) {
    const storeEntity = included.find(
      (inc: any) => inc.id === linkedStoreId
    );
    if (storeEntity) {
      linkedStorePath = storeEntity.attributes?.path?.alias ?? null;
    }
  }

  return {
    id: node.id,
    drupal_internal__nid: attrs.drupal_internal__nid,
    title: attrs.title,
    x_username: attrs.field_x_username,
    bio: attrs.field_bio_description?.processed ?? attrs.field_bio_description?.value ?? "",
    follower_count: attrs.field_follower_count ?? 0,
    profile_picture_url: profilePicUrl,
    banner_url: bannerUrl,
    top_posts: topPosts,
    top_followers: topFollowers,
    metrics,
    linked_store_id: linkedStoreId,
    linked_store_path: linkedStorePath,
    store_theme: attrs.field_store_theme ?? "default",
    store_theme_config: (() => {
      if (!linkedStoreId) return null;
      const storeEntity = included.find((inc: any) => inc.id === linkedStoreId);
      return parseJsonField<Record<string, any>>(storeEntity?.attributes?.field_store_theme);
    })(),
    myspace_background: attrs.field_myspace_background ?? null,
    myspace_music_url: attrs.field_myspace_music_url ?? null,
    myspace_glitter_color: attrs.field_myspace_glitter_color ?? null,
    myspace_accent_color: attrs.field_myspace_accent_color ?? null,
  };
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getCreatorProfile(
  username: string
): Promise<CreatorProfile | null> {
  const params = new URLSearchParams({
    "filter[field_x_username]": username,
    include: "field_linked_store,field_profile_picture,field_background_banner",
  });

  const url = `${DRUPAL_API_URL}/jsonapi/node/creator_x_profile?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    console.error(`Drupal API error: ${res.status} ${res.statusText}`);
    return null;
  }

  const json = await res.json();
  const nodes = json.data;
  if (!nodes || nodes.length === 0) return null;

  return mapCreatorProfile(nodes[0], json.included ?? []);
}

export async function getAllCreatorProfiles(): Promise<CreatorProfile[]> {
  const params = new URLSearchParams({
    include: "field_profile_picture,field_background_banner",
  });

  const url = `${DRUPAL_API_URL}/jsonapi/node/creator_x_profile?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    console.error(`Drupal API error: ${res.status} ${res.statusText}`);
    return [];
  }

  const json = await res.json();
  const nodes = json.data ?? [];
  const included = json.included ?? [];

  return nodes.map((node: any) => mapCreatorProfile(node, included));
}

export async function getCreatorStore(storeId: string): Promise<any | null> {
  const url = `${DRUPAL_API_URL}/jsonapi/commerce_store/online/${storeId}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    console.error(`Drupal store API error: ${res.status}`);
    return null;
  }

  const json = await res.json();
  return json.data ?? null;
}

export async function getCreatorStoreBySlug(
  slug: string
): Promise<any | null> {
  const params = new URLSearchParams({
    "filter[field_store_slug]": slug,
    include: "field_linked_x_profile",
  });

  const url = `${DRUPAL_API_URL}/jsonapi/commerce_store/online?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    console.error(`Drupal store-by-slug API error: ${res.status}`);
    return null;
  }

  const json = await res.json();
  const stores = json.data ?? [];
  if (stores.length === 0) return null;

  return { store: stores[0], included: json.included ?? [] };
}

export async function getStoreProducts(storeId: string): Promise<Product[]> {
  // Drupal Commerce JSON:API: filter products by store
  const params = new URLSearchParams({
    "filter[stores.meta.drupal_internal__target_id]": storeId,
    include: "variations,field_images",
    "page[limit]": "50",
  });

  const url = `${DRUPAL_API_URL}/jsonapi/commerce_product/default?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    console.error(`Drupal products API error: ${res.status}`);
    return [];
  }

  const json = await res.json();
  const products = json.data ?? [];
  const included = json.included ?? [];

  return products.map((p: any) => {
    const attrs = p.attributes;

    // Get first variation for price
    const variationRef = p.relationships?.variations?.data?.[0];
    let price = "0.00";
    let currency = "USD";
    let sku = "";
    if (variationRef) {
      const variation = included.find((inc: any) => inc.id === variationRef.id);
      if (variation) {
        price = variation.attributes?.price?.number ?? "0.00";
        currency = variation.attributes?.price?.currency_code ?? "USD";
        sku = variation.attributes?.sku ?? "";
      }
    }

    // Get first image
    let imageUrl: string | null = null;
    const imageRef = p.relationships?.field_images?.data?.[0];
    if (imageRef) {
      const imageFile = included.find(
        (inc: any) => inc.id === imageRef.id && inc.type === "file--file"
      );
      if (imageFile) {
        imageUrl = drupalAbsoluteUrl(imageFile.attributes?.uri?.url);
      }
    }

    return {
      id: p.id,
      title: attrs.title,
      description: attrs.body?.processed ?? attrs.body?.value ?? "",
      price,
      currency,
      sku,
      image_url: imageUrl,
    };
  });
}

// ---------------------------------------------------------------------------
// Product Detail API Functions
// ---------------------------------------------------------------------------

const DRUPAL_TOKEN = process.env.DRUPAL_API_TOKEN;

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (DRUPAL_TOKEN) {
    headers["Authorization"] = `Bearer ${DRUPAL_TOKEN}`;
  }
  return headers;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractText(field: any): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field.processed ?? field.value ?? "";
}

function mapProductDetail(
  product: any,
  included: any[],
  productType: string
): ProductDetail {
  const attrs = product.attributes;
  const rels = product.relationships ?? {};

  // Images
  const imageRefs = rels.field_images?.data ?? [];
  const images: ProductImage[] = imageRefs
    .map((ref: any) => {
      const file = included.find(
        (inc: any) => inc.id === ref.id && inc.type === "file--file"
      );
      if (!file) return null;
      const url = drupalAbsoluteUrl(file.attributes?.uri?.url);
      return url ? { url, alt: ref.meta?.alt || attrs.title } : null;
    })
    .filter(Boolean) as ProductImage[];

  // Variations
  const variationRefs = rels.variations?.data ?? [];
  const variations: ProductVariation[] = variationRefs
    .map((ref: any) => {
      const v = included.find((inc: any) => inc.id === ref.id && inc.type?.startsWith("commerce_product_variation"));
      if (!v) return null;
      const va = v.attributes;

      // Variation image
      let varImage: string | null = null;
      const varImgRef = v.relationships?.field_variation_image?.data;
      if (varImgRef) {
        const imgFile = included.find(
          (inc: any) => inc.id === varImgRef.id && inc.type === "file--file"
        );
        if (imgFile) {
          varImage = drupalAbsoluteUrl(imgFile.attributes?.uri?.url);
        }
      }

      // Gather attributes (size, color, etc.)
      const attrMap: Record<string, string> = {};
      if (va.attribute_size) attrMap.size = va.attribute_size;
      if (va.attribute_color) attrMap.color = va.attribute_color;
      if (va.field_size?.value) attrMap.size = va.field_size.value;
      if (va.field_color?.value) attrMap.color = va.field_color.value;
      if (va.field_license_tier) attrMap.license_tier = va.field_license_tier;
      if (va.field_color_finish) attrMap.color_finish = va.field_color_finish;
      if (va.field_size_option) attrMap.size_option = va.field_size_option;
      if (va.field_material_option) attrMap.material_option = va.field_material_option;

      return {
        id: v.id,
        sku: va.sku ?? "",
        price: va.price?.number ?? "0.00",
        currency: va.price?.currency_code ?? "USD",
        list_price: va.list_price?.number ?? null,
        image_url: varImage,
        stock: va.field_stock ?? null,
        on_sale: va.field_on_sale ?? false,
        attributes: attrMap,
      } as ProductVariation;
    })
    .filter(Boolean) as ProductVariation[];

  // Store info
  let storeName = "Unknown Store";
  let storeSlug = "";
  let storeLogo: string | null = null;
  const storeRef = rels.stores?.data?.[0];
  if (storeRef) {
    const store = included.find((inc: any) => inc.id === storeRef.id);
    if (store) {
      storeName = store.attributes?.name ?? "Unknown Store";
      storeSlug = store.attributes?.field_store_slug ?? "";
      const logoRef = store.relationships?.field_linked_x_profile?.data;
      if (logoRef) {
        // Will be resolved from profile
      }
    }
  }

  // Price from first variation
  const firstVar = variations[0];
  const price = firstVar?.price ?? "0.00";
  const currency = firstVar?.currency ?? "USD";
  const sku = firstVar?.sku ?? "";
  const listPrice = firstVar?.list_price ?? null;

  // Taxonomy terms
  const categories: string[] = [];
  const catRefs = rels.field_categories?.data ?? [];
  for (const ref of catRefs) {
    const term = included.find((inc: any) => inc.id === ref.id && inc.type?.startsWith("taxonomy_term"));
    if (term) categories.push(term.attributes?.name ?? "");
  }

  const tags: string[] = [];
  const tagRefs = rels.field_tags?.data ?? [];
  for (const ref of tagRefs) {
    const term = included.find((inc: any) => inc.id === ref.id && inc.type?.startsWith("taxonomy_term"));
    if (term) tags.push(term.attributes?.name ?? "");
  }

  // Related products
  const relatedIds: string[] = (rels.field_related_products?.data ?? []).map((r: any) => r.id);

  return {
    id: product.id,
    drupal_internal_id: attrs.drupal_internal__product_id,
    title: attrs.title,
    body: extractText(attrs.body),
    short_description: extractText(attrs.field_short_description) || extractText(attrs.body).replace(/<[^>]*>/g, "").slice(0, 200),
    product_type: productType,
    slug: slugify(attrs.title),
    price,
    list_price: listPrice,
    currency,
    sku,
    images,
    variations,
    store_name: storeName,
    store_slug: storeSlug,
    store_logo: storeLogo,
    categories,
    tags,
    seo_title: attrs.field_seo_title ?? "",
    seo_description: attrs.field_seo_description ?? "",
    featured: attrs.field_featured ?? false,
    // Clothing
    brand: attrs.field_brand ?? null,
    gender: attrs.field_gender ?? null,
    material: extractText(attrs.field_material) || null,
    care_instructions: extractText(attrs.field_care_instructions) || null,
    country_of_origin: attrs.field_country_of_origin ?? null,
    sustainability: extractText(attrs.field_sustainability) || null,
    size_guide: extractText(attrs.field_size_guide) || null,
    // Digital
    file_formats: attrs.field_file_formats ?? [],
    file_size: attrs.field_file_size ?? null,
    license_type: attrs.field_license_type ?? null,
    license_details: extractText(attrs.field_license_details) || null,
    instant_download: attrs.field_instant_download ?? false,
    software_required: extractText(attrs.field_software_required) || null,
    dimensions_resolution: attrs.field_dimensions_resolution ?? null,
    page_count: attrs.field_page_count ?? null,
    language: attrs.field_language ?? null,
    version: attrs.field_version ?? null,
    changelog: extractText(attrs.field_changelog) || null,
    // Crafts
    handmade: attrs.field_handmade ?? false,
    made_to_order: attrs.field_made_to_order ?? false,
    production_time: attrs.field_production_time ?? null,
    materials_used: extractText(attrs.field_materials_used) || null,
    craft_dimensions: attrs.field_craft_dimensions ?? null,
    customizable: attrs.field_customizable ?? false,
    customization_details: extractText(attrs.field_customization_details) || null,
    craft_technique: attrs.field_craft_technique ?? null,
    occasion: attrs.field_occasion ?? null,
    safety_info: extractText(attrs.field_safety_info) || null,
    maker: attrs.field_maker ?? null,
    gift_wrap: attrs.field_gift_wrap ?? false,
    // Shipping
    shipping_weight: attrs.field_shipping_weight?.toString() ?? null,
    shipping_class: attrs.field_shipping_class ?? null,
    // Printful
    printful_product_id: attrs.field_printful_product_id ?? null,
    print_technique: attrs.field_print_technique ?? null,
    // Related
    related_product_ids: relatedIds,
  };
}

const PRODUCT_TYPES = ["default", "clothing", "digital_download", "crafts", "printful"] as const;

const PRODUCT_INCLUDES: Record<string, string> = {
  default: "variations,field_images,stores,field_categories,field_tags",
  clothing: "variations,variations.field_variation_image,variations.field_color_swatch,field_images,stores,field_categories,field_tags",
  digital_download: "variations,field_images,field_preview_images,stores,field_categories,field_tags",
  crafts: "variations,variations.field_variation_image,field_images,stores,field_categories,field_tags",
  printful: "variations,variations.field_variation_image,variations.field_color_swatch,field_images,stores,field_categories,field_tags",
};

export async function getAllProductSlugs(): Promise<{ slug: string; type: string }[]> {
  const slugs: { slug: string; type: string }[] = [];

  for (const type of PRODUCT_TYPES) {
    try {
      const params = new URLSearchParams();
      params.set(`fields[commerce_product--${type}]`, "title");
      params.set("page[limit]", "100");
      const url = `${DRUPAL_API_URL}/jsonapi/commerce_product/${type}?${params.toString()}`;
      const res = await fetch(url, { next: { revalidate: 60 }, headers: authHeaders() });
      if (!res.ok) continue;
      const json = await res.json();
      for (const p of json.data ?? []) {
        slugs.push({ slug: slugify(p.attributes.title), type });
      }
    } catch {
      continue;
    }
  }

  return slugs;
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  for (const type of PRODUCT_TYPES) {
    try {
      const includes = PRODUCT_INCLUDES[type] || PRODUCT_INCLUDES.default;
      const params = new URLSearchParams({
        include: includes,
        "page[limit]": "50",
      });
      const url = `${DRUPAL_API_URL}/jsonapi/commerce_product/${type}?${params.toString()}`;
      const res = await fetch(url, { next: { revalidate: 60 }, headers: authHeaders() });
      if (!res.ok) continue;
      const json = await res.json();
      const included = json.included ?? [];

      for (const p of json.data ?? []) {
        if (slugify(p.attributes.title) === slug) {
          return mapProductDetail(p, included, type);
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function getRelatedProducts(
  productDetail: ProductDetail
): Promise<Product[]> {
  // If explicit related products exist, fetch them
  if (productDetail.related_product_ids.length > 0) {
    // For now, fetch products from the same store as a fallback
  }

  // Fallback: same store products
  if (productDetail.store_slug) {
    const allProducts = await getProductsByStoreSlug(productDetail.store_slug);
    return allProducts
      .filter((p) => p.id !== productDetail.id)
      .slice(0, 8);
  }

  return [];
}

export async function getProductsByStoreSlug(slug: string): Promise<Product[]> {
  // Try Drupal first
  try {
    const stores = await getCreatorStoreBySlug(slug);
    if (stores) {
      const storeInternalId =
        stores.store?.attributes?.drupal_internal__store_id;
      if (storeInternalId) {
        const products = await getStoreProducts(String(storeInternalId));
        if (products.length > 0) return products;
      }
    }
  } catch {
    // Drupal unavailable — fall through to mock data
  }

  // Fallback to mock products
  const { getMockProducts } = await import("./mock-products");
  return getMockProducts(slug);
}
