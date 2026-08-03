/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * ANA SAYFA ARAMASI
 *
 * Hata: ilce secili degilken Enter'a basmak aramayi yapmiyor, ilce
 * penceresini aciyordu — "makbule sef" yazan kisi ilce listesi goruyordu.
 * Arama teslimat adresi gerektirmemeli.
 */
const KOK = "https://neyersin.local";
const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const t = kapiliTarayici(await chromium.launch());

async function bitir(patlama) {
  await t.close().catch(() => {});
  if (patlama) cikti.push(`  !   test yarida kesildi: ${String(patlama).split("\n")[0]}`);
  console.log(cikti.join("\n"));
  const sorun = hatalar.length + (patlama ? 1 : 0);
  console.log("\n" + (sorun === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${sorun} SORUN`));
  process.exit(sorun === 0 ? 0 : 1);
}
process.on("unhandledRejection", (e) => void bitir(e));
process.on("uncaughtException", (e) => void bitir(e));

const s = await (await t.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
const jsHatalari = [];
s.on("pageerror", (e) => jsHatalari.push(String(e)));

await s.goto(KOK, { waitUntil: "networkidle" });
await s.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
await s.reload({ waitUntil: "networkidle" });

// ============ 1. ILCE SECMEDEN SEF ARAMA ============
const kutu = s.locator('input[placeholder*="ara"]').first();
(await kutu.count()) === 1 ? ok(1, "arama kutusu var") : bad(1, "arama kutusu yok");

await kutu.fill("makbule sef"); // BILEREK s-siz: Turkce harf toleransi test ediliyor
await kutu.press("Enter");

/*
 * Yonlendirmeyi BEKLIYORUZ. Sabit sure yetmiyordu: router.push tamamlanmadan
 * adres okunuyor, sayfa hala "/" gorunuyordu.
 */
const gitti = await s
  .waitForURL((u) => new URL(u).pathname === "/restoranlar", { timeout: 20000 })
  .then(() => true)
  .catch(() => false);
gitti
  ? ok(2, "Enter aramayi calistirdi (ilce sorulmadi)")
  : bad(2, `beklenmeyen adres: ${s.url()}`);
await s.waitForTimeout(1200);

const govde = await s.locator("body").innerText();
/Makbule/i.test(govde)
  ? ok(3, "'makbule sef' aramasi Makbule Sef'i buldu (Turkce harf toleransi)")
  : bad(3, "sonuc bulunamadi");

/İlçe seç|ilçe seç/i.test(await s.locator("dialog, [role=dialog]").innerText().catch(() => ""))
  ? bad(4, "ilce penceresi aciliyor")
  : ok(4, "ilce penceresi acilmiyor");

// ============ 2. TAM ADLA ARAMA ============
await s.goto(KOK, { waitUntil: "networkidle" });
const kutu2 = s.locator('input[placeholder*="ara"]').first();
await kutu2.fill("Gönül");
await kutu2.press("Enter");
await s.waitForTimeout(2500);
/Gönül/i.test(await s.locator("body").innerText())
  ? ok(5, "'Gönül' aramasi calisiyor")
  : bad(5, "Gonul bulunamadi");

// ============ 3. KELIME SIRASI ONEMSIZ ============
await s.goto(`${KOK}/restoranlar?q=${encodeURIComponent("sef makbule")}`, {
  waitUntil: "networkidle",
});
/Makbule/i.test(await s.locator("body").innerText())
  ? ok(6, "kelime sirasi onemsiz ('sef makbule')")
  : bad(6, "ters sirada bulunamadi");

// ============ 4. OLMAYAN ARAMA BOS DONER ============
await s.goto(`${KOK}/restoranlar?q=${encodeURIComponent("zzzyokboyle")}`, {
  waitUntil: "networkidle",
});
/sonuç bulunamadı|bulunamadı|eşleşen/i.test(await s.locator("body").innerText())
  ? ok(7, "olmayan arama bos sonuc mesaji veriyor")
  : bad(7, "bos sonuc mesaji yok");

jsHatalari.length === 0 ? ok(8, "JS hatasi yok") : bad(8, `JS: ${jsHatalari.join(" | ")}`);

await bitir();
