import { generateKeyPairSync } from "node:crypto";

import { describe, expect, it } from "vitest";

import { getAuthKeyPair } from "./auth-keys";

function createEncodedPair() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  return {
    privateValue: privateKey
      .export({ format: "der", type: "pkcs8" })
      .toString("base64"),
    publicValue: publicKey
      .export({ format: "der", type: "spki" })
      .toString("base64"),
  };
}

describe("authentication keys", () => {
  it("loads Base64-encoded RSA private and public keys", () => {
    const values = createEncodedPair();
    const keys = getAuthKeyPair(values.privateValue, values.publicValue);

    expect(keys.privateKey.asymmetricKeyType).toBe("rsa");
    expect(keys.publicKey.asymmetricKeyType).toBe("rsa");
  });

  it("rejects missing or malformed key material", () => {
    expect(() => getAuthKeyPair(undefined, undefined)).toThrow(
      "AUTH_PRIVATE_KEY and AUTH_PUBLIC_KEY",
    );
    expect(() => getAuthKeyPair("invalid", "invalid")).toThrow(
      "matching Base64-encoded PKCS#8 and SPKI DER RSA key pair",
    );
  });

  it("rejects a public key that does not match the private key", () => {
    const first = createEncodedPair();
    const second = createEncodedPair();

    expect(() =>
      getAuthKeyPair(first.privateValue, second.publicValue),
    ).toThrow("matching Base64-encoded PKCS#8 and SPKI DER RSA key pair");
  });
});
