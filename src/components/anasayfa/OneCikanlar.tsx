import { restoranlar } from "@/content/restoranlar";
import { ButonBaglanti, OkIkon } from "../ui/Buton";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { Kademeli, KademeliOge } from "../ui/Reveal";
import { RestoranKarti } from "./RestoranKarti";

export function OneCikanlar() {
  const oneCikanlar = restoranlar.filter((r) => r.oneCikan);

  return (
    <Bolum id="one-cikanlar">
      <BolumBasligi
        ustBaslik="Popüler"
        baslik="Bu hafta öne çıkanlar"
        aciklama="Puanı, teslimat süresi ve tekrar sipariş oranı en yüksek restoranlar."
        yan={
          <ButonBaglanti href="/restoranlar" tur="hayalet" boyut="md">
            Tüm restoranlar
            <OkIkon />
          </ButonBaglanti>
        }
      />

      <Kademeli etiket="ul" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {oneCikanlar.map((r) => (
          <KademeliOge key={r.slug} etiket="li">
            <RestoranKarti restoran={r} />
          </KademeliOge>
        ))}
      </Kademeli>
    </Bolum>
  );
}
