import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "a.espncdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.espncdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "collegefootballdata.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.collegefootballdata.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
