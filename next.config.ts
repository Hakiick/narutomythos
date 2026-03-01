import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const minioEndpoint = process.env.MINIO_ENDPOINT ?? 'http://localhost:9000';
const minioBucket = process.env.MINIO_BUCKET ?? 'narutomythos';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['onnxruntime-web'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lirp.cdn-website.com',
        pathname: '/99e556bf/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/narutomythos/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/storage/:path*',
        destination: `${minioEndpoint}/${minioBucket}/:path*`,
      },
    ];
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
