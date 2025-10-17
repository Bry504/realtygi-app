import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/Realtygi',
  reactStrictMode: true,
  trailingSlash: false,
  async redirects() {
    return [
      // Visit (/) -> login
      { source: '/', destination: '/Realtygi/auth', permanent: false },
      // Si alguien entra a /Realtygi -> también al login
      { source: '/Realtygi', destination: '/Realtygi/auth', permanent: false },
    ];
  },
};

export default nextConfig;