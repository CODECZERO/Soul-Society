/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Transpile packages that might have issues
  transpilePackages: ['react-is', 'lucide-react', '@creit.tech/stellar-wallets-kit'],
  // Security headers for wallet integration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://freighter.app https://albedo.link; object-src 'none';",
          },
        ],
      },
    ]
  },
}

export default nextConfig
