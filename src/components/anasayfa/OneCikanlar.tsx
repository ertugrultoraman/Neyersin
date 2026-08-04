import { restoranlar } from "@/content/restoranlar";
import { ButonBaglanti, OkIkon } from "../ui/Buton";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { Kademeli, KademeliOge } from "../ui/Reveal";
import { RestoranKarti } from "./RestoranKarti";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export async function OneCikanlar() {
  const c = ceviri(await aktifDil());

  const oneCikanlar = restoranlar.filter((r) => r.oneCikan);

  return (
    <Bolum id="one-cikanlar">
      <BolumBasligi
        ustBaslik={c("oneCikan.ustBaslik")}
        baslik={c("oneCikan.baslik")}
        aciklama={c("oneCikan.aciklama")}
        yan={
          <ButonBaglanti href="/restoranlar" tur="hayalet" boyut="md">
            {c("restoran.tumRestoranlar")}
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
