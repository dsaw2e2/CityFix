/** @type {import('next').NextConfig} */
const nextConfig = {
  /* cache-bust: force turbopack rebuild */
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
}

export default nextConfig
