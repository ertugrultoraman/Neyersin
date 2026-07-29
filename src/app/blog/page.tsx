import type { Metadata } from "next";

import { YaziKarti } from "@/components/blog/YaziKarti";
import { YaziListesi } from "@/components/blog/YaziListesi";
import { SayfaBasligi } from "@/components/site/SayfaBasligi";
import { Bolum } from "@/components/ui/Bolum";
import { Reveal } from "@/components/ui/Reveal";
import { yazilar } from "@/content/blog";
import { gorselDurumu } from "@/lib/images";

export const metadata: Metadata = {
  title: "Blog — Restoran otomasyonu, teslimat lojistiği ve veri",
  description:
    "Restoran otomasyonu, kurye rota optimizasyonu, mutfak ekranı, sipariş verisi ve " +
    "fiyatlandırma üzerine uzun-form, uygulanabilir yazılar.",
  alternates: { canonical: "/blog" },
};

export default function BlogSayfasi() {
  const [oneCikan, ...digerleri] = yazilar;
  const durum = gorselDurumu();

  return (
    <>
      <SayfaBasligi
        ustBaslik="Blog"
        baslik={
          <>
            Operasyonu <span className="metin-sari">veriyle</span> konuşuyoruz
          </>
        }
        aciklama="Sahada işleyen yöntemler, ölçülebilir metrikler ve kurulum planlarıyla; yüzeysel değil uygulanabilir yazılar."
        kirintiYolu={[{ etiket: "Blog" }]}
      />

      {/* Öne çıkan yazı */}
      <section className="pb-4">
        <div className="kap">
          <Reveal>
            <YaziKarti yazi={oneCikan} genis priority />
          </Reveal>
        </div>
      </section>

      <Bolum className="pt-12 md:pt-16">
        <YaziListesi yazilar={digerleri} />

        {durum.hazir === 0 && (
          <p className="mt-12 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-6 text-center text-sm leading-relaxed text-kahve-500">
            Yazı kapak görselleri şu anda marka desenli yer tutucularla gösteriliyor.{" "}
            <code className="rounded bg-kahve-900/6 px-1.5 py-0.5 font-mono text-xs text-kahve-800">
              npm run images:generate
            </code>{" "}
            komutu, AI ile üretilen görselleri Vercel Blob&apos;a yükleyip {durum.toplam} görselin
            tamamını CDN üzerinden servis eder.
          </p>
        )}
      </Bolum>
    </>
  );
}
