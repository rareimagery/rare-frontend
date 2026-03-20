import { NextRequest, NextResponse } from "next/server";
import { getCreatorProfile, getProductsByStoreSlug } from "@/lib/drupal";

function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "").trim();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const normalizedHandle = handle.toLowerCase();

  try {
    const [profile, products] = await Promise.all([
      getCreatorProfile(normalizedHandle),
      getProductsByStoreSlug(normalizedHandle),
    ]);

    const previewProducts = (products || []).slice(0, 8).map((product) => ({
      id: product.id,
      title: product.title,
      price: Number.parseFloat(product.price) || 0,
      image: product.image_url || undefined,
      description: stripHtml(product.description),
    }));

    const topPosts = (profile?.top_posts || []).slice(0, 6).map((post) => ({
      id: post.id,
      text: post.text,
    }));

    return NextResponse.json(
      {
        handle: normalizedHandle,
        avatar: profile?.profile_picture_url || null,
        banner: profile?.banner_url || null,
        bio: stripHtml(profile?.bio),
        products: previewProducts,
        posts: topPosts,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        handle: normalizedHandle,
        avatar: null,
        banner: null,
        bio: "",
        products: [],
        posts: [],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60",
        },
      }
    );
  }
}
