import { describe, expect, it } from "vitest";

import { createAuthToken, verifyAuthToken } from "./auth-token";

describe("auth token", () => {
  const secret = "a-secure-test-secret-with-enough-length";

  it("creates and verifies a user session", async () => {
    const token = await createAuthToken({ userId: "user-1" }, secret);
    await expect(verifyAuthToken(token, secret)).resolves.toEqual({
      userId: "user-1",
    });
  });

  it("rejects a token signed by another secret", async () => {
    const token = await createAuthToken({ userId: "user-1" }, secret);
    await expect(
      verifyAuthToken(token, "another-secure-secret-with-enough-length"),
    ).resolves.toBeNull();
  });
});
