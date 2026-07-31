import Link from "next/link";

import { kategoriler } from "@/content/kategoriler";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { KategoriIkon } from "../ui/KategoriIkon";
import { Kademeli, KademeliOge } from "../ui/Reveal";

export function KategoriRayi() {
  return (
    <Bolum id="kategoriler" className="py-12 md:py-16">
      <BolumBasligi
        ustBaslik="Ne canın çekiyor?"
        baslik="Kategorilerden hızlı başla"
        aciklama="En çok sipariş edilen mutfaklar — tek dokunuşla bölgendeki restoranlara geç."
      />

      <Kademeli
        etiket="ul"
        aralik={0.05}
        className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:gap-4"
      >
        {kategoriler.map((k) => (
          <KademeliOge key={k.slug} etiket="li">
            <Link
              href="/restoranlar"
              className="group flex h-full flex-col items-center gap-3 rounded-3xl border
                border-kahve-900/6 bg-white/70 px-3 py-5 text-center kart-kalk
                hover:border-sari-500/50"
            >
              <span
                className="grid size-14 place-items-center rounded-2xl bg-sari-500/14
                  text-sari-700 transition-all duration-500 ease-[var(--ease-yayli)]
                  group-hover:-rotate-6 group-hover:bg-sari-500 group-hover:text-kahve-900"
              >
                <KategoriIkon ad={k.ikon} className="size-7" />
              </span>
              <span className="text-sm leading-tight font-bold text-kahve-900">{k.ad}</span>
              <span className="text-2xs font-medium text-kahve-400">{k.not}</span>
            </Link>
          </KademeliOge>
        ))}
      </Kademeli>
    </Bolum>
  );
}
