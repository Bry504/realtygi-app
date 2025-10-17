/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  async redirects() {
    return [{ source: '/', destination: '/auth', permanent: false }];
  },
  eslint: {
    // Permite que el build continúe aunque existan errores de ESLint
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;