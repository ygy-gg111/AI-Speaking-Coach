import { generateKeyPairSync } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
});

const privateValue = privateKey
  .export({ format: "der", type: "pkcs8" })
  .toString("base64");
const publicValue = publicKey
  .export({ format: "der", type: "spki" })
  .toString("base64");

console.log(`AUTH_PRIVATE_KEY="${privateValue}"`);
console.log(`AUTH_PUBLIC_KEY="${publicValue}"`);
console.log('AUTH_KEY_ID="primary"');
