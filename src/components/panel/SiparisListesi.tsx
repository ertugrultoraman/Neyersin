import Link from "next/link";

import { HazirDugmesi } from "./HazirDugmesi";
import { SiparisDestekDugmesi } from "@/components/destek/SiparisDestekDugmesi";
import { IptalDugmesi } from "@/components/panel/IptalDugmesi";
import { SiparisKarti } from "@/components/panel/SiparisKarti";
import { SiparisMesajlari } from "@/components/panel/SiparisMesajlari";
import { YorumFormu } from "@/components/yorum/YorumFormu";
import type { KayitliSiparis } from "@/lib/depo";
import { calismayaAcikMi, musteriIptalEdebilirMi, tamamlandiMi } from "@/lib/siparis";
import { mesajlariListele, mesajlasmaAcikMi } from "@/lib/siparis-mesajlari";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

/**
 * Sipariş listesi — "Siparişlerim" ekranındaki her sekme bunu kullanır.
 *
 * `verdigim` ile `aldigim` arasındaki fark yalnızca görünüm değil, YETKİ:
 *  - Verdiğim siparişler: kişi müşteridir; iptal edebilir, değerlendirme
 *    yazabilir, destek talebi açabilir ve kendi bilgilerini görür.
 *  - Aldığım siparişler: kişi mutfaktır; müşterinin adını, telefonunu ve
 *    adresini GÖRMEZ (bkz. SiparisKarti). İptal ve yorum da onun işi değil.
 */
export async function SiparisListesi({
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
  const c = ceviri(await aktifDil());

  /*
   * MÜŞTERİNİN KURYEYLE YAZIŞMASI. Yalnızca "verdigim" sekmesinde ve yalnızca
   * kurye ATANMIŞ siparişlerde: kimse atanmamışken yazışma kutusu açmak,
   * karşısında kimsenin olmadığı bir kutuya yazdırmak olurdu.
   *
   * Hepsi tek turda çekiliyor; sipariş başına sıralı sorgu listeyi uzak
   * veritabanıyla gözle görülür yavaşlatırdı.
   */
  const yazisilabilir =
    tur === "verdigim" ? siparisler.filter((s) => s.atananKurye) : [];
  const mesajlar = new Map(
    await Promise.all(
      yazisilabilir.map(async (s) => [s.siparisNo, await mesajlariListele(s.siparisNo)] as const),
    ),
  );

  if (siparisler.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-12 text-center">
        <p className="text-sm text-kahve-500">{bosMetin}</p>
        {tur === "verdigim" && (
          <Link
            href="/restoranlar"
            className="tiklanabilir mt-3 inline-block text-sm font-bold text-sari-700 underline"
          >
            {c("siparis.restoranlaraGozAt")}
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
          /* Numara yalnızca kişinin KENDİ kartında; kuryede gizli. */
          telefon={tur === "verdigim"}
          kalemler={tur !== "teslimat"}
          /* Detay sayfası yalnızca MUTFAK için: ekstralar ve müşteri notu
             kartta kırpılıyor, yemeği hazırlayan tamamını görmeli. */
          detayYolu={
            tur === "aldigim"
              ? `/panel/siparis/${encodeURIComponent(s.siparisNo)}`
              : undefined
          }
          ekAlan={
            tur === "verdigim" ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {musteriIptalEdebilirMi(s.durum) && <IptalDugmesi siparisNo={s.siparisNo} />}
                  {tamamlandiMi(s.durum) && !yorumlananlar?.has(s.siparisNo) && (
                    <YorumFormu siparisNo={s.siparisNo} />
                  )}
                  <SiparisDestekDugmesi siparisNo={s.siparisNo} />
                </div>
                {s.atananKurye && (
                  <SiparisMesajlari
                    siparisNo={s.siparisNo}
                    ben="musteri"
                    mesajlar={mesajlar.get(s.siparisNo) ?? []}
                    acik={mesajlasmaAcikMi(s.durum, s.guncellemeTarihi)}
                  />
                )}
              </>
            ) : tur === "aldigim" && calismayaAcikMi(s) && s.durum !== "hazir" ? (
              /*
                Mutfak hazırlamayı bitirince kuryeye haber veriyor. Kapıda
                ödemeli sipariş de burada: parası kapıda alınacağı için
                `odeme-bekliyor` kalıyor ve `durum === "odendi"` koşulu o
                siparişlerde düğmeyi hiç göstermiyordu.
              */
              <HazirDugmesi siparisNo={s.siparisNo} />
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
