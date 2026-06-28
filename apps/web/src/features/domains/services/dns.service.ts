import dns from "dns/promises";

export interface DnsVerificationResult {
  verified: boolean;
  reason?: string;
}

export class DnsCheckerService {
  /**
   * Checks if the given hostname has a CNAME or TXT record pointing to our target.
   * For the MVP, we assume the target CNAME is `cname.kyro.dev`
   * and the target TXT record is `kyro-verify=true`.
   */
  public static async verifyOwnership(
    hostname: string
  ): Promise<DnsVerificationResult> {
    try {
      // Bypass for local testing
      if (hostname.endsWith(".test")) {
        return { verified: true };
      }

      // 1. Check CNAME (for subdomains)
      try {
        const cnameRecords = await dns.resolveCname(hostname);
        if (cnameRecords.some((record) => record === "cname.kyro.dev")) {
          return { verified: true };
        }
      } catch (e) {
        // Ignore ENOTFOUND/ENODATA for CNAME, proceed to check TXT
      }

      // 2. Check TXT (for apex domains or if CNAME is missing)
      try {
        const txtRecords = await dns.resolveTxt(hostname);
        // TXT records are returned as an array of arrays of strings
        for (const recordArray of txtRecords) {
          const recordString = recordArray.join("");
          if (recordString.includes("kyro-verify=true")) {
            return { verified: true };
          }
        }
      } catch (e) {
        // Ignore ENOTFOUND/ENODATA
      }

      return {
        verified: false,
        reason: "Could not find matching CNAME or TXT records.",
      };
    } catch (error) {
      console.error(`DNS Verification failed for ${hostname}:`, error);
      return {
        verified: false,
        reason: "DNS lookup failed.",
      };
    }
  }
}
