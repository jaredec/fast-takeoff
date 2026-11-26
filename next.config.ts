import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "(www\\.)?whataididtoday\\.com" }],
        destination: "https://todayinai.org/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
