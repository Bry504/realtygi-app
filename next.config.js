/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // trailingSlash por defecto es false, no hace falta declararlo
  eslint: {
    // Opcional: permite build aunque haya warnings/errores de ESLint
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;