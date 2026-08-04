import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  Anket,
  AnketOyu,
  KategoriGorseli,
  Basvuru,
  DestekTalebi,
  BasvuruDurumu,
  DogrulamaKodu,
  Hesap,
  HesapDepo,
  KodAmaci,
  MutfakUrunu,
  Rol,
  SefMutfagi,
  SefProfili,
  Yorum,
} from "./tipler";

/**
 * Dosya tabanlı hesap deposu — yerel geliştirme içindir.
 * Vercel'de dosya sistemi geçici olduğu için orada Postgres adaptörü devreye
 * girer (bkz. hesaplar/index.ts).
 */
const KLASOR = process.env.VERI_KLASORU ?? ".veri";
const DOSYA = path.join(process.cwd(), KLASOR, "hesaplar.json");

type Icerik = {
  surum: 1;
  hesaplar: Hesap[];
  profiller: SefProfili[];
  basvurular: Basvuru[];
  mutfaklar: SefMutfagi[];
  yorumlar: Yorum[];
  destekler: DestekTalebi[];
  urunler: MutfakUrunu[];
  kodlar: DogrulamaKodu[];
  anketler: Anket[];
  anketOylari: AnketOyu[];
  kategoriGorselleri: KategoriGorseli[];
};

let kuyruk: Promise<unknown> = Promise.resolve();
function siraya<T>(is: () => Promise<T>): Promise<T> {
  const sonuc = kuyruk.then(is, is);
  kuyruk = sonuc.catch(() => {});
  return sonuc;
}

async function oku(): Promise<Icerik> {
  try {
    const cozulen = JSON.parse(await readFile(DOSYA, "utf8")) as Icerik;
    if (Array.isArray(cozulen?.hesaplar)) {
      return {
        surum: 1,
        hesaplar: cozulen.hesaplar,
        profiller: cozulen.profiller ?? [],
        basvurular: cozulen.basvurular ?? [],
        mutfaklar: cozulen.mutfaklar ?? [],
        yorumlar: cozulen.yorumlar ?? [],
        destekler: cozulen.destekler ?? [],
        urunler: cozulen.urunler ?? [],
        kodlar: cozulen.kodlar ?? [],
        anketler: cozulen.anketler ?? [],
        anketOylari: cozulen.anketOylari ?? [],
        kategoriGorselleri: cozulen.kategoriGorselleri ?? [],
      };
    }
  } catch {
    // dosya yok veya bozuk — boş içerikle devam
  }
  return {
    surum: 1,
    hesaplar: [],
    profiller: [],
    basvurular: [],
    mutfaklar: [],
    yorumlar: [],
    destekler: [],
    urunler: [],
    kodlar: [],
    anketler: [],
    anketOylari: [],
    kategoriGorselleri: [],
  };
}

async function yaz(icerik: Icerik): Promise<void> {
  await mkdir(path.dirname(DOSYA), { recursive: true });
  const gecici = `${DOSYA}.${process.pid}.tmp`;
  await writeFile(gecici, `${JSON.stringify(icerik, null, 2)}\n`, "utf8");
  await rename(gecici, DOSYA);
}

const kucuk = (e: string) => e.trim().toLowerCase();

export const dosyaHesapDepo: HesapDepo = {
  ad: "dosya",
  kalici: false,

  async hazirla() {
    await mkdir(path.dirname(DOSYA), { recursive: true });
  },

  async hesapBul(eposta) {
    const icerik = await oku();
    return icerik.hesaplar.find((h) => h.eposta === kucuk(eposta)) ?? null;
  },

  async hesapEkle(hesap) {
    await siraya(async () => {
      const icerik = await oku();
      const index = icerik.hesaplar.findIndex((h) => h.eposta === hesap.eposta);
      if (index >= 0) icerik.hesaplar[index] = hesap;
      else icerik.hesaplar.push(hesap);
      await yaz(icerik);
    });
  },

  async hesapSil(eposta) {
    await siraya(async () => {
      const icerik = await oku();
      icerik.hesaplar = icerik.hesaplar.filter((h) => h.eposta !== kucuk(eposta));
      await yaz(icerik);
    });
  },

  async hesaplariListele(rol?: Rol) {
    const icerik = await oku();
    return rol ? icerik.hesaplar.filter((h) => h.rol === rol) : icerik.hesaplar;
  },

  async restoranSahibi(restoranSlug) {
    const icerik = await oku();
    return icerik.hesaplar.find((h) => h.restoranSlug === restoranSlug) ?? null;
  },

  async profilAl(restoranSlug) {
    const icerik = await oku();
    return icerik.profiller.find((p) => p.restoranSlug === restoranSlug) ?? null;
  },

  async profilleriListele() {
    return (await oku()).profiller;
  },

  async profilKaydet(profil) {
    await siraya(async () => {
      const icerik = await oku();
      const index = icerik.profiller.findIndex((p) => p.restoranSlug === profil.restoranSlug);
      if (index >= 0) icerik.profiller[index] = profil;
      else icerik.profiller.push(profil);
      await yaz(icerik);
    });
  },

  async basvuruEkle(basvuru) {
    await siraya(async () => {
      const icerik = await oku();
      icerik.basvurular.push(basvuru);
      await yaz(icerik);
    });
  },

  async basvuruBul(id) {
    const icerik = await oku();
    return icerik.basvurular.find((b) => b.id === id) ?? null;
  },

  async basvuruBulEposta(eposta) {
    const icerik = await oku();
    // En yeni başvuru geçerlidir — kişi reddedildikten sonra tekrar başvurabilir.
    return (
      [...icerik.basvurular]
        .filter((b) => b.eposta === kucuk(eposta))
        .sort((a, b) => b.olusturmaTarihi.localeCompare(a.olusturmaTarihi))[0] ?? null
    );
  },

  async basvurulariListele(durum?: BasvuruDurumu) {
    const icerik = await oku();
    const liste = durum ? icerik.basvurular.filter((b) => b.durum === durum) : icerik.basvurular;
    return [...liste].sort((a, b) => b.olusturmaTarihi.localeCompare(a.olusturmaTarihi));
  },

  async basvuruGuncelle(basvuru) {
    await siraya(async () => {
      const icerik = await oku();
      const index = icerik.basvurular.findIndex((b) => b.id === basvuru.id);
      if (index >= 0) icerik.basvurular[index] = basvuru;
      await yaz(icerik);
    });
  },

  async yorumEkle(yorum) {
    await siraya(async () => {
      const icerik = await oku();
      icerik.yorumlar.push(yorum);
      await yaz(icerik);
    });
  },

  async yorumlariListele(restoranSlug) {
    const icerik = await oku();
    const liste = restoranSlug
      ? icerik.yorumlar.filter((y) => y.restoranSlug === restoranSlug)
      : icerik.yorumlar;
    return [...liste].sort((a, b) => b.tarih.localeCompare(a.tarih));
  },

  async yorumBul(id) {
    return (await oku()).yorumlar.find((y) => y.id === id) ?? null;
  },

  async yorumSil(id) {
    await siraya(async () => {
      const icerik = await oku();
      icerik.yorumlar = icerik.yorumlar.filter((y) => y.id !== id);
      await yaz(icerik);
    });
  },

  async yorumYanitla(id, yanit) {
    await siraya(async () => {
      const icerik = await oku();
      const yorum = icerik.yorumlar.find((y) => y.id === id);
      if (!yorum) return;
      yorum.yanit = yanit;
      yorum.yanitTarihi = yanit ? new Date().toISOString() : undefined;
      await yaz(icerik);
    });
  },

  async anketKaydet(anket) {
    await siraya(async () => {
      const icerik = await oku();
      const index = icerik.anketler.findIndex((a) => a.id === anket.id);
      if (index >= 0) icerik.anketler[index] = anket;
      else icerik.anketler.push(anket);
      await yaz(icerik);
    });
  },

  async anketleriListele() {
    return [...(await oku()).anketler].sort((a, b) =>
      b.olusturmaTarihi.localeCompare(a.olusturmaTarihi),
    );
  },

  async anketBul(id) {
    return (await oku()).anketler.find((a) => a.id === id) ?? null;
  },

  async anketSil(id) {
    await siraya(async () => {
      const icerik = await oku();
      icerik.anketler = icerik.anketler.filter((a) => a.id !== id);
      // Anket silinip oyları kalırsa sonuç sayfası sahipsiz oylarla şişerdi.
      icerik.anketOylari = icerik.anketOylari.filter((o) => o.anketId !== id);
      await yaz(icerik);
    });
  },

  async anketOyVer(oy) {
    await siraya(async () => {
      const icerik = await oku();
      // Aynı seçmen aynı ankete tekrar oy verirse eskisi güncellenir.
      const index = icerik.anketOylari.findIndex(
        (o) => o.secmen === oy.secmen && (o.anketId ?? "varsayilan") === oy.anketId,
      );
      if (index >= 0) icerik.anketOylari[index] = oy;
      else icerik.anketOylari.push(oy);
      await yaz(icerik);
    });
  },

  async anketOylariListele(anketId) {
    const hepsi = (await oku()).anketOylari.map((o) => ({
      ...o,
      anketId: o.anketId ?? "varsayilan",
    }));
    return hepsi
      .filter((o) => !anketId || o.anketId === anketId)
      .sort((a, b) => b.tarih.localeCompare(a.tarih));
  },

  async anketOyumuBul(anketId, secmen) {
    return (
      (await oku()).anketOylari.find(
        (o) => o.secmen === secmen && (o.anketId ?? "varsayilan") === anketId,
      ) ?? null
    );
  },

  async kategoriGorseliKaydet(gorsel) {
    await siraya(async () => {
      const icerik = await oku();
      const index = icerik.kategoriGorselleri.findIndex((g) => g.slug === gorsel.slug);
      if (index >= 0) icerik.kategoriGorselleri[index] = gorsel;
      else icerik.kategoriGorselleri.push(gorsel);
      await yaz(icerik);
    });
  },

  async kategoriGorselleriListele() {
    return (await oku()).kategoriGorselleri;
  },

  async kategoriGorseliSil(slug) {
    await siraya(async () => {
      const icerik = await oku();
      icerik.kategoriGorselleri = icerik.kategoriGorselleri.filter((g) => g.slug !== slug);
      await yaz(icerik);
    });
  },

  async siparisYorumlandiMi(siparisNo) {
    const icerik = await oku();
    return icerik.yorumlar.some((y) => y.siparisNo === siparisNo);
  },

  async mutfakEkle(mutfak) {
    await siraya(async () => {
      const icerik = await oku();
      const index = icerik.mutfaklar.findIndex((m) => m.slug === mutfak.slug);
      if (index >= 0) icerik.mutfaklar[index] = mutfak;
      else icerik.mutfaklar.push(mutfak);
      await yaz(icerik);
    });
  },

  async mutfakBul(slug) {
    const icerik = await oku();
    return icerik.mutfaklar.find((m) => m.slug === slug) ?? null;
  },

  async mutfakSil(slug) {
    await siraya(async () => {
      const icerik = await oku();
      icerik.mutfaklar = icerik.mutfaklar.filter((m) => m.slug !== slug);
      icerik.profiller = icerik.profiller.filter((p) => p.restoranSlug !== slug);
      // Mutfak kapanınca ürünleri de gitsin — sahipsiz ürün listede asılı kalmasın.
      icerik.urunler = icerik.urunler.filter((u) => u.restoranSlug !== slug);
      await yaz(icerik);
    });
  },

  async mutfaklariListele() {
    return (await oku()).mutfaklar;
  },

  async destekEkle(talep) {
    await siraya(async () => {
      const icerik = await oku();
      icerik.destekler.unshift(talep);
      await yaz(icerik);
    });
  },

  async destekListele(durum) {
    const hepsi = (await oku()).destekler;
    return durum ? hepsi.filter((t) => t.durum === durum) : hepsi;
  },

  async destekGuncelle(talep) {
    await siraya(async () => {
      const icerik = await oku();
      icerik.destekler = icerik.destekler.map((t) => (t.id === talep.id ? talep : t));
      await yaz(icerik);
    });
  },

  async urunKaydet(urun) {
    await siraya(async () => {
      const icerik = await oku();
      const index = icerik.urunler.findIndex((u) => u.id === urun.id);
      if (index >= 0) icerik.urunler[index] = urun;
      else icerik.urunler.push(urun);
      await yaz(icerik);
    });
  },

  async urunBul(id) {
    return (await oku()).urunler.find((u) => u.id === id) ?? null;
  },

  async urunSil(id) {
    await siraya(async () => {
      const icerik = await oku();
      icerik.urunler = icerik.urunler.filter((u) => u.id !== id);
      await yaz(icerik);
    });
  },

  async urunleriListele(restoranSlug) {
    const hepsi = (await oku()).urunler;
    const liste = restoranSlug ? hepsi.filter((u) => u.restoranSlug === restoranSlug) : hepsi;
    // Eklenme sırası korunur; bölüme göre gruplama görüntüleme katmanında yapılır.
    return [...liste].sort((a, b) => a.olusturmaTarihi.localeCompare(b.olusturmaTarihi));
  },

  async kodKaydet(kod) {
    await siraya(async () => {
      const icerik = await oku();
      const index = icerik.kodlar.findIndex((k) => k.id === kod.id);
      if (index >= 0) icerik.kodlar[index] = kod;
      else icerik.kodlar.push(kod);
      // Liste sonsuza kadar büyümesin: en yeni 500 kayıt yeter.
      if (icerik.kodlar.length > 500) icerik.kodlar = icerik.kodlar.slice(-500);
      await yaz(icerik);
    });
  },

  async sonKodBul(eposta, amac: KodAmaci) {
    const icerik = await oku();
    return (
      [...icerik.kodlar]
        .filter((k) => k.eposta === kucuk(eposta) && k.amac === amac && !k.kullanildi)
        .sort((a, b) => b.olusturmaTarihi.localeCompare(a.olusturmaTarihi))[0] ?? null
    );
  },

  async kodlariListele() {
    return [...(await oku()).kodlar].sort((a, b) =>
      b.olusturmaTarihi.localeCompare(a.olusturmaTarihi),
    );
  },

  async kodlariTuket(eposta, amac: KodAmaci) {
    await siraya(async () => {
      const icerik = await oku();
      icerik.kodlar = icerik.kodlar.map((k) =>
        k.eposta === kucuk(eposta) && k.amac === amac ? { ...k, kullanildi: true } : k,
      );
      await yaz(icerik);
    });
  },
};
