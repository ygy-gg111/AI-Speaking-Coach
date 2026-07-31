type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function requestApi<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      "API_INVALID_RESPONSE",
      "The server returned an invalid response.",
      response.status,
    );
  }

  if (!response.ok || !payload.success) {
    const error = payload.success
      ? { code: "API_REQUEST_FAILED", message: "The request failed." }
      : payload.error;
    throw new ApiClientError(error.code, error.message, response.status);
  }

  return payload.data;
}
