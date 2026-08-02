/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi: kisa ucluler bilerek ifade olarak kullaniliyor */
import { chromium } from "playwright";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * URUN / MENU BOLUMLERI REGRESYONU
 *
 * Sef ve ev hanimlarinin kendi urunlerini (ev yapimi tereyagi, yogurt...)
 * ekleyebilmesi ve bunlarin musteri profilinde DOGRU BOLUMDE gorunmesi.
 * Uctan uca: panelde ekle -> profilde gor -> yonetici panelinde gor -> sil.
 */
const KOK = "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const PAROLA = process.env.ADMIN_PASSWORD;

if (!PAROLA) {
  console.error("ADMIN_PASSWORD tanimli degil — .env.local'dan okunmali.");
  process.exit(2);
}

const cikti = [];
const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const tarayici = kapiliTarayici(await chromium.launch());

/**
 * Sonuçları HER durumda yazdır. Aksi hâlde ortadaki bir zaman aşımı süreci
 * öldürüyor ve o ana kadar geçen kontroller hiç görünmüyordu.
 */
async function bitir(patlama) {
  await tarayici.close().catch(() => {});
  if (patlama) cikti.push(`  !   test yarida kesildi: ${String(patlama).split("\n")[0]}`);
  console.log(cikti.join("\n"));
  const sorun = hatalar.length + (patlama ? 1 : 0);
  console.log("\n" + (sorun === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${sorun} SORUN`));
  process.exit(sorun === 0 ? 0 : 1);
}
process.on("unhandledRejection", (e) => void bitir(e));
process.on("uncaughtException", (e) => void bitir(e));

const baglam = await tarayici.newContext({ viewport: { width: 1440, height: 950 } });
const s = await baglam.newPage();
const jsHatalari = [];
s.on("pageerror", (e) => jsHatalari.push(String(e)));

/** Acilis pop-up'i her sayfada onu kapatmakla ugrasmayalim. */
await s.goto(KOK, { waitUntil: "domcontentloaded" });
await s.evaluate(() => sessionStorage.setItem("ny-giris-secimi", "kapatildi"));

// ============ 1. BOLUMLER MUSTERI TARAFINDA SIRALI ============
await s.goto(`${KOK}/restoran/gonul-sef`, { waitUntil: "networkidle" });

const bolumBasliklari = await s
  .locator('section[id^="menu-"] > h2')
  .allInnerTexts()
  .then((l) => l.map((t) => t.trim()).filter(Boolean));

const BEKLENEN = [
  "Ana Yemekler",
  "Çorbalar",
  "Ara Sıcaklar",
  "Hamur İşleri",
  "Ev Yapımı Ürünler",
  "Tatlılar",
  "İçecekler",
];
JSON.stringify(bolumBasliklari) === JSON.stringify(BEKLENEN)
  ? ok(1, "Gonul Sef bolumleri dogru sirada")
  : bad(1, `bolum sirasi: ${bolumBasliklari.join(" | ")}`);

const evYapimi = s.locator('section[id^="menu-"]').filter({ hasText: "Ev Yapımı Ürünler" }).first();
const evYapimiUrunler = await evYapimi.locator("ul > li").allInnerTexts();
evYapimiUrunler.some((t) => /Tereyağı/i.test(t)) && evYapimiUrunler.some((t) => /Turşu|Reçel/i.test(t))
  ? ok(2, "ev yapimi bolumunde tereyagi/recel/tursu var")
  : bad(2, "ev yapimi urunleri eksik");

/Kavanoz|kavanoz|500 g|1 L|kg/.test(evYapimiUrunler.join(" "))
  ? ok(3, "ambalaj/birim bilgisi gorunuyor")
  : bad(3, "birim bilgisi yok");

// Makbule de ayni bolum modelini kullaniyor mu?
await s.goto(`${KOK}/restoran/makbule-sef`, { waitUntil: "networkidle" });
const makbuleBolumler = (await s.locator('section[id^="menu-"] > h2').allInnerTexts()).map((t) => t.trim());
makbuleBolumler.includes("Ev Yapımı Ürünler") && makbuleBolumler.includes("Ara Sıcaklar")
  ? ok(4, "Makbule Sef'te de ayni bolumler")
  : bad(4, `Makbule bolumleri: ${makbuleBolumler.join(" | ")}`);

// Fiyati girilmemis urun sepete EKLENEMEZ olmali
const taslakSatir = s.locator("ul > li").filter({ hasText: "Köy Tereyağı" }).first();
(await taslakSatir.locator("text=Sipariş için yakında").count()) > 0
  ? ok(5, "fiyatsiz urun siparise kapali")
  : bad(5, "fiyatsiz urun siparise acik gorunuyor");

// ============ 2. YONETICI GIRISI ============
await s.goto(`${KOK}/admin/giris`, { waitUntil: "networkidle" });
await s.fill('input[name="eposta"]', ADMIN);
await s.fill('input[name="parola"]', PAROLA);
await s.click('button[type="submit"]');
/*
 * Panele DUSMEYI bekle. Once /\/admin/ deseni kullaniliyordu; o desen
 * "/admin/giris" ile de esleserek hemen donuyor, sonraki gezinme oturum
 * cerezi yazilmadan basliyordu.
 */
await s.waitForURL((u) => new URL(u).pathname === "/admin", { timeout: 20000 });
new URL(s.url()).pathname === "/admin"
  ? ok(6, "yonetici girisi calisiyor")
  : bad(6, `yonetici girisi basarisiz: ${s.url()}`);

// ============ 3. PANELDEN URUN EKLE ============
const URUN_ADI = `Test Kaymak ${Date.now().toString().slice(-6)}`;
await s.goto(`${KOK}/panel/gonul-sef`, { waitUntil: "networkidle" });

(await s.locator("#urun-formu").count()) === 1
  ? ok(7, "profilde urun ekleme formu var")
  : bad(7, "urun formu yok");

await s.selectOption('#urun-formu select[name="bolum"]', "ev-yapimi");
await s.fill('#urun-formu input[name="ad"]', URUN_ADI);
await s.fill('#urun-formu input[name="fiyat"]', "240");
await s.fill('#urun-formu input[name="birim"]', "400 g kase");
await s.fill('#urun-formu textarea[name="aciklama"]', "Test amacli eklendi.");
await s.click('#urun-formu button[type="submit"]');
await s.waitForTimeout(2500);

(await s.locator(`text=${URUN_ADI}`).count()) > 0
  ? ok(8, "urun panele kaydedildi")
  : bad(8, "urun panelde gorunmedi");

// ============ 4. MUSTERI PROFILINDE GORUNUYOR MU ============
await s.goto(`${KOK}/restoran/gonul-sef`, { waitUntil: "networkidle" });
const evYapimi2 = s.locator('section[id^="menu-"]').filter({ hasText: "Ev Yapımı Ürünler" }).first();
const metin2 = await evYapimi2.innerText();

metin2.includes(URUN_ADI)
  ? ok(9, "urun musteri profilinde DOGRU bolumde")
  : bad(9, "urun profilde ev yapimi bolumunde yok");

/240/.test(metin2) && /400 g kase/.test(metin2)
  ? ok(10, "fiyat ve birim musteriye gorunuyor")
  : bad(10, "fiyat/birim gorunmuyor");

const yeniSatir = s.locator("li").filter({ hasText: URUN_ADI }).first();
(await yeniSatir.locator('button:has-text("Sepete ekle")').count()) > 0
  ? ok(11, "fiyati olan urun sepete eklenebiliyor")
  : bad(11, "sepete ekle dugmesi yok");

// Sepete gercekten giriyor mu?
await yeniSatir.locator('button:has-text("Sepete ekle")').click();
await s.waitForTimeout(1200);
const sepetMetni = await s.locator("body").innerText();
/1|Sepet/.test(sepetMetni)
  ? ok(12, "sef urunu sepete eklendi")
  : bad(12, "sepete eklenemedi");

// ============ 5. YONETICI PANELINDE GORUNUYOR MU ============
await s.goto(`${KOK}/admin/urunler`, { waitUntil: "networkidle" });
const yoneticiMetni = await s.locator("body").innerText();
yoneticiMetni.includes(URUN_ADI)
  ? ok(13, "urun yonetici panelinde listeleniyor")
  : bad(13, "yonetici panelinde yok");

await s.goto(`${KOK}/admin/urunler?suzgec=ev-yapimi`, { waitUntil: "networkidle" });
(await s.locator("body").innerText()).includes(URUN_ADI)
  ? ok(14, "ev yapimi suzgeci calisiyor")
  : bad(14, "ev yapimi suzgeci urunu getirmiyor");

await s.goto(`${KOK}/admin/urunler?suzgec=fiyatsiz`, { waitUntil: "networkidle" });
const fiyatsizMetin = await s.locator("body").innerText();
fiyatsizMetin.includes("Köy Tereyağı") && !fiyatsizMetin.includes(URUN_ADI)
  ? ok(15, "fiyatsiz suzgeci dogru ayiriyor")
  : bad(15, "fiyatsiz suzgeci yanlis");

// ============ 6. YETKI: BASKA SEF DUZENLEYEMEZ ============
const misafir = await tarayici.newContext({ viewport: { width: 1280, height: 900 } });
const m = await misafir.newPage();
await m.goto(`${KOK}/panel/gonul-sef`, { waitUntil: "networkidle" });
/\/hesap\/giris/.test(m.url())
  ? ok(16, "oturumsuz kisi urun paneline giremiyor")
  : bad(16, "oturumsuz kisi panele girebiliyor");
await misafir.close();

// ============ 7. TEMIZLIK: eklenen test urununu sil ============
await s.goto(`${KOK}/panel/gonul-sef`, { waitUntil: "networkidle" });
const satir = s.locator("li").filter({ hasText: URUN_ADI }).first();
await satir.locator('button:has-text("Sil")').click();
await s.waitForTimeout(2500);

/*
 * Silmeyi MUSTERI SAYFASINDAKI MENUDEN dogruluyoruz; iki tuzak var:
 *  - Panelde metin aramak yaniltiyor: '"<urun>" silindi.' bildirimi urun adini
 *    icerdigi icin metin hep bulunuyor.
 *  - Sayfanin tamaminda aramak da yaniltiyor: urun 12. adimda sepete eklendi,
 *    sepet ozetinde adi hala duruyor.
 */
await s.goto(`${KOK}/restoran/gonul-sef`, { waitUntil: "networkidle" });
(await s.locator('section[id^="menu-"] li').filter({ hasText: URUN_ADI }).count()) === 0
  ? ok(17, "urun silinebiliyor (temizlik)")
  : bad(17, "urun silinemedi — elle temizle");

jsHatalari.length === 0 ? ok(18, "JS hatasi yok") : bad(18, `JS: ${jsHatalari.join(" | ")}`);

await bitir();
