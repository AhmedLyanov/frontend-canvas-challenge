import type { SpaceData } from "@canvas/contracts";

import { api } from "@/shared/api/client";

export async function getSpace(
  href: string,
): Promise<SpaceData> {
  return api<SpaceData>(href);
}