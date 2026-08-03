import crypto from "node:crypto";

import { restoranBul, restoranlar, type Restoran } from "@/content/restoranlar";
import { dosyaHesapDepo } from "./dosya";
import { parolaDogrula, parolaOzetle, parolaYeterliMi } from "./parola";
import type { Basvuru, BasvuruTuru, Hesap, HesapDepo, SefProfili } from "./tipler";

export type {
  AnketOyu,
  KategoriGorseli,
  Basvuru,
  DogrulamaKodu,
  KodAmaci,
  BasvuruDurumu,
  BasvuruTuru,
  Hesap,
  HesapDepo,
  MutfakUrunu,
  Rol,
  SefMutfagi,
  SefProfili,
  Yorum,
  YorumOzeti,
} from "./tipler";
export { parolaDogrula, parolaOzetle, parolaYeterliMi } from "./parola";
export { yorumOzetiHesapla } from "./tipler";

let secilen: HesapDepo | null = null;

/** Sipariş deposuyla aynı mantık: DATABASE_URL varsa Postgres, yoksa dosya. */
export async function hesapDepoAl(): Promise<HesapDepo> {
  if (secilen) return secilen;

  if (process.env.DATABASE_URL) {
    const { postgresHesapDepo } = await import("./postgres");
    secilen = postgresHesapDepo;
  } else {
    secilen = dosyaHesapDepo;
  }

  await secilen.hazirla();
  return secilen;
}

const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFON_DESENI = /^(0?5\d{9})$/;

export const BASVURU_TURLERI: { deger: BasvuruTuru; etiket: string; aciklama: string }[] = [
  {
    deger: "ev-hanimi",
    etiket: "Ev Hanımı",
    aciklama: "Kendi evinde pişirip satmak isteyenler için.",
  },
  {
    deger: "sef",
    etiket: "Şef",
    aciklama: "Profesyonel mutfak deneyimi olan şefler için.",
  },
  {
    deger: "kurye",
    etiket: "Kurye",
    aciklama: "Teslimatları üstlenmek isteyenler için.",
  },
];

export function basvuruTuruEtiketi(tur: BasvuruTuru): string {
  return BASVURU_TURLERI.find((t) => t.deger === tur)?.etiket ?? tur;
}

// ---------------------------------------------------------------------------
// Başvuru akışı
// ---------------------------------------------------------------------------

export type IslemSonucu<T = undefined> =
  | { basarili: true; veri: T }
  | { basarili: false; hata: string };

/**
 * Şef / ev hanımı / kurye başvurusu.
 *
 * Kimse doğrudan hesap açamaz — başvuru yöneticiye düşer, yönetici onaylayıp
 * profil atadıktan sonra kişi kaydını tamamlayabilir. Bu, rastgele kişilerin
 * kendini şef ilan etmesini engelliyor.
 */
export async function basvuruOlustur(girdi: {
  ad: string;
  telefon: string;
  eposta: string;
  parola: string;
  tur: string;
  mesaj?: string;
}): Promise<IslemSonucu<Basvuru>> {
  const ad = (girdi.ad ?? "").trim();
  const eposta = (girdi.eposta ?? "").trim().toLowerCase();
  const telefon = (girdi.telefon ?? "").replace(/[\s()-]/g, "");
  const tur = BASVURU_TURLERI.find((t) => t.deger === girdi.tur)?.deger;

  if (ad.length < 3) return { basarili: false, hata: "Ad ve soyadınızı girin." };
  if (!TELEFON_DESENI.test(telefon)) {
    return { basarili: false, hata: "Telefonu 5XXXXXXXXX biçiminde girin." };
  }
  if (!EPOSTA_DESENI.test(eposta)) {
    return { basarili: false, hata: "Geçerli bir e-posta adresi girin." };
  }
  if (!parolaYeterliMi(girdi.parola)) {
    return { basarili: false, hata: "Parola en az 8 karakter olmalı." };
  }
  if (!tur) return { basarili: false, hata: "Başvuru türünü seçin." };

  /*
   * Tanıtım metni ZORUNLU ve sunucuda da denetleniyor — istemcideki `required`
   * tarayıcı geliştirici araçlarından kaldırılabilir. Boş başvuru yöneticiye
   * karar verecek hiçbir bilgi bırakmıyordu.
   */
  const mesaj = (girdi.mesaj ?? "").trim();
  if (mesaj.length < 30) {
    return {
      basarili: false,
      hata: "Kendinden bahseden bölümü doldur — en az 30 karakter. Başvurun buna göre değerlendirilecek.",
    };
  }

  const depo = await hesapDepoAl();

  if (await depo.hesapBul(eposta)) {
    return { basarili: false, hata: "Bu e-posta ile zaten bir hesap var. Giriş yapın." };
  }

  const onceki = await depo.basvuruBulEposta(eposta);
  if (onceki?.durum === "bekliyor") {
    return {
      basarili: false,
      hata: "Bu e-posta ile bekleyen bir başvurun zaten var. Sonuçlanmasını bekle.",
    };
  }
  if (onceki?.durum === "onaylandi") {
    return { basarili: false, hata: "Başvurun onaylanmış. Doğrudan giriş yapabilirsin." };
  }

  const simdi = new Date().toISOString();
  const basvuru: Basvuru = {
    id: crypto.randomUUID(),
    ad,
    telefon,
    eposta,
    tur,
    mesaj: mesaj.slice(0, 1000),
    // Parola şimdi belirlenir, onaylandığında hesap bu özetle açılır.
    parolaHash: await parolaOzetle(girdi.parola),
    durum: "bekliyor",
    olusturmaTarihi: simdi,
    guncellemeTarihi: simdi,
  };
  await depo.basvuruEkle(basvuru);
  return { basarili: true, veri: basvuru };
}

/**
 * Yönetici onayı — hesap ONAY ANINDA açılır.
 *
 * Yönetici kişinin rolünü seçer: Şef, Ev Hanımı veya Kurye.
 *  - Kurye  → mutfak yok, yalnızca kurye hesabı.
 *  - Diğeri → kişinin ADIYLA yeni bir mutfak sayfası açılır. Kimse hazır bir
 *             başkasının profiline atanmaz; her yeni kişi kendi sayfasıyla gelir.
 *
 * Parola başvuru sırasında belirlendiği için kişi ayrıca kayıt olmaz;
 * onaydan sonra doğrudan giriş yapar.
 */
export async function basvuruOnayla(girdi: {
  id: string;
  rol: BasvuruTuru;
  semt?: string;
  not?: string;
}): Promise<IslemSonucu<{ atananRestoran?: string }>> {
  const depo = await hesapDepoAl();
  const basvuru = await depo.basvuruBul(girdi.id);
  if (!basvuru) return { basarili: false, hata: "Başvuru bulunamadı." };
  if (basvuru.durum === "onaylandi") {
    return { basarili: false, hata: "Bu başvuru zaten onaylanmış." };
  }
  if (await depo.hesapBul(basvuru.eposta)) {
    return { basarili: false, hata: "Bu e-posta ile zaten bir hesap var." };
  }

  const rol = BASVURU_TURLERI.find((t) => t.deger === girdi.rol)?.deger;
  if (!rol) return { basarili: false, hata: "Geçerli bir rol seç." };

  let atananRestoran: string | undefined;

  if (rol !== "kurye") {
    // Kişinin adıyla yeni mutfak; çakışmayan bir slug üretilir.
    const { benzersizSlugUret } = await import("../restoran-listesi");
    atananRestoran = await benzersizSlugUret(basvuru.ad);
    await depo.mutfakEkle({
      slug: atananRestoran,
      ad: basvuru.ad,
      sefTuru: rol,
      semt: girdi.semt?.trim() || "Beylikdüzü",
      sahipEposta: basvuru.eposta,
      olusturmaTarihi: new Date().toISOString(),
    });
  }

  await depo.hesapEkle({
    eposta: basvuru.eposta,
    ad: basvuru.ad,
    parolaHash: basvuru.parolaHash,
    rol: rol === "kurye" ? "kurye" : "sef",
    telefon: basvuru.telefon,
    restoranSlug: atananRestoran,
    // Başvuru zaten yönetici tarafından incelendi; ayrıca kod istenmez.
    epostaDogrulandi: true,
    olusturmaTarihi: new Date().toISOString(),
  });

  await depo.basvuruGuncelle({
    ...basvuru,
    tur: rol,
    durum: "onaylandi",
    atananRestoran,
    yoneticiNotu: girdi.not?.trim() || basvuru.yoneticiNotu,
    guncellemeTarihi: new Date().toISOString(),
  });
  return { basarili: true, veri: { atananRestoran } };
}

export async function basvuruReddet(id: string, not?: string): Promise<IslemSonucu> {
  const depo = await hesapDepoAl();
  const basvuru = await depo.basvuruBul(id);
  if (!basvuru) return { basarili: false, hata: "Başvuru bulunamadı." };

  await depo.basvuruGuncelle({
    ...basvuru,
    durum: "reddedildi",
    guncellemeTarihi: new Date().toISOString(),
    yoneticiNotu: not?.trim() || basvuru.yoneticiNotu,
  });
  return { basarili: true, veri: undefined };
}

// ---------------------------------------------------------------------------
// Kayıt
// ---------------------------------------------------------------------------

/** Müşteri kaydı — herkese açık, onay gerekmez. */
export async function musteriKaydet(girdi: {
  ad: string;
  eposta: string;
  parola: string;
  telefon?: string;
}): Promise<IslemSonucu<Hesap>> {
  const ad = (girdi.ad ?? "").trim();
  const eposta = (girdi.eposta ?? "").trim().toLowerCase();

  if (ad.length < 3) return { basarili: false, hata: "Ad ve soyadınızı girin." };
  if (!EPOSTA_DESENI.test(eposta)) {
    return { basarili: false, hata: "Geçerli bir e-posta adresi girin." };
  }
  if (!parolaYeterliMi(girdi.parola)) {
    return { basarili: false, hata: "Parola en az 8 karakter olmalı." };
  }

  const depo = await hesapDepoAl();
  if (await depo.hesapBul(eposta)) {
    return { basarili: false, hata: "Bu e-posta ile zaten bir hesap var. Giriş yapın." };
  }

  const hesap: Hesap = {
    eposta,
    ad,
    parolaHash: await parolaOzetle(girdi.parola),
    rol: "musteri",
    telefon: (girdi.telefon ?? "").replace(/[\s()-]/g, "") || undefined,
    // Kayıt iki adımlı: hesap açılır, e-posta ikinci adımda kodla doğrulanır.
    epostaDogrulandi: false,
    olusturmaTarihi: new Date().toISOString(),
  };
  await depo.hesapEkle(hesap);
  return { basarili: true, veri: hesap };
}

/**
 * Parolayı değiştirir. Kişi kendi parolasını değiştiriyorsa MEVCUT parolasını
 * bilmek zorunda; parola sıfırlama akışında (`mevcutParola` verilmez) kimlik
 * e-postaya gönderilen kodla zaten kanıtlanmış olur.
 */
export async function parolaDegistir(girdi: {
  eposta: string;
  yeniParola: string;
  yeniParolaTekrar: string;
  mevcutParola?: string;
}): Promise<IslemSonucu> {
  const eposta = (girdi.eposta ?? "").trim().toLowerCase();
  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);
  if (!hesap) return { basarili: false, hata: "Hesap bulunamadı." };

  if (girdi.mevcutParola !== undefined) {
    const dogru = await parolaDogrula(girdi.mevcutParola, hesap.parolaHash);
    if (!dogru) return { basarili: false, hata: "Mevcut parolan yanlış." };
  }

  if (!parolaYeterliMi(girdi.yeniParola)) {
    return { basarili: false, hata: "Yeni parola en az 8 karakter olmalı." };
  }
  if (girdi.yeniParola !== girdi.yeniParolaTekrar) {
    return { basarili: false, hata: "Yeni parolalar birbirini tutmuyor." };
  }
  if (girdi.mevcutParola && girdi.mevcutParola === girdi.yeniParola) {
    return { basarili: false, hata: "Yeni parola eskisiyle aynı olamaz." };
  }

  await depo.hesapEkle({ ...hesap, parolaHash: await parolaOzetle(girdi.yeniParola) });
  return { basarili: true, veri: undefined };
}

/** E-posta doğrulandı olarak işaretler. */
export async function epostayiDogrulandiIsaretle(eposta: string): Promise<void> {
  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);
  if (hesap) await depo.hesapEkle({ ...hesap, epostaDogrulandi: true });
}

/**
 * Google ile gelen kimliği hesaba bağlar.
 *
 * İki durum var:
 *  - Adres zaten kayıtlı → O HESABA GİRİLİR. Rolü korunur; şef Google ile
 *    girince de şef kalır. Google adresi doğruladığı için hesap doğrulanmış
 *    işaretlenir. Mevcut parola SİLİNMEZ — kişi ister parolayla ister Google
 *    ile girer.
 *  - Adres yeni → parolasız bir müşteri hesabı açılır. `parolaHash` boştur;
 *    parola karşılaştırması boş özetle her zaman başarısız olur, yani bu hesaba
 *    parola denemesiyle girilemez. Kişi isterse "parolamı unuttum" akışından
 *    kendine parola belirleyebilir.
 */
export async function googleHesabiCoz(kimlik: {
  eposta: string;
  ad: string;
}): Promise<IslemSonucu<{ hesap: Hesap; yeniMi: boolean }>> {
  const eposta = kimlik.eposta.trim().toLowerCase();
  if (!EPOSTA_DESENI.test(eposta)) {
    return { basarili: false, hata: "Google hesabındaki e-posta geçersiz." };
  }

  const depo = await hesapDepoAl();
  const mevcut = await depo.hesapBul(eposta);

  if (mevcut) {
    if (mevcut.epostaDogrulandi === false) {
      await depo.hesapEkle({ ...mevcut, epostaDogrulandi: true });
      return { basarili: true, veri: { hesap: { ...mevcut, epostaDogrulandi: true }, yeniMi: false } };
    }
    return { basarili: true, veri: { hesap: mevcut, yeniMi: false } };
  }

  const hesap: Hesap = {
    eposta,
    ad: kimlik.ad.trim().slice(0, 80) || eposta.split("@")[0],
    // Parolasız hesap: boş özetle hiçbir parola doğrulanamaz.
    parolaHash: "",
    rol: "musteri",
    epostaDogrulandi: true,
    saglayici: "google",
    olusturmaTarihi: new Date().toISOString(),
  };
  await depo.hesapEkle(hesap);
  return { basarili: true, veri: { hesap, yeniMi: true } };
}

/** Yeni adresin biçimsel ve kullanılabilirlik denetimi — kod göndermeden önce. */
export async function yeniEpostaUygunMu(
  eskiEposta: string,
  yeniEposta: string,
): Promise<IslemSonucu> {
  const yeni = (yeniEposta ?? "").trim().toLowerCase();
  if (!EPOSTA_DESENI.test(yeni)) {
    return { basarili: false, hata: "Geçerli bir e-posta adresi girin." };
  }
  if (yeni === eskiEposta.trim().toLowerCase()) {
    return { basarili: false, hata: "Bu zaten mevcut adresin." };
  }
  const depo = await hesapDepoAl();
  if (await depo.hesapBul(yeni)) {
    return { basarili: false, hata: "Bu e-posta başka bir hesapta kullanılıyor." };
  }
  return { basarili: true, veri: undefined };
}

/**
 * Hesabın e-posta adresini değiştirir.
 *
 * E-posta hesabın kimliği olduğu için kayıt yeni adresle yeniden yazılıp eskisi
 * siliniyor. GEÇMİŞ SİPARİŞLER DE TAŞINIYOR (bkz. depo.musteriEpostasiniTasi):
 * hem kişi geçmişini kaybetmesin hem de "ilk siparişe özel" kuponu adres
 * değiştirerek tekrar tekrar kullanmak mümkün olmasın.
 *
 * @returns Taşınan sipariş sayısı.
 */
export async function epostayiDegistir(
  eskiEposta: string,
  yeniEposta: string,
): Promise<IslemSonucu<{ tasinanSiparis: number }>> {
  const eski = eskiEposta.trim().toLowerCase();
  const yeni = yeniEposta.trim().toLowerCase();

  const uygun = await yeniEpostaUygunMu(eski, yeni);
  if (!uygun.basarili) return uygun;

  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eski);
  if (!hesap) return { basarili: false, hata: "Hesap bulunamadı." };

  // Önce yeni kayıt açılıyor: arada bir hata olursa kişi hesapsız kalmasın.
  await depo.hesapEkle({ ...hesap, eposta: yeni, epostaDogrulandi: true });

  let tasinanSiparis = 0;
  try {
    const { depoAl } = await import("../depo");
    tasinanSiparis = await (await depoAl()).musteriEpostasiniTasi(eski, yeni);
  } catch {
    // Sipariş deposu susarsa hesap değişikliği yine de geçerli; geçmiş
    // taşınamadıysa yönetici elle düzeltebilir.
  }

  await depo.hesapSil(eski);
  return { basarili: true, veri: { tasinanSiparis } };
}


// ---------------------------------------------------------------------------
// Profiller
// ---------------------------------------------------------------------------

/** Bireysel profiller (şef + ev hanımı), istenirse türe göre süzülür. */
export function sefProfilleri(tur?: "sef" | "ev-hanimi"): Restoran[] {
  return restoranlar.filter((r) => r.evSefi && (!tur || r.sefTuru === tur));
}

/** Henüz bir hesaba bağlanmamış profiller — yönetici atama yaparken görür. */
export async function sahipsizSefProfilleri(): Promise<Restoran[]> {
  const depo = await hesapDepoAl();
  const sonuc: Restoran[] = [];
  for (const r of sefProfilleri()) {
    if (!(await depo.restoranSahibi(r.slug))) sonuc.push(r);
  }
  return sonuc;
}

/**
 * Statik içerikteki şef bilgisini, şefin kendi girdiği profille birleştirir.
 * Şef bir alanı boş bıraktıysa sitedeki varsayılan metin korunur.
 */
export async function sefProfiliCoz(restoranSlug: string): Promise<{
  biyografi?: string;
  sertifikalar?: string;
  uzmanlik?: string;
  slogan?: string;
}> {
  const restoran = restoranBul(restoranSlug);
  let kayitli: SefProfili | null = null;
  try {
    kayitli = await (await hesapDepoAl()).profilAl(restoranSlug);
  } catch {
    // depo erişilemiyorsa statik içerikle devam — sayfa yine de açılsın
  }

  return {
    biyografi: kayitli?.biyografi?.trim() || restoran?.sefBiyografisi,
    sertifikalar: kayitli?.sertifikalar?.trim() || undefined,
    uzmanlik: kayitli?.uzmanlik?.trim() || undefined,
    slogan: kayitli?.slogan?.trim() || undefined,
  };
}
