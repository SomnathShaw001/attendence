import type { NextConfig } from "next";

// Sanitize NEXTAUTH_URL if malformed or containing placeholder strings (e.g. [SENSITIVE])
if (process.env.NEXTAUTH_URL) {
  try {
    new URL(process.env.NEXTAUTH_URL);
  } catch {
    console.warn(`[Config] Stripping invalid NEXTAUTH_URL: "${process.env.NEXTAUTH_URL}"`);
    delete process.env.NEXTAUTH_URL;
  }
}

// Automatically bind to VERCEL_URL on Vercel deployments
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
