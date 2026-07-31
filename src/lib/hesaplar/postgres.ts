import postgres from "postgres";

import type {
  Basvuru,
  BasvuruDurumu,
  BasvuruTuru,
  Hesap,
  HesapDepo,
  Rol,
  SefMutfagi,
  SefProfili,
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
  semaHazir = true;
}

type HesapSatiri = {
  eposta: string;
  ad: string;
  parola_hash: string;
  rol: string;
  telefon: string | null;
  restoran_slug: string | null;
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
      INSERT INTO hesaplar (eposta, ad, parola_hash, rol, telefon, restoran_slug, olusturma_tarihi)
      VALUES (
        ${hesap.eposta}, ${hesap.ad}, ${hesap.parolaHash}, ${hesap.rol},
        ${hesap.telefon ?? null}, ${hesap.restoranSlug ?? null}, ${hesap.olusturmaTarihi}
      )
      ON CONFLICT (eposta) DO UPDATE SET
        ad            = EXCLUDED.ad,
        parola_hash   = EXCLUDED.parola_hash,
        rol           = EXCLUDED.rol,
        telefon       = EXCLUDED.telefon,
        restoran_slug = EXCLUDED.restoran_slug
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
  },

  async mutfaklariListele() {
    await semayiHazirla();
    const satirlar = await sql()<MutfakSatiri[]>`
      SELECT * FROM sef_mutfaklari ORDER BY olusturma_tarihi DESC LIMIT 500
    `;
    return satirlar.map(satirdanMutfak);
  },
};
