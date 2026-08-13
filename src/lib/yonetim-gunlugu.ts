import postgres from "postgres";

/**
 * YÖNETİM DEFTERİ — panelde kim, neyi, ne zaman değiştirdi.
 *
 * NEDEN GEREKİYOR: vekâlet defteri (bkz. lib/vekil-kaydi.ts) yalnızca "kim
 * kime büründü" sorusunu cevaplıyordu. Yöneticinin KENDİ kimliğiyle yaptığı
 * işler — rol yükseltme, hesap silme, sipariş durumu değiştirme, mobil
 * oturum kesme — hiçbir yere yazılmıyordu. Bir ihlal ya da yanlışlık sonrası
 * "ne yapıldı" sorusunun cevabı yoktu; üstelik birden fazla yönetici
 * olduğunda kimin yaptığı da bilinemiyordu.
 *
 * AYRI TABLO, VEKÂLET DEFTERİNE EKLENMEDİ: o defterin satırı "yönetici →
 * hedef hesap" ilişkisi, buradaki satır "yönetici → eylem → nesne". Aynı
 * tabloya sıkıştırmak, iki farklı soruyu tek şemayla cevaplamaya çalışmak
 * olurdu ve ikisi de eksik kalırdı.
 *
 * YAZILAMAZSA EYLEM ENGELLENMİYOR. Veritabanı kesintisinde yöneticiyi kendi
 * panelinden kilitlemek, defterin bir satırını kaybetmekten pahalı. Aynı
 * tercih vekâlet defterinde de yapılmıştı; tutarlı olması önemli.
 *
 * KİŞİSEL VERİ YAZILMIYOR: `ayrinti` alanına adres, telefon ya da parola
 * girmiyor — yalnızca ne yapıldığını anlatan kısa bir metin. Defterin kendisi
 * bir sızıntı hedefi olmamalı.
 */

let baglanti: ReturnType<typeof postgres> | null = null;
let semaHazir = false;

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

async function semayiHazirla() {
  if (semaHazir) return;
  const q = sql();
  await q`
    CREATE TABLE IF NOT EXISTS yonetim_gunlugu (
      id       BIGSERIAL PRIMARY KEY,
      yonetici TEXT NOT NULL,
      eylem    TEXT NOT NULL,
      hedef    TEXT NOT NULL DEFAULT '',
      ayrinti  TEXT NOT NULL DEFAULT '',
      ip       TEXT NOT NULL DEFAULT '',
      zaman    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await q`CREATE INDEX IF NOT EXISTS yonetim_gunlugu_zaman ON yonetim_gunlugu (zaman DESC)`;
  await q`CREATE INDEX IF NOT EXISTS yonetim_gunlugu_yonetici ON yonetim_gunlugu (yonetici, zaman DESC)`;
  semaHazir = true;
}

/**
 * Deftere yazılan eylem türleri.
 *
 * SERBEST METİN DEĞİL, sabit liste: eylem adı çağrı yerinde elle yazılsaydı
 * "rol-degistir" ile "rolDegistir" zamanla yan yana birikir ve defteri
 * süzmek imkânsız hâle gelirdi.
 */
export type YonetimEylemi =
  | "rol-degistir"
  | "hesap-sil"
  | "parola-uret"
  | "mutfak-bagla"
  | "altin-sef"
  | "basvuru-onayla"
  | "basvuru-reddet"
  | "siparis-durum"
  | "siparis-ata"
  | "oturum-kes"
  | "vardiya-ac"
  | "vardiya-sil"
  | "engel-kaldir";

export type GunlukKaydi = {
  yonetici: string;
  eylem: YonetimEylemi;
  hedef: string;
  ayrinti: string;
  ip: string;
  zaman: string;
};

export async function yonetimKaydet(girdi: {
  yonetici: string;
  eylem: YonetimEylemi;
  hedef?: string;
  ayrinti?: string;
  ip?: string;
}): Promise<void> {
  if (!veritabaniVarMi()) return;
  try {
    await semayiHazirla();
    await sql()`
      INSERT INTO yonetim_gunlugu (yonetici, eylem, hedef, ayrinti, ip)
      VALUES (
        ${girdi.yonetici.toLowerCase()},
        ${girdi.eylem},
        ${(girdi.hedef ?? "").slice(0, 200)},
        ${(girdi.ayrinti ?? "").slice(0, 500)},
        ${girdi.ip ?? ""}
      )
    `;
  } catch (hata) {
    console.error("[yonetim-gunlugu] yazilamadi:", hata);
  }
}

export async function gunlukOku(azami = 200): Promise<GunlukKaydi[]> {
  if (!veritabaniVarMi()) return [];
  try {
    await semayiHazirla();
    const satirlar = await sql()<
      {
        yonetici: string;
        eylem: string;
        hedef: string;
        ayrinti: string;
        ip: string;
        zaman: Date;
      }[]
    >`
      SELECT yonetici, eylem, hedef, ayrinti, ip, zaman
      FROM yonetim_gunlugu
      ORDER BY zaman DESC
      LIMIT ${azami}
    `;
    return satirlar.map((s) => ({
      yonetici: s.yonetici,
      eylem: s.eylem as YonetimEylemi,
      hedef: s.hedef,
      ayrinti: s.ayrinti,
      ip: s.ip,
      zaman: s.zaman.toISOString(),
    }));
  } catch {
    return [];
  }
}
