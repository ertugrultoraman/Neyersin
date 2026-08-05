"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { belgeleriKaydet, formdanBelgeler } from "@/lib/belge-sunucu";

import { hataMetni } from "@/lib/hata-metni";
import { kodGonder, koduDogrula, postaHazirMi } from "@/lib/dogrulama";
import { ihlalUyarisi, parolaIhlalKontrolu } from "@/lib/parola-ihlali";
import {
  basvuruOlustur,
  epostayiDegistir,
  epostayiDogrulandiIsaretle,
  hesapDepoAl,
  musteriKaydet,
  parolaDegistir,
  parolaDogrula,
  yeniEpostaUygunMu,
  type KodAmaci,
  type SefProfili,
} from "@/lib/hesaplar";
import { cikisYap, girisYap, oturumAc, oturumAl, rolAnaSayfasi } from "@/lib/oturum";

export type FormDurumu = { hata?: string; basari?: string };

/**
 * Kayıt ve parola sıfırlama iki adımlı ilerlediği için form durumu hangi
 * adımda olduğumuzu da taşır. `eposta` adımlar arasında gizli alanla değil
 * durumdan taşınır; kullanıcı adresini ikinci kez yazmak zorunda kalmasın.
 */
export type KodDurumu = FormDurumu & {
  adim?: "kod";
  eposta?: string;
  /** Posta gönderimi yapılandırılmadıysa arayüz bunu açıkça söyler. */
  postaGitmedi?: boolean;
  /**
   * Parola bilinen bir ihlalde geçmiş — kayıt DURDURULMADI, kullanıcıya
   * soruluyor. "Yine de devam" derse form `parolayiKabulEt` alanıyla geliyor.
   */
  parolaUyarisi?: string;
};

/** Yönlendirme hedefini yalnızca site içi yollara sınırlar (açık yönlendirme koruması). */
function guvenliDonus(ham: string | null | undefined): string | null {
  if (!ham) return null;
  return ham.startsWith("/") && !ham.startsWith("//") ? ham : null;
}

export async function girisAction(
  _oncekiDurum: FormDurumu,
  formVerisi: FormData,
): Promise<FormDurumu> {
  const sonuc = await girisYap(
    String(formVerisi.get("kimlik") ?? ""),
    String(formVerisi.get("parola") ?? ""),
  );
  if (!sonuc.basarili) return { hata: sonuc.hata };

  const donus = guvenliDonus(String(formVerisi.get("donus") ?? ""));
  redirect(donus ?? rolAnaSayfasi(sonuc.rol));
}

/**
 * Müşteri kaydı — 1. ADIM.
 *
 * Hesap açılır ama e-posta doğrulanmamış olarak işaretlenir ve adrese 6 haneli
 * kod gönderilir. Oturum HENÜZ açılmaz; kişi ikinci adımda kodu yazınca açılır.
 */
export async function musteriKayitAction(
  _oncekiDurum: KodDurumu,
  formVerisi: FormData,
): Promise<KodDurumu> {
  const parola = String(formVerisi.get("parola") ?? "");

  /*
   * SIZMIŞ PAROLA UYARISI — hesap açılmadan ÖNCE.
   *
   * Kişi sızmış bir parola seçerse tarayıcısı zaten uyarıyor, ama iş işten
   * geçtikten sonra: hesap açılmış oluyor. Burada önce biz söylüyoruz.
   *
   * UYARI, ENGEL DEĞİL: kullanıcı "yine de devam" derse kayıt oluyor. Sıkı
   * engelleme insanları kayıttan vazgeçiriyor ve liste dış bir servisin
   * verisi — yanlış eşleşme olabilir. Parola dışarı ÇIKMIYOR (bkz.
   * lib/parola-ihlali.ts).
   */
  if (formVerisi.get("parolayiKabulEt") === null) {
    const ihlal = await parolaIhlalKontrolu(parola);
    const uyari = ihlalUyarisi(ihlal);
    if (uyari) return { parolaUyarisi: uyari };
  }

  const sonuc = await musteriKaydet({
    ad: String(formVerisi.get("ad") ?? ""),
    eposta: String(formVerisi.get("eposta") ?? ""),
    parola,
    telefon: String(formVerisi.get("telefon") ?? ""),
  });
  if (!sonuc.basarili) return { hata: sonuc.hata };

  const gonderim = await kodGonder(sonuc.veri.eposta, "kayit");

  return {
    adim: "kod",
    eposta: sonuc.veri.eposta,
    postaGitmedi: !postaHazirMi() || (gonderim.basarili && !gonderim.postaGitti),
    basari: `Doğrulama kodunu ${sonuc.veri.eposta} adresine gönderdik. Kodu aşağıya yaz.`,
  };
}

/** Müşteri kaydı — 2. ADIM: e-postaya gelen kodun doğrulanması. */
export async function kayitDogrulaAction(
  oncekiDurum: KodDurumu,
  formVerisi: FormData,
): Promise<KodDurumu> {
  const eposta = String(formVerisi.get("eposta") ?? oncekiDurum.eposta ?? "");
  const kod = String(formVerisi.get("kod") ?? "");

  const sonuc = await koduDogrula(eposta, "kayit", kod);
  if (!sonuc.gecerli) {
    return { ...oncekiDurum, basari: undefined, hata: sonuc.hata };
  }

  await epostayiDogrulandiIsaretle(eposta);

  const hesap = await (await hesapDepoAl()).hesapBul(eposta);
  if (!hesap) return { ...oncekiDurum, hata: await hataMetni("hata.hesapYok") };

  await oturumAc({ eposta: hesap.eposta, ad: hesap.ad, rol: hesap.rol });
  revalidatePath("/admin/dogrulamalar");

  const donus = guvenliDonus(String(formVerisi.get("donus") ?? ""));
  redirect(donus ?? "/hesabim");
}

/** Kod gelmediyse yeniden gönderir (dakikada bir kez). */
export async function koduTekrarGonderAction(
  oncekiDurum: KodDurumu,
  formVerisi: FormData,
): Promise<KodDurumu> {
  const eposta = String(formVerisi.get("eposta") ?? oncekiDurum.eposta ?? "");
  const istenen = String(formVerisi.get("amac") ?? "kayit");
  const amac: KodAmaci =
    istenen === "sifre" ? "sifre" : istenen === "eposta" ? "eposta" : "kayit";

  const gonderim = await kodGonder(eposta, amac);
  if (!gonderim.basarili) return { ...oncekiDurum, basari: undefined, hata: gonderim.hata };

  revalidatePath("/admin/dogrulamalar");
  return {
    ...oncekiDurum,
    hata: undefined,
    postaGitmedi: !postaHazirMi() || !gonderim.postaGitti,
    basari: "Yeni kod gönderildi.",
  };
}

/** Şef / ev hanımı / kurye başvurusu — yöneticiye düşer, hesap açılmaz. */
export async function basvuruAction(
  _oncekiDurum: FormDurumu,
  formVerisi: FormData,
): Promise<FormDurumu> {
  const sonuc = await basvuruOlustur({
    ad: String(formVerisi.get("ad") ?? ""),
    telefon: String(formVerisi.get("telefon") ?? ""),
    eposta: String(formVerisi.get("eposta") ?? ""),
    parola: String(formVerisi.get("parola") ?? ""),
    tur: String(formVerisi.get("tur") ?? ""),
    mesaj: String(formVerisi.get("mesaj") ?? ""),
  });
  if (!sonuc.basarili) return { hata: sonuc.hata };

  /*
   * Belgeler başvuru KAYDEDİLDİKTEN sonra ekleniyor: kimliği ancak o zaman
   * biliniyor. Belge hatası başvuruyu düşürmüyor — kişi formu baştan
   * doldurmak zorunda kalmasın; yönetici eksik evrakı görüp isteyebilir.
   */
  const belgeHatasi = await belgeleriKaydet(
    formdanBelgeler(formVerisi),
    "basvuru",
    sonuc.veri.id,
  );

  revalidatePath("/admin/basvurular");
  return {
    basari: belgeHatasi
      ? `Başvurun alındı ama belgeler eklenemedi: ${belgeHatasi} Yönetici seninle iletişime geçecek.`
      : "Başvurun alındı. Yönetici onayladığı anda hesabın açılır ve belirlediğin parolayla giriş yapabilirsin.",
  };
}

/**
 * Kayıt sırasında doğrulamayı atlamış bir kullanıcı, profilinden tamamlar.
 * E-posta OTURUMDAN alınır; form alanı değiştirilerek başkasının adresi
 * doğrulanmış gösterilemez.
 */
export async function oturumEpostaDogrulaAction(
  _oncekiDurum: KodDurumu,
  formVerisi: FormData,
): Promise<KodDurumu> {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris");

  const sonuc = await koduDogrula(oturum.eposta, "kayit", String(formVerisi.get("kod") ?? ""));
  if (!sonuc.gecerli) return { hata: sonuc.hata, eposta: oturum.eposta };

  await epostayiDogrulandiIsaretle(oturum.eposta);
  revalidatePath("/hesabim");
  revalidatePath("/panel");
  revalidatePath("/admin/dogrulamalar");
  return { basari: "E-posta adresin doğrulandı.", eposta: oturum.eposta };
}

// ---------------------------------------------------------------------------
// E-posta adresini değiştirme
// ---------------------------------------------------------------------------

/**
 * E-posta değişimi — 1. ADIM.
 *
 * Mevcut parola SORULUYOR: oturumu açık unutulmuş bir cihaza oturan biri
 * adresi kendine çevirip hesabı ele geçiremesin. Kod YENİ adrese gidiyor;
 * kişinin o adrese gerçekten eriştiğini kanıtlaması gerekiyor.
 */
export async function epostaDegistirIsteAction(
  _oncekiDurum: KodDurumu,
  formVerisi: FormData,
): Promise<KodDurumu> {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris");
  if (oturum.rol === "admin") {
    return { hata: "Yönetici hesabı ortam değişkeninden yönetilir." };
  }

  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(oturum.eposta);
  if (!hesap) return { hata: await hataMetni("hata.hesapYok") };

  const parolaDogruMu = await parolaDogrula(
    String(formVerisi.get("parola") ?? ""),
    hesap.parolaHash,
  );
  if (!parolaDogruMu) return { hata: await hataMetni("hata.parolaYanlis") };

  const yeni = String(formVerisi.get("yeniEposta") ?? "").trim().toLowerCase();
  const uygun = await yeniEpostaUygunMu(oturum.eposta, yeni);
  if (!uygun.basarili) return { hata: uygun.hata };

  const gonderim = await kodGonder(yeni, "eposta");
  if (!gonderim.basarili) return { hata: gonderim.hata };

  revalidatePath("/admin/dogrulamalar");
  return {
    adim: "kod",
    eposta: yeni,
    postaGitmedi: !postaHazirMi() || !gonderim.postaGitti,
    basari: `${yeni} adresine bir kod gönderdik. Kodu yazınca adresin değişecek.`,
  };
}

/** E-posta değişimi — 2. ADIM: yeni adrese gelen kodun doğrulanması. */
export async function epostaDegistirDogrulaAction(
  oncekiDurum: KodDurumu,
  formVerisi: FormData,
): Promise<KodDurumu> {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris");

  const yeni = String(formVerisi.get("eposta") ?? oncekiDurum.eposta ?? "").trim().toLowerCase();
  const kodSonucu = await koduDogrula(yeni, "eposta", String(formVerisi.get("kod") ?? ""));
  if (!kodSonucu.gecerli) {
    return { ...oncekiDurum, basari: undefined, hata: kodSonucu.hata };
  }

  const sonuc = await epostayiDegistir(oturum.eposta, yeni);
  if (!sonuc.basarili) return { ...oncekiDurum, basari: undefined, hata: sonuc.hata };

  // Oturum eski adrese bağlıydı; yeni adresle tazeleniyor.
  await oturumAc({
    eposta: yeni,
    ad: oturum.ad,
    rol: oturum.rol,
    restoranSlug: oturum.restoranSlug,
  });

  revalidatePath("/hesabim");
  revalidatePath("/admin/dogrulamalar");
  revalidatePath("/admin/hesaplar");

  const tasinan = sonuc.veri.tasinanSiparis;
  return {
    eposta: yeni,
    basari:
      `Adresin ${yeni} olarak değişti.` +
      (tasinan > 0 ? ` ${tasinan} siparişin de yeni adresine taşındı.` : ""),
  };
}

// ---------------------------------------------------------------------------
// Parola: unuttum akışı ve profilden değiştirme
// ---------------------------------------------------------------------------

/**
 * "Parolamı unuttum" — 1. ADIM: adrese kod gönderilir.
 *
 * Hesabın var olup olmadığı Ele VERİLMEZ; iki durumda da aynı mesaj döner.
 * Aksi hâlde bu form, hangi e-postaların sitede kayıtlı olduğunu öğrenmek için
 * kullanılabilirdi.
 */
export async function sifreKoduIsteAction(
  _oncekiDurum: KodDurumu,
  formVerisi: FormData,
): Promise<KodDurumu> {
  const eposta = String(formVerisi.get("eposta") ?? "").trim().toLowerCase();
  if (!eposta.includes("@")) return { hata: await hataMetni("hata.epostaGecersiz") };

  const hesap = await (await hesapDepoAl()).hesapBul(eposta);
  let postaGitti = false;
  if (hesap) {
    const gonderim = await kodGonder(eposta, "sifre");
    if (!gonderim.basarili) return { hata: gonderim.hata };
    postaGitti = gonderim.postaGitti;
    revalidatePath("/admin/dogrulamalar");
  }

  return {
    adim: "kod",
    eposta,
    postaGitmedi: Boolean(hesap) && !postaGitti,
    basari:
      `${eposta} adresine kayıtlı bir hesap varsa kod gönderildi. ` +
      "Kodu ve yeni parolanı aşağıya yaz.",
  };
}

/** "Parolamı unuttum" — 2. ADIM: kod + yeni parola. */
export async function parolaSifirlaAction(
  oncekiDurum: KodDurumu,
  formVerisi: FormData,
): Promise<KodDurumu> {
  const eposta = String(formVerisi.get("eposta") ?? oncekiDurum.eposta ?? "");
  const kod = String(formVerisi.get("kod") ?? "");

  const kodSonucu = await koduDogrula(eposta, "sifre", kod);
  if (!kodSonucu.gecerli) return { ...oncekiDurum, basari: undefined, hata: kodSonucu.hata };

  /*
   * Mevcut parola SORULMAZ: kimlik zaten e-postaya gelen kodla kanıtlandı.
   * Parolasını unutan kişiden eskisini istemek akışı anlamsız kılardı.
   */
  const sonuc = await parolaDegistir({
    eposta,
    yeniParola: String(formVerisi.get("yeniParola") ?? ""),
    yeniParolaTekrar: String(formVerisi.get("yeniParolaTekrar") ?? ""),
  });
  if (!sonuc.basarili) return { ...oncekiDurum, basari: undefined, hata: sonuc.hata };

  // Kod doğrulandığına göre adres de teyit edilmiş sayılır.
  await epostayiDogrulandiIsaretle(eposta);
  revalidatePath("/admin/dogrulamalar");

  const hesap = await (await hesapDepoAl()).hesapBul(eposta);
  if (hesap) await oturumAc({ eposta: hesap.eposta, ad: hesap.ad, rol: hesap.rol });
  redirect(hesap ? rolAnaSayfasi(hesap.rol) : "/hesap/giris");
}

/**
 * Oturum açmış kişi kendi parolasını değiştirir.
 *
 * E-posta OTURUMDAN alınır — form alanı değiştirilerek başkasının parolası
 * değiştirilemez. Yönetici hesabı ortam değişkeniyle çalıştığı için buradan
 * geçmez.
 */
export async function parolaDegistirAction(
  _oncekiDurum: FormDurumu,
  formVerisi: FormData,
): Promise<FormDurumu> {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris");
  if (oturum.rol === "admin") {
    return { hata: "Yönetici parolası ortam değişkeninden yönetilir (ADMIN_PASSWORD)." };
  }

  const sonuc = await parolaDegistir({
    eposta: oturum.eposta,
    mevcutParola: String(formVerisi.get("mevcutParola") ?? ""),
    yeniParola: String(formVerisi.get("yeniParola") ?? ""),
    yeniParolaTekrar: String(formVerisi.get("yeniParolaTekrar") ?? ""),
  });
  if (!sonuc.basarili) return { hata: sonuc.hata };

  return { basari: "Parolan değiştirildi. Bir dahaki girişte yeni parolanı kullan." };
}

export async function cikisAction(): Promise<void> {
  await cikisYap();
  redirect("/");
}

/**
 * Şef kendi profilini günceller.
 *
 * Yetki kontrolü sunucuda yapılır ve düzenlenecek restoran İSTEMCİDEN
 * ALINMAZ — oturumdaki `restoranSlug` kullanılır. Böylece form alanı
 * değiştirilerek başkasının profili düzenlenemez.
 */
export async function profilKaydetAction(
  _oncekiDurum: FormDurumu,
  formVerisi: FormData,
): Promise<FormDurumu> {
  const oturum = await oturumAl();
  if (!oturum) redirect("/hesap/giris");

  const slug =
    oturum.rol === "admin" ? String(formVerisi.get("restoranSlug") ?? "") : oturum.restoranSlug;
  if (!slug) return { hata: await hataMetni("hata.sefProfiliYok") };

  const kirp = (ad: string, sinir: number) =>
    String(formVerisi.get(ad) ?? "")
      .trim()
      .slice(0, sinir) || undefined;

  const profil: SefProfili = {
    restoranSlug: slug,
    slogan: kirp("slogan", 120),
    uzmanlik: kirp("uzmanlik", 160),
    biyografi: kirp("biyografi", 4000),
    sertifikalar: kirp("sertifikalar", 2000),
    // Kuryenin siparişi alacağı adres — müşteriye hiçbir yerde gösterilmiyor.
    alimAdresi: kirp("alimAdresi", 300),
    alimTelefonu: kirp("alimTelefonu", 20),
    guncellemeTarihi: new Date().toISOString(),
  };

  const depo = await hesapDepoAl();
  await depo.profilKaydet(profil);

  revalidatePath("/panel");
  revalidatePath(`/restoran/${slug}`);
  return { basari: "Profilin kaydedildi." };
}
