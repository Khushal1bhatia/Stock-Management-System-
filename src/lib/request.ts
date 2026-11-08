import "server-only";
import { headers } from "next/headers";

export async function getRequestMeta() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ipAddress = (forwarded?.split(",")[0] || headerStore.get("x-real-ip") || "unknown").trim();
  const userAgent = headerStore.get("user-agent") ?? "unknown";

  return {
    ipAddress: ipAddress.slice(0, 64),
    userAgent: userAgent.slice(0, 255)
  };
}
