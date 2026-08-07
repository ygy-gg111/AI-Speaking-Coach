import type { KeyObject } from "node:crypto";

import { jwtVerify, SignJWT } from "jose";

export const AUTH_COOKIE_NAME = "ai-speaking-session";
export const AUTH_SESSION_SECONDS = 60 * 60 * 24 * 7;
const AUTH_ISSUER = "ai-speaking-coach";
const AUTH_AUDIENCE = "ai-speaking-coach-web";

export type AuthTokenPayload = {
  userId: string;
};

export async function createAuthToken(
  payload: AuthTokenPayload,
  privateKey: KeyObject,
  keyId = "primary",
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid: keyId, typ: "JWT" })
    .setIssuer(AUTH_ISSUER)
    .setAudience(AUTH_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_SESSION_SECONDS}s`)
    .sign(privateKey);
}

export async function verifyAuthToken(
  token: string,
  publicKey: KeyObject,
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE,
      typ: "JWT",
    });
    return typeof payload.userId === "string"
      ? { userId: payload.userId }
      : null;
  } catch {
    return null;
  }
}
