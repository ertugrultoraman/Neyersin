import { cookies, headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import { Baloo_2, Manrope } from "next/font/google";

import { Saglayicilar } from "@/components/saglayici/Saglayicilar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { DuyuruBandi } from "@/components/site/DuyuruBandi";
import { InsanKapisi } from "@/components/site/InsanKapisi";
import { VekaletSeridi } from "@/components/site/VekaletSeridi";
import { DilSaglayici } from "@/components/saglayici/DilBaglami";
import { aktifDil } from "@/lib/dil-sunucu";
import { aramaMotoruMu, biletGecerliMi, DOGRULAMA_COOKIE } from "@/lib/insan-dogrulama";
import { ceviri } from "@/lib/sozluk";
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
    "ev yemeği siparişi",
    "ev hanımı şef",
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /**
   * "Ben robot değilim" kapısı.
   *
   * Bilet çerezi geçerliyse site normal açılır; değilse SUNUCU sayfanın
   * kendisini basmadan kapıyı gösterir. Kapıyı istemcide gizleyip göstermek
   * yeterli olmazdı: içerik yine HTML'de gelir, bot okuyup geçerdi.
   */
  const bilet = (await cookies()).get(DOGRULAMA_COOKIE)?.value;
  const userAgent = (await headers()).get("user-agent");
  // Arama motorları kapıya takılırsa site hiçbir aramada çıkmaz.
  const insanDogrulandi = biletGecerliMi(bilet) || aramaMotoruMu(userAgent);

  /*
   * Dil çerezden okunuyor ve <html lang> ile sağlayıcıya AYNI kaynaktan
   * veriliyor. lang doğru olmazsa ekran okuyucular Türkçe metni İngilizce
   * telaffuzla okuyor ve tarayıcı çeviri önerisi yanlış çalışıyor.
   */
  const dil = await aktifDil();
  const c = ceviri(dil);

  return (
    <html lang={dil} className={`${baloo.variable} ${manrope.variable}`}>
      <body className="min-h-dvh antialiased">
        {insanDogrulandi ? (
          <>
            <a href="#icerik" className="atla">
              {c("genel.icerigeGec")}
            </a>
            <Saglayicilar dil={dil}>
              {/* Vekâlet yoksa hiçbir şey çizmiyor. */}
              <VekaletSeridi />
              <DuyuruBandi />
              <Header />
              <main id="icerik">{children}</main>
              <Footer />
            </Saglayicilar>
          </>
        ) : (
          /*
            Kapı yalnızca DİL sağlayıcısıyla sarılıyor, `Saglayicilar` ile
            değil: sepet çekmecesi, destek widgetı ve adres modalı henüz
            doğrulanmamış ziyaretçiye hiç yüklenmemeli — hem gereksiz hem de
            kapının arkasında görünmez şekilde mount olurlardı.
          */
          <DilSaglayici dil={dil}>
            <InsanKapisi />
          </DilSaglayici>
        )}
      </body>
    </html>
  );
}
