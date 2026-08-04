/** @type {import('next').NextConfig} */
const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:3001';

const nextConfig = {
  reactStrictMode: true,
  // Dev'da API'ni bir xil origin ostida ko'rsatamiz — CORS va cookie muammosi bo'lmaydi.
  // Productionda bu ishni nginx bajaradi (deploy/nginx-multilevel.conf).
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
      { source: '/uploads/:path*', destination: `${apiOrigin}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
