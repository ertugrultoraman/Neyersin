"use server";

import crypto from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { engeliKaldir } from "@/lib/bot-engeli";
import { depoAl } from "@/lib/depo";
import { kimligiSerbestBirak } from "@/lib/giris-sinirlayici";
import { teklifiYenidenAc } from "@/lib/kurye-dagitim";
import { dilimOlustur, dilimSil } from "@/lib/kurye-vardiya";
import { tumCihazlariIptalEt } from "@/lib/mobil/cihazlar";
import {
  basvuruOnayla,
  basvuruReddet,
  hesapDepoAl,
  parolaOzetle,
  ROLLER,
  type BasvuruTuru,
  type Rol,
} from "@/lib/hesaplar";
import {
  adminMi,
  istekIpsi,
  oturumAl,
  rolAnaSayfasi,
  vekaleteGir,
  vekaletiBitir,
} from "@/lib/oturum";
import { yonetimKaydet, type YonetimEylemi } from "@/lib/yonetim-gunlugu";
import { restoranCoz } from "@/lib/restoran-listesi";
import { vekaletiKaydet } from "@/lib/vekil-kaydi";

export type YonetimDurumu = { hata?: string; basari?: string };

/** Her yönetim eylemi kendi yetki kontrolünü yapar — sayfa korumasına güvenilmez. */
async function yoneticiOl() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");
  return oturum;
}

/**
 * Yapılan işi yönetim defterine yazar (bkz. lib/yonetim-gunlugu.ts).
 *
 * BEKLENMİYOR: defter satırı için yöneticiyi bekletmenin anlamı yok ve
 * yazma başarısız olsa bile eylem geçerli — hata modülün kendi içinde
 * yutuluyor.
 *
 * Yalnızca DEĞİŞTİREN eylemler yazılıyor; sayfa açmak, liste okumak deftere
 * girmiyor. Her okumayı yazsaydık defter kendi gürültüsünde kaybolur ve
 * "bu hesabı kim sildi" satırını bulmak imkânsızlaşırdı.
 *
 * KAYIT EYLEMİN BAŞINDA, SONUCU BEKLENMEDEN atılıyor — yani defter DENEMELERİ
 * tutuyor, yalnızca başarılı işleri değil. Bilinçli: ele geçirilmiş bir
 * yönetici hesabının "denediği ama tutmayan" işleri güvenlik açısından en az
 * başardıkları kadar değerli. Bir satırın gerçekten uygulanıp uygulanmadığı
 * hedefin son durumuna bakılarak görülüyor.
 */
function defterYaz(
  yonetici: string,
  eylem: YonetimEylemi,
  hedef?: string,
  ayrinti?: string,
): void {
  void istekIpsi()
    .then((ip) => yonetimKaydet({ yonetici, eylem, hedef, ayrinti, ip }))
    .catch(() => {});
}

export async function basvuruOnaylaAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "basvuru-onayla", String(formVerisi.get("id") ?? ""), String(formVerisi.get("rol") ?? ""));

  const sonuc = await basvuruOnayla({
    id: String(formVerisi.get("id") ?? ""),
    rol: String(formVerisi.get("rol") ?? "") as BasvuruTuru,
    semt: String(formVerisi.get("semt") ?? ""),
    not: String(formVerisi.get("not") ?? ""),
  });
  if (!sonuc.basarili) return { hata: sonuc.hata };

  /*
   * ALTIN ŞEF onay anında verilebiliyor: karar çoğu zaman burada, başvuruya
   * eklenen belgelere bakılırken alınıyor. Unvan mutfağa bağlı olduğu için
   * ancak mutfak açıldıysa (kurye değilse) işleniyor.
   */
  const altinSef = formVerisi.get("altinSef") === "1";
  if (altinSef && sonuc.veri.atananRestoran) {
    const depo = await hesapDepoAl();
    const slug = sonuc.veri.atananRestoran;
    const mevcut = await depo.profilAl(slug);
    await depo.profilKaydet({
      ...(mevcut ?? { restoranSlug: slug }),
      altinSef: true,
      guncellemeTarihi: new Date().toISOString(),
    });
  }

  // Yeni mutfak açıldıysa restoran listeleri tazelensin.
  revalidatePath("/admin/basvurular");
  revalidatePath("/admin/hesaplar");
  revalidatePath("/restoranlar");
  revalidatePath("/");

  const altinNotu = altinSef && sonuc.veri.atananRestoran ? " Altın Şef unvanı verildi." : "";
  return {
    basari: sonuc.veri.atananRestoran
      ? `Onaylandı, hesap açıldı. Mutfak sayfası: /restoran/${sonuc.veri.atananRestoran}${altinNotu}`
      : "Onaylandı, kurye hesabı açıldı. Kişi artık giriş yapabilir.",
  };
}

export async function basvuruReddetAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "basvuru-reddet", String(formVerisi.get("id") ?? ""), "");

  const sonuc = await basvuruReddet(
    String(formVerisi.get("id") ?? ""),
    String(formVerisi.get("not") ?? ""),
  );
  if (!sonuc.basarili) return { hata: sonuc.hata };

  revalidatePath("/admin/basvurular");
  return { basari: "Başvuru reddedildi." };
}

/**
 * Siparişe şef ve kurye atar.
 *
 * Bir sipariş tek bir kuryeye atanır; kurye panelinde yalnızca kendi ataması
 * listelenir. Boş bırakılan alan atamayı kaldırır.
 */
/**
 * Bir hesabın rolünü değiştirir.
 *
 * Şeflikten çıkarılan kişinin mutfağı silinmez, yalnızca bağlantısı kesilir —
 * mutfağı ve geçmiş siparişleri kaybolmasın diye. Mutfağı tamamen kaldırmak
 * için hesabı silme eylemi kullanılır.
 */
export async function rolDegistirAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "rol-degistir", String(formVerisi.get("eposta") ?? ""), `yeni rol: ${String(formVerisi.get("rol") ?? "")}`);

  const eposta = String(formVerisi.get("eposta") ?? "");
  const yeniRol = String(formVerisi.get("rol") ?? "") as Rol;
  /*
   * Atanabilir roller `ROLLER`den türetiliyor, elle sayılmıyor: "isletme"
   * menüye eklenip buradaki listeye yazılmadığında yönetici işletmeyi seçince
   * "Geçerli bir rol seç." hatası alıyordu. Yalnızca yöneticilik dışarıda —
   * o rol veritabanından değil, `ADMIN_EMAILS` listesinden geliyor.
   */
  if (!ATANABILIR_ROLLER.includes(yeniRol)) {
    return { hata: "Geçerli bir rol seç." };
  }

  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);
  if (!hesap) return { hata: "Hesap bulunamadı." };

  await depo.hesapEkle({
    ...hesap,
    rol: yeniRol,
    // Mutfak bağlantısı yalnızca mutfak işleten rollerde anlamlı.
    restoranSlug: MUTFAK_ROLLERI.includes(yeniRol) ? hesap.restoranSlug : undefined,
  });

  revalidatePath("/admin/hesaplar");
  return { basari: `${hesap.ad} artık ${ROL_ETIKETLERI[yeniRol]}.` };
}

/**
 * Mevcut bir hesabı mevcut bir mutfağa bağlar (ya da bağını koparır).
 *
 * Rol değiştirme bunu yapamıyordu: yalnızca var olan bağlantıyı koruyordu,
 * yeni bağlantı kuramıyordu. Başvuru onayı da her seferinde YENİ mutfak
 * açıyor. Arada bir boşluk kalıyordu: içerik dosyasında zaten tanımlı bir
 * mutfağı (örneğin "Makbule Şef") gerçek bir hesaba bağlamanın yolu yoktu.
 *
 * Bir mutfak yalnızca TEK hesaba bağlanabilir; aksi hâlde iki kişi aynı
 * menüyü düzenler ve birbirinin siparişlerini görürdü.
 */
export async function mutfakBaglaAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "mutfak-bagla", String(formVerisi.get("eposta") ?? ""), String(formVerisi.get("restoranSlug") ?? ""));

  const eposta = String(formVerisi.get("eposta") ?? "");
  const slug = String(formVerisi.get("restoranSlug") ?? "").trim();

  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);
  if (!hesap) return { hata: "Hesap bulunamadı." };

  // Boş değer = bağı kopar, hesabı müşteriye çevir.
  if (!slug) {
    await depo.hesapEkle({ ...hesap, rol: "musteri", restoranSlug: undefined });
    revalidatePath("/admin/hesaplar");
    revalidatePath("/panel");
    return { basari: `${hesap.ad} artık bir mutfağa bağlı değil.` };
  }

  const restoran = await restoranCoz(slug);
  if (!restoran) return { hata: `"${slug}" diye bir mutfak yok.` };

  // Aynı mutfak başka bir hesaba bağlıysa devretmeden önce uyar.
  const hepsi = await depo.hesaplariListele();
  const sahip = hepsi.find((h) => h.restoranSlug === slug && h.eposta !== hesap.eposta);
  if (sahip) {
    return { hata: `Bu mutfak zaten ${sahip.ad} (${sahip.eposta}) hesabına bağlı.` };
  }

  await depo.hesapEkle({ ...hesap, rol: "sef", restoranSlug: slug });

  revalidatePath("/admin/hesaplar");
  revalidatePath("/panel");
  revalidatePath(`/restoran/${slug}`);
  return { basari: `${hesap.ad} artık ${restoran.ad} mutfağının şefi.` };
}

/**
 * ALTIN ŞEF unvanını verir ya da geri alır.
 *
 * Unvan, Şef Kaşığı atma yetkisinin kendisi: yalnızca Altın Şefler
 * meslektaşlarına kaşık atabiliyor. Bu yüzden kararı YÖNETİCİ veriyor —
 * şef kendi profilinden işaretleyebilseydi yetki kendi kendine dağıtılırdı.
 *
 * Unvan mutfağa (`sef_profilleri.restoran_slug`) bağlı, hesaba değil: kaşık
 * kayıtları da mutfaktan mutfağa tutuluyor, ikisi aynı anahtarı kullanmalı.
 */
export async function altinSefAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "altin-sef", String(formVerisi.get("slug") ?? formVerisi.get("eposta") ?? ""), "");

  const slug = String(formVerisi.get("restoranSlug") ?? "").trim();
  const ver = formVerisi.get("ver") === "1";
  if (!slug) return { hata: "Önce hesabı bir mutfağa bağla." };

  const restoran = await restoranCoz(slug);
  if (!restoran) return { hata: `"${slug}" diye bir mutfak yok.` };

  const depo = await hesapDepoAl();
  const mevcut = await depo.profilAl(slug);
  await depo.profilKaydet({
    ...(mevcut ?? { restoranSlug: slug }),
    altinSef: ver,
    guncellemeTarihi: new Date().toISOString(),
  });

  revalidatePath("/admin/hesaplar");
  revalidatePath("/admin/rozetler");
  revalidatePath(`/restoran/${slug}`);
  revalidatePath("/sef-siralamasi");
  return {
    basari: ver
      ? `${restoran.ad} artık Altın Şef — Şef Kaşığı atabilir.`
      : `${restoran.ad} artık Altın Şef değil.`,
  };
}

/**
 * BOT ENGELİNİ KALDIRIR.
 *
 * Engel altı ay sürüyor ve CGNAT yüzünden bir IP'nin arkasında binlerce
 * gerçek kullanıcı olabiliyor; yanlış engellenen biri çıktığında yöneticinin
 * bunu geri alabilmesi şart.
 */
export async function engelKaldirAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "engel-kaldir", String(formVerisi.get("ip") ?? ""), "");

  const ip = String(formVerisi.get("ip") ?? "").trim();
  if (!ip) return { hata: "IP yok." };

  await engeliKaldir(ip);
  revalidatePath("/admin/engeller");
  return { basari: `${ip} engeli kaldırıldı.` };
}

/**
 * FİYAT ONAYI — şefin talep ettiği fiyatı yayına alır.
 *
 * Onaya kadar müşteri eski fiyatı görüyordu; burada `bekleyenFiyat` asıl
 * `fiyat` alanına geçiyor ve talep temizleniyor.
 */
export async function fiyatOnaylaAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  await yoneticiOl();

  const urunId = String(formVerisi.get("urunId") ?? "");
  const depo = await hesapDepoAl();
  const urun = await depo.urunBul(urunId);
  if (!urun) return { hata: "Ürün bulunamadı." };
  if (typeof urun.bekleyenFiyat !== "number") {
    return { hata: "Bu üründe bekleyen fiyat talebi yok." };
  }

  const yeni = urun.bekleyenFiyat;
  await depo.urunKaydet({
    ...urun,
    fiyat: yeni,
    bekleyenFiyat: undefined,
    bekleyenTarih: undefined,
    guncellemeTarihi: new Date().toISOString(),
  });

  revalidatePath("/admin/fiyatlar");
  revalidatePath(`/restoran/${urun.restoranSlug}`);
  revalidatePath(`/panel/${urun.restoranSlug}`);
  return { basari: `"${urun.ad}" artık ${yeni} TL.` };
}

/** Fiyat talebini reddeder — yayındaki fiyat olduğu gibi kalır. */
export async function fiyatReddetAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  await yoneticiOl();

  const urunId = String(formVerisi.get("urunId") ?? "");
  const depo = await hesapDepoAl();
  const urun = await depo.urunBul(urunId);
  if (!urun) return { hata: "Ürün bulunamadı." };

  await depo.urunKaydet({
    ...urun,
    bekleyenFiyat: undefined,
    bekleyenTarih: undefined,
    guncellemeTarihi: new Date().toISOString(),
  });

  revalidatePath("/admin/fiyatlar");
  revalidatePath(`/restoran/${urun.restoranSlug}`);
  return { basari: `"${urun.ad}" için talep reddedildi; fiyat ${urun.fiyat} TL kaldı.` };
}

/** Hesabı ve (varsa) otomatik açılmış mutfağını siler. */
export async function hesapSilAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "hesap-sil", String(formVerisi.get("eposta") ?? ""), "");

  const eposta = String(formVerisi.get("eposta") ?? "");
  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);
  if (!hesap) return { hata: "Hesap bulunamadı." };

  if (hesap.restoranSlug) {
    // Yalnızca çalışma zamanında açılmış mutfaklar silinebilir; içerik
    // dosyasındaki sabit restoranlar koddan yönetilir, buradan silinmez.
    await depo.mutfakSil(hesap.restoranSlug);
  }
  await depo.hesapSil(eposta);

  revalidatePath("/admin/hesaplar");
  revalidatePath("/restoranlar");
  revalidatePath("/");
  return { basari: `${hesap.ad} hesabı silindi.` };
}

/**
 * Okunabilir ama tahmin edilemez parola: `abcd-efgh-ijkl-123`.
 *
 * Telefonda okunup yazılabilsin diye karıştırılan harfler (l, o) çıkarıldı;
 * 24 harflik alfabeden 12 harf + 3 rakam ≈ 65 bit, kaba kuvvete kapalı.
 *
 * "GEÇİCİ" DEĞİL: üretilen parola hesabın kalıcı parolası oluyor, bir kullanımda
 * yanmıyor ve süresi dolmuyor. Adı önce `gecicoParolaUret`ti ve panelde de
 * "bir kez" yazıyordu; ikisi birden parolanın tek kullanımlık olduğu izlenimi
 * veriyordu. Bir kez olan şey PAROLANIN KENDİSİ değil, EKRANDA gösterilmesi.
 */
function okunakliParolaUret(): string {
  const harfler = "abcdefghijkmnpqrstuvwxyz";
  const kume = () =>
    Array.from({ length: 4 }, () => harfler[crypto.randomInt(harfler.length)]).join("");
  return `${kume()}-${kume()}-${kume()}-${crypto.randomInt(100, 1000)}`;
}

/**
 * Bir hesaba yeni parola üretir; parola KALICI, ekranda gösterimi bir kezlik.
 *
 * Neden "göster" değil de "üret": parolalar scrypt özeti olarak saklanıyor,
 * mevcut parolayı okumak mümkün değil. Kişi parolasını unuttuğunda e-posta
 * akışı çalışmıyorsa (adres artık yok, kod gelmiyor) yöneticinin hesabı
 * açabilmesinin başka yolu kalmıyordu.
 *
 * Üretilen parolayı yalnızca üç şey geçersiz kılıyor: kişinin kendi parolasını
 * değiştirmesi, buradan yeni bir parola üretilmesi ve `npm run hesap:test`
 * (yalnızca deneme hesaplarına dokunuyor, artık elle değiştirilmiş parolayı
 * `--zorla` olmadan ezmiyor).
 *
 * Yönetici hesabına dokunmuyor: yöneticilik veritabanındaki bir satırdan
 * değil, `ADMIN_EMAILS` + `ADMIN_PASSWORD` ortam değişkenlerinden geliyor.
 */
export async function parolaUretAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "parola-uret", String(formVerisi.get("eposta") ?? ""), "");

  const eposta = String(formVerisi.get("eposta") ?? "");
  if (adminMi(eposta)) {
    return { hata: "Yönetici parolası buradan değişmez — ADMIN_PASSWORD ortam değişkeni." };
  }

  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);
  if (!hesap) return { hata: "Hesap bulunamadı." };

  const yeni = okunakliParolaUret();
  await depo.hesapEkle({
    ...hesap,
    parolaHash: await parolaOzetle(yeni),
    /*
     * Google ile açılmış hesaba parola verilince artık ikisiyle de girebilir.
     * Sağlayıcıyı "parola"ya çevirmek Google düğmesini kapatırdı; olduğu gibi
     * bırakılıyor.
     */
    saglayici: hesap.saglayici ?? "parola",
  });

  // Eski başarısız denemeler yeni parolayı da duvara toslatmasın.
  await kimligiSerbestBirak(hesap.eposta);

  revalidatePath("/admin/hesaplar");
  return { basari: `${hesap.ad} için yeni parola: ${yeni}` };
}

/**
 * HESAP OLARAK GİR — yönetici, seçtiği hesabı o kişi olarak görüntüler.
 *
 * Parola öğrenmeye gerek kalmıyor; kişi parolasını değiştirse de çalışmaya
 * devam ediyor. Vekâlet deftere yazılıyor (bkz. `vekaletiKaydet`) ki hedef
 * hesapta yapılan değişiklik sahibinin mi yöneticinin mi olduğu sonradan
 * ayırt edilebilsin.
 */
export async function hesabaGirAction(formVerisi: FormData): Promise<void> {
  const yonetici = await yoneticiOl();

  const eposta = String(formVerisi.get("eposta") ?? "");
  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);
  if (!hesap) redirect("/admin/hesaplar");

  await vekaletiKaydet(yonetici.eposta, hesap.eposta);
  await vekaleteGir(yonetici, hesap);

  redirect(rolAnaSayfasi(hesap.rol));
}

/** Vekâletten çık, yöneticiliğe dön. */
export async function vekaletiBitirAction(): Promise<void> {
  const dondu = await vekaletiBitir();
  redirect(dondu ? "/admin/hesaplar" : "/");
}

/**
 * Bir mutfak sayfası işleten roller.
 *
 * Rol değişince mutfak bağlantısı bu listedekilerde KORUNUYOR, diğerlerinde
 * kopuyor. İşletme de şef gibi kendi mutfağını yönetiyor: listeye alınmasaydı
 * şeflikten işletmeye geçen hesabın mutfağı bağlantısız kalırdı.
 */
const MUTFAK_ROLLERI: Rol[] = ["sef", "isletme"];

/** Panelden verilebilecek roller — yöneticilik hariç hepsi. */
const ATANABILIR_ROLLER: Rol[] = ROLLER.filter((r) => r !== "admin");

const ROL_ETIKETLERI: Record<string, string> = {
  admin: "yönetici",
  sef: "şef",
  isletme: "işletme",
  kurye: "kurye",
  musteri: "müşteri",
};

/**
 * Siparişi şefe ve kuryeye bağlar.
 *
 * KURYE SEÇİMİ ATAMA DEĞİL, TEKLİF. Eskiden seçilen kurye doğrudan
 * `atananKurye` olarak yazılıyordu: iş kuryenin onayı olmadan üstüne biniyor,
 * teslimat listesinde bir anda beliriyordu. Kurye ne kabul etmiş oluyordu ne
 * de reddedebiliyordu. Artık seçim siparişi o kurye için AYIRIYOR, teklif
 * ekranına düşürüyor ve iş ancak "Kabul et" denince kuryenin oluyor
 * (bkz. depo/tipler → teklifEdilenKurye).
 *
 * ŞEF SEÇİMİ ESKİSİ GİBİ DOĞRUDAN: mutfak işi kabul etmeyi seçmiyor, sipariş
 * zaten kendi mutfağına gelmiş oluyor.
 */
export async function siparisAtaAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "siparis-ata", String(formVerisi.get("siparisNo") ?? ""), `kurye: ${String(formVerisi.get("atananKurye") ?? "-")}`);

  const siparisNo = String(formVerisi.get("siparisNo") ?? "");
  if (!siparisNo) return { hata: "Sipariş bulunamadı." };

  const depo = await depoAl();
  const siparis = await depo.bul(siparisNo);
  if (!siparis) return { hata: "Sipariş bulunamadı." };

  const secilenKurye = String(formVerisi.get("atananKurye") ?? "").trim().toLowerCase() || null;
  const zatenKabulEtmis = Boolean(
    secilenKurye && siparis.atananKurye?.trim().toLowerCase() === secilenKurye,
  );

  await depo.atamaGuncelle(siparisNo, {
    atananSef: String(formVerisi.get("atananSef") ?? "") || null,
    /*
     * Kurye zaten kabul etmişse atama BOZULMUYOR — yönetici aynı ismi
     * seçtiğinde sahadaki kuryenin işi elinden alınıp yeniden teklif
     * edilseydi, kurye yolun ortasında siparişi kaybederdi.
     */
    ...(zatenKabulEtmis
      ? { teklifEdilenKurye: null }
      : { atananKurye: null, teklifEdilenKurye: secilenKurye }),
  });

  /*
   * Teklif kaydı temizleniyor: kurye bu işi daha önce reddettiyse ya da süre
   * dolduysa kayıt duruyor ve yeni teklif üretilmiyor (ON CONFLICT DO
   * NOTHING). Temizlenmeseydi yönetici "kaydedildi" görür, kuryenin
   * telefonunda hiçbir şey olmazdı.
   */
  if (secilenKurye && !zatenKabulEtmis) {
    try {
      await teklifiYenidenAc(secilenKurye, siparisNo);
    } catch {
      /* Dağıtım deposu susarsa atama yine kaydedildi; teklif sonraki yoklamada üretilir. */
    }
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/siparis/${siparisNo}`);
  return {
    basari: zatenKabulEtmis
      ? "Atama kaydedildi."
      : secilenKurye
        ? "Sipariş kuryeye teklif edildi. Kabul edene kadar kimsenin üstüne geçmiyor."
        : "Atama kaydedildi.",
  };
}

/**
 * Destek talebini açık ↔ çözüldü arasında taşır.
 *
 * Basit bir `<form action>` olduğu için `useActionState` yerine doğrudan
 * çağrılıyor; dönüş değeri yok, sayfa `revalidatePath` ile tazeleniyor.
 */
export async function destekDurumuDegistir(formVerisi: FormData): Promise<void> {
  await yoneticiOl();

  const id = String(formVerisi.get("id") ?? "");
  const durum = String(formVerisi.get("durum") ?? "");
  if (!id || (durum !== "acik" && durum !== "cozuldu")) return;

  const depo = await hesapDepoAl();
  const talep = (await depo.destekListele()).find((t) => t.id === id);
  if (!talep) return;

  await depo.destekGuncelle({
    ...talep,
    durum,
    guncellemeTarihi: new Date().toISOString(),
  });

  revalidatePath("/admin/destek");
}

/**
 * Bir hesabın BÜTÜN mobil oturumlarını keser.
 *
 * Telefonu çalınan ya da kaybolan kuryenin ilk ihtiyacı bu. Parola
 * değiştirmek yetmiyordu: mobil jetonlar parolaya bağlı değil, imzası
 * doğruysa 180 gün geçerliler (bkz. lib/mobil/cihazlar.ts).
 *
 * İPTAL YASAK DEĞİL: kişi parolasını biliyorsa aynı cihazdan tekrar giriş
 * yapabiliyor ve iptal kalkıyor. Amaç ELDEKİ JETONU geçersizleştirmek.
 */
export async function oturumlariKesAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "oturum-kes", String(formVerisi.get("eposta") ?? ""), "");

  const eposta = String(formVerisi.get("eposta") ?? "").trim();
  if (!eposta) return { hata: "Hesap bulunamadı." };

  try {
    const adet = await tumCihazlariIptalEt(eposta);
    revalidatePath("/admin/hesaplar");
    return {
      basari:
        adet > 0
          ? `${adet} cihazın oturumu kapatıldı. Kişi parolasıyla tekrar girebilir.`
          : "Bu hesapta açık mobil oturum yok.",
    };
  } catch {
    return { hata: "Oturumlar kesilemedi; veritabanına ulaşılamadı." };
  }
}

/* --------------------------------------------------------------------------
 * Vardiya dilimleri
 * ----------------------------------------------------------------------- */

/**
 * Tarih + saat kutularını gerçek bir ana çevirir.
 *
 * FORM ALANLARI SAAT DİLİMİ TAŞIMIYOR: tarayıcı "2026-08-14" ve "19:00"
 * gönderiyor, sonunda bir kayma yok. Sunucu UTC'de çalıştığı için (Vercel)
 * doğrudan `new Date()` demek, yöneticinin yazdığı 19:00'ı UTC 19:00 — yani
 * Türkiye saatiyle 22:00 — olarak kaydederdi ve bütün vardiyalar üç saat
 * kayardı.
 *
 * Sabit +03:00 doğru: Türkiye 2016'dan beri yaz saati uygulamıyor (aynı
 * gerekçe: lib/mobil/kurye.ts → TR_KAYMA_MS).
 */
function trAnindan(tarih: string, saat: string): string {
  const gun = tarih.trim();
  const eslesme = /^(\d{2}:\d{2})/.exec(saat.trim());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(gun) || !eslesme) return "";
  return `${gun}T${eslesme[1]}:00+03:00`;
}

export async function vardiyaOlusturAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "vardiya-ac", String(formVerisi.get("tarih") ?? ""), `${String(formVerisi.get("baslangicSaati") ?? "")}-${String(formVerisi.get("bitisSaati") ?? "")}`);

  const tarih = String(formVerisi.get("tarih") ?? "");
  const baslangic = trAnindan(tarih, String(formVerisi.get("baslangicSaati") ?? ""));
  const bitisMetni = trAnindan(tarih, String(formVerisi.get("bitisSaati") ?? ""));
  if (!baslangic || !bitisMetni) return { hata: "Tarih, başlangıç ve bitiş saatini gir." };

  /*
   * GECE YARISINI GEÇEN VARDİYA: "22:00 – 02:00" yazıldığında bitiş ertesi
   * güne düşüyor. Tek bir tarih kutusu var çünkü yöneticinin kafasındaki şey
   * "salı gecesi vardiyası" — iki ayrı tarih girmek zorunda kalsaydı bitiş
   * gününü yanlış yazmak en sık yapılan hata olurdu.
   */
  const basAni = new Date(baslangic).getTime();
  let bitAni = new Date(bitisMetni).getTime();
  if (bitAni <= basAni) bitAni += 86_400_000;

  const sonuc = await dilimOlustur({
    baslangic,
    bitis: new Date(bitAni).toISOString(),
    bolge: String(formVerisi.get("bolge") ?? ""),
    not: String(formVerisi.get("not") ?? ""),
    kontenjan: Number(formVerisi.get("kontenjan") ?? 0),
  });
  if (!sonuc.tamam) return { hata: sonuc.sebep };

  revalidatePath("/admin/vardiyalar");
  return { basari: "Vardiya açıldı. Kuryeler artık yer ayırabilir." };
}

export async function vardiyaSilAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  const yonetici = await yoneticiOl();
  defterYaz(yonetici.eposta, "vardiya-sil", String(formVerisi.get("id") ?? ""), "");

  const sonuc = await dilimSil(String(formVerisi.get("id") ?? ""));
  if (!sonuc.tamam) return { hata: sonuc.sebep };

  revalidatePath("/admin/vardiyalar");
  return { basari: "Vardiya kaldırıldı." };
}
