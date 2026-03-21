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

export type BuildStorageShape =
  | "missing-store"
  | "empty"
  | "legacy-array"
  | "versioned-v2"
  | "invalid-json"
  | "unknown-object";

export interface BuildStorageInspection {
  storeSlug: string;
  storeUuid: string | null;
  shape: BuildStorageShape;
  buildCount: number;
  publishedCount: number;
  updatedAt: string | null;
  rawBytes: number;
  needsMigration: boolean;
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

function inspectRawBuildDocument(raw: string | null | undefined): Omit<BuildStorageInspection, "storeSlug" | "storeUuid"> {
  if (!raw) {
    return {
      shape: "empty",
      buildCount: 0,
      publishedCount: 0,
      updatedAt: null,
      rawBytes: 0,
      needsMigration: false,
      builds: [],
    };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      const builds = normalizeBuilds(parsed);
      return {
        shape: "legacy-array",
        buildCount: builds.length,
        publishedCount: builds.filter((build) => build.published === true).length,
        updatedAt: null,
        rawBytes: raw.length,
        needsMigration: true,
        builds,
      };
    }

    if (isBuildDocument(parsed)) {
      const builds = normalizeBuilds(parsed.builds);
      return {
        shape: "versioned-v2",
        buildCount: builds.length,
        publishedCount: builds.filter((build) => build.published === true).length,
        updatedAt: parsed.updatedAt,
        rawBytes: raw.length,
        needsMigration: false,
        builds,
      };
    }

    return {
      shape: "unknown-object",
      buildCount: 0,
      publishedCount: 0,
      updatedAt: null,
      rawBytes: raw.length,
      needsMigration: true,
      builds: [],
    };
  } catch {
    return {
      shape: "invalid-json",
      buildCount: 0,
      publishedCount: 0,
      updatedAt: null,
      rawBytes: raw.length,
      needsMigration: true,
      builds: [],
    };
  }
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

async function fetchRawBuildFieldByUuid(uuid: string): Promise<string | null> {
  const res = await fetch(
    `${DRUPAL_API_URL}/jsonapi/commerce_store/online/${uuid}?fields[commerce_store--online]=field_page_builds,field_store_slug`,
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
  return json.data?.attributes?.field_page_builds ?? null;
}

export async function listBuildStoreSlugs(limit = 250): Promise<string[]> {
  const params = new URLSearchParams({
    "fields[commerce_store--online]": "field_store_slug",
    "page[limit]": String(limit),
  });

  const res = await fetch(`${DRUPAL_API_URL}/jsonapi/commerce_store/online?${params.toString()}`, {
    headers: {
      ...drupalAuthHeaders(),
      Accept: "application/vnd.api+json",
    },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const json = await res.json();
  const data: Array<{ attributes?: { field_store_slug?: unknown } }> = Array.isArray(json.data) ? json.data : [];

  return data
    .map((item) => item?.attributes?.field_store_slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.trim().length > 0);
}

export async function inspectBuildStorage(storeSlug: string): Promise<BuildStorageInspection> {
  const uuid = await resolveStoreUuid(storeSlug);
  if (!uuid) {
    return {
      storeSlug,
      storeUuid: null,
      shape: "missing-store",
      buildCount: 0,
      publishedCount: 0,
      updatedAt: null,
      rawBytes: 0,
      needsMigration: false,
      builds: [],
    };
  }

  const raw = await fetchRawBuildFieldByUuid(uuid);
  const inspection = inspectRawBuildDocument(raw);

  return {
    storeSlug,
    storeUuid: uuid,
    ...inspection,
  };
}

export async function migrateBuildStorage(storeSlug: string): Promise<BuildStorageInspection & { migrated: boolean }> {
  const inspection = await inspectBuildStorage(storeSlug);

  if (!inspection.storeUuid || !inspection.needsMigration) {
    return { ...inspection, migrated: false };
  }

  const migrated = await saveBuilds(storeSlug, inspection.builds);
  if (!migrated) {
    return { ...inspection, migrated: false };
  }

  const refreshed = await inspectBuildStorage(storeSlug);
  return { ...refreshed, migrated: true };
}

export async function getBuilds(storeSlug: string): Promise<Build[]> {
  const uuid = await resolveStoreUuid(storeSlug);
  if (!uuid) return [];

  const raw = await fetchRawBuildFieldByUuid(uuid);
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
