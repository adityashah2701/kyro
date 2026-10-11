import crypto from "crypto";
import dns from "dns/promises";

export interface DnsVerificationResult {
  verified: boolean;
  reason?: string;
}

/**
 * Per-domain proof-of-ownership value. Derived from the domain id so it needs
 * no extra column; the owner puts it in a TXT record at `_kyro-challenge.<host>`.
 */
export function domainChallengeToken(domainId: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required.");
  return crypto
    .createHmac("sha256", secret)
    .update(`domain-verify:${domainId}`)
    .digest("hex")
    .slice(0, 32);
}

export class DnsCheckerService {
  /**
   * Checks that `_kyro-challenge.<hostname>` has a TXT record containing this
   * domain's token. A CNAME alone is not proof: a dangling CNAME on someone
   * else's DNS would let anyone claim the hostname.
   */
  public static async verifyOwnership(
    hostname: string,
    domainId: string
  ): Promise<DnsVerificationResult> {
    // Local testing only; never auto-verify in production.
    if (process.env.NODE_ENV !== "production" && hostname.endsWith(".test")) {
      return { verified: true };
    }

    const expected = `kyro-verify=${domainChallengeToken(domainId)}`;

    try {
      const txtRecords = await dns.resolveTxt(`_kyro-challenge.${hostname}`);
      // TXT records are returned as an array of arrays of strings
      if (txtRecords.some((parts) => parts.join("").trim() === expected)) {
        return { verified: true };
      }
    } catch {
      // ENOTFOUND/ENODATA: record not published yet
    }

    return {
      verified: false,
      reason: "Could not find the matching TXT record.",
    };
  }
}
