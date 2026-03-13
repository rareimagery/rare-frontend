import { drupalAuthHeaders, drupalWriteHeaders } from "./drupal";

const DRUPAL_API_URL = process.env.DRUPAL_API_URL || "http://72.62.80.155";

export interface Build {
  id: string;
  label: string;
  code: string;
  createdAt: string;
}

/** Resolve the JSON:API UUID for a store given its slug */
async function resolveStoreUuid(slug: string): Promise<string | null> {
  const res = await fetch(
    `${DRUPAL_API_URL}/jsonapi/commerce_store/online?filter[field_store_slug]=${encodeURIComponent(slug)}&fields[commerce_store--online]=field_page_builds`,
    {
      headers: {
        ...drupalAuthHeaders(),
        Accept: "application/vnd.api+json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.[0]?.id ?? null;
}

export async function getBuilds(storeSlug: string): Promise<Build[]> {
  const uuid = await resolveStoreUuid(storeSlug);
  if (!uuid) return [];

  const res = await fetch(
    `${DRUPAL_API_URL}/jsonapi/commerce_store/online/${uuid}?fields[commerce_store--online]=field_page_builds`,
    {
      headers: {
        ...drupalAuthHeaders(),
        Accept: "application/vnd.api+json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];

  const json = await res.json();
  const raw = json.data?.attributes?.field_page_builds;
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Build[];
  } catch {
    return [];
  }
}

export async function saveBuilds(
  storeSlug: string,
  builds: Build[]
): Promise<boolean> {
  const uuid = await resolveStoreUuid(storeSlug);
  if (!uuid) return false;

  const writeHeaders = await drupalWriteHeaders();
  const res = await fetch(
    `${DRUPAL_API_URL}/jsonapi/commerce_store/online/${uuid}`,
    {
      method: "PATCH",
      headers: {
        ...writeHeaders,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "commerce_store--online",
          id: uuid,
          attributes: {
            field_page_builds: JSON.stringify(builds),
          },
        },
      }),
    }
  );

  return res.ok;
}
