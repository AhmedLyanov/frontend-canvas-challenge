import type { GraphData } from '@canvas/contracts';

import { apiResponse } from '@/shared/api/client';

export interface GraphResponse {
  graph: GraphData;
  etag: string;
}

export async function getGraph(href: string): Promise<GraphResponse> {
  const response = await apiResponse<GraphData>(href);

  const etag = response.headers.get('ETag');

  if (!etag) {
    throw new Error('Graph response does not contain ETag');
  }

  return {
    graph: response.data,
    etag,
  };
}
