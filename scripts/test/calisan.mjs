/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import { chromium } from "playwright";
import postgres from "postgres";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * CALISAN GIRISLERI — isin IKI UCU birden.
 *
 * Bir uc: isletme SAHIBI panelinden kasa/mutfak calisani ekliyor, listede
 * goruyor, geri cikarabiliyor.
 * Oteki uc: eklenen kisi o adres ve parolayla GERCEKTEN giriyor ve iceride
 * yalnizca siparis tahtasini goruyor.
 *
 * Ikisi ayri ayri calisip birlikte calismayabilir: form kaydeder ama hesap
 * giris yapamaz, ya da giris yapar ama fiyatlari da gorur. Ucu de sessiz
 * hatalar — panelde her sey yolunda gorunur.
 *
 * Ucuncu uc YONETICI: ayni calisan /admin/isletmeler/<slug> sayfasinda
 * listeleniyor mu? Tahtada bir aksaklik oldugunda yoneticinin arayacagi kisi o.
 *
 * Kullanim:  npm run test:calisan
 */
const KOK = process.env.TEST_KOK ?? "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const ADMIN_PAROLA = process.env.ADMIN_PASSWORD;
const TEST_PAROLA = process.env.TEST_PAROLA;

if (!ADMIN_PAROLA) { console.error("ADMIN_PASSWORD yok."); process.exit(2); }
if (!TEST_PAROLA) { console.error("TEST_PAROLA yok — once: npm run hesap:test"); process.exit(2); }
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL yok."); process.exit(2); }

/** Deneme isletmesi — `npm run hesap:test` ile aciliyor. */
const SAHIP = "ornek@gmail.com";
/** Testin kendi actigi calisan. Gercek bir hesapla karismasin diye .test alanadi. */
const CALISAN = "kasa.deneme@ornek.test";
const CALISAN_ADI = "Kasa Deneme";

const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const tarayici = kapiliTarayici(await chromium.launch(), new URL(KOK).hostname);

/** Testin actigi calisan hesabi geride kalmasin — basta da sonda da siliniyor. */
async function calisaniSil() {
  await sql`DELETE FROM hesaplar WHERE eposta = ${CALISAN}`;
  await sql`DELETE FROM giris_denemeleri WHERE anahtar LIKE ${CALISAN + "|%"}`;
}

async function girisYap(sayfa, kimlik, parola) {
  await sayfa.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
  await sayfa.fill('input[name="kimlik"]', kimlik);
  await sayfa.fill('input[name="parola"]', parola);
  await sayfa.locator('form:has(input[name="kimlik"])').locator('button[type="submit"]').click();
}

let no = 0;
try {
  await calisaniSil();

  /* Sahibin hangi mutfaga bagli oldugu yoneticideki kontrol icin gerekiyor. */
  const [sahipSatiri] = await sql`SELECT restoran_slug FROM hesaplar WHERE eposta = ${SAHIP}`;
  const slug = sahipSatiri?.restoran_slug;
  if (!slug) {
    bad((no += 1), `${SAHIP} bir mutfaga bagli degil — calisan eklenemez`);
    throw new Error("deneme isletmesinin mutfagi yok");
  }

  // ═══════════════ 1. UC: SAHIP CALISAN EKLIYOR ═══════════════
  const sahipBaglam = await tarayici.newContext({ ignoreHTTPSErrors: true });
  const sahip = await sahipBaglam.newPage();

  await girisYap(sahip, SAHIP, TEST_PAROLA);
  await sahip.waitForURL(/\/isletme/, { timeout: 25000 });
  ok((no += 1), "isletme sahibi kendi paneline girdi");

  const bolum = sahip.locator("section:has(input[name='parola'])");
  (await bolum.count()) > 0
    ? ok((no += 1), "sahip 'Calisan girisleri' bolumunu goruyor")
    : bad((no += 1), "sahibin panelinde calisan ekleme formu yok");

  await bolum.locator('input[name="ad"]').fill(CALISAN_ADI);
  await bolum.locator('input[name="eposta"]').fill(CALISAN);
  await bolum.locator('input[name="parola"]').fill(TEST_PAROLA);
  await bolum.locator('button[type="submit"]').click();
  await sahip.waitForSelector(`text=${CALISAN}`, { timeout: 25000 }).catch(() => {});

  const eklemeGovde = await sahip.locator("body").innerText();
  eklemeGovde.includes(`${CALISAN_ADI} artık giriş yapabilir`)
    ? ok((no += 1), "ekleme onaylandi")
    : bad((no += 1), `ekleme onayi yok: ${eklemeGovde.slice(0, 120).replace(/\s+/g, " ")}`);

  eklemeGovde.includes(CALISAN)
    ? ok((no += 1), "calisan listede gorunuyor")
    : bad((no += 1), "eklenen calisan sahibin listesinde yok");

  /* Kayit gercekten VERITABANINDA mi — ekranda gorunmesi tek basina yetmez. */
  const [kayit] = await sql`
    SELECT rol, restoran_slug, isletme_yetkisi, eposta_dogrulandi
    FROM hesaplar WHERE eposta = ${CALISAN}`;
  kayit?.rol === "isletme" && kayit?.isletme_yetkisi === "calisan" && kayit?.restoran_slug === slug
    ? ok((no += 1), "hesap dogru rol, yetki ve mutfakla acildi")
    : bad((no += 1), `hesap yanlis acildi: ${JSON.stringify(kayit ?? null)}`);

  // ═══════════════ 2. UC: CALISAN GERCEKTEN GIRIYOR ═══════════════
  const calisanBaglam = await tarayici.newContext({ ignoreHTTPSErrors: true });
  const calisan = await calisanBaglam.newPage();

  await girisYap(calisan, CALISAN, TEST_PAROLA);
  await calisan.waitForURL((u) => !/\/hesap\/giris/.test(String(u)), { timeout: 25000 }).catch(() => {});
  /\/isletme/.test(calisan.url())
    ? ok((no += 1), "calisan kendi parolasiyla girdi ve tahtaya dustu")
    : bad((no += 1), `calisan girisi beklenmedik adrese gitti: ${calisan.url()}`);

  /*
   * Ikinci istek: jeton `isletmeYetkisi` alanini tasiyor. Cozucu bilmedigi bir
   * alanda takilsaydi oturum ilk istekten sonra dusetdi (bkz. hesap-erisim).
   */
  await calisan.goto(`${KOK}/isletme`, { waitUntil: "networkidle" });
  /\/isletme/.test(calisan.url())
    ? ok((no += 1), "calisan oturumu ikinci istekte de ayakta")
    : bad((no += 1), `calisan oturumu dustu: ${calisan.url()}`);

  const calisanGovde = await calisan.locator("body").innerText();

  calisanGovde.includes("Sipariş tahtası")
    ? ok((no += 1), "calisan siparis tahtasini goruyor")
    : bad((no += 1), "calisan siparis tahtasini GOREMIYOR — isi bu");

  calisanGovde.includes("Çalışan hesabıyla giriş yaptın")
    ? ok((no += 1), "calisana neyi gordugunu soyleyen not cikiyor")
    : bad((no += 1), "calisan notu yok — eksik ekran hata gibi gorunur");

  /*
   * ASIL SINIR. Kasadaki kisi fiyat degistirememeli, saatleri kaydiramamali,
   * ciroyu gormemeli ve yeni calisan acamamali. Dordu de ayri ayri olculuyor:
   * biri sizarsa hangisi oldugu dogrudan belli olsun.
   */
  const kapali = [
    ["Ciro ve satış", "ciro raporu"],
    ["Ürünlerim", "urun yonetimi"],
    ["Çalışma saatleri", "calisma saatleri"],
    ["Çalışan girişleri", "calisan yonetimi"],
    ["profilim", "profil formu"],
  ];
  for (const [metin, ad] of kapali) {
    calisanGovde.includes(metin)
      ? bad((no += 1), `calisan ${ad} bolumunu goruyor`)
      : ok((no += 1), `calisan ${ad} bolumunu gormuyor`);
  }

  /* Yonetim paneli calisana da kapali. */
  await calisan.goto(`${KOK}/admin/hesaplar`, { waitUntil: "networkidle" });
  !/\/admin(\/|$)/.test(new URL(calisan.url()).pathname)
    ? ok((no += 1), "calisan yonetim paneline giremiyor")
    : bad((no += 1), `calisan /admin/hesaplar sayfasini gordu: ${calisan.url()}`);

  await calisanBaglam.close();

  // ═══════════════ 3. UC: YONETICI DE GORUYOR ═══════════════
  const yoneticiBaglam = await tarayici.newContext({ ignoreHTTPSErrors: true });
  const yonetici = await yoneticiBaglam.newPage();
  await girisYap(yonetici, ADMIN, ADMIN_PAROLA);
  await yonetici.waitForURL(/\/admin/, { timeout: 25000 }).catch(() => {});
  await yonetici.goto(`${KOK}/admin/isletmeler/${slug}`, { waitUntil: "networkidle" });
  const yoneticiGovde = await yonetici.locator("body").innerText();
  yoneticiGovde.includes(CALISAN)
    ? ok((no += 1), "yonetici isletme sayfasinda calisani goruyor")
    : bad((no += 1), "calisan yonetici panelinde listelenmiyor");
  await yoneticiBaglam.close();

  // ═══════════════ 4. GERI ALMA: CIKARILAN HESAP SILINIYOR ═══════════════
  /*
   * Yetki JETONDA tasiniyor: yalnizca "calisan" yetkisi dusurulseydi kisi eski
   * cerezle sekiz saat daha girebilirdi. O yuzden hesabin SILINDIGI, silindikten
   * sonra da GIRIS YAPAMADIGI olculuyor.
   */
  await sahip.goto(`${KOK}/isletme`, { waitUntil: "networkidle" });
  await sahip.locator(`li:has-text("${CALISAN}")`).locator("button").click();
  await sahip.waitForSelector(`text=${CALISAN_ADI} çıkarıldı`, { timeout: 25000 }).catch(() => {});

  const cikarmaGovde = await sahip.locator("body").innerText();
  cikarmaGovde.includes(`${CALISAN_ADI} çıkarıldı`)
    ? ok((no += 1), "cikarma onaylandi")
    : bad((no += 1), "cikarma onayi yok");

  const kalan = await sql`SELECT 1 FROM hesaplar WHERE eposta = ${CALISAN}`;
  kalan.length === 0
    ? ok((no += 1), "hesap veritabanindan silindi")
    : bad((no += 1), "cikarilan calisanin hesabi duruyor — eski cerezle girebilir");

  const eskiBaglam = await tarayici.newContext({ ignoreHTTPSErrors: true });
  const eski = await eskiBaglam.newPage();
  await girisYap(eski, CALISAN, TEST_PAROLA);
  await eski.waitForTimeout(2500);
  /\/hesap\/giris/.test(eski.url())
    ? ok((no += 1), "cikarilan calisan artik giris yapamiyor")
    : bad((no += 1), `cikarilan calisan hala giriyor: ${eski.url()}`);
  await eskiBaglam.close();

  await sahipBaglam.close();
} catch (hata) {
  /* Beklenmeyen hata o ana kadarki sonuclari gizlemesin. */
  bad((no += 1), `beklenmeyen hata: ${String(hata?.message ?? hata).split("\n")[0]}`);
} finally {
  await tarayici.close();
  await calisaniSil().catch(() => {});
  await sql.end();
}

console.log("\nCALISAN GIRISLERI\n" + cikti.join("\n"));
if (hatalar.length > 0) {
  console.error(`\n${hatalar.length} kontrol basarisiz.`);
  process.exit(1);
}
console.log(`\n${no}/${no} kontrol gecti.`);
