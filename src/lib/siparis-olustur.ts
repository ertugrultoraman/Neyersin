import type { OdemeYontemi } from "@/content/odeme";
import { acikMi } from "./calisma-saatleri";
import { saatleriAl } from "./calisma-saatleri-depo";
import { checkoutFormBaslat, iyzicoYapilandirildiMi } from "./iyzico";
import { kuponKisiDenetimi } from "./kupon-denetimi";
import { urunCoz } from "./mutfak-menusu";
import { restoranCoz } from "./restoran-listesi";
import {
  siparisDogrula,
  siparisNoUret,
  telefonNormalize,
  tutarlariHesapla,
  type DogrulamaHatalari,
  type Siparis,
  type SiparisGirdisi,
  type SiparisKalemi,
  type Tutarlar,
} from "./siparis";
import { siparisiKaydet } from "./siparis-deposu";
import { siparisOzetiGonder } from "./siparis-postasi";
import type { Ceviri } from "./sozluk";

/**
 * SİPARİŞ OLUŞTURMANIN TEK KAYNAĞI.
 *
 * Bu mantık bir zamanlar yalnızca `app/odeme/actions.ts` içindeydi ve web
 * formuna bağlıydı: oturumu çerezden, dili çerezden, IP'yi `next/headers`ten
 * okuyordu. Mobil uygulama aynı işi Bearer jetonuyla yapıyor ve o üçüne de
 * ulaşamıyor.
 *
 * KOPYALANMADI, DIŞARI ALINDI. Buradaki kuralların her biri para ya da
 * güvenlikle ilgili — kapalı mutfağa sipariş düşmemesi, fiyatın sunucudan
 * okunması, e-postanın oturumdan gelmesi, kuponun kişi başı denetimi. İki
 * kopya olsaydı biri düzeltilip diğeri unutulduğunda açık, yalnızca bir
 * platformda kalırdı.
 *
 * Bağlam (oturum e-postası, dil, IP) artık PARAMETRE: çağıran taraf kendi
 * yönteminden okuyup geçiyor.
 */

/** İstemciden gelen sepet: yalnızca kimlik ve adet. Fiyat gönderilmez. */
export type SepetSatiri = { urunId: string; adet: number; ekstraIdleri?: string[] };

export type SiparisSonucu =
  | {
      basarili: true;
      /** Havale/kapıda akışı: sipariş numarası ve talimat arayüzde gösterilir. */
      yontem: "havale";
      siparisNo: string;
      tutarlar: Tutarlar;
      restoranAdi: string;
      kalemler: SiparisKalemi[];
    }
  | {
      basarili: true;
      /** Kart akışı: kullanıcı iyzico ödeme sayfasına yönlendirilir. */
      yontem: "iyzico";
      siparisNo: string;
      paymentPageUrl?: string;
      checkoutFormContent?: string;
    }
  | { basarili: false; hatalar: DogrulamaHatalari };

export type SiparisIstegi = {
  restoranSlug: string;
  sepet: SepetSatiri[];
  form: Omit<SiparisGirdisi, "restoranSlug" | "kalemler">;
  odemeYontemi: OdemeYontemi;
  /**
   * Oturumdan gelen e-posta. Formdakine güvenilmiyor: başka bir adres yazarak
   * kişi başı kupon sınırı aşılabilir ve sipariş başkasının hesabına
   * düşürülebilirdi.
   */
  oturumEpostasi: string;
  /** iyzico risk analizi için gerçek istemci IP'si. */
  ip: string;
  /** Hata metinleri kullanıcının dilinde dönsün diye. */
  c: Ceviri;
};

export async function siparisOlustur(istek: SiparisIstegi): Promise<SiparisSonucu> {
  const { restoranSlug, sepet, form, odemeYontemi, oturumEpostasi, ip, c } = istek;

  /**
   * Mutfak `restoranCoz` ile çözülüyor: sabit içerikteki restoranların yanı sıra
   * yönetici onayıyla açılan şef / ev hanımı mutfakları da sipariş alabilsin.
   */
  const restoran = await restoranCoz(restoranSlug);
  if (!restoran) {
    return { basarili: false, hatalar: { restoran: c("hata.restoranYok") } };
  }

  /*
   * MUTFAK KAPALIYSA SİPARİŞ ALINMIYOR — denetim SUNUCUDA.
   *
   * Ekranlardaki "kapalı" rozeti yalnızca kolaylık; sepetini kapanma saatinden
   * önce doldurup ödemeye geç basan biri ya da doğrudan bu ucu çağıran biri
   * kapalı mutfağa sipariş düşürebilirdi. Kimse mutfakta yokken gelen sipariş,
   * kuryeyi kapalı kapıya gönderiyor.
   */
  const acik = acikMi(await saatleriAl(restoranSlug));
  if (!acik.acik) {
    return {
      basarili: false,
      hatalar: { restoran: c("saat.mutfakKapali", { ad: restoran.ad }) },
    };
  }

  if (odemeYontemi === "iyzico" && !iyzicoYapilandirildiMi()) {
    return { basarili: false, hatalar: { odeme: c("hata.kartKapali") } };
  }

  /**
   * Fiyatlar SUNUCUDA menüden yeniden okunur. İstemcinin gönderdiği tutara
   * güvenilmez — aksi hâlde sepet fiyatı istemciden değiştirilebilirdi.
   */
  const kalemler: SiparisKalemi[] = [];
  for (const satir of sepet) {
    const adet = Math.floor(Number(satir.adet));
    if (!Number.isFinite(adet) || adet < 1 || adet > 99) continue;
    const urun = await urunCoz(restoranSlug, satir.urunId);
    if (!urun || urun.taslak) continue;

    // Ekstralar da SUNUCUDAKİ ürün tanımından okunur; istemci yalnızca hangi
    // ekstranın seçildiğini söylüyor, adı ve fiyatı buradan geliyor.
    const ekstralar = (satir.ekstraIdleri ?? [])
      .map((id) => urun.ekstralar?.find((e) => e.id === id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .map((e) => ({ id: e.id, ad: e.ad, fiyat: e.fiyat }));

    kalemler.push({
      satirId: `${urun.id}::${[...ekstralar].map((e) => e.id).sort().join(",")}`,
      urunId: urun.id,
      ad: urun.ad,
      fiyat: urun.fiyat,
      adet,
      ekstralar: ekstralar.length > 0 ? ekstralar : undefined,
    });
  }

  if (kalemler.length === 0) {
    return { basarili: false, hatalar: { kalemler: c("hata.gecerliUrunYok") } };
  }

  const girdi: SiparisGirdisi = {
    restoranSlug,
    kalemler,
    musteri: {
      adSoyad: (form.musteri.adSoyad ?? "").trim(),
      telefon: telefonNormalize(form.musteri.telefon ?? ""),
      eposta: oturumEpostasi,
    },
    adres: {
      ilce: (form.adres.ilce ?? "").trim(),
      mahalle: (form.adres.mahalle ?? "").trim(),
      acikAdres: (form.adres.acikAdres ?? "").trim(),
      binaNo: (form.adres.binaNo ?? "").trim(),
      daireNo: (form.adres.daireNo ?? "").trim(),
      tarif: (form.adres.tarif ?? "").trim(),
    },
    not: (form.not ?? "").trim(),
    kuponKodu: (form.kuponKodu ?? "").trim() || undefined,
  };

  const hatalar = siparisDogrula(girdi, restoran, c);
  if (Object.keys(hatalar).length > 0) {
    return { basarili: false, hatalar };
  }

  /**
   * Kişiye bağlı kupon kuralları (ilk sipariş / kişi başı tek kullanım) geçmiş
   * siparişlere bakmayı gerektirdiği için senkron doğrulamanın dışında,
   * sipariş kaydedilmeden hemen önce denetlenir.
   */
  const kuponDenetimi = await kuponKisiDenetimi(girdi.kuponKodu, girdi.musteri.eposta);
  if (!kuponDenetimi.uygun) {
    return { basarili: false, hatalar: { kupon: kuponDenetimi.hata } };
  }

  const tutarlar = tutarlariHesapla(kalemler, restoranSlug, girdi.kuponKodu, restoran);
  const siparisNo = siparisNoUret();
  const siparis: Siparis = {
    ...girdi,
    siparisNo,
    olusturmaTarihi: new Date().toISOString(),
    odemeYontemi,
    durum: "odeme-bekliyor",
    tutarlar,
    restoranAdi: restoran.ad,
  };

  await siparisiKaydet(siparis);

  // --- Kart ödemesi: iyzico Checkout Form -----------------------------------
  if (odemeYontemi === "iyzico") {
    const odemeFormu = await checkoutFormBaslat({
      siparisNo,
      kalemler,
      tutarlar,
      restoranAdi: restoran.ad,
      musteri: girdi.musteri,
      adres: girdi.adres,
      ip,
    });

    if (!odemeFormu.basarili) {
      return { basarili: false, hatalar: { odeme: odemeFormu.hata } };
    }

    return {
      basarili: true,
      yontem: "iyzico",
      siparisNo,
      paymentPageUrl: odemeFormu.paymentPageUrl,
      checkoutFormContent: odemeFormu.checkoutFormContent,
    };
  }

  // --- Kapıda ödeme (nakit / IBAN) ------------------------------------------

  /*
   * Özet postası BURADA gönderiliyor, kart ödemesinde ise ödeme onaylandıktan
   * sonra (bkz. iyzico callback). Kapıda ödemede sipariş bu an kesinleşiyor.
   *
   * Beklenmiyor (`await` yok): posta sunucusu yavaşsa müşteri sipariş sonuç
   * sayfasını görmek için SMTP'yi beklerdi. Gönderim kendi hatasını yutuyor.
   */
  void siparisOzetiGonder(siparis);

  return {
    basarili: true,
    yontem: "havale",
    siparisNo,
    tutarlar,
    restoranAdi: restoran.ad,
    kalemler,
  };
}
