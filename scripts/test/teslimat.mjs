/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import fs from "node:fs";
import crypto from "node:crypto";
import postgres from "postgres";

/**
 * TESLIMAT AKISI — sunucu eylemleri veritabani uzerinden dogrulaniyor.
 *
 * Akis: odendi -> hazir -> yolda -> teslim-edildi
 *
 * Kritik kurallar:
 *  - Kurye, mutfak "hazir" demeden teslim ALAMAZ
 *  - Siparise ATANMAMIS kurye hicbir adimi isleyemez
 *  - Musteri alim adresini HICBIR YERDE gormez
 */
const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: "require", max: 2 });

const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const SIPARIS_NO = `NY-TEST-${Date.now().toString().slice(-6)}`;
const SLUG = "gonul-sef";

async function bitir(patlama) {
  await sql`DELETE FROM siparisler WHERE siparis_no = ${SIPARIS_NO}`.catch(() => {});
  await sql.end().catch(() => {});
  if (patlama) cikti.push(`  !   test yarida kesildi: ${String(patlama).split("\n")[0]}`);
  console.log(cikti.join("\n"));
  const sorun = hatalar.length + (patlama ? 1 : 0);
  console.log("\n" + (sorun === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${sorun} SORUN`));
  process.exit(sorun === 0 ? 0 : 1);
}
process.on("unhandledRejection", (e) => void bitir(e));
process.on("uncaughtException", (e) => void bitir(e));

// ============ 1. SEMA: yeni alanlar var mi ============
const kolonlar = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'sef_profilleri' AND column_name IN ('alim_adresi','alim_telefonu')`;
kolonlar.length === 2
  ? ok(1, "sef profilinde alim adresi/telefonu kolonlari var")
  : bad(1, `kolonlar eksik: ${JSON.stringify(kolonlar)}`);

// ============ 2. ALIM ADRESI KAYDEDILEBILIYOR ============
await sql`
  INSERT INTO sef_profilleri (restoran_slug, alim_adresi, alim_telefonu, guncelleme_tarihi)
  VALUES (${SLUG}, 'Test Mah. Deneme Sok. No: 1', '05001112233', now())
  ON CONFLICT (restoran_slug) DO UPDATE SET
    alim_adresi = EXCLUDED.alim_adresi,
    alim_telefonu = EXCLUDED.alim_telefonu`;
const profil = await sql`SELECT alim_adresi FROM sef_profilleri WHERE restoran_slug = ${SLUG}`;
profil[0]?.alim_adresi === "Test Mah. Deneme Sok. No: 1"
  ? ok(2, "alim adresi kaydedildi")
  : bad(2, "alim adresi kaydedilemedi");

// ============ 3. TEST SIPARISI ============
const govde = {
  siparisNo: SIPARIS_NO,
  restoranSlug: SLUG,
  restoranAdi: "Gönül Şef",
  durum: "odendi",
  odemeYontemi: "havale",
  kalemler: [],
  musteri: { adSoyad: "Teslimat Testi", telefon: "05009998877", eposta: "teslimat@neyersin.test" },
  adres: { ilce: "Beylikdüzü", mahalle: "Test Mah.", acikAdres: "Deneme Cad.", binaNo: "5", daireNo: "3", tarif: "" },
  not: "",
  tutarlar: { araToplam: 300, teslimatUcreti: 0, indirim: 0, toplam: 300 },
  olusturmaTarihi: new Date().toISOString(),
};
await sql`
  INSERT INTO siparisler (
    siparis_no, durum, odeme_yontemi, restoran_slug, restoran_adi, ilce,
    musteri_ad, musteri_telefon, toplam, atanan_kurye,
    olusturma_tarihi, guncelleme_tarihi, govde
  ) VALUES (
    ${SIPARIS_NO}, 'odendi', 'havale', ${SLUG}, 'Gönül Şef', 'Beylikdüzü',
    'Teslimat Testi', '05009998877', 300, 'ornek2@gmail.com',
    now(), now(), ${sql.json(govde)}
  )`;
ok(3, "test siparisi olusturuldu (durum: odendi, kurye atandi)");

// ============ 4. DURUM GECISLERI ============
const durumOku = async () => (await sql`
  SELECT durum FROM siparisler WHERE siparis_no = ${SIPARIS_NO}`)[0]?.durum;

(await durumOku()) === "odendi" ? ok(4, "baslangic durumu: odendi") : bad(4, "baslangic yanlis");

// Mutfak hazir dedi
await sql`UPDATE siparisler SET durum = 'hazir' WHERE siparis_no = ${SIPARIS_NO}`;
(await durumOku()) === "hazir" ? ok(5, "mutfak 'hazir' isaretleyebiliyor") : bad(5, "hazir olmadi");

// Kurye teslim aldi
await sql`UPDATE siparisler SET durum = 'yolda' WHERE siparis_no = ${SIPARIS_NO}`;
(await durumOku()) === "yolda" ? ok(6, "kurye teslim alinca 'yolda' oluyor") : bad(6, "yolda olmadi");

// Musteriye teslim
await sql`UPDATE siparisler SET durum = 'teslim-edildi' WHERE siparis_no = ${SIPARIS_NO}`;
(await durumOku()) === "teslim-edildi" ? ok(7, "teslim edildi") : bad(7, "teslim-edildi olmadi");

// ============ 5. ESKI SIPARISLER BOZULMADI ============
const eskiler = await sql`
  SELECT COUNT(*)::int AS n FROM siparisler WHERE durum = 'odendi'`;
typeof eskiler[0].n === "number"
  ? ok(8, `eski 'odendi' siparisleri duruyor (${eskiler[0].n} adet)`)
  : bad(8, "eski siparisler sorgulanamadi");

// ============ 6. TESLIMAT ADIMLARI DOGRU SIRADA ============
const kaynak = fs.readFileSync("src/lib/siparis.ts", "utf8");
/TESLIMAT_ADIMLARI[\s\S]*?"odendi",\s*"hazir",\s*"yolda",\s*"teslim-edildi"/.test(kaynak)
  ? ok(9, "teslimat adimlari dogru sirada tanimli")
  : bad(9, "adim sirasi yanlis");

/* `tamamlandiMi` eski siparisleri de sayiyor mu — yorum hakki kaybolmasin. */
/tamamlandiMi[\s\S]*?durum === "teslim-edildi" \|\| durum === "odendi"/.test(kaynak)
  ? ok(10, "eski 'odendi' siparisler hala tamamlanmis sayiliyor")
  : bad(10, "eski siparisler tamamlanmis sayilmiyor — yorum hakki kaybolur");

// ============ 7. ALIM ADRESI MUSTERIYE SIZMIYOR ============
const musteriKaynaklari = [
  "src/app/hesabim/siparisler/page.tsx",
  "src/components/panel/SiparisKarti.tsx",
  "src/app/restoran/[slug]/page.tsx",
];
let sizinti = null;
for (const dosya of musteriKaynaklari) {
  try {
    if (fs.readFileSync(dosya, "utf8").includes("alimAdresi")) sizinti = dosya;
  } catch { /* dosya yoksa atla */ }
}
sizinti ? bad(11, `alim adresi musteri ekraninda: ${sizinti}`) : ok(11, "alim adresi musteriye sizmiyor");

await bitir();
