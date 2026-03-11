import { NextRequest, NextResponse } from "next/server";

import { drupalAuthHeaders } from "@/lib/drupal";

const DRUPAL_API = process.env.DRUPAL_API_URL;
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { storeId, storeDrupalId } = await req.json();

    if (!PRINTFUL_API_KEY) {
      return NextResponse.json(
        { error: "Printful API key not configured on server" },
        { status: 500 }
      );
    }

    // Fetch products from Printful
    const printfulRes = await fetch(
      "https://api.printful.com/store/products",
      {
        headers: { Authorization: `Bearer ${PRINTFUL_API_KEY}` },
      }
    );

    if (!printfulRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch products from Printful" },
        { status: 502 }
      );
    }

    const printfulData = await printfulRes.json();
    const printfulProducts = printfulData.result || [];

    let synced = 0;
    let skipped = 0;

    for (const pfProduct of printfulProducts) {
      // Check if product already exists in Drupal
      const existingParams = new URLSearchParams();
      existingParams.set(
        "filter[field_printful_product_id]",
        String(pfProduct.id)
      );
      existingParams.set("filter[stores.meta.drupal_internal__target_id]", storeDrupalId);

      const existingRes = await fetch(
        `${DRUPAL_API}/jsonapi/commerce_product/printful?${existingParams.toString()}`,
        {
          headers: { ...drupalAuthHeaders() },
        }
      );

      if (existingRes.ok) {
        const existingData = await existingRes.json();
        if (existingData.data && existingData.data.length > 0) {
          skipped++;
          continue;
        }
      }

      // Fetch product details from Printful
      const detailRes = await fetch(
        `https://api.printful.com/store/products/${pfProduct.id}`,
        {
          headers: { Authorization: `Bearer ${PRINTFUL_API_KEY}` },
        }
      );

      if (!detailRes.ok) continue;
      const detail = await detailRes.json();
      const syncProduct = detail.result?.sync_product;
      const syncVariants = detail.result?.sync_variants || [];

      if (!syncProduct) continue;

      // Create variations in Drupal first
      const variationIds: string[] = [];

      for (const sv of syncVariants) {
        const varBody = {
          data: {
            type: "commerce_product_variation--printful",
            attributes: {
              sku: `pf-${sv.id}`,
              price: {
                number: sv.retail_price || "0.00",
                currency_code: sv.currency || "USD",
              },
              field_printful_variant_id: String(sv.id),
              field_printful_base_cost: String(sv.product?.retail_price || "0.00"),
              field_size: sv.size || null,
              field_color: sv.color || null,
            },
          },
        };

        const varRes = await fetch(
          `${DRUPAL_API}/jsonapi/commerce_product_variation/printful`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/vnd.api+json",
              ...drupalAuthHeaders(),
            },
            body: JSON.stringify(varBody),
          }
        );

        if (varRes.ok) {
          const varData = await varRes.json();
          variationIds.push(varData.data.id);
        }
      }

      // Create the product in Drupal
      const productBody = {
        data: {
          type: "commerce_product--printful",
          attributes: {
            title: syncProduct.name,
            field_printful_product_id: String(syncProduct.id),
            field_printful_store_id: String(storeDrupalId),
            field_production_time: "2-7 business days",
            status: true,
          },
          relationships: {
            stores: {
              data: [
                {
                  type: "commerce_store--online",
                  id: storeId,
                },
              ],
            },
            variations: {
              data: variationIds.map((vid) => ({
                type: "commerce_product_variation--printful",
                id: vid,
              })),
            },
          },
        },
      };

      const prodRes = await fetch(
        `${DRUPAL_API}/jsonapi/commerce_product/printful`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/vnd.api+json",
            ...drupalAuthHeaders(),
          },
          body: JSON.stringify(productBody),
        }
      );

      if (prodRes.ok) {
        synced++;
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      total: printfulProducts.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Sync failed" },
      { status: 500 }
    );
  }
}
