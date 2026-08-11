/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import fs from "node:fs";

import postgres from "postgres";
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * KURYE BASVURUSU — arac ve ehliyet sorulari
 *
 * Test edilen kurallar:
 *  - Kurye secilince arac sorusu cikiyor, diger konularda cikmiyor
 *  - Ehliyet listesi ARACA gore: 50 cc moped icin B (ve M) sinifi da gecerli,
 *    motosiklette yalnizca A1/A2/A
 *  - Arac degisince artik gecerli olmayan ehliyet cevabi siliniyor
 *  - Motorsuz araca (bisiklet) gecilince ehliyet ve SRC hic sorulmuyor
 *  - Belge ipucu 50 cc kuralini yaziyor
 *  - Moped + B ehliyetle gonderilen basvuru KAYDEDILIYOR ve yoneticinin
 *    destek listesinde "50 cc icin yeterli" notuyla gorunuyor
 *
 * NEDEN AYRI BIR TEST: liste once her motorlu aracta A1/A2/A/B gosteriyor,
 * ipucu ise "motora gore A1/A2/A" diyordu. Elinde B ehliyet olan bir moped
 * kuryesi bunu okuyup basvurmaktan vazgecebilirdi. Kural mevzuattan geliyor,
 * kod okunarak anlasilmiyor — yaziyla sabitlenmesi gerekiyor.
 */
const KOK = "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;
if (!PAROLA) { console.error("ADMIN_PASSWORD yok."); process.exit(2); }

const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: "require", max: 3 });

const DAMGA = Date.now();
const EPOSTA = `kurye-${DAMGA}@neyersin.test`;
const AD = `Kurye Testi ${DAMGA}`;

const tarayici = kapiliTarayici(await chromium.launch());

async function temizle() {
  const talepler = await sql`SELECT id FROM destek_talepleri WHERE eposta = ${EPOSTA}`.catch(() => []);
  for (const { id } of talepler) {
    await sql`DELETE FROM belgeler WHERE sahip_id = ${id}`.catch(() => {});
  }
  await sql`DELETE FROM destek_talepleri WHERE eposta = ${EPOSTA}`.catch(() => {});
}

async function bitir(patlama) {
  await temizle();
  await sql.end().catch(() => {});
  await tarayici.close().catch(() => {});
  if (patlama) cikti.push(`  !   test yarida kesildi: ${String(patlama).split("\n")[0]}`);
  console.log(cikti.join("\n"));
  const sorun = hatalar.length + (patlama ? 1 : 0);
  console.log("\n" + (sorun === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${sorun} SORUN`));
  process.exit(sorun === 0 ? 0 : 1);
}
process.on("unhandledRejection", (e) => void bitir(e));
process.on("uncaughtException", (e) => void bitir(e));

await temizle();

const sayfa = await (await tarayici.newContext({ viewport: { width: 1280, height: 1100 } })).newPage();
const jsHatalari = [];
sayfa.on("pageerror", (e) => jsHatalari.push(e.message));

await sayfa.goto(`${KOK}/iletisim?konu=kurye`, { waitUntil: "networkidle" });

/*
 * Formun alanlarinda `name` ozniteligi YOK (React durumu tutuyor). Acilir
 * kutular sirayla duruyor: ilce, arac, ehliyet, SRC — kurye konusunda isletme
 * alani cikmadigi icin sira sabit.
 */
const form = sayfa.locator("form");
const kutular = form.locator("select");
const aracKutusu = kutular.nth(1);
const ehliyetKutusu = kutular.nth(2);
const srcKutusu = kutular.nth(3);

/** Bir acilir kutunun secenek DEGERLERI (bos "Seciniz" haric). */
const secenekler = async (kutu) =>
  (await kutu.locator("option").evaluateAll((o) => o.map((s) => s.value))).filter(Boolean);

/* ════════════ 1. ARAC SORUSU ════════════ */
const aracSecenekleri = await secenekler(aracKutusu);
aracSecenekleri.includes("moped") && aracSecenekleri.includes("bisiklet")
  ? ok(1, `arac sorusu var (${aracSecenekleri.join(", ")})`)
  : bad(1, `arac secenekleri beklenenden farkli: ${aracSecenekleri.join(", ")}`);

const mopedEtiketi = await aracKutusu.locator('option[value="moped"]').innerText();
/50\s*cc/i.test(mopedEtiketi)
  ? ok(2, `moped secenegi hacmi yaziyor ("${mopedEtiketi.trim()}")`)
  : bad(2, `moped secenegi 50 cc demiyor: "${mopedEtiketi.trim()}"`);

/* ════════════ 2. MOPED → B EHLIYET DE GECERLI ════════════ */
await aracKutusu.selectOption("moped");
await sayfa.waitForTimeout(300);
const mopedEhliyetleri = await secenekler(ehliyetKutusu);
mopedEhliyetleri.includes("B") && mopedEhliyetleri.includes("M")
  ? ok(3, `mopedde B ve M sinifi listede (${mopedEhliyetleri.join(", ")})`)
  : bad(3, `50 cc moped icin B ehliyet secilemiyor: ${mopedEhliyetleri.join(", ")}`);

const mopedIpucu = await sayfa.locator("form label", { hasText: "Ehliyet" }).first().innerText();
/50\s*cc/i.test(mopedIpucu) && /\bB\b/.test(mopedIpucu)
  ? ok(4, "mopedde ipucu B ehliyetin yettigini yaziyor")
  : bad(4, `mopedde ipucu 50 cc / B demiyor: "${mopedIpucu.replace(/\s+/g, " ").trim()}"`);

/* ════════════ 3. MOTOSIKLET → B YETMIYOR ════════════ */
await ehliyetKutusu.selectOption("B");
await aracKutusu.selectOption("motosiklet");
await sayfa.waitForTimeout(300);
const motorEhliyetleri = await secenekler(ehliyetKutusu);
!motorEhliyetleri.includes("B") && motorEhliyetleri.includes("A2")
  ? ok(5, `motosiklette yalnizca A siniflari (${motorEhliyetleri.join(", ")})`)
  : bad(5, `motosiklet ehliyet listesi yanlis: ${motorEhliyetleri.join(", ")}`);

(await ehliyetKutusu.inputValue()) === ""
  ? ok(6, "araca uymayan onceki cevap (B) silinmis")
  : bad(6, `arac degisti ama ehliyet "${await ehliyetKutusu.inputValue()}" olarak kaldi`);

/* ════════════ 4. BISIKLETTE EHLIYET SORULMUYOR ════════════ */
await aracKutusu.selectOption("bisiklet");
await sayfa.waitForTimeout(300);
(await kutular.count()) === 2
  ? ok(7, "bisiklette ehliyet ve SRC hic sorulmuyor")
  : bad(7, `bisiklette ${await kutular.count()} acilir kutu var — ehliyet/SRC kalmis`);

/* ════════════ 5. BELGE IPUCU ════════════ */
const belgeIpucu = await sayfa.locator("body").innerText();
/50\s*cc/i.test(belgeIpucu.split("\n").find((s) => /ehliyet/i.test(s) && /SRC/i.test(s)) ?? "")
  ? ok(8, "belge ipucu 50 cc kuralini yaziyor")
  : bad(8, "belge ipucunda 50 cc kurali yok");

/* ════════════ 6. MOPED + B ILE BASVURU ════════════ */
await aracKutusu.selectOption("moped");
await sayfa.waitForTimeout(300);
await ehliyetKutusu.selectOption("B");
await srcKutusu.selectOption("yok");
await form.locator('input[autocomplete="name"]').fill(AD);
await form.locator('input[autocomplete="tel"]').fill("5001112233");
await form.locator('input[autocomplete="email"]').fill(EPOSTA);
await form.locator("textarea").fill("Beylikduzu ve civarinda aksam vardiyasinda calisabilirim.");
await form.locator('button[type="submit"]').click();
await sayfa.waitForTimeout(4000);

/^NY-B-/.test((await sayfa.locator("body").innerText()).match(/NY-B-\w+/)?.[0] ?? "")
  ? ok(9, "basvuru gonderildi, referans numarasi verildi")
  : bad(9, "basvuru gonderilemedi — referans numarasi cikmadi");

const talep = (await sql`SELECT id, no, mesaj FROM destek_talepleri WHERE eposta = ${EPOSTA}`)[0];
talep ? ok(10, `basvuru kaydedildi (${talep.no})`) : bad(10, "basvuru hicbir yere kaydedilmedi");

if (talep) {
  /50\s*cc/i.test(talep.mesaj) && /Ehliyet:\s*B/.test(talep.mesaj)
    ? ok(11, "kayitta B ehliyet 50 cc notuyla duruyor")
    : bad(11, `kayitta ehliyet notu eksik: ${JSON.stringify(talep.mesaj)}`);

  /* ── Isin diger ucu: yonetici bunu panelde goruyor mu? ── */
  const y = await (await tarayici.newContext({ viewport: { width: 1440, height: 1100 } })).newPage();
  await y.goto(`${KOK}/admin/giris`, { waitUntil: "domcontentloaded" });
  await y.fill('input[name="eposta"]', ADMIN);
  await y.fill('input[name="parola"]', PAROLA);
  await y.click('form button[type="submit"]');
  await y.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 30000 });

  await y.goto(`${KOK}/admin/destek`, { waitUntil: "networkidle" });
  const panel = await y.locator("body").innerText();
  panel.includes(AD)
    ? ok(12, "basvuru yonetici destek listesinde")
    : bad(12, "basvuru yonetici panelinde gorunmuyor");
  /50\s*cc/i.test(panel)
    ? ok(13, "yonetici 'B ehliyet 50 cc icin yeterli' notunu goruyor")
    : bad(13, "yonetici panelinde 50 cc notu yok — basvuru yanlislikla elenebilir");
}

jsHatalari.length === 0
  ? ok(14, "sayfada JS hatasi yok")
  : bad(14, `JS hatasi: ${jsHatalari[0]}`);

await bitir();
