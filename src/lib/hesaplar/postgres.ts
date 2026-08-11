import postgres from "postgres";

import type {
  Anket,
  AnketOyu,
  AnketSecenegi,
  Basvuru,
  BasvuruDurumu,
  BasvuruTuru,
  DestekTalebi,
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
 * Postgres hesap deposu — DATABASE_URL tanımlıysa devreye girer.
 * Sipariş deposuyla aynı bağlantı ayarlarını kullanır ama kendi havuzunu açar;
 * iki modülün birbirine bağımlı olmaması sürüm yükseltmelerini kolaylaştırıyor.
 */
let baglanti: ReturnType<typeof postgres> | null = null;
let semaSozu: Promise<void> | null = null;

function sql() {
  if (!baglanti) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL tanımlı değil.");
    baglanti = postgres(url, {
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: url.includes("sslmode=disable") ? false : "require",
    });
  }
  return baglanti;
}

/**
 * Şema hazırlığı SÖZ olarak saklanıyor (bkz. depo/postgres.ts'teki aynı not).
 *
 * Buradaki DDL bloğu ~200 satır; eşzamanlı çağrılar bayrağı `false` görüp
 * hepsini yeniden çalıştırdığında soğuk ilk istek kabul edilemez hâle
 * geliyordu. İkinci çağıran artık aynı işi tekrarlamıyor, bitmesini bekliyor.
 */
function semayiHazirla(): Promise<void> {
  semaSozu ??= semayiKur().catch((hata) => {
    semaSozu = null;
    throw hata;
  });
  return semaSozu;
}

async function semayiKur() {
  const q = sql();
  await q`
    CREATE TABLE IF NOT EXISTS hesaplar (
      eposta            TEXT PRIMARY KEY,
      ad                TEXT NOT NULL,
      parola_hash       TEXT NOT NULL,
      rol               TEXT NOT NULL,
      restoran_slug     TEXT UNIQUE,
      olusturma_tarihi  TIMESTAMPTZ NOT NULL
    )
  `;
  // Sonradan eklenen kolon — mevcut kurulumlar için güvenli göç.
  await q`ALTER TABLE hesaplar ADD COLUMN IF NOT EXISTS telefon TEXT`;
  /*
   * ÇOK KULLANICILI İŞLETME. `restoran_slug` UNIQUE'ti: bir mutfağa yalnızca
   * tek hesap bağlanabiliyordu. İşletmenin kasa ve mutfak çalışanları aynı
   * mutfağa bağlanacağı için kısıt kaldırılıyor.
   *
   * Şef mutfaklarında tekliği KOD sürdürüyor (hesabuOlustur / basvuruOnayla
   * yeni slug üretiyor); kısıt zaten bir güvenlik sınırı değil, kaza
   * engelleyicisiydi.
   */
  await q`ALTER TABLE hesaplar DROP CONSTRAINT IF EXISTS hesaplar_restoran_slug_key`;
  await q`ALTER TABLE hesaplar ADD COLUMN IF NOT EXISTS isletme_yetkisi TEXT`;
  /* Slug'a göre arama artık birden fazla satır dönebiliyor. */
  await q`CREATE INDEX IF NOT EXISTS hesaplar_restoran_slug ON hesaplar (restoran_slug)`;
  await q`
    CREATE TABLE IF NOT EXISTS sef_profilleri (
      restoran_slug      TEXT PRIMARY KEY,
      biyografi          TEXT,
      sertifikalar       TEXT,
      uzmanlik           TEXT,
      slogan             TEXT,
      iletisim           TEXT,
      guncelleme_tarihi  TIMESTAMPTZ NOT NULL
    )
  `;
  /* Kuryenin siparisi alacagi adres — sonradan eklendi, guvenli goc. */
  await q`ALTER TABLE sef_profilleri ADD COLUMN IF NOT EXISTS alim_adresi TEXT`;
  await q`ALTER TABLE sef_profilleri ADD COLUMN IF NOT EXISTS alim_telefonu TEXT`;
  /* Altin Sef — Sef Kasigi atma yetkisi, yalnizca yonetici veriyor. */
  await q`ALTER TABLE sef_profilleri ADD COLUMN IF NOT EXISTS altin_sef BOOLEAN NOT NULL DEFAULT FALSE`;
  await q`
    CREATE TABLE IF NOT EXISTS basvurular (
      id                TEXT PRIMARY KEY,
      ad                TEXT NOT NULL,
      telefon           TEXT NOT NULL,
      eposta            TEXT NOT NULL,
      tur               TEXT NOT NULL,
      mesaj             TEXT,
      parola_hash       TEXT NOT NULL DEFAULT '',
      durum             TEXT NOT NULL,
      atanan_restoran   TEXT,
      yonetici_notu     TEXT,
      olusturma_tarihi  TIMESTAMPTZ NOT NULL,
      guncelleme_tarihi TIMESTAMPTZ NOT NULL
    )
  `;
  // Sonradan eklenen kolon — mevcut kurulumlar için güvenli göç.
  await q`ALTER TABLE basvurular ADD COLUMN IF NOT EXISTS parola_hash TEXT NOT NULL DEFAULT ''`;
  await q`CREATE INDEX IF NOT EXISTS basvurular_eposta_idx ON basvurular (lower(eposta))`;
  await q`CREATE INDEX IF NOT EXISTS basvurular_durum_idx ON basvurular (durum)`;
  await q`
    CREATE TABLE IF NOT EXISTS sef_mutfaklari (
      slug              TEXT PRIMARY KEY,
      ad                TEXT NOT NULL,
      sef_turu          TEXT NOT NULL,
      semt              TEXT NOT NULL,
      sahip_eposta      TEXT NOT NULL,
      olusturma_tarihi  TIMESTAMPTZ NOT NULL
    )
  `;
  await q`
    CREATE TABLE IF NOT EXISTS yorumlar (
      id             TEXT PRIMARY KEY,
      restoran_slug  TEXT NOT NULL,
      siparis_no     TEXT NOT NULL UNIQUE,
      musteri_eposta TEXT NOT NULL,
      musteri_adi    TEXT NOT NULL,
      sicaklik       SMALLINT NOT NULL,
      teslimat_hizi  SMALLINT NOT NULL,
      tad            SMALLINT NOT NULL,
      metin          TEXT,
      tarih          TIMESTAMPTZ NOT NULL
    )
  `;
  await q`CREATE INDEX IF NOT EXISTS yorumlar_restoran_idx ON yorumlar (restoran_slug)`;
  /* Mutfağın yoruma cevabı — sonradan eklendi, güvenli göç. */
  await q`ALTER TABLE yorumlar ADD COLUMN IF NOT EXISTS yanit TEXT`;
  await q`ALTER TABLE yorumlar ADD COLUMN IF NOT EXISTS yanit_tarihi TIMESTAMPTZ`;
  await q`
    CREATE TABLE IF NOT EXISTS anketler (
      id               TEXT PRIMARY KEY,
      soru             TEXT NOT NULL,
      soru_en          TEXT,
      /* [{id, etiket, etiketEn}] — seçenek sayısı ankete göre değişiyor. */
      secenekler       JSONB NOT NULL,
      yayinda          BOOLEAN NOT NULL DEFAULT TRUE,
      sira             INTEGER NOT NULL DEFAULT -1,
      olusturma_tarihi TIMESTAMPTZ NOT NULL
    )
  `;
  await q`
    CREATE TABLE IF NOT EXISTS anket_oylari (
      id       TEXT PRIMARY KEY,
      /* Bir kişi bir oy: bu alan BENZERSIZ, aynı seçmen ikinci kez sayılmaz. */
      secmen   TEXT NOT NULL UNIQUE,
      secenek  TEXT NOT NULL,
      ad       TEXT,
      girisli  BOOLEAN NOT NULL DEFAULT FALSE,
      tarih    TIMESTAMPTZ NOT NULL
    )
  `;
  await q`CREATE INDEX IF NOT EXISTS anket_oylari_secenek_idx ON anket_oylari (secenek)`;
  /*
   * ÇOKLU ANKET GÖÇÜ.
   *
   * Önceden tek anket vardı, `secmen` tek başına benzersizdi. Artık kişi HER
   * ankette bir kez oy verebiliyor: benzersizlik (anket_id, secmen) ikilisine
   * taşınıyor. Eski oylar `varsayilan` anketine bağlanıyor — kaybolmuyorlar.
   */
  await q`ALTER TABLE anket_oylari ADD COLUMN IF NOT EXISTS anket_id TEXT NOT NULL DEFAULT 'varsayilan'`;
  await q`ALTER TABLE anket_oylari DROP CONSTRAINT IF EXISTS anket_oylari_secmen_key`;
  await q`
    CREATE UNIQUE INDEX IF NOT EXISTS anket_oylari_anket_secmen_idx
      ON anket_oylari (anket_id, secmen)
  `;
  await q`CREATE INDEX IF NOT EXISTS anket_oylari_anket_idx ON anket_oylari (anket_id)`;
  await q`
    CREATE TABLE IF NOT EXISTS kategori_gorselleri (
      slug              TEXT PRIMARY KEY,
      url               TEXT NOT NULL,
      guncelleme_tarihi TIMESTAMPTZ NOT NULL
    )
  `;
  /*
   * Şef kaşığı — şeften şefe takdir.
   * Birincil anahtar (veren, alan) ÇİFTİ: aynı şef aynı kişiye ikinci kez
   * kaşık atamaz. Kuralı uygulama katmanına bırakmak yeterli olmazdı;
   * eşzamanlı iki istek denetimi atlatıp iki satır yazabilirdi.
   */
  await q`
    CREATE TABLE IF NOT EXISTS sef_kasiklari (
      veren_slug  TEXT NOT NULL,
      alan_slug   TEXT NOT NULL,
      tarih       TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (veren_slug, alan_slug)
    )
  `;
  await q`CREATE INDEX IF NOT EXISTS sef_kasiklari_alan_idx ON sef_kasiklari (alan_slug)`;
  /*
   * Ana sayfa ızgarasındaki sürükle-bırak kutularının yeri.
   *
   * Anketin sırası kendi kaydında duruyordu; ikinci sürüklenebilir kutu
   * (Şef Kaşığı tanıtımı) gelince her kutuya ayrı tablo açmak yerine
   * anahtar/sıra çifti tutan tek bir yer açıldı.
   */
  await q`
    CREATE TABLE IF NOT EXISTS izgara_sirasi (
      anahtar TEXT PRIMARY KEY,
      sira    INTEGER NOT NULL
    )
  `;
  /*
   * BAŞVURU BELGELERİ — bakanlık evrakı, ruhsat, sertifika.
   *
   * İçerik veritabanında (BYTEA) tutuluyor. Vercel Blob bilerek
   * kullanılmadı: Blob yalnızca herkese açık URL veriyor ve bunlar kimlik
   * ve ruhsat belgeleri — tahmin edilmesi zor bir adresin arkasına
   * konulamaz. Boyut sınırı uygulama tarafında (bkz. lib/belge.ts).
   */
  await q`
    CREATE TABLE IF NOT EXISTS belgeler (
      id         TEXT PRIMARY KEY,
      sahip_tur  TEXT NOT NULL,
      sahip_id   TEXT NOT NULL,
      ad         TEXT NOT NULL,
      mime       TEXT NOT NULL,
      boyut      INTEGER NOT NULL,
      veri       BYTEA NOT NULL,
      tarih      TIMESTAMPTZ NOT NULL
    )
  `;
  await q`CREATE INDEX IF NOT EXISTS belgeler_sahip_idx ON belgeler (sahip_tur, sahip_id)`;
  await q`
    CREATE TABLE IF NOT EXISTS destek_talepleri (
      id                TEXT PRIMARY KEY,
      no                TEXT NOT NULL UNIQUE,
      konu              TEXT NOT NULL,
      mesaj             TEXT NOT NULL,
      siparis_no        TEXT,
      ad                TEXT NOT NULL,
      eposta            TEXT NOT NULL,
      telefon           TEXT,
      durum             TEXT NOT NULL,
      yanit             TEXT,
      olusturma_tarihi  TIMESTAMPTZ NOT NULL,
      guncelleme_tarihi TIMESTAMPTZ NOT NULL
    )
  `;
  await q`CREATE INDEX IF NOT EXISTS destek_durum_idx ON destek_talepleri (durum)`;
  await q`
    CREATE TABLE IF NOT EXISTS mutfak_urunleri (
      id                TEXT PRIMARY KEY,
      restoran_slug     TEXT NOT NULL,
      bolum             TEXT NOT NULL,
      ad                TEXT NOT NULL,
      aciklama          TEXT NOT NULL DEFAULT '',
      fiyat             NUMERIC(10,2) NOT NULL DEFAULT 0,
      birim             TEXT,
      yayinda           BOOLEAN NOT NULL DEFAULT TRUE,
      olusturma_tarihi  TIMESTAMPTZ NOT NULL,
      guncelleme_tarihi TIMESTAMPTZ NOT NULL
    )
  `;
  await q`CREATE INDEX IF NOT EXISTS mutfak_urunleri_slug_idx ON mutfak_urunleri (restoran_slug)`;
  /*
   * Fiyat onayı sonradan eklendi — mevcut kurulumlar için güvenli göç.
   * `bekleyen_fiyat` doluysa şef yeni fiyat talep etmiş, yönetici onayı
   * bekliyor demektir; `fiyat` o ana kadar değişmez.
   */
  await q`ALTER TABLE mutfak_urunleri ADD COLUMN IF NOT EXISTS bekleyen_fiyat NUMERIC(10,2)`;
  await q`ALTER TABLE mutfak_urunleri ADD COLUMN IF NOT EXISTS bekleyen_tarih TIMESTAMPTZ`;
  /* Urun fotografi — sonradan eklendi, guvenli goc. */
  await q`ALTER TABLE mutfak_urunleri ADD COLUMN IF NOT EXISTS gorsel_url TEXT`;
  /* Sabit menüden kopyalanmış (gölgelenmiş) ürünleri ayırt etmek için. */
  await q`ALTER TABLE mutfak_urunleri ADD COLUMN IF NOT EXISTS sabitten_mi BOOLEAN NOT NULL DEFAULT FALSE`;
  /* Yönetici onay ekranı yalnızca bekleyenleri çekiyor — indeksli olsun. */
  await q`
    CREATE INDEX IF NOT EXISTS mutfak_urunleri_bekleyen_idx
    ON mutfak_urunleri (bekleyen_tarih) WHERE bekleyen_fiyat IS NOT NULL
  `;
  /*
   * Mevcut hesaplar DOĞRULANMIŞ sayılır (DEFAULT TRUE): doğrulama özelliği
   * sonradan eklendi, eski kullanıcıları bir sabahında kilitlemek doğru olmaz.
   * Bundan sonra açılan hesaplar açıkça `false` ile yazılır.
   */
  await q`ALTER TABLE hesaplar ADD COLUMN IF NOT EXISTS eposta_dogrulandi BOOLEAN NOT NULL DEFAULT TRUE`;
  // Hesabin nasil acildigi: parola formu mu, Google ile mi.
  await q`ALTER TABLE hesaplar ADD COLUMN IF NOT EXISTS saglayici TEXT NOT NULL DEFAULT 'parola'`;
  /* Profil fotografi (Blob adresi) — sonradan eklendi, guvenli goc. */
  await q`ALTER TABLE hesaplar ADD COLUMN IF NOT EXISTS fotograf_url TEXT`;
  await q`
    CREATE TABLE IF NOT EXISTS dogrulama_kodlari (
      id                TEXT PRIMARY KEY,
      eposta            TEXT NOT NULL,
      amac              TEXT NOT NULL,
      kod_ozeti         TEXT NOT NULL,
      duz_kod           TEXT,
      deneme            SMALLINT NOT NULL DEFAULT 0,
      kullanildi        BOOLEAN NOT NULL DEFAULT FALSE,
      gonderildi        BOOLEAN NOT NULL DEFAULT FALSE,
      son_gecerlilik    TIMESTAMPTZ NOT NULL,
      olusturma_tarihi  TIMESTAMPTZ NOT NULL
    )
  `;
  await q`
    CREATE INDEX IF NOT EXISTS dogrulama_kodlari_eposta_idx
    ON dogrulama_kodlari (lower(eposta), amac)
  `;
}

type HesapSatiri = {
  eposta: string;
  ad: string;
  parola_hash: string;
  rol: string;
  telefon: string | null;
  restoran_slug: string | null;
  isletme_yetkisi: string | null;
  eposta_dogrulandi: boolean | null;
  saglayici: string | null;
  fotograf_url: string | null;
  olusturma_tarihi: Date;
};

function satirdanHesap(s: HesapSatiri): Hesap {
  return {
    eposta: s.eposta,
    ad: s.ad,
    parolaHash: s.parola_hash,
    rol: s.rol as Rol,
    telefon: s.telefon ?? undefined,
    restoranSlug: s.restoran_slug ?? undefined,
    isletmeYetkisi: (s.isletme_yetkisi as Hesap["isletmeYetkisi"]) ?? undefined,
    epostaDogrulandi: s.eposta_dogrulandi ?? true,
    saglayici: (s.saglayici as Hesap["saglayici"]) ?? "parola",
    fotografUrl: s.fotograf_url ?? undefined,
    olusturmaTarihi: new Date(s.olusturma_tarihi).toISOString(),
  };
}

type KodSatiri = {
  id: string;
  eposta: string;
  amac: string;
  kod_ozeti: string;
  duz_kod: string | null;
  deneme: number;
  kullanildi: boolean;
  gonderildi: boolean;
  son_gecerlilik: Date;
  olusturma_tarihi: Date;
};

function satirdanKod(s: KodSatiri): DogrulamaKodu {
  return {
    id: s.id,
    eposta: s.eposta,
    amac: s.amac as KodAmaci,
    kodOzeti: s.kod_ozeti,
    duzKod: s.duz_kod ?? undefined,
    deneme: Number(s.deneme),
    kullanildi: s.kullanildi,
    gonderildi: s.gonderildi,
    sonGecerlilik: new Date(s.son_gecerlilik).toISOString(),
    olusturmaTarihi: new Date(s.olusturma_tarihi).toISOString(),
  };
}

type ProfilSatiri = {
  restoran_slug: string;
  biyografi: string | null;
  sertifikalar: string | null;
  uzmanlik: string | null;
  slogan: string | null;
  alim_adresi: string | null;
  alim_telefonu: string | null;
  altin_sef: boolean | null;
  guncelleme_tarihi: Date;
};

/**
 * Profil kolonları TEK YERDE.
 *
 * İki sorgu kolonları ayrı ayrı sayıyordu ve `altin_sef` eklenince biri
 * güncellenip diğeri unutuldu — unvan veritabanında duruyor ama okunmuyordu,
 * yetki hiç görünmedi. Aynı listeyi paylaşınca yeni kolon iki sorguya da
 * kendiliğinden geliyor.
 */
const PROFIL_KOLONLARI =
  "restoran_slug, biyografi, sertifikalar, uzmanlik, slogan, alim_adresi, alim_telefonu, altin_sef, guncelleme_tarihi";

function satirdanProfil(s: ProfilSatiri): SefProfili {
  return {
    restoranSlug: s.restoran_slug,
    biyografi: s.biyografi ?? undefined,
    sertifikalar: s.sertifikalar ?? undefined,
    uzmanlik: s.uzmanlik ?? undefined,
    slogan: s.slogan ?? undefined,
    alimAdresi: s.alim_adresi ?? undefined,
    alimTelefonu: s.alim_telefonu ?? undefined,
    altinSef: s.altin_sef ?? false,
    guncellemeTarihi: new Date(s.guncelleme_tarihi).toISOString(),
  };
}

type BasvuruSatiri = {
  id: string;
  ad: string;
  telefon: string;
  eposta: string;
  tur: string;
  mesaj: string | null;
  parola_hash: string;
  durum: string;
  atanan_restoran: string | null;
  yonetici_notu: string | null;
  olusturma_tarihi: Date;
  guncelleme_tarihi: Date;
};

function satirdanBasvuru(s: BasvuruSatiri): Basvuru {
  return {
    id: s.id,
    ad: s.ad,
    telefon: s.telefon,
    eposta: s.eposta,
    tur: s.tur as BasvuruTuru,
    mesaj: s.mesaj ?? undefined,
    parolaHash: s.parola_hash ?? "",
    durum: s.durum as BasvuruDurumu,
    atananRestoran: s.atanan_restoran ?? undefined,
    yoneticiNotu: s.yonetici_notu ?? undefined,
    olusturmaTarihi: new Date(s.olusturma_tarihi).toISOString(),
    guncellemeTarihi: new Date(s.guncelleme_tarihi).toISOString(),
  };
}

type MutfakSatiri = {
  slug: string;
  ad: string;
  sef_turu: string;
  semt: string;
  sahip_eposta: string;
  olusturma_tarihi: Date;
};

function satirdanMutfak(s: MutfakSatiri): SefMutfagi {
  return {
    slug: s.slug,
    ad: s.ad,
    sefTuru: s.sef_turu as SefMutfagi["sefTuru"],
    semt: s.semt,
    sahipEposta: s.sahip_eposta,
    olusturmaTarihi: new Date(s.olusturma_tarihi).toISOString(),
  };
}

type DestekSatiri = {
  id: string;
  no: string;
  konu: string;
  mesaj: string;
  siparis_no: string | null;
  ad: string;
  eposta: string;
  telefon: string | null;
  durum: string;
  yanit: string | null;
  olusturma_tarihi: Date;
  guncelleme_tarihi: Date;
};

function satirdanDestek(s: DestekSatiri): DestekTalebi {
  return {
    id: s.id,
    no: s.no,
    konu: s.konu,
    mesaj: s.mesaj,
    siparisNo: s.siparis_no ?? undefined,
    ad: s.ad,
    eposta: s.eposta,
    telefon: s.telefon ?? undefined,
    durum: s.durum as DestekTalebi["durum"],
    yanit: s.yanit ?? undefined,
    olusturmaTarihi: new Date(s.olusturma_tarihi).toISOString(),
    guncellemeTarihi: new Date(s.guncelleme_tarihi).toISOString(),
  };
}

type UrunSatiri = {
  id: string;
  restoran_slug: string;
  bolum: string;
  ad: string;
  aciklama: string;
  fiyat: string;
  bekleyen_fiyat: string | null;
  bekleyen_tarih: Date | null;
  birim: string | null;
  gorsel_url: string | null;
  yayinda: boolean;
  sabitten_mi: boolean;
  olusturma_tarihi: Date;
  guncelleme_tarihi: Date;
};

function satirdanUrun(s: UrunSatiri): MutfakUrunu {
  return {
    id: s.id,
    restoranSlug: s.restoran_slug,
    bolum: s.bolum,
    ad: s.ad,
    aciklama: s.aciklama ?? "",
    // NUMERIC sürücüden metin olarak gelir — sayıya çevrilmezse fiyat "150.00" olur.
    fiyat: Number(s.fiyat),
    bekleyenFiyat: s.bekleyen_fiyat === null ? undefined : Number(s.bekleyen_fiyat),
    bekleyenTarih: s.bekleyen_tarih ? new Date(s.bekleyen_tarih).toISOString() : undefined,
    birim: s.birim ?? undefined,
    gorselUrl: s.gorsel_url ?? undefined,
    yayinda: s.yayinda,
    sabittenMi: s.sabitten_mi ?? false,
    olusturmaTarihi: new Date(s.olusturma_tarihi).toISOString(),
    guncellemeTarihi: new Date(s.guncelleme_tarihi).toISOString(),
  };
}

type YorumSatiri = {
  id: string;
  restoran_slug: string;
  siparis_no: string;
  musteri_eposta: string;
  musteri_adi: string;
  sicaklik: number;
  teslimat_hizi: number;
  tad: number;
  metin: string | null;
  yanit: string | null;
  yanit_tarihi: Date | null;
  tarih: Date;
};

function satirdanYorum(s: YorumSatiri): Yorum {
  return {
    id: s.id,
    restoranSlug: s.restoran_slug,
    siparisNo: s.siparis_no,
    musteriEposta: s.musteri_eposta,
    musteriAdi: s.musteri_adi,
    sicaklik: Number(s.sicaklik),
    teslimatHizi: Number(s.teslimat_hizi),
    tad: Number(s.tad),
    metin: s.metin ?? undefined,
    yanit: s.yanit ?? undefined,
    yanitTarihi: s.yanit_tarihi ? new Date(s.yanit_tarihi).toISOString() : undefined,
    tarih: new Date(s.tarih).toISOString(),
  };
}

type AnketSatiri = {
  id: string;
  anket_id: string | null;
  secmen: string;
  secenek: string;
  ad: string | null;
  girisli: boolean;
  tarih: Date;
};

function satirdanOy(s: AnketSatiri): AnketOyu {
  return {
    id: s.id,
    // Göçten önce yazılmış oylarda sütun yoktu; varsayılan ankete sayılıyorlar.
    anketId: s.anket_id ?? "varsayilan",
    secmen: s.secmen,
    secenek: s.secenek,
    ad: s.ad ?? undefined,
    girisli: s.girisli,
    tarih: new Date(s.tarih).toISOString(),
  };
}

type AnketKaydiSatiri = {
  id: string;
  soru: string;
  soru_en: string | null;
  secenekler: AnketSecenegi[];
  yayinda: boolean;
  sira: number;
  olusturma_tarihi: Date;
};

function satirdanAnket(s: AnketKaydiSatiri): Anket {
  return {
    id: s.id,
    soru: s.soru,
    soruEn: s.soru_en ?? undefined,
    secenekler: Array.isArray(s.secenekler) ? s.secenekler : [],
    yayinda: s.yayinda,
    sira: s.sira,
    olusturmaTarihi: new Date(s.olusturma_tarihi).toISOString(),
  };
}

export const postgresHesapDepo: HesapDepo = {
  ad: "postgres",
  kalici: true,

  async hazirla() {
    await semayiHazirla();
  },

  async hesapBul(eposta) {
    await semayiHazirla();
    const satirlar = await sql()<HesapSatiri[]>`
      SELECT * FROM hesaplar WHERE eposta = ${eposta.trim().toLowerCase()} LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanHesap(satirlar[0]) : null;
  },

  async hesapEkle(hesap) {
    await semayiHazirla();
    await sql()`
      INSERT INTO hesaplar
        (eposta, ad, parola_hash, rol, telefon, restoran_slug, isletme_yetkisi,
         eposta_dogrulandi, saglayici, olusturma_tarihi)
      VALUES (
        ${hesap.eposta}, ${hesap.ad}, ${hesap.parolaHash}, ${hesap.rol},
        ${hesap.telefon ?? null}, ${hesap.restoranSlug ?? null},
        ${hesap.isletmeYetkisi ?? null},
        ${hesap.epostaDogrulandi ?? false}, ${hesap.saglayici ?? "parola"},
        ${hesap.olusturmaTarihi}
      )
      ON CONFLICT (eposta) DO UPDATE SET
        ad                = EXCLUDED.ad,
        parola_hash       = EXCLUDED.parola_hash,
        rol               = EXCLUDED.rol,
        telefon           = EXCLUDED.telefon,
        restoran_slug     = EXCLUDED.restoran_slug,
        eposta_dogrulandi = EXCLUDED.eposta_dogrulandi,
        saglayici         = EXCLUDED.saglayici
    `;
  },

  async hesapSil(eposta) {
    await semayiHazirla();
    await sql()`DELETE FROM hesaplar WHERE eposta = ${eposta.trim().toLowerCase()}`;
  },

  async fotografKaydet(eposta, url) {
    await semayiHazirla();
    await sql()`
      UPDATE hesaplar SET fotograf_url = ${url ?? null}
      WHERE eposta = ${eposta.trim().toLowerCase()}
    `;
  },

  async hesaplariListele(rol?: Rol) {
    await semayiHazirla();
    const satirlar = rol
      ? await sql()<HesapSatiri[]>`
          SELECT * FROM hesaplar WHERE rol = ${rol} ORDER BY olusturma_tarihi DESC LIMIT 500
        `
      : await sql()<HesapSatiri[]>`
          SELECT * FROM hesaplar ORDER BY olusturma_tarihi DESC LIMIT 500
        `;
    return satirlar.map(satirdanHesap);
  },

  /*
   * SAHİP, çalışanlardan önce dönüyor. Bir mutfağa artık birden fazla hesap
   * bağlanabildiği için sırasız bir `LIMIT 1` işletmenin kasa çalışanını sahip
   * sanabilirdi — "alım adresin eksik" postası ona giderdi.
   *
   * `isletme_yetkisi` boş olan kayıtlar da sahip sayılıyor: alan sonradan
   * eklendi ve mevcut şef/işletme hesaplarının hepsi boş.
   */
  async restoranSahibi(restoranSlug) {
    await semayiHazirla();
    const satirlar = await sql()<HesapSatiri[]>`
      SELECT * FROM hesaplar
      WHERE restoran_slug = ${restoranSlug}
      ORDER BY (isletme_yetkisi = 'calisan') ASC, olusturma_tarihi ASC
      LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanHesap(satirlar[0]) : null;
  },

  async isletmeCalisanlari(restoranSlug) {
    await semayiHazirla();
    const satirlar = await sql()<HesapSatiri[]>`
      SELECT * FROM hesaplar
      WHERE restoran_slug = ${restoranSlug} AND isletme_yetkisi = 'calisan'
      ORDER BY olusturma_tarihi ASC
    `;
    return satirlar.map(satirdanHesap);
  },

  async profilAl(restoranSlug) {
    await semayiHazirla();
    const satirlar = await sql()<ProfilSatiri[]>`
      SELECT ${sql().unsafe(PROFIL_KOLONLARI)}
      FROM sef_profilleri WHERE restoran_slug = ${restoranSlug} LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanProfil(satirlar[0]) : null;
  },

  async profilleriListele() {
    await semayiHazirla();
    const satirlar = await sql()<ProfilSatiri[]>`
      SELECT ${sql().unsafe(PROFIL_KOLONLARI)}
      FROM sef_profilleri LIMIT 500
    `;
    return satirlar.map(satirdanProfil);
  },

  /**
   * KOLON LİSTESİ ile değer listesi birebir aynı olmalı.
   *
   * Burada 6 kolon sayılıp 8 değer veriliyordu (alım adresi/telefonu sonradan
   * eklenmiş ama kolon listesine yazılmamış): Postgres "INSERT has more
   * expressions than target columns" diyerek her kaydı reddediyordu, yani
   * şefler profillerini HİÇ kaydedemiyordu. Yeni alan eklerken iki listeye de
   * yazmak şart.
   */
  async profilKaydet(profil) {
    await semayiHazirla();
    await sql()`
      INSERT INTO sef_profilleri (
        restoran_slug, biyografi, sertifikalar, uzmanlik, slogan,
        alim_adresi, alim_telefonu, altin_sef, guncelleme_tarihi
      ) VALUES (
        ${profil.restoranSlug}, ${profil.biyografi ?? null}, ${profil.sertifikalar ?? null},
        ${profil.uzmanlik ?? null}, ${profil.slogan ?? null}, ${profil.alimAdresi ?? null},
        ${profil.alimTelefonu ?? null}, ${profil.altinSef ?? false}, ${profil.guncellemeTarihi}
      )
      ON CONFLICT (restoran_slug) DO UPDATE SET
        biyografi         = EXCLUDED.biyografi,
        sertifikalar      = EXCLUDED.sertifikalar,
        uzmanlik          = EXCLUDED.uzmanlik,
        slogan            = EXCLUDED.slogan,
        alim_adresi       = EXCLUDED.alim_adresi,
        alim_telefonu     = EXCLUDED.alim_telefonu,
        altin_sef         = EXCLUDED.altin_sef,
        guncelleme_tarihi = EXCLUDED.guncelleme_tarihi
    `;
  },

  async basvuruEkle(b) {
    await semayiHazirla();
    await sql()`
      INSERT INTO basvurular (
        id, ad, telefon, eposta, tur, mesaj, parola_hash, durum, atanan_restoran, yonetici_notu,
        olusturma_tarihi, guncelleme_tarihi
      ) VALUES (
        ${b.id}, ${b.ad}, ${b.telefon}, ${b.eposta}, ${b.tur}, ${b.mesaj ?? null}, ${b.parolaHash},
        ${b.durum}, ${b.atananRestoran ?? null}, ${b.yoneticiNotu ?? null},
        ${b.olusturmaTarihi}, ${b.guncellemeTarihi}
      )
    `;
  },

  async basvuruBul(id) {
    await semayiHazirla();
    const satirlar = await sql()<BasvuruSatiri[]>`
      SELECT * FROM basvurular WHERE id = ${id} LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanBasvuru(satirlar[0]) : null;
  },

  async basvuruBulEposta(eposta) {
    await semayiHazirla();
    const satirlar = await sql()<BasvuruSatiri[]>`
      SELECT * FROM basvurular WHERE lower(eposta) = ${eposta.trim().toLowerCase()}
      ORDER BY olusturma_tarihi DESC LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanBasvuru(satirlar[0]) : null;
  },

  async basvurulariListele(durum?: BasvuruDurumu) {
    await semayiHazirla();
    const satirlar = durum
      ? await sql()<BasvuruSatiri[]>`
          SELECT * FROM basvurular WHERE durum = ${durum}
          ORDER BY olusturma_tarihi DESC LIMIT 300
        `
      : await sql()<BasvuruSatiri[]>`
          SELECT * FROM basvurular ORDER BY olusturma_tarihi DESC LIMIT 300
        `;
    return satirlar.map(satirdanBasvuru);
  },

  async basvuruGuncelle(b) {
    await semayiHazirla();
    await sql()`
      UPDATE basvurular SET
        durum             = ${b.durum},
        atanan_restoran   = ${b.atananRestoran ?? null},
        yonetici_notu     = ${b.yoneticiNotu ?? null},
        guncelleme_tarihi = ${b.guncellemeTarihi}
      WHERE id = ${b.id}
    `;
  },

  async yorumEkle(y) {
    await semayiHazirla();
    await sql()`
      INSERT INTO yorumlar (
        id, restoran_slug, siparis_no, musteri_eposta, musteri_adi,
        sicaklik, teslimat_hizi, tad, metin, tarih
      ) VALUES (
        ${y.id}, ${y.restoranSlug}, ${y.siparisNo}, ${y.musteriEposta}, ${y.musteriAdi},
        ${y.sicaklik}, ${y.teslimatHizi}, ${y.tad}, ${y.metin ?? null}, ${y.tarih}
      )
      ON CONFLICT (siparis_no) DO NOTHING
    `;
  },

  async yorumBul(id) {
    await semayiHazirla();
    const satirlar = await sql()<YorumSatiri[]>`
      SELECT * FROM yorumlar WHERE id = ${id} LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanYorum(satirlar[0]) : null;
  },

  async anketKaydet(anket) {
    await semayiHazirla();
    await sql()`
      INSERT INTO anketler (id, soru, soru_en, secenekler, yayinda, sira, olusturma_tarihi)
      VALUES (${anket.id}, ${anket.soru}, ${anket.soruEn ?? null},
              ${sql().json(anket.secenekler)}, ${anket.yayinda}, ${anket.sira},
              ${anket.olusturmaTarihi})
      ON CONFLICT (id) DO UPDATE SET
        soru       = EXCLUDED.soru,
        soru_en    = EXCLUDED.soru_en,
        secenekler = EXCLUDED.secenekler,
        yayinda    = EXCLUDED.yayinda,
        sira       = EXCLUDED.sira
    `;
  },

  async anketleriListele() {
    await semayiHazirla();
    const satirlar = await sql()<AnketKaydiSatiri[]>`
      SELECT * FROM anketler ORDER BY olusturma_tarihi DESC LIMIT 200
    `;
    return satirlar.map(satirdanAnket);
  },

  async anketBul(id) {
    await semayiHazirla();
    const satirlar = await sql()<AnketKaydiSatiri[]>`
      SELECT * FROM anketler WHERE id = ${id} LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanAnket(satirlar[0]) : null;
  },

  async anketSil(id) {
    await semayiHazirla();
    // Oylar önce gidiyor; anket silinip oyları kalırsa sonuç sayfası şişerdi.
    await sql()`DELETE FROM anket_oylari WHERE anket_id = ${id}`;
    await sql()`DELETE FROM anketler WHERE id = ${id}`;
  },

  async anketOyVer(oy) {
    await semayiHazirla();
    /*
     * Aynı seçmen aynı ankete tekrar oy verirse yeni kayıt açılmıyor, eskisi
     * güncelleniyor — toplam sayı şişmesin, fikrini değiştirmek de mümkün olsun.
     */
    await sql()`
      INSERT INTO anket_oylari (id, anket_id, secmen, secenek, ad, girisli, tarih)
      VALUES (${oy.id}, ${oy.anketId}, ${oy.secmen}, ${oy.secenek}, ${oy.ad ?? null},
              ${oy.girisli}, ${oy.tarih})
      ON CONFLICT (anket_id, secmen) DO UPDATE SET
        secenek = EXCLUDED.secenek,
        ad      = EXCLUDED.ad,
        girisli = EXCLUDED.girisli,
        tarih   = EXCLUDED.tarih
    `;
  },

  async anketOylariListele(anketId) {
    await semayiHazirla();
    const satirlar = anketId
      ? await sql()<AnketSatiri[]>`
          SELECT * FROM anket_oylari WHERE anket_id = ${anketId}
          ORDER BY tarih DESC LIMIT 5000
        `
      : await sql()<AnketSatiri[]>`
          SELECT * FROM anket_oylari ORDER BY tarih DESC LIMIT 5000
        `;
    return satirlar.map(satirdanOy);
  },

  async anketOyumuBul(anketId, secmen) {
    await semayiHazirla();
    const satirlar = await sql()<AnketSatiri[]>`
      SELECT * FROM anket_oylari
      WHERE anket_id = ${anketId} AND secmen = ${secmen} LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanOy(satirlar[0]) : null;
  },

  async kategoriGorseliKaydet(g) {
    await semayiHazirla();
    await sql()`
      INSERT INTO kategori_gorselleri (slug, url, guncelleme_tarihi)
      VALUES (${g.slug}, ${g.url}, ${g.guncellemeTarihi})
      ON CONFLICT (slug) DO UPDATE SET
        url = EXCLUDED.url,
        guncelleme_tarihi = EXCLUDED.guncelleme_tarihi
    `;
  },

  async kategoriGorselleriListele() {
    await semayiHazirla();
    const satirlar = await sql()<
      { slug: string; url: string; guncelleme_tarihi: Date }[]
    >`SELECT * FROM kategori_gorselleri`;
    return satirlar.map((s) => ({
      slug: s.slug,
      url: s.url,
      guncellemeTarihi: new Date(s.guncelleme_tarihi).toISOString(),
    }));
  },

  async kategoriGorseliSil(slug) {
    await semayiHazirla();
    await sql()`DELETE FROM kategori_gorselleri WHERE slug = ${slug}`;
  },

  async kasikAt(kasik) {
    await semayiHazirla();
    // Çift zaten varsa hiçbir şey yapılmıyor; tarih de korunuyor ki
    // "ne zaman verildi" bilgisi tekrar tıklamayla kaymasın.
    await sql()`
      INSERT INTO sef_kasiklari (veren_slug, alan_slug, tarih)
      VALUES (${kasik.verenSlug}, ${kasik.alanSlug}, ${kasik.tarih})
      ON CONFLICT (veren_slug, alan_slug) DO NOTHING
    `;
  },

  async kasikGeriAl(verenSlug, alanSlug) {
    await semayiHazirla();
    await sql()`
      DELETE FROM sef_kasiklari WHERE veren_slug = ${verenSlug} AND alan_slug = ${alanSlug}
    `;
  },

  async belgeEkle(belge) {
    await semayiHazirla();
    await sql()`
      INSERT INTO belgeler (id, sahip_tur, sahip_id, ad, mime, boyut, veri, tarih)
      VALUES (${belge.id}, ${belge.sahipTur}, ${belge.sahipId}, ${belge.ad},
              ${belge.mime}, ${belge.boyut}, ${belge.veri ?? Buffer.alloc(0)}, ${belge.tarih})
    `;
  },

  /** İÇERİK ÇEKİLMİYOR: liste sayfası her açılışta megabaytlarca veri taşımasın. */
  async belgeleriListele(sahipTur, sahipId) {
    await semayiHazirla();
    const satirlar = await sql()<
      { id: string; sahip_tur: string; sahip_id: string; ad: string; mime: string; boyut: number; tarih: Date }[]
    >`
      SELECT id, sahip_tur, sahip_id, ad, mime, boyut, tarih FROM belgeler
      WHERE sahip_tur = ${sahipTur} AND sahip_id = ${sahipId}
      ORDER BY tarih ASC
    `;
    return satirlar.map((s) => ({
      id: s.id,
      sahipTur: s.sahip_tur,
      sahipId: s.sahip_id,
      ad: s.ad,
      mime: s.mime,
      boyut: s.boyut,
      tarih: new Date(s.tarih).toISOString(),
    }));
  },

  async belgeBul(id) {
    await semayiHazirla();
    const satirlar = await sql()<
      { id: string; sahip_tur: string; sahip_id: string; ad: string; mime: string; boyut: number; veri: Buffer; tarih: Date }[]
    >`SELECT * FROM belgeler WHERE id = ${id} LIMIT 1`;
    if (satirlar.length === 0) return null;
    const s = satirlar[0];
    return {
      id: s.id,
      sahipTur: s.sahip_tur,
      sahipId: s.sahip_id,
      ad: s.ad,
      mime: s.mime,
      boyut: s.boyut,
      veri: s.veri,
      tarih: new Date(s.tarih).toISOString(),
    };
  },

  async izgaraSirasiAl() {
    await semayiHazirla();
    const satirlar = await sql()<{ anahtar: string; sira: number }[]>`
      SELECT anahtar, sira FROM izgara_sirasi
    `;
    return satirlar.map((s) => ({ anahtar: s.anahtar, sira: s.sira }));
  },

  async izgaraSirasiKaydet(kayit) {
    await semayiHazirla();
    await sql()`
      INSERT INTO izgara_sirasi (anahtar, sira) VALUES (${kayit.anahtar}, ${kayit.sira})
      ON CONFLICT (anahtar) DO UPDATE SET sira = EXCLUDED.sira
    `;
  },

  async kasiklariListele() {
    await semayiHazirla();
    const satirlar = await sql()<
      { veren_slug: string; alan_slug: string; tarih: Date }[]
    >`SELECT veren_slug, alan_slug, tarih FROM sef_kasiklari`;
    return satirlar.map((s) => ({
      verenSlug: s.veren_slug,
      alanSlug: s.alan_slug,
      tarih: new Date(s.tarih).toISOString(),
    }));
  },

  async yorumSil(id) {
    await semayiHazirla();
    await sql()`DELETE FROM yorumlar WHERE id = ${id}`;
  },

  async yorumYanitla(id, yanit) {
    await semayiHazirla();
    await sql()`
      UPDATE yorumlar
      SET yanit = ${yanit ?? null},
          yanit_tarihi = ${yanit ? new Date().toISOString() : null}
      WHERE id = ${id}
    `;
  },

  async yorumlariListele(restoranSlug) {
    await semayiHazirla();
    const satirlar = restoranSlug
      ? await sql()<YorumSatiri[]>`
          SELECT * FROM yorumlar WHERE restoran_slug = ${restoranSlug}
          ORDER BY tarih DESC LIMIT 200
        `
      : await sql()<YorumSatiri[]>`SELECT * FROM yorumlar ORDER BY tarih DESC LIMIT 200`;
    return satirlar.map(satirdanYorum);
  },

  async siparisYorumlandiMi(siparisNo) {
    await semayiHazirla();
    const satirlar = await sql()<{ var: number }[]>`
      SELECT 1 AS var FROM yorumlar WHERE siparis_no = ${siparisNo} LIMIT 1
    `;
    return satirlar.length > 0;
  },

  async mutfakEkle(m) {
    await semayiHazirla();
    await sql()`
      INSERT INTO sef_mutfaklari (slug, ad, sef_turu, semt, sahip_eposta, olusturma_tarihi)
      VALUES (${m.slug}, ${m.ad}, ${m.sefTuru}, ${m.semt}, ${m.sahipEposta}, ${m.olusturmaTarihi})
      ON CONFLICT (slug) DO UPDATE SET
        ad           = EXCLUDED.ad,
        sef_turu     = EXCLUDED.sef_turu,
        semt         = EXCLUDED.semt,
        sahip_eposta = EXCLUDED.sahip_eposta
    `;
  },

  async mutfakBul(slug) {
    await semayiHazirla();
    const satirlar = await sql()<MutfakSatiri[]>`
      SELECT * FROM sef_mutfaklari WHERE slug = ${slug} LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanMutfak(satirlar[0]) : null;
  },

  async mutfakSil(slug) {
    await semayiHazirla();
    const q = sql();
    await q`DELETE FROM sef_mutfaklari WHERE slug = ${slug}`;
    await q`DELETE FROM sef_profilleri WHERE restoran_slug = ${slug}`;
    // Mutfak kapanınca ürünleri de gitsin — sahipsiz ürün listede asılı kalmasın.
    await q`DELETE FROM mutfak_urunleri WHERE restoran_slug = ${slug}`;
  },

  async mutfaklariListele() {
    await semayiHazirla();
    const satirlar = await sql()<MutfakSatiri[]>`
      SELECT * FROM sef_mutfaklari ORDER BY olusturma_tarihi DESC LIMIT 500
    `;
    return satirlar.map(satirdanMutfak);
  },

  async destekEkle(t) {
    await semayiHazirla();
    await sql()`
      INSERT INTO destek_talepleri
        (id, no, konu, mesaj, siparis_no, ad, eposta, telefon, durum, yanit,
         olusturma_tarihi, guncelleme_tarihi)
      VALUES
        (${t.id}, ${t.no}, ${t.konu}, ${t.mesaj}, ${t.siparisNo ?? null}, ${t.ad},
         ${t.eposta}, ${t.telefon ?? null}, ${t.durum}, ${t.yanit ?? null},
         ${t.olusturmaTarihi}, ${t.guncellemeTarihi})
    `;
  },

  async destekListele(durum) {
    await semayiHazirla();
    const q = sql();
    const satirlar = durum
      ? await q<DestekSatiri[]>`
          SELECT * FROM destek_talepleri WHERE durum = ${durum}
          ORDER BY olusturma_tarihi DESC LIMIT 500
        `
      : await q<DestekSatiri[]>`
          SELECT * FROM destek_talepleri ORDER BY olusturma_tarihi DESC LIMIT 500
        `;
    return satirlar.map(satirdanDestek);
  },

  async destekGuncelle(t) {
    await semayiHazirla();
    await sql()`
      UPDATE destek_talepleri
      SET durum = ${t.durum}, yanit = ${t.yanit ?? null}, guncelleme_tarihi = ${t.guncellemeTarihi}
      WHERE id = ${t.id}
    `;
  },

  async urunKaydet(u) {
    await semayiHazirla();
    await sql()`
      INSERT INTO mutfak_urunleri
        (id, restoran_slug, bolum, ad, aciklama, fiyat, bekleyen_fiyat, bekleyen_tarih,
         birim, gorsel_url, yayinda, sabitten_mi, olusturma_tarihi, guncelleme_tarihi)
      VALUES
        (${u.id}, ${u.restoranSlug}, ${u.bolum}, ${u.ad}, ${u.aciklama}, ${u.fiyat},
         ${u.bekleyenFiyat ?? null}, ${u.bekleyenTarih ?? null},
         ${u.birim ?? null}, ${u.gorselUrl ?? null}, ${u.yayinda}, ${u.sabittenMi ?? false},
         ${u.olusturmaTarihi}, ${u.guncellemeTarihi})
      ON CONFLICT (id) DO UPDATE SET
        bolum             = EXCLUDED.bolum,
        ad                = EXCLUDED.ad,
        aciklama          = EXCLUDED.aciklama,
        fiyat             = EXCLUDED.fiyat,
        bekleyen_fiyat    = EXCLUDED.bekleyen_fiyat,
        bekleyen_tarih    = EXCLUDED.bekleyen_tarih,
        birim             = EXCLUDED.birim,
        gorsel_url        = EXCLUDED.gorsel_url,
        yayinda           = EXCLUDED.yayinda,
        sabitten_mi       = EXCLUDED.sabitten_mi,
        guncelleme_tarihi = EXCLUDED.guncelleme_tarihi
    `;
  },

  async urunBul(id) {
    await semayiHazirla();
    const satirlar = await sql()<UrunSatiri[]>`
      SELECT * FROM mutfak_urunleri WHERE id = ${id} LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanUrun(satirlar[0]) : null;
  },

  async urunSil(id) {
    await semayiHazirla();
    await sql()`DELETE FROM mutfak_urunleri WHERE id = ${id}`;
  },

  async urunleriListele(restoranSlug) {
    await semayiHazirla();
    const q = sql();
    const satirlar = restoranSlug
      ? await q<UrunSatiri[]>`
          SELECT * FROM mutfak_urunleri WHERE restoran_slug = ${restoranSlug}
          ORDER BY olusturma_tarihi LIMIT 500
        `
      : await q<UrunSatiri[]>`
          SELECT * FROM mutfak_urunleri ORDER BY restoran_slug, olusturma_tarihi LIMIT 2000
        `;
    return satirlar.map(satirdanUrun);
  },

  async kodKaydet(k) {
    await semayiHazirla();
    await sql()`
      INSERT INTO dogrulama_kodlari
        (id, eposta, amac, kod_ozeti, duz_kod, deneme, kullanildi, gonderildi,
         son_gecerlilik, olusturma_tarihi)
      VALUES
        (${k.id}, ${k.eposta}, ${k.amac}, ${k.kodOzeti}, ${k.duzKod ?? null}, ${k.deneme},
         ${k.kullanildi}, ${k.gonderildi}, ${k.sonGecerlilik}, ${k.olusturmaTarihi})
      ON CONFLICT (id) DO UPDATE SET
        deneme     = EXCLUDED.deneme,
        kullanildi = EXCLUDED.kullanildi,
        gonderildi = EXCLUDED.gonderildi,
        duz_kod    = EXCLUDED.duz_kod
    `;
  },

  async sonKodBul(eposta, amac: KodAmaci) {
    await semayiHazirla();
    const satirlar = await sql()<KodSatiri[]>`
      SELECT * FROM dogrulama_kodlari
      WHERE lower(eposta) = ${eposta.trim().toLowerCase()}
        AND amac = ${amac} AND kullanildi = FALSE
      ORDER BY olusturma_tarihi DESC LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanKod(satirlar[0]) : null;
  },

  async kodlariListele() {
    await semayiHazirla();
    const satirlar = await sql()<KodSatiri[]>`
      SELECT * FROM dogrulama_kodlari ORDER BY olusturma_tarihi DESC LIMIT 200
    `;
    return satirlar.map(satirdanKod);
  },

  async kodlariTuket(eposta, amac: KodAmaci) {
    await semayiHazirla();
    await sql()`
      UPDATE dogrulama_kodlari SET kullanildi = TRUE
      WHERE lower(eposta) = ${eposta.trim().toLowerCase()} AND amac = ${amac}
    `;
  },
};
