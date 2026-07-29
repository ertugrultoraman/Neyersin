import { yazilar } from "@/content/blog";
import { YaziKarti } from "../blog/YaziKarti";
import { ButonBaglanti, OkIkon } from "../ui/Buton";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { Kademeli, KademeliOge } from "../ui/Reveal";

export function BlogOnizleme() {
  const secilenler = yazilar.slice(0, 3);

  return (
    <Bolum id="blog-onizleme">
      <BolumBasligi
        ustBaslik="Blog"
        baslik="Operasyonu veriyle konuşuyoruz"
        aciklama="Restoran otomasyonu, teslimat lojistiği ve veri kullanımı üzerine uzun-form, uygulanabilir yazılar."
        yan={
          <ButonBaglanti href="/blog" tur="hayalet" boyut="md">
            Tüm yazılar
            <OkIkon />
          </ButonBaglanti>
        }
      />

      <Kademeli etiket="ul" className="mt-10 grid gap-5 md:grid-cols-3">
        {secilenler.map((y) => (
          <KademeliOge key={y.slug} etiket="li">
            <YaziKarti yazi={y} />
          </KademeliOge>
        ))}
      </Kademeli>
    </Bolum>
  );
}
