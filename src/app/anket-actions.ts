"use server";

import crypto from "node:crypto";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { ASGARI_SECENEK, AZAMI_SECENEK, secenekKimligi, VARSAYILAN_ANKET } from "@/content/anket";
import { hesapDepoAl, type Anket, type AnketOyu, type AnketSecenegi } from "@/lib/hesaplar";
import { hataMetni } from "@/lib/hata-metni";
import { ingilizceyeCevir, otomatikCeviriVarMi } from "@/lib/otomatik-ceviri";
import { oturumAl } from "@/lib/oturum";

export type AnketDurumu = { hata?: string; basari?: string };

const MISAFIR_COOKIE = "ny_anket";
const MISAFIR_GUN = 365;

const SORU_SINIRI = 140;
const ETIKET_SINIRI = 60;

/**
 * Misafir seçmen kimliği.
 *
 * Girişsiz de oy verilebiliyor ama aynı kişi sayfayı yenileyip yüzlerce oy
 * atamamalı. Tarayıcıya rastgele bir kimlik yazılıyor; imzalı olması gerekmiyor
 * çünkü kimseye yetki vermiyor — yalnızca tekrar oyu zorlaştırıyor.
 *
 * Kesin bir koruma değil (çerezi silen tekrar oy verir) ve bilerek öyle:
 * daha sıkısı için girişi zorunlu kılmak gerekirdi, o da katılımı düşürürdü.
 */
async function misafirKimligi(): Promise<string> {
  const kavanoz = await cookies();
  const mevcut = kavanoz.get(MISAFIR_COOKIE)?.value;
  if (mevcut) return mevcut;

  const yeni = `misafir:${crypto.randomUUID()}`;
  kavanoz.set(MISAFIR_COOKIE, yeni, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MISAFIR_GUN * 24 * 60 * 60,
  });
  return yeni;
}

/** Oy veren kim: girişliyse e-postası, değilse misafir kimliği. */
async function secmenKimligi(): Promise<{ secmen: string; ad?: string; girisli: boolean }> {
  const oturum = await oturumAl();
  if (oturum) return { secmen: `hesap:${oturum.eposta}`, ad: oturum.ad, girisli: true };
  return { secmen: await misafirKimligi(), girisli: false };
}

/**
 * Aynısının SALT OKUYAN hâli — çerez yazmaz.
 *
 * Sayfa çizilirken çerez yazılamıyor (Next yalnızca eylemlerde ve rota
 * işleyicilerinde izin veriyor); yukarıdaki işlev orada çağrılınca hata
 * fırlatıyor ve sonuç boş dönüyordu — hiç oy verilmemiş gibi. Sonuç okuma
 * yolunda kimlik yalnızca "bu kişi oy vermiş mi" sorusuna bakıyor, kimlik
 * üretmeye gerek yok.
 */
async function secmenKimligiOku(): Promise<string | undefined> {
  const oturum = await oturumAl();
  if (oturum) return `hesap:${oturum.eposta}`;
  return (await cookies()).get(MISAFIR_COOKIE)?.value;
}

/**
 * Ana sayfada gösterilecek anketler.
 *
 * Yayında olan HER anket ana sayfaya çıkıyor; her biri kampanya ızgarasında
 * kendi kutusunda duruyor. Hiçbiri yayında değilse `content/anket.ts` içindeki
 * varsayılan geliyor — yönetici bütün anketleri silse bile ana sayfada boşluk
 * kalmıyor.
 */
export async function yayindakiAnketler(): Promise<Anket[]> {
  try {
    const anketler = await (await hesapDepoAl()).anketleriListele();
    const yayinda = anketler.filter((a) => a.yayinda);
    if (yayinda.length === 0) return [VARSAYILAN_ANKET];

    /*
     * Izgaradaki yeri belli olanlar önce. Yeri olmayanlar (sira = -1) sona
     * yığılıyor; orada YENİ anket üstte olsun diye tarihe göre ters sıralanıyor
     * — yeni açılan anket ızgaranın en dibinde kaybolmasın.
     */
    return yayinda.sort((a, b) => {
      const ay = a.sira < 0 ? Number.MAX_SAFE_INTEGER : a.sira;
      const by = b.sira < 0 ? Number.MAX_SAFE_INTEGER : b.sira;
      if (ay !== by) return ay - by;
      return b.olusturmaTarihi.localeCompare(a.olusturmaTarihi);
    });
  } catch {
    return [VARSAYILAN_ANKET];
  }
}

export async function anketOyVerAction(
  _oncekiDurum: AnketDurumu,
  formVerisi: FormData,
): Promise<AnketDurumu> {
  const secenek = String(formVerisi.get("secenek") ?? "").trim();
  const anketId = String(formVerisi.get("anketId") ?? "").trim();

  /*
   * Formdan gelen anket kimliği YAYINDAKİ anketler arasında aranıyor; kayıt
   * doğrudan bu kimlikle okunmuyor. Aksi hâlde yayından kaldırılmış ya da hiç
   * gösterilmemiş bir ankete oy yağdırılabilirdi. Seçeneğin o ankete ait
   * olduğu da burada doğrulanıyor.
   */
  const anket = (await yayindakiAnketler()).find((a) => a.id === anketId);
  if (!anket || !anket.secenekler.some((s) => s.id === secenek)) {
    return { hata: await hataMetni("hata.anketSecenek") };
  }

  const { secmen, ad, girisli } = await secmenKimligi();

  const oy: AnketOyu = {
    id: crypto.randomUUID(),
    anketId: anket.id,
    secmen,
    secenek,
    ad,
    girisli,
    tarih: new Date().toISOString(),
  };

  try {
    await (await hesapDepoAl()).anketOyVer(oy);
  } catch {
    return { hata: await hataMetni("hata.oyKaydedilemedi") };
  }

  revalidatePath("/");
  revalidatePath("/admin/anket");
  return { basari: "Oyun alındı." };
}

export type AnketSonucu = {
  anketId: string;
  soru: string;
  soruEn?: string;
  toplam: number;
  /** Seçenek kimliği → { adet, yuzde } */
  dagilim: { id: string; etiket: string; etiketEn?: string; adet: number; yuzde: number }[];
  /** Bu ziyaretçinin oyu — verdiyse sonuçlar gösterilir. */
  benimOyum?: string;
  /** Kampanya ızgarasında kaçıncı kutuda duracağı; -1 ise sona konur. */
  sira: number;
};

function bosSonuc(anket: Anket): AnketSonucu {
  return {
    anketId: anket.id,
    soru: anket.soru,
    soruEn: anket.soruEn,
    toplam: 0,
    dagilim: anket.secenekler.map((s) => ({
      id: s.id,
      etiket: s.etiket,
      etiketEn: s.etiketEn,
      adet: 0,
      yuzde: 0,
    })),
    sira: anket.sira,
  };
}

/** Bir anketin oylarını yüzdeye çevirir. */
function sonucCikar(anket: Anket, oylar: AnketOyu[], secmen?: string): AnketSonucu {
  const sayim = new Map<string, number>();
  for (const o of oylar) sayim.set(o.secenek, (sayim.get(o.secenek) ?? 0) + 1);

  const toplam = oylar.length;
  return {
    anketId: anket.id,
    soru: anket.soru,
    soruEn: anket.soruEn,
    toplam,
    dagilim: anket.secenekler.map((s) => {
      const adet = sayim.get(s.id) ?? 0;
      return {
        id: s.id,
        etiket: s.etiket,
        etiketEn: s.etiketEn,
        adet,
        yuzde: toplam > 0 ? Math.round((adet / toplam) * 100) : 0,
      };
    }),
    benimOyum: secmen ? oylar.find((o) => o.secmen === secmen)?.secenek : undefined,
    sira: anket.sira,
  };
}

/**
 * Yayındaki anketlerin sonuçları.
 *
 * Yüzdeler HERKESE açık ama yalnızca OY VERDİKTEN SONRA gösteriliyor:
 * önden görmek insanın tercihini etkiliyor (sürü etkisi), sonuç da anlamını
 * yitiriyordu. Bu kural anket başına işliyor — birine oy vermek diğerinin
 * sonucunu açmıyor.
 */
export async function anketSonuclari(): Promise<AnketSonucu[]> {
  const anketler = await yayindakiAnketler();

  try {
    const depo = await hesapDepoAl();
    const [secmen, oyListeleri] = await Promise.all([
      secmenKimligiOku(),
      Promise.all(anketler.map((a) => depo.anketOylariListele(a.id))),
    ]);
    return anketler.map((anket, i) => sonucCikar(anket, oyListeleri[i], secmen));
  } catch {
    return anketler.map(bosSonuc);
  }
}

/* ─────────────────────────  YÖNETİCİ İŞLEMLERİ  ───────────────────────── */

/** Bütün yönetim eylemlerinin ilk satırı — rol SUNUCUDA doğrulanıyor. */
async function yoneticiMi(): Promise<boolean> {
  const oturum = await oturumAl();
  return oturum?.rol === "admin";
}

function tazele() {
  revalidatePath("/");
  revalidatePath("/admin/anket");
}

/**
 * YENİ ANKET (WhatsApp anketi gibi).
 *
 * Soru + istenen sayıda seçenek geliyor; kaç seçenek olacağını yönetici formda
 * seçiyor, boş bırakılanlar atlanıyor. Yayınlanan anket ana sayfaya çıkıyor.
 *
 * Yeni anket ESKİSİNİ İNDİRMİYOR: yayında olan her anket ana sayfada kendi
 * kutusunda duruyor. Önceden tek anket kuralı vardı (oylar bölünmesin diye) ama
 * eski anketin bir anda görünmez olması istenmiyordu; oylar zaten anket başına
 * ayrı sayıldığı için bölünme diye bir şey de olmuyor. Yayından indirmek
 * isteyen anket satırındaki düğmeyi kullanıyor.
 */
export async function anketOlusturAction(
  _oncekiDurum: AnketDurumu,
  formVerisi: FormData,
): Promise<AnketDurumu> {
  if (!(await yoneticiMi())) return { hata: "Bu işlem için yönetici girişi gerekiyor." };

  const soru = String(formVerisi.get("soru") ?? "").trim().slice(0, SORU_SINIRI);
  if (soru.length < 5) return { hata: "Soru en az 5 karakter olmalı." };

  const soruEn = String(formVerisi.get("soruEn") ?? "").trim().slice(0, SORU_SINIRI);
  /** Otomatik çeviriden gelen soru — yönetici elle yazdıysa hiç doldurulmuyor. */
  let enSoru = "";

  const kullanilan = new Set<string>();
  const secenekler: AnketSecenegi[] = [];
  for (let i = 0; i < AZAMI_SECENEK; i++) {
    const etiket = String(formVerisi.get(`secenek${i}`) ?? "").trim().slice(0, ETIKET_SINIRI);
    if (!etiket) continue; // boş bırakılan kutu seçenek sayılmıyor
    const etiketEn = String(formVerisi.get(`secenekEn${i}`) ?? "").trim().slice(0, ETIKET_SINIRI);
    secenekler.push({
      id: secenekKimligi(etiket, kullanilan),
      etiket,
      etiketEn: etiketEn || undefined,
    });
  }

  if (secenekler.length < ASGARI_SECENEK) {
    return { hata: `En az ${ASGARI_SECENEK} seçenek yazmalısın.` };
  }

  /*
   * BOŞ BIRAKILAN İNGİLİZCE ALANLARI OTOMATİK DOLDUR.
   *
   * Anket metni veritabanında olduğu için `sozluk.ts` onu göremiyor; İngilizce
   * siteye geçen ziyaretçi anketi Türkçe görüyordu. Elle yazılan çevirilere
   * dokunulmuyor, yalnızca boşlar isteniyor.
   *
   * Çeviri başarısız olursa anket YİNE DE kaydediliyor: alan boş kalıyor ve
   * gösterimde Türkçesine düşüyor. Anketi kaydetmemek çok daha kötü olurdu.
   */
  const cevrilecek = [
    ...(soruEn ? [] : [soru]),
    ...secenekler.filter((s) => !s.etiketEn).map((s) => s.etiket),
  ];
  let cevrilemedi = false;

  if (cevrilecek.length > 0 && otomatikCeviriVarMi()) {
    const cevrilen = await ingilizceyeCevir(cevrilecek);
    let sira = 0;
    const soruCevirisi = soruEn ? null : cevrilen[sira++];
    for (const s of secenekler) {
      if (s.etiketEn) continue;
      s.etiketEn = cevrilen[sira++] ?? undefined;
    }
    if (soruCevirisi) enSoru = soruCevirisi;
    cevrilemedi = cevrilen.some((c) => c === null);
  }

  const anket: Anket = {
    id: crypto.randomUUID(),
    soru,
    soruEn: (soruEn || enSoru) || undefined,
    secenekler,
    yayinda: true,
    sira: -1,
    olusturmaTarihi: new Date().toISOString(),
  };

  try {
    await (await hesapDepoAl()).anketKaydet(anket);
  } catch {
    return { hata: "Anket kaydedilemedi, tekrar dene." };
  }

  tazele();
  const ceviriNotu = cevrilemedi
    ? " İngilizce çeviri yapılamadı — anket satırından elle yazabilirsin."
    : "";
  return {
    basari:
      `Anket yayınlandı — ${secenekler.length} seçenek. Eski anketler yayında kaldı.${ceviriNotu}`,
  };
}

/**
 * Anketi yayına alır / yayından kaldırır.
 *
 * Her anketin yayın durumu KENDİNE ait: birini yayına almak diğerlerini
 * indirmiyor, yayında olanların hepsi ana sayfada görünüyor.
 */
export async function anketYayinAction(
  _oncekiDurum: AnketDurumu,
  formVerisi: FormData,
): Promise<AnketDurumu> {
  if (!(await yoneticiMi())) return { hata: "Bu işlem için yönetici girişi gerekiyor." };

  const id = String(formVerisi.get("id") ?? "").trim();
  const depo = await hesapDepoAl();
  /*
   * Varsayılan anket kod dosyasında yaşıyor; veritabanında kaydı yoksa
   * yayından kaldırılamıyordu. İlk dokunuşta kaydı burada açılıyor.
   */
  const anket = (await depo.anketBul(id)) ?? (id === VARSAYILAN_ANKET.id ? VARSAYILAN_ANKET : null);
  if (!anket) return { hata: "Anket bulunamadı." };

  await depo.anketKaydet({ ...anket, yayinda: !anket.yayinda });

  tazele();
  return {
    basari: anket.yayinda ? "Anket yayından kaldırıldı. Oyları duruyor." : "Anket yayına alındı.",
  };
}

/** Anketi ve oylarını siler — geri alınamaz. */
export async function anketSilAction(
  _oncekiDurum: AnketDurumu,
  formVerisi: FormData,
): Promise<AnketDurumu> {
  if (!(await yoneticiMi())) return { hata: "Bu işlem için yönetici girişi gerekiyor." };

  const id = String(formVerisi.get("id") ?? "").trim();
  const depo = await hesapDepoAl();
  const anket = await depo.anketBul(id);
  if (!anket) return { hata: "Anket bulunamadı." };

  await depo.anketSil(id);
  tazele();
  return { basari: `"${anket.soru}" ve oyları silindi.` };
}

/**
 * ANKETİN ANA SAYFADAKİ YERİ.
 *
 * Yönetici anketi kampanya kutucukları arasında sürükleyip bırakınca yeni
 * sırası buraya geliyor ve HERKESE öyle görünüyor. Varsayılan anket
 * veritabanında olmadığı için o sürüklenirse kaydı burada açılıyor.
 */
export async function anketSiraAction(
  _oncekiDurum: AnketDurumu,
  formVerisi: FormData,
): Promise<AnketDurumu> {
  if (!(await yoneticiMi())) return { hata: "Bu işlem için yönetici girişi gerekiyor." };

  const id = String(formVerisi.get("id") ?? "").trim();
  const ham = Number(formVerisi.get("sira"));
  if (!Number.isFinite(ham)) return { hata: "Geçersiz konum." };
  const sira = Math.max(-1, Math.min(Math.trunc(ham), 50));

  const depo = await hesapDepoAl();
  const anket = (await depo.anketBul(id)) ?? (id === VARSAYILAN_ANKET.id ? VARSAYILAN_ANKET : null);
  if (!anket) return { hata: "Anket bulunamadı." };

  await depo.anketKaydet({ ...anket, sira });
  tazele();
  return { basari: "Anketin yeri güncellendi." };
}
