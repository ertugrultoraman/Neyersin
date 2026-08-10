import type { KayitliSiparis } from "./depo";

/**
 * İŞLETME RAPORU — ciro, en çok satanlar, iptal oranı.
 *
 * SAF FONKSİYON: sipariş listesini alıp sayıları döndürüyor, veritabanına
 * dokunmuyor. Sayfa listeyi zaten sipariş tahtası için çekiyor; ikinci bir
 * sorgu atmak gereksizdi.
 *
 * "TAMAMLANDI" BURADA KULLANILMIYOR. lib/siparis.ts'teki `tamamlandiMi`
 * "odendi"yi de sayıyor — yani parası alınmış ama HENÜZ TESLİM EDİLMEMİŞ
 * siparişleri. Ciro raporunda bu ikisini tek sayıda toplamak yanıltıcı:
 * işletme daha mutfakta duran yemeği kazanılmış görürdü. Bu yüzden ayrı:
 *
 *   TESLİM EDİLEN — gerçekten tamamlanmış iş.
 *   YOLDAKİ       — parası alınmış, hâlâ süren iş.
 *
 * İptal edilenler hiçbir ciroya girmiyor.
 */

/** Günler Europe/Istanbul'a göre ayrılıyor — sunucu UTC'de çalışıyor olabilir. */
const BOLGE = "Europe/Istanbul";

const gunBicimi = new Intl.DateTimeFormat("en-CA", {
  timeZone: BOLGE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "2026-08-10" — İstanbul gününe göre. */
export function gunAnahtari(tarih: Date): string {
  return gunBicimi.format(tarih);
}

export type DonemOzeti = {
  siparis: number;
  ciro: number;
  /** Ortalama sepet — sipariş yoksa 0. */
  ortalama: number;
};

export type SatanUrun = { ad: string; adet: number; ciro: number };

export type IsletmeRaporu = {
  bugun: DonemOzeti;
  sonYediGun: DonemOzeti;
  sonOtuzGun: DonemOzeti;
  /** Parası alınmış ama teslim edilmemiş siparişler. */
  yoldakiCiro: number;
  yoldakiSiparis: number;
  iptal: number;
  /** Yüzde 0–100; hiç sipariş yoksa 0. */
  iptalOrani: number;
  enCokSatan: SatanUrun[];
};

const BOS_DONEM: DonemOzeti = { siparis: 0, ciro: 0, ortalama: 0 };

function donem(siparisler: KayitliSiparis[]): DonemOzeti {
  const ciro = siparisler.reduce((t, s) => t + s.tutarlar.toplam, 0);
  return {
    siparis: siparisler.length,
    ciro,
    ortalama: siparisler.length === 0 ? 0 : Math.round(ciro / siparisler.length),
  };
}

/**
 * @param gunSayisi Kaç gün geriye bakılacağı; bugün dahil.
 */
function sonGunler(siparisler: KayitliSiparis[], simdi: Date, gunSayisi: number): KayitliSiparis[] {
  /*
   * Sınır GÜN BAŞINDAN hesaplanıyor, "24 saat önce"den değil: işletme "son 7
   * gün" derken takvim günlerini kastediyor. Saat farkıyla ölçseydik sabah
   * bakınca dünün akşam siparişleri listeden düşerdi.
   */
  const bugunBaslangic = new Date(`${gunAnahtari(simdi)}T00:00:00+03:00`).getTime();
  const sinir = bugunBaslangic - (gunSayisi - 1) * 24 * 60 * 60 * 1000;
  return siparisler.filter((s) => new Date(s.olusturmaTarihi).getTime() >= sinir);
}

export function raporCikar(
  siparisler: KayitliSiparis[],
  simdi: Date = new Date(),
): IsletmeRaporu {
  const teslimEdilen = siparisler.filter((s) => s.durum === "teslim-edildi");
  const yoldaki = siparisler.filter(
    (s) => s.durum === "odendi" || s.durum === "hazir" || s.durum === "yolda",
  );
  const iptaller = siparisler.filter((s) => s.durum === "iptal");

  const bugunAnahtari = gunAnahtari(simdi);
  const bugunkuler = teslimEdilen.filter(
    (s) => gunAnahtari(new Date(s.olusturmaTarihi)) === bugunAnahtari,
  );

  /* En çok satanlar TESLİM EDİLEN siparişlerden; iptal edilen sepet satış değil. */
  const sayac = new Map<string, SatanUrun>();
  for (const s of teslimEdilen) {
    for (const k of s.kalemler) {
      const mevcut = sayac.get(k.ad) ?? { ad: k.ad, adet: 0, ciro: 0 };
      mevcut.adet += k.adet;
      /*
       * Ekstralar da ciroya giriyor: "ekstra peynir" ürünün parçası olarak
       * satılıyor ve hariç tutulsaydı toplam, sipariş tutarlarıyla
       * uyuşmazdı.
       */
      const ekstraToplami = (k.ekstralar ?? []).reduce((t, e) => t + e.fiyat, 0);
      mevcut.ciro += (k.fiyat + ekstraToplami) * k.adet;
      sayac.set(k.ad, mevcut);
    }
  }

  const enCokSatan = [...sayac.values()].sort((a, b) => b.adet - a.adet).slice(0, 5);

  const toplamKarar = teslimEdilen.length + iptaller.length;

  return {
    bugun: bugunkuler.length === 0 ? BOS_DONEM : donem(bugunkuler),
    sonYediGun: donem(sonGunler(teslimEdilen, simdi, 7)),
    sonOtuzGun: donem(sonGunler(teslimEdilen, simdi, 30)),
    yoldakiCiro: yoldaki.reduce((t, s) => t + s.tutarlar.toplam, 0),
    yoldakiSiparis: yoldaki.length,
    iptal: iptaller.length,
    /*
     * Oran, SONUÇLANMIŞ siparişler üzerinden: devam edenler paydaya girseydi
     * yoğun bir gün oranı yapay olarak düşürürdü.
     */
    iptalOrani: toplamKarar === 0 ? 0 : Math.round((iptaller.length / toplamKarar) * 100),
    enCokSatan,
  };
}
