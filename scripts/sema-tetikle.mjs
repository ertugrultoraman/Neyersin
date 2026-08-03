/**
 * Siparis deposunun semasini kurdurur.
 *
 * `siparisler` tablosu ayri bir depo modulunde ve yalnizca yonetici/panel
 * sayfalari acilinca kuruluyor. Tasima oncesi hedef veritabaninda bu tablonun
 * da bulunmasi gerekiyor; burada yoneticiyle girip /admin aciliyor.
 */
import { chromium } from "playwright";
import { kapiliTarayici } from "./test/yardim.mjs";

const KOK = "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;
if (!PAROLA) {
  console.error("ADMIN_PASSWORD yok.");
  process.exit(2);
}

const tarayici = kapiliTarayici(await chromium.launch());
const s = await (await tarayici.newContext()).newPage();

await s.goto(`${KOK}/admin/giris`, { waitUntil: "networkidle" });
await s.fill('input[name="eposta"]', ADMIN);
await s.fill('input[name="parola"]', PAROLA);
await s.click('button[type="submit"]');
await s.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 40000 });
console.log("yonetici paneli acildi:", s.url());

// Siparis deposuna dokunan sayfalar
for (const yol of ["/admin", "/hesabim"]) {
  await s.goto(KOK + yol, { waitUntil: "networkidle" }).catch(() => {});
}

await tarayici.close();
console.log("sema tetiklendi");
