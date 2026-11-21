import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/basePath";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  async redirects() {
    return [
      { source: "/", destination: BASE_PATH, basePath: false, permanent: false },
      // Capsule was archived when this project became Fast Takeoff.
      { source: "/capsule/:path*", destination: BASE_PATH, basePath: false, permanent: false },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
