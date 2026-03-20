'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DRUPAL_API_URL, drupalWriteHeaders } from '@/lib/drupal';
import { updateTemplate } from '@/app/actions/template';

type TemplateId = 'retro' | 'modern-cart' | 'ai-video-store' | 'latest-posts' | 'blank';

async function assertPlaygroundPermission(handle: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const sessionMeta = session as typeof session & {
    role?: string;
    xUsername?: string;
    storeSlug?: string;
  };

  const role = sessionMeta.role;
  const sessionHandle = (sessionMeta.xUsername || sessionMeta.storeSlug || '').replace(/^@+/, '');
  const normalizedHandle = handle.replace(/^@+/, '');

  if (role !== 'admin' && sessionHandle !== normalizedHandle) {
    throw new Error('Forbidden');
  }
}

async function findCreatorProfileUuidByHandle(handle: string): Promise<string | null> {
  const normalizedHandle = handle.replace(/^@+/, '');
  const params = new URLSearchParams({
    'filter[field_x_username]': normalizedHandle,
    'fields[node--creator_x_profile]': 'drupal_internal__nid',
  });

  const url = `${DRUPAL_API_URL}/jsonapi/node/creator_x_profile?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.api+json' },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ id?: string }> };
  return json.data?.[0]?.id ?? null;
}

async function findUserUuidByHandle(handle: string): Promise<string | null> {
  const normalizedHandle = handle.replace(/^@+/, '');
  const params = new URLSearchParams({
    'filter[name]': normalizedHandle,
    'fields[user--user]': 'name',
  });

  const url = `${DRUPAL_API_URL}/jsonapi/user/user?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.api+json' },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ id?: string }> };
  return json.data?.[0]?.id ?? null;
}

async function readThemeConfig(profileUuid: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${DRUPAL_API_URL}/jsonapi/node/creator_x_profile/${profileUuid}`, {
    headers: { Accept: 'application/vnd.api+json' },
    cache: 'no-store',
  });

  if (!res.ok) return {};
  const json = await res.json();
  const raw = json?.data?.attributes?.field_store_theme_config;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function savePlaygroundDraft(
  sellerHandle: string,
  templateId: TemplateId,
  customCSS: string,
  addedComponents: string[]
) {
  await assertPlaygroundPermission(sellerHandle);

  const profileUuid = await findCreatorProfileUuidByHandle(sellerHandle);
  if (!profileUuid) throw new Error('Creator profile not found');

  const existingConfig = await readThemeConfig(profileUuid);
  const nextConfig = {
    ...existingConfig,
    playgroundDraft: {
      templateId,
      customCSS,
      addedComponents,
      savedAt: new Date().toISOString(),
    },
  };

  const writeHeaders = await drupalWriteHeaders();
  const patchRes = await fetch(`${DRUPAL_API_URL}/jsonapi/node/creator_x_profile/${profileUuid}`, {
    method: 'PATCH',
    headers: {
      ...writeHeaders,
      'Content-Type': 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'node--creator_x_profile',
        id: profileUuid,
        attributes: {
          field_store_theme_config: JSON.stringify(nextConfig),
        },
      },
    }),
    cache: 'no-store',
  });

  if (!patchRes.ok) {
    const text = await patchRes.text();
    throw new Error(`Draft save failed: ${patchRes.status} ${text.slice(0, 180)}`);
  }

  const normalizedHandle = sellerHandle.replace(/^@+/, '');
  revalidatePath(`/playground/${normalizedHandle}`);
  revalidatePath(`/stores/${normalizedHandle}`);

  return { success: true };
}

export async function publishSite(
  sellerHandle: string,
  templateId: TemplateId,
  customCSS: string,
  addedComponents: string[]
) {
  await assertPlaygroundPermission(sellerHandle);

  const normalizedHandle = sellerHandle.replace(/^@+/, '');
  const userUuid = await findUserUuidByHandle(normalizedHandle);
  if (!userUuid) throw new Error('User not found');

  const writeHeaders = await drupalWriteHeaders();
  const publishRes = await fetch(`${DRUPAL_API_URL}/jsonapi/user/user/${userUuid}`, {
    method: 'PATCH',
    headers: {
      ...writeHeaders,
      'Content-Type': 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'user--user',
        id: userUuid,
        attributes: {
          field_template: templateId,
          field_custom_css: customCSS,
          field_extra_components: addedComponents,
        },
      },
    }),
    cache: 'no-store',
  });

  if (!publishRes.ok) {
    const text = await publishRes.text();
    throw new Error(`Publish failed: ${publishRes.status} ${text.slice(0, 180)}`);
  }

  await savePlaygroundDraft(sellerHandle, templateId, customCSS, addedComponents);
  await updateTemplate(normalizedHandle, templateId);

  revalidatePath(`/shop/${normalizedHandle}`);
  revalidatePath(`/stores/${normalizedHandle}`);
  revalidatePath(`/playground/${normalizedHandle}`);

  return { success: true };
}
