import type {
  AuthCredentials,
  CurrentUser,
  PreferencesUpdateInput,
  ProfileUpdateInput,
  RegistrationInput,
} from "./types";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export class AuthApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    const error = payload.success
      ? { code: "AUTH_REQUEST_FAILED", message: "Authentication failed." }
      : payload.error;
    throw new AuthApiError(error.code, error.message);
  }
  return payload.data;
}

export function getCurrentUser() {
  return request<CurrentUser>("/api/v1/users/me");
}

export function login(input: AuthCredentials) {
  return request<CurrentUser>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: RegistrationInput) {
  return request<CurrentUser>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return request<{ loggedOut: true }>("/api/v1/auth/logout", {
    method: "POST",
  });
}

export function updateProfile(input: ProfileUpdateInput) {
  return request<CurrentUser>("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updatePreferences(input: PreferencesUpdateInput) {
  return request<CurrentUser>("/api/v1/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
