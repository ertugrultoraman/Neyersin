"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { depoAl } from "@/lib/depo";
import {
  basvuruOnayla,
  basvuruReddet,
  hesapDepoAl,
  type BasvuruTuru,
  type Rol,
} from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { restoranCoz } from "@/lib/restoran-listesi";

export type YonetimDurumu = { hata?: string; basari?: string };

/** Her yönetim eylemi kendi yetki kontrolünü yapar — sayfa korumasına güvenilmez. */
async function yoneticiOl() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");
  return oturum;
}

export async function basvuruOnaylaAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  await yoneticiOl();

  const sonuc = await basvuruOnayla({
    id: String(formVerisi.get("id") ?? ""),
    rol: String(formVerisi.get("rol") ?? "") as BasvuruTuru,
    semt: String(formVerisi.get("semt") ?? ""),
    not: String(formVerisi.get("not") ?? ""),
  });
  if (!sonuc.basarili) return { hata: sonuc.hata };

  // Yeni mutfak açıldıysa restoran listeleri tazelensin.
  revalidatePath("/admin/basvurular");
  revalidatePath("/restoranlar");
  revalidatePath("/");

  return {
    basari: sonuc.veri.atananRestoran
      ? `Onaylandı, hesap açıldı. Mutfak sayfası: /restoran/${sonuc.veri.atananRestoran}`
      : "Onaylandı, kurye hesabı açıldı. Kişi artık giriş yapabilir.",
  };
}

export async function basvuruReddetAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  await yoneticiOl();

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
  await yoneticiOl();

  const eposta = String(formVerisi.get("eposta") ?? "");
  const yeniRol = String(formVerisi.get("rol") ?? "") as Rol;
  if (!["sef", "kurye", "musteri"].includes(yeniRol)) {
    return { hata: "Geçerli bir rol seç." };
  }

  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);
  if (!hesap) return { hata: "Hesap bulunamadı." };

  await depo.hesapEkle({
    ...hesap,
    rol: yeniRol,
    // Yalnızca şef rolünde mutfak bağlantısı anlamlı.
    restoranSlug: yeniRol === "sef" ? hesap.restoranSlug : undefined,
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
  await yoneticiOl();

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
  await yoneticiOl();

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
  await yoneticiOl();

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

const ROL_ETIKETLERI: Record<string, string> = {
  admin: "yönetici",
  sef: "şef",
  kurye: "kurye",
  musteri: "müşteri",
};

export async function siparisAtaAction(
  _oncekiDurum: YonetimDurumu,
  formVerisi: FormData,
): Promise<YonetimDurumu> {
  await yoneticiOl();

  const siparisNo = String(formVerisi.get("siparisNo") ?? "");
  if (!siparisNo) return { hata: "Sipariş bulunamadı." };

  const depo = await depoAl();
  await depo.atamaGuncelle(siparisNo, {
    atananSef: String(formVerisi.get("atananSef") ?? "") || null,
    atananKurye: String(formVerisi.get("atananKurye") ?? "") || null,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/siparis/${siparisNo}`);
  return { basari: "Atama kaydedildi." };
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
