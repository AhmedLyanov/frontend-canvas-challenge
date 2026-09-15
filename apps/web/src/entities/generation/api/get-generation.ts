import type { GenerationData } from '@canvas/contracts';

import { api } from '@/shared/api/client';

export async function getGeneration(href: string): Promise<GenerationData> {
  return api<GenerationData>(href);
}
