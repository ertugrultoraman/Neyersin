import crypto from "node:crypto";

import { restoranBul, restoranlar, type Restoran } from "@/content/restoranlar";
import { dosyaHesapDepo } from "./dosya";
import { parolaOzetle, parolaYeterliMi } from "./parola";
import type { Basvuru, BasvuruTuru, Hesap, HesapDepo, SefProfili } from "./tipler";

export type {
  Basvuru,
  BasvuruDurumu,
  BasvuruTuru,
  Hesap,
  HesapDepo,
  Rol,
  SefProfili,
} from "./tipler";
export { parolaDogrula, parolaOzetle, parolaYeterliMi } from "./parola";

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
  if (!tur) return { basarili: false, hata: "Başvuru türünü seçin." };

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
    return {
      basarili: false,
      hata: "Başvurun onaylanmış. Kayıt sayfasından hesabını oluşturabilirsin.",
    };
  }

  const simdi = new Date().toISOString();
  const basvuru: Basvuru = {
    id: crypto.randomUUID(),
    ad,
    telefon,
    eposta,
    tur,
    mesaj: (girdi.mesaj ?? "").trim().slice(0, 1000) || undefined,
    durum: "bekliyor",
    olusturmaTarihi: simdi,
    guncellemeTarihi: simdi,
  };
  await depo.basvuruEkle(basvuru);
  return { basarili: true, veri: basvuru };
}

/**
 * Yönetici onayı. Şef/ev hanımı başvurusunda bir profil atanması zorunlu;
 * kurye başvurusunda profil yok.
 */
export async function basvuruOnayla(
  id: string,
  atananRestoran: string | undefined,
  not?: string,
): Promise<IslemSonucu> {
  const depo = await hesapDepoAl();
  const basvuru = await depo.basvuruBul(id);
  if (!basvuru) return { basarili: false, hata: "Başvuru bulunamadı." };

  if (basvuru.tur !== "kurye") {
    const restoran = atananRestoran ? restoranBul(atananRestoran) : undefined;
    if (!restoran?.evSefi) {
      return { basarili: false, hata: "Onaylamak için bir profil seçmelisin." };
    }
    const sahip = await depo.restoranSahibi(restoran.slug);
    if (sahip) {
      return { basarili: false, hata: `${restoran.ad} profili zaten ${sahip.ad} adına kayıtlı.` };
    }
  }

  await depo.basvuruGuncelle({
    ...basvuru,
    durum: "onaylandi",
    atananRestoran: basvuru.tur === "kurye" ? undefined : atananRestoran,
    yoneticiNotu: not?.trim() || basvuru.yoneticiNotu,
    guncellemeTarihi: new Date().toISOString(),
  });
  return { basarili: true, veri: undefined };
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
    olusturmaTarihi: new Date().toISOString(),
  };
  await depo.hesapEkle(hesap);
  return { basarili: true, veri: hesap };
}

/**
 * Onaylanmış başvuru sahibinin kaydını tamamlaması.
 * Parolayı kişi kendisi belirler — yönetici kimsenin parolasını bilmez.
 */
export async function onayliKaydiTamamla(girdi: {
  eposta: string;
  parola: string;
}): Promise<IslemSonucu<Hesap>> {
  const eposta = (girdi.eposta ?? "").trim().toLowerCase();
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

  const basvuru = await depo.basvuruBulEposta(eposta);
  if (!basvuru || basvuru.durum !== "onaylandi") {
    return {
      basarili: false,
      hata: "Bu e-posta için onaylanmış bir başvuru yok. Önce başvuru formunu doldur.",
    };
  }

  // Onaydan sonra profil başkasına verilmiş olabilir — son kez doğrula.
  if (basvuru.tur !== "kurye") {
    if (!basvuru.atananRestoran) {
      return { basarili: false, hata: "Başvurunda atanmış bir profil yok. Bizimle iletişime geç." };
    }
    const sahip = await depo.restoranSahibi(basvuru.atananRestoran);
    if (sahip) {
      return { basarili: false, hata: "Atanan profil artık müsait değil. Bizimle iletişime geç." };
    }
  }

  const hesap: Hesap = {
    eposta,
    ad: basvuru.ad,
    parolaHash: await parolaOzetle(girdi.parola),
    rol: basvuru.tur === "kurye" ? "kurye" : "sef",
    telefon: basvuru.telefon,
    restoranSlug: basvuru.tur === "kurye" ? undefined : basvuru.atananRestoran,
    olusturmaTarihi: new Date().toISOString(),
  };
  await depo.hesapEkle(hesap);
  return { basarili: true, veri: hesap };
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
