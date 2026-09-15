import type { GraphData } from '@canvas/contracts';

import { apiResponse } from '@/shared/api/client';

export interface SaveGraphResponse {
  graph: GraphData;
  etag: string;
}

export async function saveGraph(
  href: string,
  graph: GraphData,
  etag: string,
): Promise<SaveGraphResponse> {
  const response = await apiResponse<GraphData>(href, {
    method: 'PUT',
    headers: {
      'If-Match': etag,
    },
    body: JSON.stringify(graph),
  });

  const nextEtag = response.headers.get('ETag');

  if (!nextEtag) {
    throw new Error('Graph response does not contain ETag');
  }

  return {
    graph: response.data,
    etag: nextEtag,
  };
}
