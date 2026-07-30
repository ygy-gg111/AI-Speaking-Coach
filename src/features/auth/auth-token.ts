import { jwtVerify, SignJWT } from "jose";

export const AUTH_COOKIE_NAME = "ai-speaking-session";
export const AUTH_SESSION_SECONDS = 60 * 60 * 24 * 7;

export type AuthTokenPayload = {
  userId: string;
};

function createKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function createAuthToken(
  payload: AuthTokenPayload,
  secret: string,
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_SESSION_SECONDS}s`)
    .sign(createKey(secret));
}

export async function verifyAuthToken(
  token: string,
  secret: string,
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, createKey(secret), {
      algorithms: ["HS256"],
    });
    return typeof payload.userId === "string"
      ? { userId: payload.userId }
      : null;
  } catch {
    return null;
  }
}
