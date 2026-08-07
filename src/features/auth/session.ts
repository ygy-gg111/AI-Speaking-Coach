import { cookies } from "next/headers";

import { getServerEnv } from "@/lib/env";

import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_SECONDS,
  createAuthToken,
  verifyAuthToken,
} from "./auth-token";
import { getAuthKeyPair } from "./auth-keys";

function getAuthKeys() {
  const env = getServerEnv();
  return {
    ...getAuthKeyPair(env.AUTH_PRIVATE_KEY, env.AUTH_PUBLIC_KEY),
    keyId: env.AUTH_KEY_ID,
  };
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  const payload = await verifyAuthToken(token, getAuthKeys().publicKey);
  return payload?.userId ?? null;
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  const keys = getAuthKeys();
  const token = await createAuthToken(
    { userId },
    keys.privateKey,
    keys.keyId,
  );
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
