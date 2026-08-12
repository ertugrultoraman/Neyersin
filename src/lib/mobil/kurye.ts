import { depoAl } from "../depo";
import type { KayitliSiparis } from "../depo/tipler";
import { hesapDepoAl } from "../hesaplar";
import { restoranCoz } from "../restoran-listesi";
import { kuryeAlabilirMi, type SiparisDurumu } from "../siparis";
import type { KuryeTeslimatiDto } from "./tipler";

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
