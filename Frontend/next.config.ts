import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  rewrites: async () => {
    return [
      {
        source: '/(.*)',
        destination: '/',
      },
    ];
  }
};

export default nextConfig;
