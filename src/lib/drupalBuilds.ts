import { drupalAuthHeaders, drupalWriteHeaders, DRUPAL_API_URL } from "./drupal";

export interface Build {
  id: string;
  label: string;
  code: string;
  createdAt: string;
  published?: boolean;
}

export interface BuildDocument {
  schemaVersion: 2;
  updatedAt: string;
  builds: Build[];
}

function isBuild(value: unknown): value is Build {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.code === "string" &&
    typeof candidate.createdAt === "string"
  );
}

function normalizeBuilds(value: unknown): Build[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isBuild)
    .map((build) => ({
      ...build,
      published: build.published === true,
    }));
}

function isBuildDocument(value: unknown): value is BuildDocument {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    candidate.schemaVersion === 2 &&
    typeof candidate.updatedAt === "string" &&
    Array.isArray(candidate.builds)
  );
}

function parseBuildDocument(raw: string | null | undefined): BuildDocument {
  if (!raw) {
    return {
      schemaVersion: 2,
      updatedAt: new Date(0).toISOString(),
      builds: [],
    };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      return {
        schemaVersion: 2,
        updatedAt: new Date(0).toISOString(),
        builds: normalizeBuilds(parsed),
      };
    }

    if (isBuildDocument(parsed)) {
      return {
        schemaVersion: 2,
        updatedAt: parsed.updatedAt,
        builds: normalizeBuilds(parsed.builds),
      };
    }
  } catch {
    // Fall through to empty document.
  }

  return {
    schemaVersion: 2,
    updatedAt: new Date(0).toISOString(),
    builds: [],
  };
}

function serializeBuildDocument(builds: Build[]): string {
  const document: BuildDocument = {
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
    builds: normalizeBuilds(builds),
  };

  return JSON.stringify(document);
}

export async function getPublishedBuilds(storeSlug: string): Promise<Build[]> {
  const all = await getBuilds(storeSlug);
  return all.filter((b) => b.published === true);
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
  return parseBuildDocument(raw).builds;
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
            field_page_builds: serializeBuildDocument(builds),
          },
        },
      }),
    }
  );

  return res.ok;
}
