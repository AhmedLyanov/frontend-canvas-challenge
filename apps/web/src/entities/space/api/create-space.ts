import type { SpaceData, SpaceInputData } from '@canvas/contracts';

import { api } from '@/shared/api/client';

export async function createSpace(href: string, input: SpaceInputData): Promise<SpaceData> {
  return api<SpaceData>(href, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
