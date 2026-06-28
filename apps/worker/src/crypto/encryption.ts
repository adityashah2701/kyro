/**
 * AES-256-GCM decryption for the worker.
 * The worker only needs to DECRYPT — it never encrypts.
 * Encryption happens exclusively in the web app when variables are saved.
 *
 * Storage format: `iv:authTag:encryptedData` (all hex-encoded)
 * ENCRYPTION_KEY must be a 64-char hex string (32 bytes).
 */
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length < 64) {
    throw new Error(
      "ENCRYPTION_KEY environment variable must be a 64-character hex string (32 bytes).",
    );
  }
  return Buffer.from(keyHex.slice(0, 64), "hex");
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format.");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
