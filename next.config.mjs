/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force rebuild - cache bust
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
}

export default nextConfig
