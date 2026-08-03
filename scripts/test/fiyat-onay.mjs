/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import fs from "node:fs";
import postgres from "postgres";
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * FİYAT ONAY AKIŞI
 *
 * Şef kendi profilinden fiyat değiştirmek istediğinde:
 *  - talep yöneticiye düşer, YAYINDAKİ fiyat değişmez
 *  - müşteri hâlâ eski fiyatı görür
 *  - yönetici onaylayınca yeni fiyat yayına geçer
 *
 * En kritik kontrol: onay beklerken müşteriye görünen fiyatın DEĞİŞMEMESİ.
 * Aksi hâlde onay mekanizmasının hiçbir anlamı kalmaz.
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
const sql = postgres(url, { ssl: "require", max: 2 });

const SLUG = "gonul-sef";
let URUN_ID = null;

const tarayici = kapiliTarayici(await chromium.launch());

async function bitir(patlama) {
  // Test urununu temizle
  if (URUN_ID) await sql`DELETE FROM mutfak_urunleri WHERE id = ${URUN_ID}`.catch(() => {});
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

const baglam = await tarayici.newContext({ viewport: { width: 1440, height: 1000 } });
const s = await baglam.newPage();
const jsHatalari = [];
s.on("pageerror", (e) => jsHatalari.push(String(e)));

// ============ 1. MISAFIR DUZENLEME GORMEZ ============
await s.goto(`${KOK}/restoran/${SLUG}`, { waitUntil: "networkidle" });
await s.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));
await s.reload({ waitUntil: "networkidle" });

(await s.locator('button:has-text("Fiyatı düzenle")').count()) === 0
  ? ok(1, "misafire fiyat duzenleme cikmiyor")
  : bad(1, "misafir fiyat duzenleyebiliyor");

// ============ 2. YONETICI GIRISI ============
await s.goto(`${KOK}/admin/giris`, { waitUntil: "networkidle" });
await s.fill('input[name="eposta"]', ADMIN);
await s.fill('input[name="parola"]', PAROLA);
await s.click('button[type="submit"]');
await s.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 30000 });
ok(2, "yonetici girisi calisiyor");

// ============ 3. SAHIBINE DUZENLEME CIKIYOR ============
await s.goto(`${KOK}/restoran/${SLUG}`, { waitUntil: "networkidle" });
const dugmeler = await s.locator('button:has-text("Fiyatı düzenle")').count();
dugmeler > 0 ? ok(3, `duzenleme dugmesi cikiyor (${dugmeler} urun)`) : bad(3, "duzenleme dugmesi yok");
if (dugmeler === 0) await bitir("duzenleme dugmesi olmadan devam edilemiyor");

// ============ 4. FIYAT TALEBI ============
/*
 * FIYATI OLAN bir urun seciliyor. Ilk satiri almak yaniltiyordu: Gonul Sef'in
 * menusunde bastaki urunler fiyati henuz girilmemis taslaklar ("Fiyat yakinda")
 * ve fiyat "—" olarak cikiyor.
 */
const satirlar = s.locator('section[id^="menu-"] li');
const adet = await satirlar.count();
let ilkSatir = null;
let oncekiFiyat = 0;
for (let i = 0; i < adet; i += 1) {
  const aday = satirlar.nth(i);
  const metin = await aday.innerText();
  // Fiyat "₺150" biciminde basiliyor (Intl, tr-TR) — "TL" degil.
  const bulunan = Number((metin.match(/₺\s*([\d.]+)/) ?? [])[1]?.replace(/\./g, "") ?? 0);
  if (bulunan > 0 && (await aday.locator('button:has-text("Fiyatı düzenle")').count()) > 0) {
    ilkSatir = aday;
    oncekiFiyat = bulunan;
    break;
  }
}
oncekiFiyat > 0 ? ok(4, `fiyatli urun bulundu: ${oncekiFiyat} TL`) : bad(4, "fiyatli urun yok");
if (!ilkSatir) await bitir("fiyatli urun bulunamadi");

const YENI_FIYAT = oncekiFiyat + 37;
await ilkSatir.locator('button:has-text("Fiyatı düzenle")').click();
await ilkSatir.locator('input[name="fiyat"]').fill(String(YENI_FIYAT));
await ilkSatir.locator('button:has-text("Onaya gönder")').click();
await s.waitForFunction(() => document.body.innerText.includes("onaya gönderildi"), null, { timeout: 20000 })
  .then(() => ok(5, "talep onaya gonderildi"))
  .catch(() => bad(5, "talep gonderilemedi"));

// Hangi urun oldugunu veritabanindan bul (temizlik icin)
const kayit = await sql`
  SELECT id, fiyat, bekleyen_fiyat FROM mutfak_urunleri
  WHERE restoran_slug = ${SLUG} AND bekleyen_fiyat IS NOT NULL LIMIT 1`;
URUN_ID = kayit[0]?.id ?? null;
URUN_ID ? ok(6, "talep veritabanina yazildi") : bad(6, "talep veritabaninda yok");
if (!URUN_ID) await bitir("talep kaydi bulunamadi");

// ============ 5. EN KRITIK: YAYINDAKI FIYAT DEGISMEDI ============
Number(kayit[0].fiyat) === oncekiFiyat
  ? ok(7, `yayindaki fiyat DEGISMEDI (${oncekiFiyat} TL)`)
  : bad(7, `yayindaki fiyat degisti! ${kayit[0].fiyat}`);

Number(kayit[0].bekleyen_fiyat) === YENI_FIYAT
  ? ok(8, `bekleyen fiyat kaydedildi (${YENI_FIYAT} TL)`)
  : bad(8, "bekleyen fiyat yanlis");

// ============ 6. MUSTERI HALA ESKI FIYATI GORUYOR ============
const misafir = await tarayici.newContext();
const m = await misafir.newPage();
await m.goto(`${KOK}/restoran/${SLUG}`, { waitUntil: "networkidle" });
const misafirMetin = await m.locator('section[id^="menu-"] li').first().innerText();
misafirMetin.includes(String(YENI_FIYAT))
  ? bad(9, "musteri ONAYSIZ yeni fiyati goruyor")
  : ok(9, "musteri hala eski fiyati goruyor");
await misafir.close();

// ============ 7. YONETICI EKRANINDA GORUNUYOR ============
await s.goto(`${KOK}/admin/fiyatlar`, { waitUntil: "networkidle" });
const yoneticiMetin = await s.locator("body").innerText();
yoneticiMetin.includes(String(YENI_FIYAT))
  ? ok(10, "talep yonetici ekraninda listeleniyor")
  : bad(10, "talep yonetici ekraninda yok");

// ============ 8. ONAYLA ============
await s.locator('button:has-text("Onayla")').first().click();
/*
 * Onay VERITABANINDAN dogrulaniyor, ekrandaki metinden degil. Metni beklemek
 * yanilticiydi: sunucu eylemi bitip sayfa tazelenince basari mesaji kaybolup
 * kart listeden dusuyor, bekleyen kontrol bosa dusuyordu.
 */
const onaylandi = await (async () => {
  for (let i = 0; i < 20; i += 1) {
    const r = await sql`SELECT bekleyen_fiyat FROM mutfak_urunleri WHERE id = ${URUN_ID}`;
    if (r[0]?.bekleyen_fiyat === null) return true;
    await new Promise((c) => setTimeout(c, 1000));
  }
  return false;
})();
onaylandi ? ok(11, "onay islendi") : bad(11, "onay islenmedi");

const sonrasi = await sql`SELECT fiyat, bekleyen_fiyat FROM mutfak_urunleri WHERE id = ${URUN_ID}`;
Number(sonrasi[0].fiyat) === YENI_FIYAT
  ? ok(12, `onaydan sonra yayindaki fiyat ${YENI_FIYAT} TL`)
  : bad(12, `onaydan sonra fiyat yanlis: ${sonrasi[0].fiyat}`);
sonrasi[0].bekleyen_fiyat === null
  ? ok(13, "bekleyen talep temizlendi")
  : bad(13, "bekleyen talep duruyor");

// ============ 9. MUSTERI ARTIK YENI FIYATI GORUYOR ============
const misafir2 = await tarayici.newContext();
const m2 = await misafir2.newPage();
await m2.goto(`${KOK}/restoran/${SLUG}`, { waitUntil: "networkidle" });
(await m2.locator("body").innerText()).includes(String(YENI_FIYAT))
  ? ok(14, "onaydan sonra musteri yeni fiyati goruyor")
  : bad(14, "onaya ragmen eski fiyat gorunuyor");
await misafir2.close();

jsHatalari.length === 0 ? ok(15, "JS hatasi yok") : bad(15, `JS: ${jsHatalari.join(" | ")}`);

await bitir();
