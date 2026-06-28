/**
 * Pluggable Secret Provider interface.
 *
 * To add a new provider (e.g. HashiCorp Vault, AWS Secrets Manager):
 * 1. Create a class implementing ISecretProvider.
 * 2. Override `encrypt` to push the value to the external vault and return a pointer string.
 * 3. Override `decrypt` to fetch the value by the pointer string from the external vault.
 * 4. Wire the new provider in getSecretProvider() below.
 */

import { encrypt, decrypt } from "../crypto/encryption";

export interface ISecretProvider {
  encrypt(plaintext: string): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
}

/**
 * LocalEncryptedStorageProvider
 * Encrypts values with AES-256-GCM and stores them directly in the database.
 */
export class LocalEncryptedStorageProvider implements ISecretProvider {
  async encrypt(plaintext: string): Promise<string> {
    return encrypt(plaintext);
  }

  async decrypt(ciphertext: string): Promise<string> {
    return decrypt(ciphertext);
  }
}

/**
 * Returns the configured secret provider based on the SECRET_PROVIDER env var.
 * Defaults to LocalEncryptedStorageProvider.
 */
export function getSecretProvider(): ISecretProvider {
  const provider = process.env.SECRET_PROVIDER ?? "local";
  switch (provider) {
    case "local":
    default:
      return new LocalEncryptedStorageProvider();
  }
}
