import postgres from "postgres";

import { SATIS_DURUMLARI, type Siparis, type SiparisDurumu } from "../siparis";
import {
  filtreUygula,
  ozetHesapla,
  type KayitliSiparis,
  type Ozet,
  type SatisSayimi,
  type SiparisDepo,
  type SiparisFiltresi,
} from "./tipler";

/**
 * Postgres sipariş deposu — DATABASE_URL tanımlıysa devreye girer.
 * Vercel Postgres / Neon / Supabase / kendi sunucunuz ile çalışır.
 *
 * !! Bu adaptör canlı bir veritabanına karşı TEST EDİLMEDİ (geliştirme sırasında
 * erişilebilir bir Postgres yoktu). Şema otomatik oluşturuluyor; ilk deploy'dan
 * sonra /admin panelinde bir sipariş görebildiğinizi doğrulayın.
 */

let baglanti: ReturnType<typeof postgres> | null = null;

/**
 * Şema hazırlığı SÖZ olarak saklanıyor, `boolean` olarak değil.
 *
 * Eskiden `let semaHazir = false` vardı ve bayrak ancak bütün DDL bittikten
 * sonra `true` oluyordu. Ana sayfa aynı anda birkaç sunucu bileşeninden depoya
 * dokunduğu için hepsi bayrağı `false` görüp DDL'i BAŞTAN çalıştırıyordu:
 * soğuk ilk istek `CREATE INDEX` kilitleri yüzünden dakikalarca sürüyordu
 * (ölçüm: 90 sn). Söz saklanınca ikinci çağıran aynı işin bitmesini bekliyor.
 *
 * Hata durumunda söz temizleniyor — geçici bir bağlantı hatası şemayı kalıcı
 * olarak "hazırlanamaz" durumda bırakmasın.
 */
let semaSozu: Promise<void> | null = null;

function sql() {
  if (!baglanti) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL tanımlı değil.");
    baglanti = postgres(url, {
      // Serverless'ta bağlantı havuzunu küçük tut
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: url.includes("sslmode=disable") ? false : "require",
    });
  }
  return baglanti;
}

/**
 * Sipariş gövdesini JSONB olarak saklıyoruz; sorgulanan alanlar ayrı kolonda.
 * Böylece sipariş modeli değiştiğinde migration gerekmiyor, ama listeleme ve
 * filtreleme yine indeksli kolonlar üzerinden yapılıyor.
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
    CREATE TABLE IF NOT EXISTS siparisler (
      siparis_no          TEXT PRIMARY KEY,
      olusturma_tarihi    TIMESTAMPTZ NOT NULL,
      guncelleme_tarihi   TIMESTAMPTZ NOT NULL,
      durum               TEXT NOT NULL,
      odeme_yontemi       TEXT NOT NULL,
      restoran_slug       TEXT NOT NULL,
      restoran_adi        TEXT NOT NULL,
      ilce                TEXT NOT NULL,
      musteri_ad          TEXT NOT NULL,
      musteri_telefon     TEXT NOT NULL,
      toplam              NUMERIC(10,2) NOT NULL,
      saglayici_odeme_id  TEXT,
      odenen_tutar        TEXT,
      odeme_mesaji        TEXT,
      govde               JSONB NOT NULL
    )
  `;
  await q`CREATE INDEX IF NOT EXISTS siparisler_tarih_idx ON siparisler (olusturma_tarihi DESC)`;
  await q`CREATE INDEX IF NOT EXISTS siparisler_durum_idx ON siparisler (durum)`;
  // Kupon denetimi e-posta üzerinden sorguladığı için ifade indeksi ekliyoruz.
  await q`
    CREATE INDEX IF NOT EXISTS siparisler_eposta_idx
    ON siparisler ((lower(govde->'musteri'->>'eposta')))
  `;
  // Atama kolonları sonradan eklendi — mevcut kurulumlar için güvenli göç.
  await q`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS atanan_sef TEXT`;
  await q`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS atanan_kurye TEXT`;
  await q`CREATE INDEX IF NOT EXISTS siparisler_atanan_sef_idx ON siparisler (atanan_sef)`;
  await q`CREATE INDEX IF NOT EXISTS siparisler_atanan_kurye_idx ON siparisler (atanan_kurye)`;
}

type Satir = {
  govde: Siparis;
  guncelleme_tarihi: Date;
  durum: string;
  saglayici_odeme_id: string | null;
  odenen_tutar: string | null;
  odeme_mesaji: string | null;
  atanan_sef: string | null;
  atanan_kurye: string | null;
};

/** Listeleme ve tekil okuma aynı kolonları çeksin diye tek yerden tanımlı. */
const KOLONLAR =
  "govde, guncelleme_tarihi, durum, saglayici_odeme_id, odenen_tutar, odeme_mesaji, atanan_sef, atanan_kurye";

function satirdanKayit(satir: Satir): KayitliSiparis {
  return {
    ...satir.govde,
    durum: satir.durum as SiparisDurumu,
    guncellemeTarihi: new Date(satir.guncelleme_tarihi).toISOString(),
    saglayiciOdemeId: satir.saglayici_odeme_id ?? undefined,
    odenenTutar: satir.odenen_tutar ?? undefined,
    odemeMesaji: satir.odeme_mesaji ?? undefined,
    atananSef: satir.atanan_sef ?? undefined,
    atananKurye: satir.atanan_kurye ?? undefined,
  };
}

export const postgresDepo: SiparisDepo = {
  ad: "postgres",
  kalici: true,

  async hazirla() {
    await semayiHazirla();
  },

  async ekle(siparis: Siparis) {
    await semayiHazirla();
    const q = sql();
    const simdi = new Date().toISOString();
    await q`
      INSERT INTO siparisler (
        siparis_no, olusturma_tarihi, guncelleme_tarihi, durum, odeme_yontemi,
        restoran_slug, restoran_adi, ilce, musteri_ad, musteri_telefon, toplam, govde
      ) VALUES (
        ${siparis.siparisNo}, ${siparis.olusturmaTarihi}, ${simdi}, ${siparis.durum},
        ${siparis.odemeYontemi}, ${siparis.restoranSlug}, ${siparis.restoranAdi},
        ${siparis.adres.ilce}, ${siparis.musteri.adSoyad}, ${siparis.musteri.telefon},
        ${siparis.tutarlar.toplam}, ${q.json(JSON.parse(JSON.stringify(siparis)))}
      )
      ON CONFLICT (siparis_no) DO UPDATE SET
        guncelleme_tarihi = EXCLUDED.guncelleme_tarihi,
        durum             = EXCLUDED.durum,
        govde             = EXCLUDED.govde
    `;
  },

  async durumGuncelle(siparisNo, durum, ek) {
    await semayiHazirla();
    const q = sql();
    await q`
      UPDATE siparisler SET
        durum              = ${durum},
        guncelleme_tarihi  = ${new Date().toISOString()},
        saglayici_odeme_id = COALESCE(${ek?.saglayiciOdemeId ?? null}, saglayici_odeme_id),
        odenen_tutar       = COALESCE(${ek?.odenenTutar ?? null}, odenen_tutar),
        odeme_mesaji       = COALESCE(${ek?.odemeMesaji ?? null}, odeme_mesaji)
      WHERE siparis_no = ${siparisNo}
    `;
  },

  async listele(filtre?: SiparisFiltresi) {
    await semayiHazirla();
    const q = sql();
    const limit = filtre?.limit ?? 500;

    /**
     * Yetki filtreleri (restoran / şef / kurye / müşteri) SQL'de uygulanır:
     * kayıtları önce çekip bellekte elemek, limit yüzünden başkasının siparişini
     * gizlemek yerine hiç göstermemek riskini doğururdu.
     */
    const kosullar = [];
    if (filtre?.durum) kosullar.push(q`durum = ${filtre.durum}`);
    if (filtre?.restoranSlug) kosullar.push(q`restoran_slug = ${filtre.restoranSlug}`);
    if (filtre?.atananSef) {
      kosullar.push(q`lower(atanan_sef) = ${filtre.atananSef.trim().toLowerCase()}`);
    }
    if (filtre?.atananKurye) {
      kosullar.push(q`lower(atanan_kurye) = ${filtre.atananKurye.trim().toLowerCase()}`);
    }
    if (filtre?.musteriEpostasi) {
      kosullar.push(
        q`lower(govde->'musteri'->>'eposta') = ${filtre.musteriEpostasi.trim().toLowerCase()}`,
      );
    }

    const nerede = kosullar.length
      ? kosullar.reduce((a, b) => q`${a} AND ${b}`)
      : q`TRUE`;

    const satirlar = await q<Satir[]>`
      SELECT ${q.unsafe(KOLONLAR)} FROM siparisler
      WHERE ${nerede}
      ORDER BY olusturma_tarihi DESC LIMIT ${limit}
    `;

    // Metin aramasını bellek içinde uyguluyoruz — aynı filtre mantığı iki adaptörde tek yerden.
    return filtreUygula(satirlar.map(satirdanKayit), { arama: filtre?.arama });
  },

  async bul(siparisNo: string) {
    await semayiHazirla();
    const q = sql();
    const satirlar = await q<Satir[]>`
      SELECT ${q.unsafe(KOLONLAR)} FROM siparisler WHERE siparis_no = ${siparisNo} LIMIT 1
    `;
    return satirlar.length > 0 ? satirdanKayit(satirlar[0]) : null;
  },

  async atamaGuncelle(siparisNo, atama) {
    await semayiHazirla();
    const q = sql();
    // undefined → dokunma, null → temizle, değer → ata
    await q`
      UPDATE siparisler SET
        atanan_sef        = ${atama.atananSef === undefined ? q`atanan_sef` : atama.atananSef},
        atanan_kurye      = ${atama.atananKurye === undefined ? q`atanan_kurye` : atama.atananKurye},
        guncelleme_tarihi = ${new Date().toISOString()}
      WHERE siparis_no = ${siparisNo}
    `;
  },

  async kuryeyeAtaKosullu(siparisNo, eposta) {
    await semayiHazirla();
    /*
     * Koşul WHERE'de: iki kurye aynı anda kabul ederse ikincinin UPDATE'i
     * hiçbir satırla eşleşmiyor ve `RETURNING` boş dönüyor. Postgres tek
     * ifadeyi zaten atomik yürütüyor, ayrıca kilit almaya gerek yok.
     *
     * Boş dizge de "atanmamış" sayılıyor: atamayı temizleyen eski kod yolları
     * NULL yerine '' yazmış olabilir ve o kayıt sonsuza dek kilitli kalırdı.
     */
    const satirlar = await sql()<{ siparis_no: string }[]>`
      UPDATE siparisler
      SET atanan_kurye = ${eposta.trim().toLowerCase()},
          guncelleme_tarihi = ${new Date().toISOString()}
      WHERE siparis_no = ${siparisNo}
        AND (atanan_kurye IS NULL OR atanan_kurye = '')
      RETURNING siparis_no
    `;
    return satirlar.length > 0;
  },

  async musteriEpostasiniTasi(eski, yeni) {
    await semayiHazirla();
    // Gövde JSONB olduğu için adres yerinde güncelleniyor; sipariş yeniden yazılmıyor.
    const satirlar = await sql()<{ siparis_no: string }[]>`
      UPDATE siparisler
      SET govde = jsonb_set(govde, '{musteri,eposta}', to_jsonb(${yeni.trim().toLowerCase()}::text)),
          guncelleme_tarihi = ${new Date().toISOString()}
      WHERE lower(govde->'musteri'->>'eposta') = ${eski.trim().toLowerCase()}
      RETURNING siparis_no
    `;
    return satirlar.length;
  },

  async ozet(): Promise<Ozet> {
    const hepsi = await this.listele({ limit: 5000 });
    return ozetHesapla(hepsi);
  },

  async epostaSiparisSayisi(eposta: string) {
    await semayiHazirla();
    const satirlar = await sql()<{ adet: number }[]>`
      SELECT COUNT(*)::int AS adet FROM siparisler
      WHERE lower(govde->'musteri'->>'eposta') = ${eposta.trim().toLowerCase()}
        AND durum NOT IN ('odeme-basarisiz','iptal')
    `;
    return satirlar[0]?.adet ?? 0;
  },

  /**
   * Sayım SQL'de, sıralama JS'te.
   *
   * COUNT/GROUP BY veritabanında yapılıyor — bütün siparişleri çekip bellekte
   * saymak binlerce kayıtta anlamsız bir yük. Ama SIRALAMA bilerek burada
   * yapılmıyor: eşitlik bozulurken ada göre karşılaştırma gerekiyor ve
   * Postgres'in harmanlama (collation) ayarı sunucudan sunucuya değişiyor;
   * dosya adaptörüyle aynı sırayı üreteceğinin garantisi yok. Grup sayısı
   * mutfak sayısı kadar (yani küçük), JS'te sıralamak bedava.
   */
  async satisSiralamasi(limit?: number): Promise<SatisSayimi[]> {
    await semayiHazirla();
    const satirlar = await sql()<{ restoran_slug: string; restoran_adi: string; adet: number }[]>`
      SELECT
        restoran_slug,
        -- Mutfak adı sonradan değişmiş olabilir; en son siparişteki ad geçerli.
        (array_agg(restoran_adi ORDER BY olusturma_tarihi DESC))[1] AS restoran_adi,
        COUNT(*)::int AS adet
      FROM siparisler
      WHERE durum = ANY(${SATIS_DURUMLARI})
      GROUP BY restoran_slug
    `;

    const siralama = satirlar
      .map((s) => ({ restoranSlug: s.restoran_slug, restoranAdi: s.restoran_adi, adet: s.adet }))
      .sort((a, b) => b.adet - a.adet || a.restoranAdi.localeCompare(b.restoranAdi, "tr-TR"));

    return limit ? siralama.slice(0, limit) : siralama;
  },

  async kuponKullanildiMi(eposta: string, kod: string) {
    await semayiHazirla();
    const satirlar = await sql()<{ var: number }[]>`
      SELECT 1 AS var FROM siparisler
      WHERE lower(govde->'musteri'->>'eposta') = ${eposta.trim().toLowerCase()}
        AND upper(govde->'tutarlar'->>'kuponKodu') = ${kod.trim().toUpperCase()}
        AND durum NOT IN ('odeme-basarisiz','iptal')
      LIMIT 1
    `;
    return satirlar.length > 0;
  },
};
