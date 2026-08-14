"use client";

import { useActionState } from "react";

import { siparisAtaAction, type YonetimDurumu } from "@/app/admin/yonetim-actions";
import { Alan, Secim, Uyari } from "@/components/hesap/Alan";
import { Buton } from "@/components/ui/Buton";

const BASLANGIC: YonetimDurumu = {};

export type AtanabilirKisi = { eposta: string; ad: string; ek?: string };

/**
 * Siparişe şef atar, kuryeye teklif eder.
 *
 * Bir sipariş TEK bir kuryeye gider: seçilen kurye kabul edene kadar iş onun
 * için ayrılıyor, başka kuryeye teklif edilmiyor.
 */
export function AtamaFormu({
  siparisNo,
  sefler,
  kuryeler,
  mevcutSef,
  mevcutKurye,
  kabulEdildi,
}: {
  siparisNo: string;
  sefler: AtanabilirKisi[];
  kuryeler: AtanabilirKisi[];
  mevcutSef?: string;
  /** Seçili kurye — kabul etmiş ya da teklif bekleyen. */
  mevcutKurye?: string;
  /** Kurye işi kabul etti mi? Etiket buna göre değişiyor. */
  kabulEdildi?: boolean;
}) {
  const [durum, gonder, bekliyor] = useActionState(siparisAtaAction, BASLANGIC);

  return (
    <form action={gonder} className="space-y-4">
      <input type="hidden" name="siparisNo" value={siparisNo} />

      {durum.hata && <Uyari tur="hata">{durum.hata}</Uyari>}
      {durum.basari && <Uyari tur="basari">{durum.basari}</Uyari>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Alan etiket="Hazırlayacak şef">
          <Secim name="atananSef" defaultValue={mevcutSef ?? ""}>
            <option value="">— atanmadı —</option>
            {sefler.map((s) => (
              <option key={s.eposta} value={s.eposta}>
                {s.ad}
                {s.ek ? ` (${s.ek})` : ""}
              </option>
            ))}
          </Secim>
        </Alan>

        <Alan
          etiket="Teslim edecek kurye"
          ipucu={
            kabulEdildi
              ? "Kurye bu işi kabul etti. Başka birini seçersen iş elinden alınıp yenisine teklif edilir."
              : "Seçilen kuryeye teklif düşer; kabul edene kadar sipariş kimsenin üstünde olmaz."
          }
        >
          <Secim name="atananKurye" defaultValue={mevcutKurye ?? ""}>
            <option value="">— kimseye gitmesin —</option>
            {kuryeler.map((k) => (
              <option key={k.eposta} value={k.eposta}>
                {k.ad}
                {k.ek ? ` (${k.ek})` : ""}
              </option>
            ))}
          </Secim>
        </Alan>
      </div>

      {sefler.length === 0 && kuryeler.length === 0 && (
        <p className="text-xs text-kahve-500">
          Henüz onaylanmış şef veya kurye hesabı yok. Başvurular sayfasından onaylayabilirsin.
        </p>
      )}

      <Buton type="submit" boyut="md" disabled={bekliyor}>
        {bekliyor ? "Kaydediliyor…" : "Atamayı kaydet"}
      </Buton>
    </form>
  );
}
