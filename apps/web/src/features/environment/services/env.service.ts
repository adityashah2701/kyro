import { db, schema, eq, and } from "@kyro/database";
import { getSecretProvider } from "../providers/secret.provider";
import type { Environment } from "../schemas";

export interface EnvVariableRow {
  id: string;
  key: string;
  /** Always masked for isSecret=true, plaintext for isSecret=false */
  displayValue: string;
  environment: Environment;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MASK = "••••••••";

export class EnvService {
  /**
   * Returns all variables for a project in a given environment.
   * Secret values are masked.
   */
  static async getVariables(
    projectId: string,
    environment?: Environment
  ): Promise<EnvVariableRow[]> {
    const provider = getSecretProvider();

    const conditions = environment
      ? and(
          eq(schema.environmentVariable.projectId, projectId),
          eq(schema.environmentVariable.environment, environment)
        )
      : eq(schema.environmentVariable.projectId, projectId);

    const rows = await db.query.environmentVariable.findMany({
      where: conditions,
      orderBy: (t, { asc }) => [asc(t.environment), asc(t.key)],
    });

    return Promise.all(
      rows.map(async (row) => {
        let displayValue = MASK;
        if (!row.isSecret) {
          try {
            displayValue = await provider.decrypt(row.encryptedValue);
          } catch {
            displayValue = "[decryption error]";
          }
        }
        return {
          id: row.id,
          key: row.key,
          displayValue,
          environment: row.environment as Environment,
          isSecret: row.isSecret,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      })
    );
  }

  /**
   * Returns all variables decrypted — for use in the worker only.
   * NEVER call this from client-facing code.
   */
  static async getDecryptedVariables(
    projectId: string,
    environment: Environment
  ): Promise<Record<string, string>> {
    const provider = getSecretProvider();

    const rows = await db.query.environmentVariable.findMany({
      where: and(
        eq(schema.environmentVariable.projectId, projectId),
        eq(schema.environmentVariable.environment, environment)
      ),
    });

    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = await provider.decrypt(row.encryptedValue);
    }
    return result;
  }

  /**
   * Creates a new variable. Throws if the key already exists in this environment.
   */
  static async createVariable(
    projectId: string,
    userId: string,
    key: string,
    value: string,
    environment: Environment,
    isSecret: boolean
  ): Promise<void> {
    const existing = await db.query.environmentVariable.findFirst({
      where: and(
        eq(schema.environmentVariable.projectId, projectId),
        eq(schema.environmentVariable.key, key),
        eq(schema.environmentVariable.environment, environment)
      ),
    });

    if (existing) {
      throw new Error(
        `Variable "${key}" already exists in the ${environment} environment.`
      );
    }

    const provider = getSecretProvider();
    const encryptedValue = await provider.encrypt(value);

    await db.insert(schema.environmentVariable).values({
      projectId,
      key,
      encryptedValue,
      environment,
      isSecret,
      createdBy: userId,
    });
  }

  /**
   * Updates the value of an existing variable.
   */
  static async updateVariable(
    id: string,
    projectId: string,
    value: string,
    isSecret: boolean
  ): Promise<void> {
    const provider = getSecretProvider();
    const encryptedValue = await provider.encrypt(value);

    await db
      .update(schema.environmentVariable)
      .set({ encryptedValue, isSecret, updatedAt: new Date() })
      .where(
        and(
          eq(schema.environmentVariable.id, id),
          eq(schema.environmentVariable.projectId, projectId)
        )
      );
  }

  /**
   * Deletes a variable.
   */
  static async deleteVariable(id: string, projectId: string): Promise<void> {
    await db
      .delete(schema.environmentVariable)
      .where(
        and(
          eq(schema.environmentVariable.id, id),
          eq(schema.environmentVariable.projectId, projectId)
        )
      );
  }

  /**
   * Temporarily reveals the decrypted value of a single variable.
   * Only called on demand, never cached.
   */
  static async revealValue(id: string, projectId: string): Promise<string> {
    const row = await db.query.environmentVariable.findFirst({
      where: and(
        eq(schema.environmentVariable.id, id),
        eq(schema.environmentVariable.projectId, projectId)
      ),
    });

    if (!row) throw new Error("Variable not found.");

    const provider = getSecretProvider();
    return provider.decrypt(row.encryptedValue);
  }
}
