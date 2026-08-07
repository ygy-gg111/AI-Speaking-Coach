import {
  createPrivateKey,
  createPublicKey,
  type KeyObject,
} from "node:crypto";

type CachedAuthKeys = {
  privateValue: string;
  publicValue: string;
  privateKey: KeyObject;
  publicKey: KeyObject;
};

let cachedKeys: CachedAuthKeys | null = null;

export function getAuthKeyPair(
  privateValue: string | undefined,
  publicValue: string | undefined,
) {
  if (!privateValue || !publicValue) {
    throw new Error(
      "AUTH_PRIVATE_KEY and AUTH_PUBLIC_KEY are required for authentication.",
    );
  }
  if (
    cachedKeys?.privateValue === privateValue &&
    cachedKeys.publicValue === publicValue
  ) {
    return cachedKeys;
  }

  try {
    const privateKey = createPrivateKey({
      key: Buffer.from(privateValue, "base64"),
      format: "der",
      type: "pkcs8",
    });
    const publicKey = createPublicKey({
      key: Buffer.from(publicValue, "base64"),
      format: "der",
      type: "spki",
    });
    if (
      privateKey.asymmetricKeyType !== "rsa" ||
      publicKey.asymmetricKeyType !== "rsa"
    ) {
      throw new Error("Authentication keys must be RSA keys.");
    }
    const derivedPublicKey = createPublicKey(privateKey).export({
      format: "der",
      type: "spki",
    });
    const configuredPublicKey = publicKey.export({
      format: "der",
      type: "spki",
    });
    if (!derivedPublicKey.equals(configuredPublicKey)) {
      throw new Error("Authentication public key does not match private key.");
    }
    cachedKeys = { privateValue, publicValue, privateKey, publicKey };
    return cachedKeys;
  } catch (error) {
    throw new Error(
      "Authentication keys must be a matching Base64-encoded PKCS#8 and SPKI DER RSA key pair.",
      { cause: error },
    );
  }
}
