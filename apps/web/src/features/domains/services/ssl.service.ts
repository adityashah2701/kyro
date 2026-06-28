export interface SslIssuanceResult {
  status: "ready" | "failed";
  error?: string;
}

export interface ISslProvider {
  issueCertificate(hostname: string): Promise<SslIssuanceResult>;
}

export class MockSslProvider implements ISslProvider {
  /**
   * Mocks the issuance of an SSL certificate.
   * In a real environment, this would interface with Let's Encrypt / ACME.
   */
  public async issueCertificate(hostname: string): Promise<SslIssuanceResult> {
    console.log(`[SSL] Starting mock SSL issuance for ${hostname}...`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`[SSL] Certificate issued for ${hostname}.`);

    return {
      status: "ready",
    };
  }
}

// Simple factory for future dependency injection
export const getSslProvider = (): ISslProvider => {
  return new MockSslProvider();
};
