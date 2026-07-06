export interface SslIssuanceResult {
  status: "ready" | "failed";
  error?: string;
}

export interface ISslProvider {
  issueCertificate(hostname: string): Promise<SslIssuanceResult>;
}

export class MockSslProvider implements ISslProvider {
  public async issueCertificate(hostname: string): Promise<SslIssuanceResult> {
    console.log(
      `[SSL] Caddy On-Demand TLS will handle SSL for ${hostname} upon first request.`
    );
    return {
      status: "ready",
    };
  }
}

// Simple factory for future dependency injection
export const getSslProvider = (): ISslProvider => {
  return new MockSslProvider();
};
