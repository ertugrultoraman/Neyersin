"use client";

import { useTransition } from "react";

import { durumuGuncelle } from "@/app/admin/actions";
import { durumEtiketi } from "@/components/admin/DurumRozeti";
import type { SiparisDurumu } from "@/lib/siparis";
import { cn } from "@/lib/utils";

/**
 * Yöneticinin elle atayabileceği durumlar.
 *
 * ETİKETLER `durumEtiketi`DEN GELİYOR, burada tekrar yazılmıyor. Önceden
 * ayrı yazılmıştı ve ayrışmıştı: form "Ödendi olarak işaretle" diyor, basınca
 * rozet "HAZIRLANIYOR" çıkıyordu. Tek kaynak olunca bir daha ayrışamaz.
 *
 * Teslimat adımları da burada: normalde şef ve kurye kendi panellerinden
 * ilerletiyor ama bir aksilikte (kuryenin telefonu bitti, şef basmayı unuttu)
 * yöneticinin elle düzeltebilmesi gerekiyor.
 */
const SECENEKLER: { deger: SiparisDurumu; aciklama: string }[] = [
  { deger: "odendi", aciklama: "Ödeme alındı, mutfak hazırlıyor." },
  { deger: "hazir", aciklama: "Mutfak bitirdi, kurye alabilir." },
  { deger: "yolda", aciklama: "Kurye teslim aldı, müşteriye gidiyor." },
  { deger: "teslim-edildi", aciklama: "Sipariş müşteriye ulaştı." },
  { deger: "odeme-bekliyor", aciklama: "Ödeme henüz ulaşmadı." },
  { deger: "odeme-basarisiz", aciklama: "Ödeme alınamadı veya sipariş iptal edildi." },
];

export function DurumFormu({
  siparisNo,
  mevcutDurum,
}: {
  siparisNo: string;
  mevcutDurum: SiparisDurumu;
}) {
  const [bekliyor, basla] = useTransition();

  return (
    <div className="rounded-3xl border border-kahve-900/8 bg-white p-5 md:p-6">
      <h2 className="font-display text-base font-extrabold text-kahve-900">Durumu güncelle</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-kahve-500">
        Kapıda ödemelerde tahsilat yapıldığında siparişi elle onaylayın.
      </p>

      <div className="mt-4 space-y-2">
        {SECENEKLER.map((s) => {
          const secili = s.deger === mevcutDurum;
          return (
            <button
              key={s.deger}
              type="button"
              disabled={bekliyor || secili}
              onClick={() => basla(() => durumuGuncelle(siparisNo, s.deger).then(() => {}))}
              className={cn(
                "w-full rounded-2xl border-2 px-4 py-3 text-left transition-all duration-300",
                secili
                  ? "cursor-default border-sari-500 bg-sari-500/10"
                  : "border-kahve-900/10 hover:border-kahve-900/30 hover:bg-kahve-900/3",
                bekliyor && "opacity-60",
              )}
            >
              <span className="block text-sm font-bold text-kahve-900">
                {secili ? `Mevcut durum: ${durumEtiketi(s.deger)}` : durumEtiketi(s.deger)}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-kahve-500">
                {s.aciklama}
              </span>
            </button>
          );
        })}
      </div>

      {bekliyor && (
        <p aria-live="polite" className="mt-3 text-xs font-semibold text-kahve-500">
          Güncelleniyor…
        </p>
      )}
    </div>
  );
}
