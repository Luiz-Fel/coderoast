import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  cacheLife: {
    hourly: {
      stale: 60 * 60,
      revalidate: 60 * 60,
      expire: 60 * 60 * 24,
    },
  },
  reactCompiler: true,
}

export default nextConfig
