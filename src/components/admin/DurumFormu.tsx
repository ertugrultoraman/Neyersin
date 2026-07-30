"use client";

import { useTransition } from "react";

import { durumuGuncelle } from "@/app/admin/actions";
import type { SiparisDurumu } from "@/lib/siparis";
import { cn } from "@/lib/utils";

const SECENEKLER: { deger: SiparisDurumu; etiket: string; aciklama: string }[] = [
  {
    deger: "odendi",
    etiket: "Ödendi olarak işaretle",
    aciklama: "Havale dekontu eşleşti — sipariş mutfağa iletilebilir.",
  },
  {
    deger: "odeme-bekliyor",
    etiket: "Ödeme bekliyor",
    aciklama: "Ödeme henüz ulaşmadı.",
  },
  {
    deger: "odeme-basarisiz",
    etiket: "Başarısız / iptal",
    aciklama: "Ödeme alınamadı veya sipariş iptal edildi.",
  },
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
        Havale ödemelerinde dekont eşleştiğinde siparişi elle onaylayın.
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
                {secili ? "Mevcut durum" : s.etiket}
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
