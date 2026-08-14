import { depoAl } from "../depo";
import type { KayitliSiparis } from "../depo/tipler";
import { hesapDepoAl } from "../hesaplar";
import { durumOku, kabulOrani } from "../kurye-dagitim";
import { kuryeHakedisi } from "../kurye-tarife";
import { restoranCoz } from "../restoran-listesi";
import { kuryeAlabilirMi, type SiparisDurumu } from "../siparis";
import type { KuryeDonemDto, KuryeOzetiDto, KuryeTeslimatiDto } from "./tipler";

/**
 * KURYE TESLİMATLARI.
 *
 * Adım kuralları web'deki `panel/teslimat-actions.ts` ile birebir aynı ve
 * bilerek burada TEKRAR YAZILMADI — o dosya `oturumAl()` ile çereze bağlı ve
 * `revalidatePath` çağırıyor, ikisi de mobil uçta anlamsız. Ortak olan kısım
 * `kuryeAlabilirMi` ve durum sıralaması; ikisi de `lib/siparis`ten geliyor.
 * Yani kural tek yerde, yalnızca kabuk iki tane.
 */

const epostaEsit = (a: string | undefined, b: string) =>
  (a ?? "").trim().toLocaleLowerCase("tr") === b.trim().toLocaleLowerCase("tr");

async function dtoyaCevir(s: KayitliSiparis): Promise<KuryeTeslimatiDto> {
  /*
   * Alım adresi şef profilinden okunuyor ve DEPO ERİŞİLEMEZSE boş kalıyor:
   * teslimat listesi bir profil sorgusu yüzünden hiç açılmamalı, kurye
   * mutfağı telefonla da bulabilir.
   */
  let alimAdresi: string | undefined;
  let alimTelefonu: string | undefined;
  try {
    const profil = await (await hesapDepoAl()).profilAl(s.restoranSlug);
    alimAdresi = profil?.alimAdresi?.trim() || undefined;
    alimTelefonu = profil?.alimTelefonu?.trim() || undefined;
  } catch {
    /* sessiz */
  }

  const restoran = await restoranCoz(s.restoranSlug);

  return {
    siparisNo: s.siparisNo,
    durum: s.durum,
    restoranAdi: s.restoranAdi,
    restoranSlug: s.restoranSlug,
    alim: {
      ...(alimAdresi ? { adres: alimAdresi } : {}),
      ...(alimTelefonu ? { telefon: alimTelefonu } : {}),
      semt: restoran?.semt ?? "",
    },
    teslim: {
      adSoyad: s.musteri.adSoyad,
      telefon: s.musteri.telefon,
      ...s.adres,
    },
    kalemSayisi: s.kalemler.reduce((t, k) => t + k.adet, 0),
    /*
     * Kartla ödenmiş siparişte tahsilat 0. Toplam tutarı göstermek, kuryenin
     * kapıda yanlışlıkla para istemesine yol açardı.
     */
    tahsilat: s.odemeYontemi === "iyzico" ? 0 : s.tutarlar.toplam,
    not: s.not,
    olusturmaTarihi: s.olusturmaTarihi,
    guncellemeTarihi: s.guncellemeTarihi,
  };
}

/**
 * Kuryenin kendi teslimatları.
 *
 * TAMAMLANMIŞLAR DA GELİYOR (limit dahilinde): kurye "bugün kaç teslimat
 * yaptım" sorusunu buradan cevaplıyor. Yalnızca aktif olanlar dönseydi
 * teslim edilen sipariş ekrandan bir anda kaybolur, kurye işlemin geçip
 * geçmediğinden emin olamazdı.
 */
export async function kuryeTeslimatlari(
  eposta: string,
  limit = 100,
): Promise<KuryeTeslimatiDto[]> {
  const depo = await depoAl();
  const kayitlar = await depo.listele({ atananKurye: eposta, limit });
  return Promise.all(kayitlar.map(dtoyaCevir));
}

/* --------------------------------------------------------------------------
 * Özet — teslimat sayısı, hakediş, tahsilat, kabul oranı
 * ----------------------------------------------------------------------- */

/**
 * TÜRKİYE SAATİ SABİT UTC+3.
 *
 * Sunucu UTC'de çalışıyor (Vercel). "Bugün" UTC'ye göre hesaplansaydı gün
 * Türkiye saatiyle 03:00'te dönerdi: gece 01:00'de teslimat yapan kurye,
 * kazancını hâlâ dünün hanesinde görürdü. Türkiye 2016'dan beri yaz saati
 * uygulamıyor, bu yüzden sabit kaydırma doğru — DST olsaydı Intl gerekirdi.
 */
const TR_KAYMA_MS = 3 * 60 * 60 * 1000;

/** Verilen anın Türkiye saatiyle gün başlangıcı (UTC damgası olarak). */
function gunBasi(simdi: number): number {
  const yerel = simdi + TR_KAYMA_MS;
  return yerel - (yerel % 86_400_000) - TR_KAYMA_MS;
}

/** Haftanın başı — pazartesi, Türkiye takvimi. */
function haftaBasi(simdi: number): number {
  const gun = gunBasi(simdi);
  /* 1 Ocak 1970 perşembeydi; pazartesiye kaydırmak için 4 gün ekleniyor. */
  const haftaninGunu = Math.floor((gun + TR_KAYMA_MS + 4 * 86_400_000) / 86_400_000) % 7;
  return gun - haftaninGunu * 86_400_000;
}

function donemTopla(teslimler: KayitliSiparis[], baslangic: number): KuryeDonemDto {
  const secilenler = teslimler.filter(
    (s) => new Date(s.guncellemeTarihi).getTime() >= baslangic,
  );

  return {
    teslimat: secilenler.length,
    kazanc: secilenler.reduce((t, s) => t + kuryeHakedisi(s.tutarlar), 0),
    tahsilat: secilenler.reduce(
      (t, s) => t + (s.odemeYontemi === "iyzico" ? 0 : s.tutarlar.toplam),
      0,
    ),
  };
}

/**
 * Kurye özeti.
 *
 * HAKEDİŞ SİPARİŞİN KENDİ TUTARINDAN hesaplanıyor (bkz. lib/kurye-tarife.ts):
 * kademeye göre siparişin %25, %18 ya da %15'i, kupon varsa üçte bir kesinti.
 * Teslimatın saati artık tutarı etkilemiyor — gece/kapıda ödeme ekleri
 * kaldırıldı, yerini yüzde payı aldı.
 *
 * Teslimat kaydının kendisine ücret YAZILMIYOR: oranlar tek yerde duruyor ve
 * iki kaynak zamanla ayrışırdı. Bunun sonucu şu — oranlar değişirse geçmiş
 * teslimatların hesabı da yeni oranla görünür. Oran değişikliği yapılırken bu
 * hesaba katılmalı; kalıcı hakediş kaydı gerektiğinde sipariş kaydına
 * yazılacak alan buraya eklenecek.
 */
export async function kuryeOzeti(eposta: string): Promise<KuryeOzetiDto> {
  const depo = await depoAl();
  const kayitlar = await depo.listele({ atananKurye: eposta, limit: 500 });
  const teslimler = kayitlar.filter((s) => s.durum === "teslim-edildi");
  const simdi = Date.now();

  /*
   * Dağıtım deposu susarsa özet yine açılsın: kabul oranı ve çevrimiçi
   * bilgisi eksik görünür ama teslimat ve kazanç sipariş deposundan geliyor.
   */
  const [oran, durum] = await Promise.all([
    kabulOrani(eposta).catch(() => ({ yuzde: null, kabul: 0, toplam: 0 })),
    durumOku(eposta).catch(() => null),
  ]);

  return {
    bugun: donemTopla(teslimler, gunBasi(simdi)),
    hafta: donemTopla(teslimler, haftaBasi(simdi)),
    /*
     * TOPLAM: başlangıcı 0, yani bütün kayıtlar. Yukarıdaki `limit: 500`
     * yüzünden gerçek bir üst sınırı var; 500 teslimatı geçen kuryede rakam
     * eskimeye başlar. O noktada sayım veritabanında toplanacak (SUM),
     * uygulamaya taşınmayacak.
     */
    toplam: donemTopla(teslimler, 0),
    acikTeslimat: kayitlar.filter((s) => s.durum !== "teslim-edildi" && s.durum !== "iptal").length,
    kabulOrani: oran,
    cevrimici: durum?.cevrimici ?? false,
  };
}

export type AdimSonucu = { tamam: true; durum: SiparisDurumu } | { tamam: false; sebep: string };

/**
 * Teslimat adımı: "teslim aldım" (→ yolda) ve "teslim ettim" (→ teslim-edildi).
 *
 * Sıra denetimi SUNUCUDA: mutfak "hazır" demeden kurye siparişi yola çıkaramaz,
 * yola çıkmadan teslim edemez. Uygulamada düğmeyi gizlemek yeterli değil —
 * kurye ağ kesikken iki kez dokunmuş, uygulama yeniden bağlanınca iki isteği
 * de göndermiş olabilir.
 */
export async function kuryeAdimi(
  siparisNo: string,
  eposta: string,
  hedef: "yolda" | "teslim-edildi",
): Promise<AdimSonucu> {
  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);

  /*
   * "Bulunamadı" ile "sana atanmamış" AYNI cevabı veriyor: aksi hâlde kurye,
   * sipariş numarası deneyerek başkasının teslimatının var olup olmadığını
   * öğrenebilirdi.
   */
  if (!siparis || !epostaEsit(siparis.atananKurye, eposta)) {
    return { tamam: false, sebep: "Bu teslimat sana atanmamış." };
  }

  if (hedef === "yolda" && !kuryeAlabilirMi(siparis.durum)) {
    return { tamam: false, sebep: "Mutfak bu siparişi henüz hazır olarak işaretlemedi." };
  }
  if (hedef === "teslim-edildi" && siparis.durum !== "yolda") {
    return { tamam: false, sebep: "Önce siparişi teslim almalısın." };
  }

  await depo.durumGuncelle(siparisNo, hedef);
  return { tamam: true, durum: hedef };
}
