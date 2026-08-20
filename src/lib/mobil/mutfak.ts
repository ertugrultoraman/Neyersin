import crypto from "node:crypto";

import { bolumBul, bolumCoz, mutfakBolumleri, VARSAYILAN_BOLUM } from "@/content/mutfak-bolumleri";
import { acikMi } from "../calisma-saatleri";
import { saatleriAl } from "../calisma-saatleri-depo";
import { depoAl } from "../depo";
import type { KayitliSiparis } from "../depo/tipler";
import { hesapDepoAl, type MutfakUrunu } from "../hesaplar";
import { mutfakUrunleri } from "../mutfak-menusu";
import { restoranCoz } from "../restoran-listesi";
import { sefinSiparisleri } from "../sef-siparisleri";
import { calismayaAcikMi } from "../siparis";
import type {
  MutfakBolumuDto,
  MutfakMenusuDto,
  MutfakOzetiDto,
  MutfakSiparisDto,
  MutfakUrunDto,
  UrunKaydetGirdisi,
} from "./tipler";

/**
 * MUTFAK PANELİ — şefin/işletmenin uygulamadaki ekranı.
 *
 * Web'deki /panel ile AYNI kaynaklardan besleniyor: sipariş listesi
 * `sefinSiparisleri`, "hazır denebilir mi" kuralı `calismayaAcikMi`. Uçlar
 * kendi mantığını kursaydı, iki ekran aynı siparişte farklı şey söylerdi —
 * telefonda hazır yapılabilen bir sipariş sitede kilitli görünürdü.
 */

/** Sipariş kaydını mutfağın göreceği hâle indirger. */
export function mutfakSiparisi(s: KayitliSiparis): MutfakSiparisDto {
  return {
    siparisNo: s.siparisNo,
    durum: s.durum,
    musteriAdi: s.musteri?.adSoyad ?? "",
    /* Semt = ilçe/mahalle. Açık adres mutfağa HİÇ gönderilmiyor. */
    semt: [s.adres?.mahalle, s.adres?.ilce].filter(Boolean).join(", "),
    kalemler: s.kalemler.map((k) => ({
      ad: k.ad,
      adet: k.adet,
      ...(k.ekstralar && k.ekstralar.length > 0
        ? { ekstralar: k.ekstralar.map((e) => e.ad) }
        : {}),
    })),
    toplam: s.tutarlar.toplam,
    ...(s.not?.trim() ? { not: s.not.trim() } : {}),
    olusturmaTarihi: s.olusturmaTarihi,
    hazirYapilabilir: s.durum !== "hazir" && calismayaAcikMi(s),
  };
}

export async function mutfakSiparisleri(
  restoranSlug: string | undefined,
  eposta: string,
): Promise<MutfakSiparisDto[]> {
  const depo = await depoAl();
  const liste = await sefinSiparisleri(depo, restoranSlug, eposta);
  return liste.map(mutfakSiparisi);
}

/** İstanbul saatiyle bugünün tarihi (YYYY-MM-DD). */
function bugunIstanbul(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function ayniGunMu(iso: string, gun: string): boolean {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return false;
  return (
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(t) === gun
  );
}

export async function mutfakOzeti(
  restoranSlug: string,
  eposta: string,
): Promise<MutfakOzetiDto> {
  const [depo, restoran, urunler, saatler] = await Promise.all([
    depoAl(),
    restoranCoz(restoranSlug),
    mutfakUrunleri(restoranSlug),
    saatleriAl(restoranSlug),
  ]);

  const siparisler = await sefinSiparisleri(depo, restoranSlug, eposta);
  const bugun = bugunIstanbul();
  const bugunkuler = siparisler.filter((s) => ayniGunMu(s.olusturmaTarihi, bugun));

  return {
    restoranSlug,
    restoranAdi: restoran?.ad ?? restoranSlug,
    bugunSiparis: bugunkuler.length,
    /*
     * CİRO İPTALLERİ SAYMIYOR: iptal edilmiş sipariş için para geçmiyor ve
     * "bugün ne kazandım" sorusunun cevabına girmesi yanlış olurdu.
     */
    bugunCiro: bugunkuler
      .filter((s) => s.durum !== "iptal" && s.durum !== "odeme-basarisiz")
      .reduce((t, s) => t + s.tutarlar.toplam, 0),
    /* Bekleyen = mutfağın hâlâ yapacak işi olan sipariş. */
    bekleyen: siparisler.filter((s) => s.durum !== "hazir" && calismayaAcikMi(s)).length,
    /* Fiyatı girilmemiş ürün: 0 TL. Menüde "fiyat yakında" görünüyor ve
       sepete eklenemiyor (bkz. lib/mutfak-menusu → taslak). */
    taslakUrun: urunler.filter((u) => u.fiyat <= 0).length,
    acik: acikMi(saatler).acik,
  };
}

/* --------------------------------------------------------------------------
 * Menü yönetimi
 * ----------------------------------------------------------------------- */

/** Tek ürün için üst sınır — web'deki fiyat tavanının aynısı. */
export const FIYAT_TAVANI = 5000;
const AD_SINIRI = 80;
const ACIKLAMA_SINIRI = 240;
const BIRIM_SINIRI = 40;

export function bolumListesi(): MutfakBolumuDto[] {
  return [...mutfakBolumleri]
    .sort((a, b) => a.sira - b.sira)
    .map((b) => ({
      id: b.id,
      ad: b.ad,
      aciklama: b.aciklama,
      ornek: b.ornek,
      birimliMi: Boolean(b.birimliMi),
    }));
}

function urunDto(u: MutfakUrunu): MutfakUrunDto {
  return {
    id: u.id,
    ad: u.ad,
    aciklama: u.aciklama,
    bolum: u.bolum,
    bolumAdi: bolumCoz(u.bolum).ad,
    fiyat: u.fiyat,
    ...(u.birim ? { birim: u.birim } : {}),
    ...(u.gorselUrl ? { gorselUrl: u.gorselUrl } : {}),
    yayinda: u.yayinda,
    ...(u.bekleyenFiyat ? { bekleyenFiyat: u.bekleyenFiyat } : {}),
  };
}

export async function mutfakMenusuYonetim(restoranSlug: string): Promise<MutfakMenusuDto> {
  const urunler = await mutfakUrunleri(restoranSlug);
  return {
    bolumler: bolumListesi(),
    /* Bölüm sırası, sonra ad: panelde her açılışta aynı düzen. */
    urunler: urunler
      .map(urunDto)
      .sort((a, b) => a.bolumAdi.localeCompare(b.bolumAdi, "tr") || a.ad.localeCompare(b.ad, "tr")),
  };
}

/** "180,50" → 180. Geçersiz ya da eksi değer 0 (fiyat yakında). */
export function fiyatOku(ham: unknown): number {
  const sayi = Number(String(ham ?? "").replace(/[^\d,.-]/g, "").replace(",", "."));
  if (!Number.isFinite(sayi) || sayi <= 0) return 0;
  return Math.min(Math.round(sayi), FIYAT_TAVANI);
}

/**
 * Ürün kaydı — web'deki `urunKaydetAction` ile aynı kurallar.
 *
 * DÜZENLEMEDE ürünün gerçekten bu mutfağa ait olduğu doğrulanıyor; aksi hâlde
 * istekteki kimlik değiştirilerek başka bir mutfağın ürünü ele geçirilebilirdi.
 *
 * FOTOĞRAF BU UÇTAN GEÇMİYOR: dosya yüklemesi ayrı bir uçta (multipart).
 * Mevcut fotoğraf korunuyor — kaydetmek onu silmiyor.
 */
export async function urunKaydet(
  restoranSlug: string,
  girdi: UrunKaydetGirdisi,
): Promise<{ basarili: true; urun: MutfakUrunDto } | { basarili: false; hata: string }> {
  const ad = (girdi.ad ?? "").trim().slice(0, AD_SINIRI);
  if (ad.length < 2) return { basarili: false, hata: "Ürün adı en az 2 karakter olmalı." };

  const bolum = bolumBul(girdi.bolum)?.id ?? VARSAYILAN_BOLUM;
  const depo = await hesapDepoAl();
  const simdi = new Date().toISOString();

  let mevcut: MutfakUrunu | null = null;
  if (girdi.id) {
    mevcut = await depo.urunBul(girdi.id);
    if (!mevcut || mevcut.restoranSlug !== restoranSlug) {
      return { basarili: false, hata: "Düzenlenecek ürün bulunamadı." };
    }
  }

  const urun: MutfakUrunu = {
    id: mevcut?.id ?? crypto.randomUUID(),
    restoranSlug,
    bolum,
    ad,
    aciklama: (girdi.aciklama ?? "").trim().slice(0, ACIKLAMA_SINIRI),
    fiyat: fiyatOku(girdi.fiyat),
    ...(mevcut?.gorselUrl ? { gorselUrl: mevcut.gorselUrl } : {}),
    ...((girdi.birim ?? "").trim()
      ? { birim: (girdi.birim ?? "").trim().slice(0, BIRIM_SINIRI) }
      : {}),
    yayinda: girdi.yayinda !== false,
    olusturmaTarihi: mevcut?.olusturmaTarihi ?? simdi,
    guncellemeTarihi: simdi,
  };

  await depo.urunKaydet(urun);
  return { basarili: true, urun: urunDto(urun) };
}
