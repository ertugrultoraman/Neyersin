/**
 * VERITABANI TASIMA — eski bolgeden yeni bolgeye
 *
 * Kullanim:
 *   node scripts/veri-tasi.mjs            # once PROVA (hicbir sey yazmaz)
 *   node scripts/veri-tasi.mjs --uygula   # gercekten yazar
 *
 * .env.local'da iki adres bulunur:
 *   DATABASE_URL       kaynak (mevcut, us-east-1)
 *   YENI_DATABASE_URL  hedef (yeni, eu-central-1)
 *
 * Guvenlik:
 *  - Hedefteki tablo BOS DEGILSE o tablo atlanir; yanlislikla ustune
 *    yazip veri kaybetmeyelim. Bilerek tazelemek icin --zorla kullanilir.
 *  - Kaynak yalnizca OKUNUR; taşıma dogrulanana kadar eski veritabani
 *    oldugu gibi durur.
 *  - Semayi uygulama kendisi kuruyor (ilk istekte). Bu betik yalnizca
 *    SATIRLARI kopyalar; tablo yoksa uyarir ve durur.
 */
import fs from "node:fs";
import postgres from "postgres";

const UYGULA = process.argv.includes("--uygula");
const ZORLA = process.argv.includes("--zorla");

const env = fs.readFileSync(".env.local", "utf8");
function adres(anahtar) {
  const e = env.match(new RegExp(`^${anahtar}=(.*)$`, "m"));
  if (!e) throw new Error(`${anahtar} .env.local icinde yok.`);
  return e[1].trim().replace(/^["']|["']$/g, "");
}

/** Tasima sirasi: yabanci anahtar yok ama okunakli olsun diye sabit. */
const TABLOLAR = [
  "hesaplar",
  "sef_mutfaklari",
  "sef_profilleri",
  "mutfak_urunleri",
  "basvurular",
  "yorumlar",
  "destek_talepleri",
  "dogrulama_kodlari",
  "siparisler",
];

const kaynak = postgres(adres("DATABASE_URL"), { ssl: "require", max: 2 });
const hedef = postgres(adres("YENI_DATABASE_URL"), { ssl: "require", max: 2 });

console.log(UYGULA ? "=== TASIMA (gercek) ===" : "=== PROVA (hicbir sey yazilmaz) ===");

let toplamKopyalanan = 0;
const atlananlar = [];
const eksikTablolar = [];

for (const tablo of TABLOLAR) {
  const varMi = await hedef`
    SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=${tablo}`;
  if (varMi.length === 0) {
    eksikTablolar.push(tablo);
    console.log(`  !  ${tablo}: HEDEFTE TABLO YOK`);
    continue;
  }

  const satirlar = await kaynak.unsafe(`SELECT * FROM "${tablo}"`);
  const hedefSayi = await hedef.unsafe(`SELECT COUNT(*)::int AS n FROM "${tablo}"`);

  if (satirlar.length === 0) {
    console.log(`  -  ${tablo}: kaynakta satir yok`);
    continue;
  }
  if (hedefSayi[0].n > 0 && !ZORLA) {
    atlananlar.push(tablo);
    console.log(`  !  ${tablo}: hedefte ${hedefSayi[0].n} satir VAR — atlandi (--zorla ile ustune yazilir)`);
    continue;
  }

  if (!UYGULA) {
    console.log(`  .  ${tablo}: ${satirlar.length} satir kopyalanacak`);
    toplamKopyalanan += satirlar.length;
    continue;
  }

  if (ZORLA && hedefSayi[0].n > 0) await hedef.unsafe(`DELETE FROM "${tablo}"`);

  /*
   * postgres.js yardimcilari (`hedef(...)`) YALNIZCA etiketli sablon icinde
   * calisir; `unsafe()` ile birlestirilirse nesne metne cevrilip sozdizimi
   * hatasi veriyor. Toplu ekleme tek turda gidiyor — uzak bolgeye gidis-donus
   * sayisi az olsun.
   */
  await hedef`INSERT INTO ${hedef(tablo)} ${hedef(satirlar)}`;

  const sonrasi = await hedef.unsafe(`SELECT COUNT(*)::int AS n FROM "${tablo}"`);
  console.log(`  OK ${tablo}: ${satirlar.length} satir -> hedefte ${sonrasi[0].n}`);
  toplamKopyalanan += satirlar.length;
}

console.log(`\nToplam: ${toplamKopyalanan} satir`);
if (eksikTablolar.length) {
  console.log(
    `\nHEDEFTE OLMAYAN TABLOLAR: ${eksikTablolar.join(", ")}\n` +
      `Once uygulamayi YENI veritabanina baglayip bir sayfa acin; sema kendiliginden kurulur.`,
  );
}
if (atlananlar.length) console.log(`Atlanan (hedefte veri vardi): ${atlananlar.join(", ")}`);
if (!UYGULA) console.log("\nGercekten tasimak icin: node scripts/veri-tasi.mjs --uygula");

await kaynak.end();
await hedef.end();
