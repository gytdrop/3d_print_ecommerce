import type { NextConfig } from "next";
import os from "os";

/**
 * Resolve all local network IPs dynamically so HMR works on any interface
 * (e.g. 10.x.x.x, 192.168.x.x) without hard-coding addresses.
 */
function getLocalNetworkIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const iface of Object.values(interfaces)) {
    for (const info of iface ?? []) {
      if (info.family === "IPv4" && !info.internal) {
        ips.push(info.address);
      }
    }
  }
  return ips;
}

const nextConfig: NextConfig = {
  // Allow HMR / dev resource requests from all local network IPs.
  // This silences the "Blocked cross-origin request" warning when
  // the browser connects via the LAN address instead of localhost.
  allowedDevOrigins: getLocalNetworkIPs(),

  // Silence the "multiple lockfiles" workspace-root warning by explicitly
  // anchoring Turbopack to this project's own directory.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
