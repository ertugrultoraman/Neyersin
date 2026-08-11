import postgres from "postgres";

/**
 * VEKÂLET DEFTERİ — hangi yönetici, hangi hesaba, ne zaman büründü.
 *
 * Neden tutuluyor: "bu siparişi kim değiştirdi", "bu ürünün fiyatını kim
 * düşürdü" sorularının cevabı vekâletle girildiğinde hedef hesabın kendisi
 * gibi görünüyor. Defter olmasa yöneticinin yaptığı değişiklik, hesabın
 * sahibinin yaptığından ayırt edilemezdi.
 *
 * Bağlantı ayarları giriş sınırlayıcısıyla aynı; kendi küçük havuzunu tutuyor.
 */

let baglanti: ReturnType<typeof postgres> | null = null;
let semaHazir = false;

function veritabaniVarMi(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

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

async function semayiHazirla() {
  if (semaHazir) return;
  const q = sql();
  await q`
    CREATE TABLE IF NOT EXISTS vekil_kayitlari (
      id       BIGSERIAL PRIMARY KEY,
      yonetici TEXT NOT NULL,
      hedef    TEXT NOT NULL,
      zaman    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await q`CREATE INDEX IF NOT EXISTS vekil_kayitlari_zaman_idx ON vekil_kayitlari (zaman DESC)`;
  semaHazir = true;
}

export type VekilKaydi = { yonetici: string; hedef: string; zaman: string };

/**
 * Deftere bir satır yazar.
 *
 * Yazılamazsa vekâleti ENGELLEMİYORUZ, yalnızca sunucu günlüğüne düşüyoruz:
 * veritabanı kesintisinde yöneticiyi kendi panelinden kilitlemek, defterin
 * bir satırını kaybetmekten daha pahalı. Bilinçli tercih.
 */
export async function vekaletiKaydet(yonetici: string, hedef: string): Promise<void> {
  if (!veritabaniVarMi()) return;
  try {
    await semayiHazirla();
    await sql()`INSERT INTO vekil_kayitlari (yonetici, hedef)
                VALUES (${yonetici.toLowerCase()}, ${hedef.toLowerCase()})`;
  } catch (hata) {
    console.error("Vekâlet kaydı yazılamadı:", hata);
  }
}

/** Son kayıtlar — yönetici panelinde gösteriliyor. */
export async function vekilKayitlariniListele(azami = 50): Promise<VekilKaydi[]> {
  if (!veritabaniVarMi()) return [];
  try {
    await semayiHazirla();
    const satirlar = await sql()<{ yonetici: string; hedef: string; zaman: Date }[]>`
      SELECT yonetici, hedef, zaman FROM vekil_kayitlari
      ORDER BY zaman DESC LIMIT ${azami}
    `;
    return satirlar.map((s) => ({
      yonetici: s.yonetici,
      hedef: s.hedef,
      zaman: s.zaman.toISOString(),
    }));
  } catch {
    return [];
  }
}
