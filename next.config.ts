import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString().slice(0, 16).replace("T", " "),
  },
};

export default nextConfig;
