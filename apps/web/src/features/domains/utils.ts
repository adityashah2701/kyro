export function getDnsInstructions(hostname: string, verifyToken: string) {
  const isApex = hostname.split(".").length === 2; // e.g. example.com
  const sub = hostname.split(".")[0];
  // Ownership proof: a TXT record at _kyro-challenge.<hostname>.
  const txt = (name: string) => ({
    type: "TXT",
    name,
    value: `kyro-verify=${verifyToken}`,
  });

  if (isApex) {
    return {
      type: "TXT & A Record",
      records: [
        { type: "A", name: "@", value: "76.76.21.21" }, // Example Vercel-like IP
        txt("_kyro-challenge"),
      ],
    };
  } else {
    return {
      type: "TXT & CNAME",
      records: [
        { type: "CNAME", name: sub, value: "cname.kyro.dev" },
        txt(`_kyro-challenge.${sub}`),
      ],
    };
  }
}
