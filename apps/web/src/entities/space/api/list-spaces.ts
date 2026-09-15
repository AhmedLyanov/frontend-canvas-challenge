import type { SpaceData } from '@canvas/contracts';

import { api } from '@/shared/api/client';

export function listSpaces(href: string): Promise<SpaceData[]> {
  return api<SpaceData[]>(href);
}
