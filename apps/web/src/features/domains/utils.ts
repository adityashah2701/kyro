export function getDnsInstructions(hostname: string) {
  const isApex = hostname.split(".").length === 2; // e.g. example.com

  if (isApex) {
    return {
      type: "TXT & A Record",
      records: [
        { type: "A", name: "@", value: "76.76.21.21" }, // Example Vercel-like IP
        { type: "TXT", name: "@", value: "kyro-verify=true" },
      ],
    };
  } else {
    return {
      type: "CNAME",
      records: [
        {
          type: "CNAME",
          name: hostname.split(".")[0],
          value: "cname.kyro.dev",
        },
      ],
    };
  }
}
