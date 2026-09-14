import type { GenerationData, GenerationRequest } from '@canvas/contracts';

import { apiResponse } from '@/shared/api/client';

export interface CreateGenerationResponse {
  generation: GenerationData;
  location: string | null;
  retryAfter: number | null;
}

export async function createGeneration(
  href: string,
  input: GenerationRequest,
  idempotencyKey: string,
): Promise<CreateGenerationResponse> {
  const response = await apiResponse<GenerationData>(href, {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(input),
  });

  const retryAfterHeader = response.headers.get('Retry-After');
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null;
  
  return {
    generation: response.data,
    location: response.headers.get('Location'),
    retryAfter: retryAfter ? Number(retryAfter) : null,
  };
}
