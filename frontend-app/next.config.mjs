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
        source: "/api/:path*",
        // Portul tunelului Minikube (schimbă-l dacă se modifică)
        destination: "http://localhost:65129/api/:path*",
      },
    ];
  },
};

export default nextConfig;
