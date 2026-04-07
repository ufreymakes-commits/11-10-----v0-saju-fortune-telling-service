/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force rebuild - cache bust v2
  generateBuildId: async () => {
    return `build-v2-${Date.now()}`
  },
}

export default nextConfig
