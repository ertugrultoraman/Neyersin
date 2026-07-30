import type { Metadata, Viewport } from "next";
import { Baloo_2, Manrope } from "next/font/google";

import { Saglayicilar } from "@/components/saglayici/Saglayicilar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { DuyuruBandi } from "@/components/site/DuyuruBandi";
import { site } from "@/content/site";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin", "latin-ext"],
  variable: "--font-baloo",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.ad} — ${site.slogan}`,
    template: `%s | ${site.ad}`,
  },
  description: site.aciklama,
  applicationName: site.ad,
  keywords: [
    "yemek siparişi",
    "online yemek",
    "kurye yönetimi",
    "restoran paneli",
    "teslimat takibi",
    "sektörel otomasyon",
    "veri değerlendirme",
  ],
  authors: [{ name: site.ad }],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: site.url,
    siteName: site.ad,
    title: `${site.ad} — ${site.slogan}`,
    description: site.aciklama,
    images: [
      {
        url: "/brand/ne-yersin-logo.jpeg",
        width: 1536,
        height: 1024,
        alt: `${site.ad} logosu`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.ad} — ${site.slogan}`,
    description: site.aciklama,
    images: ["/brand/ne-yersin-logo.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff9ef" },
    { media: "(prefers-color-scheme: dark)", color: "#241608" },
  ],
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${baloo.variable} ${manrope.variable}`}>
      <body className="min-h-dvh antialiased">
        <a href="#icerik" className="atla">
          İçeriğe geç
        </a>
        <Saglayicilar>
          <DuyuruBandi />
          <Header />
          <main id="icerik">{children}</main>
          <Footer />
        </Saglayicilar>
      </body>
    </html>
  );
}
