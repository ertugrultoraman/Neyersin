import type { NextConfig } from "next";

/**
 * Görseller Vercel Blob (CDN) üzerinden servis edilir. Uzak host burada
 * izinlenmezse `next/image` production'da hata verir — bkz. brief Bölüm 8.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Dokümante edilmiş alternatif storage'lar (kullanılmazsa zararsız):
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  poweredByHeader: false,
};

export default nextConfig;
