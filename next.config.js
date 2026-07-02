/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'triumphadmin.irajweb.in',
      },
      {
        protocol: 'http',
        hostname: 'triumphadmin.irajweb.in',
      },
      {
        protocol: 'http',
        hostname: 'irajweb.in',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '125mb'
    },
  },
}

module.exports = nextConfig
