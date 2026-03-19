'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DRUPAL_API_URL, drupalWriteHeaders } from '@/lib/drupal';

type TemplateId =
  | 'retro'
  | 'modern-cart'
  | 'ai-video-store'
  | 'latest-posts'
  | 'blank';

const TEMPLATE_TO_THEME: Record<TemplateId, string> = {
  retro: 'myspace',
  'modern-cart': 'xai3',
  'ai-video-store': 'editorial',
  'latest-posts': 'xmimic',
  blank: 'minimal',
};

async function findCreatorProfileUuidByHandle(handle: string): Promise<string | null> {
  const params = new URLSearchParams({
    'filter[field_x_username]': handle,
    'fields[node--creator_x_profile]': 'drupal_internal__nid',
  });

  const url = `${DRUPAL_API_URL}/jsonapi/node/creator_x_profile?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.api+json',
    },
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const json = (await res.json()) as { data?: Array<{ id?: string }> };
  return json.data?.[0]?.id ?? null;
}

export async function updateTemplate(sellerHandle: string, templateId: TemplateId) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const sessionMeta = session as typeof session & {
    role?: string;
    xUsername?: string;
    storeSlug?: string;
  };

  const role = sessionMeta.role;
  const sessionHandle = sessionMeta.xUsername || sessionMeta.storeSlug || null;

  if (role !== 'admin' && sessionHandle !== sellerHandle) {
    throw new Error('Forbidden');
  }

  const profileUuid = await findCreatorProfileUuidByHandle(sellerHandle);
  if (!profileUuid) {
    throw new Error('Creator profile not found');
  }

  const theme = TEMPLATE_TO_THEME[templateId];
  const writeHeaders = await drupalWriteHeaders();

  const res = await fetch(`${DRUPAL_API_URL}/jsonapi/node/creator_x_profile/${profileUuid}`, {
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
          field_store_theme: theme,
          field_store_theme_config: JSON.stringify({
            templateId,
            selectedAt: new Date().toISOString(),
          }),
        },
      },
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Template update failed: ${res.status} ${text.slice(0, 180)}`);
  }

  revalidatePath('/console');
  revalidatePath('/console/theme');
  revalidatePath(`/stores/${sellerHandle}`);
  revalidatePath(`/shop/${sellerHandle}`);

  return { success: true, theme };
}
