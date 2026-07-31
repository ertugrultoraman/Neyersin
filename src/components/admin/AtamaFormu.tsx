"use client";

import { useActionState } from "react";

import { siparisAtaAction, type YonetimDurumu } from "@/app/admin/yonetim-actions";
import { Alan, Secim, Uyari } from "@/components/hesap/Alan";
import { Buton } from "@/components/ui/Buton";

const BASLANGIC: YonetimDurumu = {};

export type AtanabilirKisi = { eposta: string; ad: string; ek?: string };

/**
 * Siparişe şef ve kurye atar.
 *
 * Bir sipariş TEK bir kuryeye atanır — kurye panelinde yalnızca kendi ataması
 * görünür, atanmamış sipariş hiçbir kuryeye düşmez.
 */
export function AtamaFormu({
  siparisNo,
  sefler,
  kuryeler,
  mevcutSef,
  mevcutKurye,
}: {
  siparisNo: string;
  sefler: AtanabilirKisi[];
  kuryeler: AtanabilirKisi[];
  mevcutSef?: string;
  mevcutKurye?: string;
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

        <Alan etiket="Teslim edecek kurye" ipucu="Sipariş yalnızca seçilen kuryeye görünür.">
          <Secim name="atananKurye" defaultValue={mevcutKurye ?? ""}>
            <option value="">— atanmadı —</option>
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
