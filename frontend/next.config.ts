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
  // Standalone output produces a self-contained production bundle for Docker
  output: "standalone",

  // Allow HMR / dev resource requests from all local network IPs.
  allowedDevOrigins: getLocalNetworkIPs(),

  // Proxy /api requests to Go backend service if running locally or in Docker
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // Silence the "multiple lockfiles" workspace-root warning
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
