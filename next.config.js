/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" }
    ]
  },
  experimental: { typedRoutes: false }
};

module.exports = nextConfig;
