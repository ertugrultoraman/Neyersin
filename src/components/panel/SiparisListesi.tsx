import Link from "next/link";

import { HazirDugmesi } from "./HazirDugmesi";
import { SiparisDestekDugmesi } from "@/components/destek/SiparisDestekDugmesi";
import { IptalDugmesi } from "@/components/panel/IptalDugmesi";
import { SiparisKarti } from "@/components/panel/SiparisKarti";
import { YorumFormu } from "@/components/yorum/YorumFormu";
import type { KayitliSiparis } from "@/lib/depo";
import { musteriIptalEdebilirMi, tamamlandiMi } from "@/lib/siparis";

/**
 * Sipariş listesi — "Siparişlerim" ekranındaki her sekme bunu kullanır.
 *
 * `verdigim` ile `aldigim` arasındaki fark yalnızca görünüm değil, YETKİ:
 *  - Verdiğim siparişler: kişi müşteridir; iptal edebilir, değerlendirme
 *    yazabilir, destek talebi açabilir ve kendi bilgilerini görür.
 *  - Aldığım siparişler: kişi mutfaktır; müşterinin adını, telefonunu ve
 *    adresini GÖRMEZ (bkz. SiparisKarti). İptal ve yorum da onun işi değil.
 */
export function SiparisListesi({
  siparisler,
  tur,
  yorumlananlar,
  bosMetin,
}: {
  siparisler: KayitliSiparis[];
  tur: "verdigim" | "aldigim" | "teslimat";
  /** Zaten değerlendirilmiş sipariş numaraları — form ikinci kez çıkmasın. */
  yorumlananlar?: Set<string>;
  bosMetin: string;
}) {
  if (siparisler.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-12 text-center">
        <p className="text-sm text-kahve-500">{bosMetin}</p>
        {tur === "verdigim" && (
          <Link
            href="/restoranlar"
            className="tiklanabilir mt-3 inline-block text-sm font-bold text-sari-700 underline"
          >
            Restoranlara göz at
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {siparisler.map((s) => (
        <SiparisKarti
          key={s.siparisNo}
          siparis={s}
          /* Adres ve telefon yalnızca siparişi VEREN kişide ve teslimatı
             yapacak kuryede görünür; mutfak tarafında görünmez. */
          musteriBilgisi={tur !== "aldigim"}
          kalemler={tur !== "teslimat"}
          ekAlan={
            tur === "verdigim" ? (
              <div className="flex flex-wrap items-center gap-2">
                {musteriIptalEdebilirMi(s.durum) && <IptalDugmesi siparisNo={s.siparisNo} />}
                {tamamlandiMi(s.durum) && !yorumlananlar?.has(s.siparisNo) && (
                  <YorumFormu siparisNo={s.siparisNo} />
                )}
                <SiparisDestekDugmesi siparisNo={s.siparisNo} />
              </div>
            ) : tur === "aldigim" && s.durum === "odendi" ? (
              /* Mutfak hazırlamayı bitirince kuryeye haber veriyor. */
              <HazirDugmesi siparisNo={s.siparisNo} />
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
