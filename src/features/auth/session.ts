import { cookies } from "next/headers";

import { getServerEnv } from "@/lib/env";

import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_SECONDS,
  createAuthToken,
  verifyAuthToken,
} from "./auth-token";

function getAuthSecret() {
  const secret = getServerEnv().AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for authentication.");
  }
  return secret;
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  const payload = await verifyAuthToken(token, getAuthSecret());
  return payload?.userId ?? null;
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  const token = await createAuthToken({ userId }, getAuthSecret());
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: AUTH_SESSION_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
