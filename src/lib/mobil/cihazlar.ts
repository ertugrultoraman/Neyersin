import postgres from "postgres";

/**
 * MOBİL CİHAZ KAYDI VE OTURUM İPTALİ.
 *
 * NEDEN GEREKİYOR: mobil jetonlar DURUM TUTMUYOR (bkz. lib/mobil/jeton.ts) —
 * imzası doğruysa geçerliler. Bu, her istekte veritabanına gitmemek için
 * bilinçli bir tercih ama bir boşluk bırakıyordu: yenileme jetonunun ömrü 180
 * gün ve telefonu çalınan kuryenin oturumunu kesecek hiçbir yol yoktu.
 * Parolayı değiştirmek bile işe yaramıyordu, çünkü jeton parolaya bağlı değil.
 *
 * ÇÖZÜM YALNIZCA YENİLEME NOKTASINA KONULDU. İptal kontrolü her istekte
 * yapılsaydı, saniyede gelen teklif yoklamalarının hepsine bir veritabanı
 * okuması eklenirdi. Yenileme saatte bir olduğu için maliyet ihmal edilebilir;
 * bedeli, iptalin en geç bir saat içinde (erişim jetonu ömrü) devreye
 * girmesi — çalınan telefon senaryosunda kabul edilebilir bir pencere.
 *
 * KAYIT SİLİNMİYOR, İPTAL İŞARETLENİYOR: "bu hesaba hangi cihazlardan
 * girilmiş" sorusunun cevabı güvenlik incelemesinin ilk adımı. Satır
 * silinseydi, saldırganın hangi cihazdan girdiği de silinirdi.
 *
 * VERİTABANI YOKSA sessizce kapalı: dosya deposu tek süreçte çalışıyor ve
 * oturum iptali çok süreçli bir sunucuda anlamlı. Kapalıyken hiçbir cihaz
 * iptal edilmiş sayılmıyor — yani mevcut davranış korunuyor, kimse dışarıda
 * kalmıyor.
 */

let baglanti: ReturnType<typeof postgres> | null = null;
let semaSozu: Promise<void> | null = null;

export const cihazKaydiAcikMi = () => Boolean(process.env.DATABASE_URL);

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
      CREATE TABLE IF NOT EXISTS mobil_cihazlar (
        eposta       TEXT NOT NULL,
        cihaz        TEXT NOT NULL,
        ilk_giris    TIMESTAMPTZ NOT NULL DEFAULT now(),
        son_gorulme  TIMESTAMPTZ NOT NULL DEFAULT now(),
        iptal_tarihi TIMESTAMPTZ,
        PRIMARY KEY (eposta, cihaz)
      )
    `;
    await sql()`
      CREATE INDEX IF NOT EXISTS mobil_cihazlar_eposta ON mobil_cihazlar (eposta)
    `;
  })().catch((hata) => {
    semaSozu = null;
    throw hata;
  });
  return semaSozu;
}

const kucuk = (e: string) => e.trim().toLocaleLowerCase("tr");

export type Cihaz = {
  cihaz: string;
  ilkGiris: string;
  sonGorulme: string;
  iptalTarihi: string | null;
};

/**
 * Girişte cihazı kaydeder ve varsa ESKİ İPTALİ KALDIRIR.
 *
 * İptal kalkmasaydı, telefonunu bulan ya da yeniden kuran kurye bir daha o
 * cihazdan giriş yapamazdı — üstelik sebebini anlayamazdı. İptalin anlamı
 * "elindeki jeton geçersiz", "bu cihaz yasaklı" değil; parolayı bilen kişi
 * yeniden girebilmeli.
 */
export async function cihaziKaydet(eposta: string, cihaz: string): Promise<void> {
  if (!cihazKaydiAcikMi()) return;
  try {
    await semayiHazirla();
    await sql()`
      INSERT INTO mobil_cihazlar (eposta, cihaz, ilk_giris, son_gorulme, iptal_tarihi)
      VALUES (${kucuk(eposta)}, ${cihaz}, now(), now(), NULL)
      ON CONFLICT (eposta, cihaz) DO UPDATE SET
        son_gorulme  = now(),
        iptal_tarihi = NULL
    `;
  } catch {
    /* Kayıt tutulamazsa giriş yine de olsun; bu bir denetim kaydı, kapı değil. */
  }
}

/**
 * Cihaz iptal edilmiş mi? Yenileme ucu bunu soruyor.
 *
 * HATA DURUMUNDA `false` DÖNÜYOR — yani veritabanına ulaşılamazsa oturum
 * kesilmiyor. Tersi, bir veritabanı arızasında sahadaki bütün kuryeleri aynı
 * anda dışarı atmak olurdu.
 */
export async function cihazIptalEdilmisMi(eposta: string, cihaz: string): Promise<boolean> {
  if (!cihazKaydiAcikMi()) return false;
  try {
    await semayiHazirla();
    const satirlar = await sql()<{ iptal: boolean }[]>`
      SELECT (iptal_tarihi IS NOT NULL) AS iptal
      FROM mobil_cihazlar
      WHERE eposta = ${kucuk(eposta)} AND cihaz = ${cihaz}
      LIMIT 1
    `;
    return satirlar[0]?.iptal ?? false;
  } catch {
    return false;
  }
}

/** Yenileme başarılıysa "son görülme" damgası tazeleniyor. */
export async function cihaziGorduk(eposta: string, cihaz: string): Promise<void> {
  if (!cihazKaydiAcikMi()) return;
  try {
    await semayiHazirla();
    await sql()`
      UPDATE mobil_cihazlar SET son_gorulme = now()
      WHERE eposta = ${kucuk(eposta)} AND cihaz = ${cihaz}
    `;
  } catch {
    /* sessiz */
  }
}

/** Tek cihazın oturumunu keser (çıkış ya da "telefonumu kaybettim"). */
export async function cihaziIptalEt(eposta: string, cihaz: string): Promise<void> {
  if (!cihazKaydiAcikMi()) return;
  await semayiHazirla();
  await sql()`
    INSERT INTO mobil_cihazlar (eposta, cihaz, iptal_tarihi)
    VALUES (${kucuk(eposta)}, ${cihaz}, now())
    ON CONFLICT (eposta, cihaz) DO UPDATE SET iptal_tarihi = now()
  `;
}

/** Hesabın BÜTÜN cihazlarını keser — parola sızıntısı şüphesinde. */
export async function tumCihazlariIptalEt(eposta: string): Promise<number> {
  if (!cihazKaydiAcikMi()) return 0;
  await semayiHazirla();
  const satirlar = await sql()<{ cihaz: string }[]>`
    UPDATE mobil_cihazlar SET iptal_tarihi = now()
    WHERE eposta = ${kucuk(eposta)} AND iptal_tarihi IS NULL
    RETURNING cihaz
  `;
  return satirlar.length;
}

/** Hesabın cihazları — yönetici paneli ve "cihazlarım" ekranı için. */
export async function cihazlariListele(eposta: string): Promise<Cihaz[]> {
  if (!cihazKaydiAcikMi()) return [];
  try {
    await semayiHazirla();
    const satirlar = await sql()<
      { cihaz: string; ilk_giris: Date; son_gorulme: Date; iptal_tarihi: Date | null }[]
    >`
      SELECT cihaz, ilk_giris, son_gorulme, iptal_tarihi
      FROM mobil_cihazlar
      WHERE eposta = ${kucuk(eposta)}
      ORDER BY son_gorulme DESC
      LIMIT 50
    `;
    return satirlar.map((s) => ({
      cihaz: s.cihaz,
      ilkGiris: new Date(s.ilk_giris).toISOString(),
      sonGorulme: new Date(s.son_gorulme).toISOString(),
      iptalTarihi: s.iptal_tarihi ? new Date(s.iptal_tarihi).toISOString() : null,
    }));
  } catch {
    return [];
  }
}
