import type { KuryeTeslimatiDto, SiparisDurumu } from "ortak";

/**
 * TESLİMAT KURALLARI — kuryenin gözünden.
 *
 * Durum adları müşteri uygulamasındakinden BİLEREK farklı: müşteriye "Kurye
 * yolda" denen durum kurye için "Sende", müşterinin "Hazırlanıyor" dediği
 * durum kurye için "Mutfak hazırlıyor". Aynı sözlüğü paylaşsalardı kurye
 * kendi telefonunda kendisini üçüncü şahıs olarak okurdu.
 *
 * Adım kuralları sunucudaki `lib/mobil/kurye.ts` ile aynı. Buradaki kopya
 * yalnızca DÜĞMEYİ GİZLEMEK için: son sözü sunucu söylüyor, uygulama
 * yapılamayacak bir işi kuryeye teklif etmesin diye önden eliyor.
 */

export const DURUM_ADI: Record<SiparisDurumu, string> = {
  /*
   * "Ödeme bekleniyor" DEĞİL: kuryenin listesine düşen bekleyen sipariş her
   * zaman kapıda ödemeli (kartla ödenmemiş sipariş hiç teklif edilmiyor, bkz.
   * lib/siparis → calismayaAcikMi). Kurye için doğru bilgi mutfağın çalışıyor
   * olması; parayı zaten kapıda kendisi tahsil edecek.
   */
  "odeme-bekliyor": "Mutfak hazırlıyor",
  odendi: "Mutfak hazırlıyor",
  hazir: "Alınmayı bekliyor",
  yolda: "Sende",
  "teslim-edildi": "Teslim edildi",
  "odeme-basarisiz": "Ödeme alınamadı",
  iptal: "İptal edildi",
};

/** Kuryenin hâlâ yapacak işi var mı? */
export function aktifMi(durum: SiparisDurumu): boolean {
  return (
    durum === "odeme-bekliyor" || durum === "odendi" || durum === "hazir" || durum === "yolda"
  );
}

/**
 * Mutfağın ortalama hazırlanma süresi (dakika).
 *
 * Kurye "işi kabul ettim, neden hemen alamıyorum" diye sormasın diye
 * gösteriliyor: sipariş `odendi` durumundayken teslim alınamıyor, mutfağın
 * "hazır" demesi gerekiyor (kural sunucuda, bkz. lib/mobil/kurye.ts →
 * kuryeAdimi). Süre yazılmadan bu bekleme, uygulamanın takıldığı izlenimi
 * veriyordu.
 *
 * TEK SAYI, MUTFAK BAŞINA DEĞİL: mutfak başına gerçek hazırlanma süresi
 * ölçülmüyor. Ölçülmeyen bir şeyi mutfak başına farklı göstermek, olmayan
 * bir veriden kesinlik üretmek olurdu. Ortalama ölçülmeye başlandığında
 * buraya sunucudan gelen değer bağlanacak.
 */
export const HAZIRLANMA_DK = 5;

export type SiradakiAdim = {
  hedef: "yolda" | "teslim-edildi";
  baslik: string;
  /** Dokunmadan önce onay sorulacak mı? Teslim geri alınamıyor. */
  onayIster: boolean;
};

/**
 * Bu durumda kuryenin atabileceği adım; yoksa null.
 *
 * `odendi` için null dönüyor — mutfak "hazır" demeden teslim alınamıyor
 * (sunucudaki `kuryeAlabilirMi`). Düğme gösterilip 409 alınsaydı, kurye
 * mutfağın yavaşlığını uygulamanın hatası sanardı.
 */
export function siradakiAdim(durum: SiparisDurumu): SiradakiAdim | null {
  if (durum === "hazir") return { hedef: "yolda", baslik: "Teslim aldım", onayIster: false };
  if (durum === "yolda") {
    return { hedef: "teslim-edildi", baslik: "Teslim ettim", onayIster: true };
  }
  return null;
}

/**
 * Şu an ilgilenilmesi gereken teslimat.
 *
 * Sıra: elindeki (yolda) → alınmayı bekleyen (hazır) → mutfaktaki (ödendi ve
 * kapıda ödemeli). Her grupta EN ESKİSİ seçiliyor; liste sunucudan yeniden
 * eskiye geliyor, bu yüzden sondan alınıyor. En yeniyi seçmek, bekleyen
 * müşteriyi daha da bekletirdi.
 */
export function aktifTeslimat(liste: readonly KuryeTeslimatiDto[]): KuryeTeslimatiDto | null {
  for (const durum of ["yolda", "hazir", "odendi", "odeme-bekliyor"] as const) {
    const grup = liste.filter((t) => t.durum === durum);
    if (grup.length > 0) return grup[grup.length - 1];
  }
  return null;
}

/** Haritaya ve ekrana giden tek satırlık teslim adresi. */
export function teslimAdresi(teslim: KuryeTeslimatiDto["teslim"]): string {
  const kapi = [teslim.binaNo && `No ${teslim.binaNo}`, teslim.daireNo && `D. ${teslim.daireNo}`]
    .filter(Boolean)
    .join(" ");

  return [teslim.mahalle, teslim.acikAdres, kapi, teslim.ilce].filter(Boolean).join(", ");
}

/** Mutfağın adresi; profilde girilmemişse semt bilgisiyle yetiniliyor. */
export function alimAdresi(t: KuryeTeslimatiDto): string {
  return [t.alim.adres, t.alim.semt].filter(Boolean).join(", ") || t.restoranAdi;
}

/**
 * "3,2 km" — mesafe bilinmiyorsa boş dizge.
 *
 * ONDALIK VİRGÜLLE: `toFixed` nokta üretiyor ve "3.2 km" Türkçe bir ekranda
 * yanlış okunuyor — kurye motorda göz ucuyla bakıyor, "32" sanabilir.
 *
 * Teklif katı ve bildirim aynı sayıyı aynı biçimde yazsın diye burada:
 * bildirimde "3,2", ekranda "3.2" görmek, iki farklı iş sanılmasına yol
 * açardı.
 */
export function kmYaz(km: number | null | undefined): string {
  if (km === null || km === undefined || !Number.isFinite(km)) return "";
  return `${km.toFixed(1).replace(".", ",")} km`;
}

/** "12 Ağu, 17:30" — yıl yazılmıyor, liste yakın tarihli. */
export function tarihYaz(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
