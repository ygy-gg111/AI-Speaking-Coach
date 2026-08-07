import { generateKeyPairSync } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createAuthToken, verifyAuthToken } from "./auth-token";

describe("auth token", () => {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const otherKeys = generateKeyPairSync("rsa", { modulusLength: 2048 });

  it("creates and verifies a user session", async () => {
    const token = await createAuthToken(
      { userId: "user-1" },
      keys.privateKey,
      "test-key",
    );
    await expect(verifyAuthToken(token, keys.publicKey)).resolves.toEqual({
      userId: "user-1",
    });
    expect(JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString()))
      .toMatchObject({ alg: "RS256", kid: "test-key", typ: "JWT" });
  });

  it("rejects a token verified by another public key", async () => {
    const token = await createAuthToken(
      { userId: "user-1" },
      keys.privateKey,
    );
    await expect(
      verifyAuthToken(token, otherKeys.publicKey),
    ).resolves.toBeNull();
  });
});
