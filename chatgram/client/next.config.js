/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["robohash.org"],
  },
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination:`${process.env.NEXT_PUBLIC_API_URL}/:path*`
      }
    ]
  }
};

module.exports = nextConfig
