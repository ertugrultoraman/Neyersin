"use client";

import { useRouter } from "next/navigation";

import { paraFormatla } from "@/lib/utils";
import { useSepet } from "../saglayici/SepetBaglami";
import { Buton, OkIkon } from "../ui/Buton";
import { SepetIkon } from "../ui/Ikonlar";

/** Restoran sayfasındaki yapışkan sepet özeti. */
export function SepetOzeti({ restoranSlug }: { restoranSlug: string }) {
  const { kalemler, restoranSlug: sepetRestoran, tutarlar, adetToplam, hazir } = useSepet();
  const router = useRouter();

  const buRestoranin = sepetRestoran === restoranSlug;
  const gosterilecek = hazir && buRestoranin && kalemler.length > 0;

  return (
    <aside className="rounded-3xl border border-kahve-900/8 bg-white p-5 shadow-yumusak">
      <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-kahve-900">
        <SepetIkon className="size-4.5 text-sari-700" />
        Sepetim
      </h2>

      {!gosterilecek ? (
        <p className="mt-3 text-sm leading-relaxed text-kahve-500">
          Menüden ürün ekledikçe sepetin burada görünecek.
        </p>
      ) : (
        <>
          <ul className="mt-4 space-y-2.5 border-b border-kahve-900/8 pb-4">
            {kalemler.map((k) => (
              <li key={k.urunId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 text-kahve-700">
                  <span className="font-bold text-kahve-900">{k.adet}×</span> {k.ad}
                </span>
                <span className="shrink-0 font-semibold text-kahve-900">
                  {paraFormatla(k.fiyat * k.adet)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-kahve-600">Ara toplam ({adetToplam} ürün)</dt>
              <dd className="font-semibold text-kahve-900">
                {paraFormatla(tutarlar?.araToplam ?? 0)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-kahve-600">Teslimat</dt>
              <dd className="font-semibold text-kahve-900">
                {tutarlar?.teslimatUcreti === 0 ? (
                  <span className="text-nane-koyu">Ücretsiz</span>
                ) : (
                  paraFormatla(tutarlar?.teslimatUcreti ?? 0)
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t border-kahve-900/10 pt-2">
              <dt className="font-display font-extrabold text-kahve-900">Toplam</dt>
              <dd className="font-display text-lg font-extrabold text-kahve-900">
                {paraFormatla(tutarlar?.toplam ?? 0)}
              </dd>
            </div>
          </dl>

          {tutarlar && !tutarlar.minSepetKarsilandi && (
            <p className="mt-3 rounded-xl bg-domates/10 px-3 py-2.5 text-xs leading-snug font-semibold text-domates-koyu">
              Minimum sepet {paraFormatla(tutarlar.minSepet)} — {" "}
              {paraFormatla(tutarlar.minSepet - tutarlar.araToplam)} daha ekle.
            </p>
          )}

          <Buton
            type="button"
            boyut="lg"
            className="mt-4 w-full"
            disabled={!tutarlar?.minSepetKarsilandi}
            onClick={() => router.push("/odeme")}
            ikon={<OkIkon />}
          >
            Ödemeye geç
          </Buton>
        </>
      )}
    </aside>
  );
}
