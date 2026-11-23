import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";

const IV_LENGTH = 12;

function keyFromSecret(secret: string): Buffer {
  return createHmac("sha256", "creator-store-ai-ig").update(secret).digest();
}

export function encryptPayload(secret: string, value: string): string {
  const key = keyFromSecret(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptPayload(secret: string, payload: string): string | null {
  try {
    const [ivB64, tagB64, dataB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const key = keyFromSecret(secret);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivB64, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function signState(secret: string, nonce: string): string {
  return createHmac("sha256", secret).update(nonce).digest("base64url");
}

export function verifyState(
  secret: string,
  nonce: string,
  signature: string,
): boolean {
  const expected = signState(secret, nonce);
  if (expected.length !== signature.length) return false;
  // timing-safe-ish compare
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
