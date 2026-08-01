import type { NextConfig } from "next";

/**
 * Güvenlik başlıkları.
 *
 * Tarayıcıya "bu siteye ne yapılabilir, ne yapılamaz" diye söylüyorlar. Yoksa
 * varsayılanlar oldukça gevşek: sayfa başka bir sitenin iframe'ine gömülebilir
 * (tıklama hırsızlığı), yabancı bir script çalışabilir, form başka bir adrese
 * gönderilebilir.
 *
 * CSP notu: Next.js çalışma zamanı satır içi script ve stil kullanıyor, bu
 * yüzden 'unsafe-inline' zorunlu. Asıl korumayı `script-src 'self'` sağlıyor —
 * dışarıdan hiçbir script yüklenemiyor.
 */
const GUVENLIK_BASLIKLARI = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Görseller kendi sunucumuz + Vercel Blob CDN'i
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "font-src 'self' data:",
      "connect-src 'self'",
      // iframe kullanmıyoruz; iyzico kendi sayfasına yönlendiriyor
      "frame-src 'none'",
      // Sayfamız başka bir sitenin iframe'ine GÖMÜLEMEZ (clickjacking)
      "frame-ancestors 'none'",
      // Formlar yalnızca kendi sunucumuza gönderilebilir
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  // Tarayıcı bir daha HTTP denemesin — araya girip dinleme ihtimalini kapatır
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Dosya tipini tahmin etmeye çalışma (MIME sniffing)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Eski tarayıcılar için frame-ancestors karşılığı
  { key: "X-Frame-Options", value: "DENY" },
  // Başka siteye giderken tam adresi sızdırma
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kamera, mikrofon, konum: hiçbiri istenmiyor
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Sekmeler arası izolasyon
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

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
  /**
   * `iyzipay` CommonJS bir paket ve node:https / node:crypto kullanıyor.
   * Bundle'a dahil edilmesin, Node tarafında olduğu gibi require edilsin.
   */
  serverExternalPackages: ["iyzipay"],
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: GUVENLIK_BASLIKLARI }];
  },
};

export default nextConfig;
