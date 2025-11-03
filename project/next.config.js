/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // <-- ELIMINADO: Conflicta con el proxy de API.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },

  // AÑADIDO: Proxy para redirigir las llamadas de API al backend de FastAPI
  async rewrites() {
    const BACKEND_URL = 'http://localhost:12000';
    return [
      {
        source: '/conversation/:path*',
        destination: `${BACKEND_URL}/conversation/:path*`,
      },
      {
        source: '/message/:path*',
        destination: `${BACKEND_URL}/message/:path*`,
      },
      {
        source: '/events/:path*',
        destination: `${BACKEND_URL}/events/:path*`,
      },
      {
        source: '/task/:path*',
        destination: `${BACKEND_URL}/task/:path*`,
      },
      {
        source: '/agent/:path*',
        destination: `${BACKEND_URL}/agent/:path*`,
      },
      {
        source: '/api_key/:path*',
        destination: `${BACKEND_URL}/api_key/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
