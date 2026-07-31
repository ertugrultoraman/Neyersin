import { restoranBul, restoranlar } from "@/content/restoranlar";
import { dosyaHesapDepo } from "./dosya";
import { parolaOzetle, parolaYeterliMi } from "./parola";
import type { Hesap, HesapDepo, SefProfili } from "./tipler";

export type { Hesap, HesapDepo, Rol, SefProfili } from "./tipler";
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

export type KayitSonucu = { basarili: true; hesap: Hesap } | { basarili: false; hata: string };

/**
 * Şef kaydı.
 *
 * Bir şef hesabı her zaman bir ev şefi profiline bağlanır ve bir profil yalnızca
 * bir hesaba ait olabilir — böylece kimse başkasının profilini sahiplenemez.
 * Sahipsiz profil kalmadıysa kayıt reddedilir; yeni profil açmak yönetici işi.
 */
export async function sefKaydet(girdi: {
  ad: string;
  eposta: string;
  parola: string;
  restoranSlug: string;
}): Promise<KayitSonucu> {
  const ad = (girdi.ad ?? "").trim();
  const eposta = (girdi.eposta ?? "").trim().toLowerCase();

  if (ad.length < 3) return { basarili: false, hata: "Ad ve soyadınızı girin." };
  if (!EPOSTA_DESENI.test(eposta)) {
    return { basarili: false, hata: "Geçerli bir e-posta adresi girin." };
  }
  if (!parolaYeterliMi(girdi.parola)) {
    return { basarili: false, hata: "Parola en az 8 karakter olmalı." };
  }

  const restoran = restoranBul(girdi.restoranSlug);
  if (!restoran?.evSefi) {
    return { basarili: false, hata: "Geçerli bir şef profili seçin." };
  }

  const depo = await hesapDepoAl();

  if (await depo.hesapBul(eposta)) {
    return { basarili: false, hata: "Bu e-posta ile zaten bir hesap var. Giriş yapın." };
  }
  if (await depo.restoranSahibi(restoran.slug)) {
    return { basarili: false, hata: `${restoran.ad} profili başka bir hesaba ait.` };
  }

  const hesap: Hesap = {
    eposta,
    ad,
    parolaHash: await parolaOzetle(girdi.parola),
    rol: "sef",
    restoranSlug: restoran.slug,
    olusturmaTarihi: new Date().toISOString(),
  };
  await depo.hesapEkle(hesap);
  return { basarili: true, hesap };
}

/** Kayıt formunda seçilebilecek, henüz sahiplenilmemiş şef profilleri. */
export async function sahipsizSefProfilleri() {
  const depo = await hesapDepoAl();
  const sefler = restoranlar.filter((r) => r.evSefi);
  const sonuc = [];
  for (const r of sefler) {
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
  iletisim?: string;
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
    iletisim: kayitli?.iletisim?.trim() || undefined,
  };
}
