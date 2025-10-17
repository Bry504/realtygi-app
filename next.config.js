/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  async redirects() {
    return [
      // Cuando entren a la raíz del dominio, envía al login
      { source: '/', destination: '/auth', permanent: false },
    ];
  },
};

module.exports = nextConfig;