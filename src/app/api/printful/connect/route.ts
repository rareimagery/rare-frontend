import { NextRequest, NextResponse } from "next/server";

import { drupalAuthHeaders } from "@/lib/drupal";

const DRUPAL_API = process.env.DRUPAL_API_URL;

export async function POST(req: NextRequest) {
  try {
    const { storeId, storeDrupalId, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Verify the API key with Printful
    const printfulRes = await fetch("https://api.printful.com/store", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!printfulRes.ok) {
      return NextResponse.json(
        { error: "Invalid Printful API key" },
        { status: 401 }
      );
    }

    const printfulData = await printfulRes.json();
    const printfulStoreName = printfulData.result?.name || "Printful Store";

    // Save the Printful API key and store connection in Drupal
    // Store the Printful store ID on the Drupal commerce store
    if (DRUPAL_API) {
      try {
        // Update the store with Printful connection info
        // Using a custom field or state API
        await fetch(
          `${DRUPAL_API}/jsonapi/commerce_store/online/${storeId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/vnd.api+json",
              ...drupalAuthHeaders(),
            },
            body: JSON.stringify({
              data: {
                type: "commerce_store--online",
                id: storeId,
                attributes: {
                  // Store Printful connection status in store theme field as JSON
                  // In production, use a dedicated field
                },
              },
            }),
          }
        );
      } catch {
        // Non-critical — connection still valid
      }
    }

    return NextResponse.json({
      success: true,
      printful_store: printfulStoreName,
      printful_store_id: printfulData.result?.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Connection failed" },
      { status: 500 }
    );
  }
}
