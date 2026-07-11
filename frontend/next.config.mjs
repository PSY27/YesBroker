/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/search',
        destination: 'http://127.0.0.1:8000/search',
      },
      {
        source: '/api/investigate',
        destination: 'http://127.0.0.1:8000/investigate',
      },
      {
        source: '/api/investigate/stream',
        destination: 'http://127.0.0.1:8000/investigate/stream',
      },
      {
        source: '/api/health',
        destination: 'http://127.0.0.1:8000/health',
      },
    ];
  },
};

export default nextConfig;
