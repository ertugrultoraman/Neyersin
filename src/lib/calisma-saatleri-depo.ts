import postgres from "postgres";

import { VARSAYILAN_PROGRAM, type HaftaProgrami, type IsletmeSaatleri } from "./calisma-saatleri";

/**
 * Çalışma saatlerinin VERİTABANI katmanı.
 *
 * Saf mantıktan (bkz. calisma-saatleri.ts) ayrı bir dosyada: saatleri gösteren
 * form bir istemci bileşeni ve oradan `GUN_ADLARI` gibi sabitleri okuyor. İkisi
 * aynı dosyada olduğunda `postgres` paketi tarayıcı paketine giriyor ve derleme
 * patlıyordu. Ayrım bu yüzden zorunlu, tercih değil.
 */

let baglanti: ReturnType<typeof postgres> | null = null;
let semaSozu: Promise<void> | null = null;

const veritabaniVarMi = () => Boolean(process.env.DATABASE_URL);

function sql() {
  if (!baglanti) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL tanımlı değil.");
    baglanti = postgres(url, {
      max: 2,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: url.includes("sslmode=disable") ? false : "require",
    });
  }
  return baglanti;
}

function semayiHazirla(): Promise<void> {
  semaSozu ??= (async () => {
    await sql()`
      CREATE TABLE IF NOT EXISTS isletme_saatleri (
        slug               TEXT PRIMARY KEY,
        program            JSONB NOT NULL,
        elle_kapali_bitis  TIMESTAMPTZ,
        guncelleme         TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  })().catch((hata) => {
    semaSozu = null;
    throw hata;
  });
  return semaSozu;
}

/** Programı okur; kaydı yoksa `null` (= hep açık). */
export async function saatleriAl(slug: string): Promise<IsletmeSaatleri | null> {
  if (!slug || !veritabaniVarMi()) return null;
  try {
    await semayiHazirla();
    const satirlar = await sql()<{ program: HaftaProgrami; elle_kapali_bitis: Date | null }[]>`
      SELECT program, elle_kapali_bitis FROM isletme_saatleri WHERE slug = ${slug}
    `;
    const satir = satirlar[0];
    if (!satir) return null;
    return {
      program: Array.isArray(satir.program) ? satir.program : VARSAYILAN_PROGRAM,
      elleKapaliBitis: satir.elle_kapali_bitis
        ? new Date(satir.elle_kapali_bitis).toISOString()
        : undefined,
    };
  } catch {
    /* Depo susarsa mutfağı kapatmıyoruz — kesinti sipariş almayı durdurmasın. */
    return null;
  }
}

/**
 * Birden çok mutfağın programı TEK sorguda.
 *
 * Mobil katalog listesi her mutfak için "şu an açık mı" gösteriyor. `saatleriAl`
 * döngüde çağrılsaydı 20 mutfaklık liste 20 ayrı sorgu açardı — bağlantı havuzu
 * `max: 2` olduğu için istekler birbirini beklerdi ve liste ucu, tek bir sayfa
 * açılışında saniyelerce sürerdi.
 *
 * Kaydı olmayan slug haritada HİÇ görünmüyor; çağıran taraf `null` (= hep açık)
 * gibi davranıyor — `saatleriAl` ile aynı sözleşme.
 */
export async function saatleriTopluAl(
  sluglar: readonly string[],
): Promise<Map<string, IsletmeSaatleri>> {
  const harita = new Map<string, IsletmeSaatleri>();
  if (sluglar.length === 0 || !veritabaniVarMi()) return harita;

  try {
    await semayiHazirla();
    const satirlar = await sql()<
      { slug: string; program: HaftaProgrami; elle_kapali_bitis: Date | null }[]
    >`
      SELECT slug, program, elle_kapali_bitis
      FROM isletme_saatleri
      WHERE slug = ANY(${sql().array([...sluglar])})
    `;
    for (const satir of satirlar) {
      harita.set(satir.slug, {
        program: Array.isArray(satir.program) ? satir.program : VARSAYILAN_PROGRAM,
        elleKapaliBitis: satir.elle_kapali_bitis
          ? new Date(satir.elle_kapali_bitis).toISOString()
          : undefined,
      });
    }
  } catch {
    /* Tek mutfaklık okumayla aynı davranış: depo susarsa kimseyi kapatmıyoruz. */
  }
  return harita;
}

export async function saatleriKaydet(slug: string, saatler: IsletmeSaatleri): Promise<void> {
  if (!veritabaniVarMi()) throw new Error("Çalışma saatleri için veritabanı gerekiyor.");
  await semayiHazirla();
  await sql()`
    INSERT INTO isletme_saatleri (slug, program, elle_kapali_bitis, guncelleme)
    VALUES (${slug}, ${JSON.stringify(saatler.program)}::jsonb,
            ${saatler.elleKapaliBitis ?? null}, now())
    ON CONFLICT (slug) DO UPDATE SET
      program           = EXCLUDED.program,
      elle_kapali_bitis = EXCLUDED.elle_kapali_bitis,
      guncelleme        = now()
  `;
}
