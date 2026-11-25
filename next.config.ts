import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The site used to live at jaredconnolly.com/fasttakeoff.
      { source: "/fasttakeoff", destination: "/", permanent: true },
      { source: "/fasttakeoff/:path+", destination: "/:path+", permanent: true },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
