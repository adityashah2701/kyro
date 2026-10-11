/**
 * Site-password hashing and the signed "unlocked" cookie used by the proxy.
 * Server-only (node:crypto). Import as `@kyro/shared/password`, not from the
 * package root, so client bundles never pull it in.
 */
import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 32;
const PREFIX = "scrypt:";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, KEYLEN)).toString("hex");
  return `${PREFIX}${salt}:${hash}`;
}

const safeEqual = (a: Buffer, b: Buffer) =>
  a.length === b.length && crypto.timingSafeEqual(a, b);

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  if (!stored.startsWith(PREFIX)) {
    // shortcut: passwords saved before hashing existed are plain text; they
    // keep working until the owner saves a new one, which stores a hash.
    const h = (s: string) => crypto.createHash("sha256").update(s).digest();
    return safeEqual(h(password), h(stored));
  }
  const [, salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = await scrypt(password, salt, KEYLEN);
  return safeEqual(actual, Buffer.from(hash, "hex"));
}

/**
 * Cookie value `<expiry>.<hmac>`. The HMAC covers the stored password hash, so
 * changing the password invalidates every existing cookie.
 */
export function signUnlockCookie(
  projectId: string,
  storedPassword: string,
  secret: string,
  maxAgeSeconds: number,
): string {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  return `${exp}.${mac(projectId, exp, storedPassword, secret)}`;
}

export function verifyUnlockCookie(
  value: string | undefined,
  projectId: string,
  storedPassword: string,
  secret: string,
): boolean {
  if (!value) return false;
  const [expStr, sig] = value.split(".");
  const exp = Number(expStr);
  if (!sig || !Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  return safeEqual(
    Buffer.from(sig),
    Buffer.from(mac(projectId, exp, storedPassword, secret)),
  );
}

function mac(projectId: string, exp: number, stored: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${projectId}.${exp}.${stored}`)
    .digest("hex");
}
