import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  serverExternalPackages: ['onnxruntime-web'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lirp.cdn-website.com',
        pathname: '/99e556bf/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/ml/wasm/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
