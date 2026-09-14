import type { ErrorResponseData } from "@canvas/contracts";

import { ApiError } from "./errors";

interface RequestOptions extends RequestInit {
  parseJson?: boolean;
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ErrorResponseData | undefined;

  try {
    body = (await response.json()) as ErrorResponseData;
  } catch {
  }

  return new ApiError(
    response.status,
    body?.error.code ?? "UNKNOWN_ERROR",
    body?.error.message ?? `Request failed with status ${response.status}`,
  );
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { parseJson = true, body, ...fetchOptions } = options;

  let response: Response;

  try {
    response = await fetch(path, {
      ...fetchOptions,
      body,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...fetchOptions.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Network request failed",
    );
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (!parseJson || response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}