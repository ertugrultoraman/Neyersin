import postgres from "postgres";

import type {
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
let semaHazir = false;

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

async function semayiHazirla() {
  if (semaHazir) return;
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
   * Mevcut hesaplar DOĞRULANMIŞ sayılır (DEFAULT TRUE): doğrulama özelliği
   * sonradan eklendi, eski kullanıcıları bir sabahında kilitlemek doğru olmaz.
   * Bundan sonra açılan hesaplar açıkça `false` ile yazılır.
   */
  await q`ALTER TABLE hesaplar ADD COLUMN IF NOT EXISTS eposta_dogrulandi BOOLEAN NOT NULL DEFAULT TRUE`;
  // Hesabin nasil acildigi: parola formu mu, Google ile mi.
  await q`ALTER TABLE hesaplar ADD COLUMN IF NOT EXISTS saglayici TEXT NOT NULL DEFAULT 'parola'`;
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
  semaHazir = true;
}

type HesapSatiri = {
  eposta: string;
  ad: string;
  parola_hash: string;
  rol: string;
  telefon: string | null;
  restoran_slug: string | null;
  eposta_dogrulandi: boolean | null;
  saglayici: string | null;
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
    epostaDogrulandi: s.eposta_dogrulandi ?? true,
    saglayici: (s.saglayici as Hesap["saglayici"]) ?? "parola",
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
  guncelleme_tarihi: Date;
};

function satirdanProfil(s: ProfilSatiri): SefProfili {
  return {
    restoranSlug: s.restoran_slug,
    biyografi: s.biyografi ?? undefined,
    sertifikalar: s.sertifikalar ?? undefined,
    uzmanlik: s.uzmanlik ?? undefined,
    slogan: s.slogan ?? undefined,
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
  birim: string | null;
  yayinda: boolean;
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
    birim: s.birim ?? undefined,
    yayinda: s.yayinda,
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
    tarih: new Date(s.tarih).toISOString(),
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
        (eposta, ad, parola_hash, rol, telefon, restoran_slug, eposta_dogrulandi,
         saglayici, olusturma_tarihi)
      VALUES (
        ${hesap.eposta}, ${hesap.ad}, ${hesap.parolaHash}, ${hesap.rol},
        ${hesap.telefon ?? null}, ${hesap.restoranSlug ?? null},
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

  async restoranSahibi(restoranSlug) {
    await semayiHazirla();
    const satirlar = await sql()<HesapSatiri[]>`
      SELECT * FROM hesaplar WHERE restoran_slug = ${restoranSlug} LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanHesap(satirlar[0]) : null;
  },

  async profilAl(restoranSlug) {
    await semayiHazirla();
    const satirlar = await sql()<ProfilSatiri[]>`
      SELECT restoran_slug, biyografi, sertifikalar, uzmanlik, slogan, guncelleme_tarihi
      FROM sef_profilleri WHERE restoran_slug = ${restoranSlug} LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanProfil(satirlar[0]) : null;
  },

  async profilleriListele() {
    await semayiHazirla();
    const satirlar = await sql()<ProfilSatiri[]>`
      SELECT restoran_slug, biyografi, sertifikalar, uzmanlik, slogan, guncelleme_tarihi
      FROM sef_profilleri LIMIT 500
    `;
    return satirlar.map(satirdanProfil);
  },

  async profilKaydet(profil) {
    await semayiHazirla();
    await sql()`
      INSERT INTO sef_profilleri (
        restoran_slug, biyografi, sertifikalar, uzmanlik, slogan, guncelleme_tarihi
      ) VALUES (
        ${profil.restoranSlug}, ${profil.biyografi ?? null}, ${profil.sertifikalar ?? null},
        ${profil.uzmanlik ?? null}, ${profil.slogan ?? null}, ${profil.guncellemeTarihi}
      )
      ON CONFLICT (restoran_slug) DO UPDATE SET
        biyografi         = EXCLUDED.biyografi,
        sertifikalar      = EXCLUDED.sertifikalar,
        uzmanlik          = EXCLUDED.uzmanlik,
        slogan            = EXCLUDED.slogan,
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
        (id, restoran_slug, bolum, ad, aciklama, fiyat, birim, yayinda,
         olusturma_tarihi, guncelleme_tarihi)
      VALUES
        (${u.id}, ${u.restoranSlug}, ${u.bolum}, ${u.ad}, ${u.aciklama}, ${u.fiyat},
         ${u.birim ?? null}, ${u.yayinda}, ${u.olusturmaTarihi}, ${u.guncellemeTarihi})
      ON CONFLICT (id) DO UPDATE SET
        bolum             = EXCLUDED.bolum,
        ad                = EXCLUDED.ad,
        aciklama          = EXCLUDED.aciklama,
        fiyat             = EXCLUDED.fiyat,
        birim             = EXCLUDED.birim,
        yayinda           = EXCLUDED.yayinda,
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
