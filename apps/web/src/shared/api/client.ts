import type { ErrorResponseData } from '@canvas/contracts';

import { ApiError } from './errors';

const API_URL = import.meta.env.VITE_API_URL;

function buildApiUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }

  return `${API_URL}${path}`;
}

interface RequestOptions extends RequestInit {
  parseJson?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  headers: Headers;
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ErrorResponseData | undefined;

  try {
    body = (await response.json()) as ErrorResponseData;
  } catch {}

  return new ApiError(
    response.status,
    body?.error.code ?? 'UNKNOWN_ERROR',
    body?.error.message ?? `Request failed with status ${response.status}`,
  );
}

export async function apiResponse<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { parseJson = true, body, ...fetchOptions } = options;

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      ...fetchOptions,
      body,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...fetchOptions.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Network request failed');
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  const data = !parseJson || response.status === 204 ? undefined : await response.json();

  return {
    data: data as T,
    headers: response.headers,
  };
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await apiResponse<T>(path, options);

  return data;
}

export function resolveApiUrl(path: string): string {
  return new URL(path, import.meta.env.VITE_API_URL).toString();
}
