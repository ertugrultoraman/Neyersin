import Link from "next/link";

import { restoranlar } from "@/content/restoranlar";
import { AkilliGorsel } from "../ui/AkilliGorsel";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { YildizIkon } from "../ui/Ikonlar";
import { Kademeli, KademeliOge } from "../ui/Reveal";
import { Rozet } from "../ui/Rozet";

/**
 * Ev hanımı profillerini öne çıkaran yatay kayan şerit. Yeni ev hanımları
 * katıldıkça otomatik büyür — filtre `sefTuru` alanına bakar, "Ev Yapımı"
 * etiketine değil (o etiket ticari işletmelerin ürünleri için de kullanılıyor).
 * Profesyonel şef profilleri bu bölümde görünmez.
 */
export function AyinHanimlari() {
  const sefler = restoranlar.filter((r) => r.sefTuru === "ev-hanimi");
  if (sefler.length === 0) return null;

  return (
    <Bolum id="ayin-hanimlari">
      <BolumBasligi
        ustBaslik="Ev Mutfağı"
        baslik="Ayın Hanımları"
        aciklama="Kendi mutfağından, ev yapımı lezzetlerle katılan şeflerimiz."
      />

      <Kademeli
        etiket="ul"
        className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 gizli-scroll"
      >
        {sefler.map((r) => (
          <KademeliOge key={r.slug} etiket="li" className="w-64 shrink-0 snap-start sm:w-72">
            <Link
              href={`/restoran/${r.slug}`}
              className="tiklanabilir group block overflow-hidden rounded-4xl border border-kahve-900/8 bg-white kart-kalk"
            >
              <AkilliGorsel
                anahtar={`sef/${r.slug}`}
                alt={r.ad}
                oran="4/3"
                sizes="288px"
                className="w-full"
              />
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-extrabold text-kahve-900">{r.ad}</h3>
                  <Rozet ton="sari">Ev Yapımı</Rozet>
                </div>
                <p className="mt-1 text-xs font-semibold text-kahve-500">{r.semt} / İstanbul</p>
                <p className="mt-3 text-sm leading-relaxed text-kahve-600">
                  {r.sefBiyografisi
                    ? r.sefBiyografisi.slice(0, 90) + (r.sefBiyografisi.length > 90 ? "…" : "")
                    : "Platforma yeni katıldı — kendi hikayesini yakında paylaşacak."}
                </p>
                <p className="mt-3 flex items-center gap-1 text-xs font-bold text-kahve-500">
                  <YildizIkon className="size-3.5 text-sari-500" />
                  {r.yorum > 0
                    ? `${r.puan.toLocaleString("tr-TR", { minimumFractionDigits: 1 })} (${r.yorum})`
                    : "Henüz değerlendirilmedi"}
                </p>
              </div>
            </Link>
          </KademeliOge>
        ))}
      </Kademeli>
    </Bolum>
  );
}
