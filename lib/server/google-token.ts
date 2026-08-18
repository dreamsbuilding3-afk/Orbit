import crypto from "node:crypto";

function getKey() {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is not configured.");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
}

export function encryptGoogleToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

export function decryptGoogleToken(payload: string) {
  const [version, iv64, tag64, data64] = payload.split(":");
  if (version !== "v1" || !iv64 || !tag64 || !data64) throw new Error("Invalid encrypted Google token.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv64, "base64url"));
  decipher.setAuthTag(Buffer.from(tag64, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data64, "base64url")), decipher.final()]).toString("utf8");
}
