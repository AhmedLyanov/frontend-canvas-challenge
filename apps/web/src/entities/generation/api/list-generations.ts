import type { GenerationData } from "@canvas/contracts";

import { api } from "@/shared/api/client";

export async function listGenerations(
  href: string,
): Promise<GenerationData[]> {
  return api<GenerationData[]>(href);
}