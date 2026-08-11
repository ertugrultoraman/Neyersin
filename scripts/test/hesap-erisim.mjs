/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import crypto from "node:crypto";
import { promisify } from "node:util";
import { chromium } from "playwright";
import postgres from "postgres";
import { kapiliTarayici } from "./yardim.mjs";

/**
 * HESABA ERISIM — yoneticinin parolayi bilmeden hesaba ulasma yollari.
 *
 * Test edilen kurallar:
 *  - ISLETME OTURUMU DUSMUYOR. Cerezi cozen beyaz listede "isletme" yoktu:
 *    kisi dogru parolayla giriyor, cerez yaziliyor, ama BIR SONRAKI istekte
 *    jeton reddedildigi icin hic giris yapmamis gibi gorunuyordu. Bu takimin
 *    var olma sebebi bu hata; ilk uc kontrol onu kolluyor.
 *  - "Hesap olarak gir": yonetici hedef hesabin panelinde aciliyor, vekalet
 *    seridi cikiyor, "Yoneticilige don" geri getiriyor.
 *  - Vekalet DEFTERE yaziliyor (yetkinin denetim tarafi).
 *  - "Yeni parola uret": uretilen parola gercekten giris yaptiriyor.
 *  - Vekalet YETKI VERMIYOR: musteri hesabina burunmus yonetici /admin'e
 *    giremiyor. Verseydi, burunme sessizce bir yetki yukseltme araci olurdu.
 *  - Sirdan bir kullanici hesabaGirAction'i cagiramaz (dogrudan POST).
 */
const KOK = process.env.TEST_KOK ?? "https://neyersin.local";
const ADMIN = process.env.ADMIN_KULLANICI_ADI ?? "admin";
const ADMIN_PAROLA = process.env.ADMIN_PASSWORD;
const TEST_PAROLA = process.env.TEST_PAROLA;

if (!ADMIN_PAROLA) { console.error("ADMIN_PASSWORD yok."); process.exit(2); }
if (!TEST_PAROLA) { console.error("TEST_PAROLA yok — once: npm run hesap:test"); process.exit(2); }
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL yok."); process.exit(2); }

const ISLETME = "ornek@gmail.com";
const MUSTERI = "ornek3@gmail.com";

const cikti = []; const hatalar = [];
const ok = (n, m) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n, m) => { hatalar.push(m); cikti.push(`  X   ${String(n).padStart(2)}. ${m}`); };

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const tarayici = kapiliTarayici(await chromium.launch(), new URL(KOK).hostname);

/** Uygulamadaki `parolaOzetle` ile ayni bicim: scrypt, `tuz:ozet` (hex). */
const scrypt = promisify(crypto.scrypt);
async function parolaOzetle(parola) {
  const tuz = crypto.randomBytes(16).toString("hex");
  return `${tuz}:${(await scrypt(parola, tuz, 64)).toString("hex")}`;
}

/** Test hesabinin parolasini sabit degere geri getir. */
async function parolayiGeriAl(eposta) {
  await sql`UPDATE hesaplar SET parola_hash = ${await parolaOzetle(TEST_PAROLA)}
            WHERE eposta = ${eposta}`;
}

/**
 * Yonetim listesinde hesap karti KAPALI geliyor; icindeki dugmeler `<details>`
 * kapaliyken gorunmuyor ve tiklama zaman asimina dusuyor. Once basligina bas.
 */
async function kartiAc(kart) {
  await kart.locator("summary").first().click();
}

async function girisYap(sayfa, kimlik, parola) {
  await sayfa.goto(`${KOK}/hesap/giris`, { waitUntil: "networkidle" });
  await sayfa.fill('input[name="kimlik"]', kimlik);
  await sayfa.fill('input[name="parola"]', parola);
  await sayfa.locator('form:has(input[name="kimlik"])').locator('button[type="submit"]').click();
  await sayfa.waitForURL((u) => !/\/hesap\/giris/.test(String(u)), { timeout: 25000 });
}

let no = 0;
try {
  // -------------------------------------------------------------------------
  // ISLETME OTURUMU — asil regresyon kontrolu
  // -------------------------------------------------------------------------
  const isletmeBaglam = await tarayici.newContext();
  const isletme = await isletmeBaglam.newPage();

  await girisYap(isletme, ISLETME, TEST_PAROLA);
  /^.*\/isletme/.test(isletme.url())
    ? ok((no += 1), "isletme dogru parolayla girdi ve /isletme'ye dustu")
    : bad((no += 1), `isletme girisi beklenmedik adrese gitti: ${isletme.url()}`);

  /*
   * ASIL KONTROL: ikinci istek. Hata birinci istekte gorunmuyordu — cerez
   * yaziliyor, yonlendirme calisiyor; jeton ancak BIR SONRAKI istekte
   * cozulup reddediliyordu.
   */
  await isletme.goto(`${KOK}/isletme`, { waitUntil: "networkidle" });
  /\/isletme/.test(isletme.url()) && !/\/hesap\/giris/.test(isletme.url())
    ? ok((no += 1), "isletme oturumu ikinci istekte AYAKTA (jeton reddedilmiyor)")
    : bad((no += 1), `isletme oturumu dustu — jetonCoz rolu tanimiyor: ${isletme.url()}`);

  const cerezler = await isletmeBaglam.cookies();
  cerezler.some((c) => c.name === "ny_oturum" && c.value.length > 0)
    ? ok((no += 1), "oturum cerezi yazilmis")
    : bad((no += 1), "ny_oturum cerezi yok");

  await isletmeBaglam.close();

  // -------------------------------------------------------------------------
  // HESAP OLARAK GIR
  // -------------------------------------------------------------------------
  const yoneticiBaglam = await tarayici.newContext();
  const yonetici = await yoneticiBaglam.newPage();
  await girisYap(yonetici, ADMIN, ADMIN_PAROLA);

  await yonetici.goto(`${KOK}/admin/hesaplar`, { waitUntil: "networkidle" });

  /*
   * Sayac sayfa YUKLENDIKTEN sonra okunuyor: `vekil_kayitlari` tablosunu
   * uygulama ilk erisimde olusturuyor (CREATE TABLE IF NOT EXISTS). Test
   * dogrudan veritabanina sorunca tablo henuz yoktu.
   */
  const oncekiKayit = (
    await sql`SELECT COUNT(*)::int AS n FROM vekil_kayitlari WHERE hedef = ${ISLETME}`
  )[0].n;

  /*
   * Kart ADRESIYLE secili, metniyle degil. `article:has-text(eposta)` bes
   * kartin BESINE birden denk geliyordu: her kartin "Mutfaga bagla" listesi
   * butun mutfaklari sahiplerinin adresiyle sayiyor. `.first()` de listenin
   * en ustundeki BASKA hesabi aciyor, test "burunme yanlis sayfaya goturdu"
   * diye dusuyordu — hata burunmede degil, secicideydi.
   */
  const kart = yonetici.locator(`article[data-hesap="${ISLETME}"]`);
  await kartiAc(kart);
  await kart.locator('form:has(button:has-text("Hesap olarak gir"))').locator("button").click();
  await yonetici.waitForURL((u) => !/\/admin\/hesaplar/.test(String(u)), { timeout: 25000 });

  /\/isletme/.test(yonetici.url())
    ? ok((no += 1), "yonetici hedef hesabin panelinde acildi")
    : bad((no += 1), `burunme yanlis sayfaya goturdu: ${yonetici.url()}`);

  const govde = await yonetici.locator("body").innerText();
  govde.includes("Yönetici olarak görüntülüyorsun")
    ? ok((no += 1), "vekalet seridi gorunuyor")
    : bad((no += 1), "vekalet seridi yok — kim adina bakildigi belli degil");

  govde.includes(ISLETME)
    ? ok((no += 1), "serit hangi hesap oldugunu yaziyor")
    : bad((no += 1), "seritte hedef hesabin adresi yok");

  /*
   * Vekalet yetki VERMEMELI: burunmus yonetici /admin goremez.
   *
   * Nereye dustugu degil, GIREMEDIGI olculuyor. Zincir su an
   * /admin/hesaplar -> /admin/giris -> /panel -> rolun kendi sayfasi seklinde
   * ilerliyor; ara duraga bagli bir kontrol, yonlendirme degisince kirilirdi.
   */
  await yonetici.goto(`${KOK}/admin/hesaplar`, { waitUntil: "networkidle" });
  !/\/admin(\/|$)/.test(new URL(yonetici.url()).pathname)
    ? ok((no += 1), "burunmusken /admin kapali (vekalet yetki yukseltmiyor)")
    : bad((no += 1), `burunmus oturum /admin'e girdi: ${yonetici.url()}`);

  /* Deftere yazildi mi. */
  const sonrakiKayit = (
    await sql`SELECT COUNT(*)::int AS n FROM vekil_kayitlari WHERE hedef = ${ISLETME}`
  )[0].n;
  sonrakiKayit === oncekiKayit + 1
    ? ok((no += 1), "vekalet deftere yazildi")
    : bad((no += 1), `defter kaydi eklenmedi (${oncekiKayit} -> ${sonrakiKayit})`);

  /*
   * Yoneticilige donus. Anasayfa DEGIL: orada oturum basina bir kez cikan
   * "giris secimi" penceresi tikllamalarin onunu kesiyor. Serit her sayfada
   * oldugu icin hedef hesabin kendi paneli de ayni seyi olcuyor.
   */
  await yonetici.goto(`${KOK}/isletme`, { waitUntil: "networkidle" });
  await yonetici.locator('button:has-text("Yöneticiliğe dön")').click();
  await yonetici.waitForURL(/\/admin\/hesaplar/, { timeout: 25000 });

  const donusGovde = await yonetici.locator("body").innerText();
  !donusGovde.includes("Yönetici olarak görüntülüyorsun")
    ? ok((no += 1), "serit kayboldu, yoneticilige donuldu")
    : bad((no += 1), "vekaletten cikilamadi, serit duruyor");

  donusGovde.includes("Vekâlet defteri")
    ? ok((no += 1), "defter yonetici panelinde listeleniyor (isin diger ucu)")
    : bad((no += 1), "vekalet defteri panelde gorunmuyor");

  // -------------------------------------------------------------------------
  // YENI PAROLA URET
  // -------------------------------------------------------------------------
  await yonetici.goto(`${KOK}/admin/hesaplar?rol=musteri`, { waitUntil: "networkidle" });
  const musteriKart = yonetici.locator(`article[data-hesap="${MUSTERI}"]`);
  await kartiAc(musteriKart);
  await musteriKart.locator('button:has-text("Yeni parola üret")').click();
  await musteriKart.locator('button:has-text("Evet, eskisini geçersiz kıl")').click();

  const kutu = musteriKart.locator("[data-parola-sonucu]");
  await kutu.waitFor({ state: "visible", timeout: 25000 });
  const metin = await kutu.innerText();
  const eslesme = metin.match(/([a-z]{4}-[a-z]{4}-[a-z]{4}-\d{3})/);

  eslesme
    ? ok((no += 1), "uretilen parola ekranda gosterildi")
    : bad((no += 1), `parola kutusunda parola yok: ${metin.slice(0, 80)}`);

  if (eslesme) {
    const yeniBaglam = await tarayici.newContext();
    const yeniSayfa = await yeniBaglam.newPage();
    await girisYap(yeniSayfa, MUSTERI, eslesme[1]);
    /\/hesabim/.test(yeniSayfa.url())
      ? ok((no += 1), "uretilen parolayla giris yapildi")
      : bad((no += 1), `uretilen parola calismadi: ${yeniSayfa.url()}`);

    /*
     * PROFIL FOTOGRAFI — hesabin sahibi kendi alanini goruyor mu?
     *
     * Isin diger ucu: ayni alan yonetim listesindeki kartta da var. Ikisi de
     * ayni bileseni ve ayni sunucu eylemini kullaniyor; biri calisip digeri
     * calismasin diye ikisi de olculuyor.
     */
    await yeniSayfa.goto(`${KOK}/hesabim`, { waitUntil: "networkidle" });
    (await yeniSayfa.locator('input[type="file"][name="fotograf"]').count()) > 0
      ? ok((no += 1), "hesap sahibi profil fotografi alanini goruyor")
      : bad((no += 1), "/hesabim'da fotograf alani yok");
    await yeniBaglam.close();
  }

  /* Yonetim kartinda da ayni alan aciliyor mu (musteri karti hala acik). */
  (await musteriKart.locator('input[type="file"][name="fotograf"]').count()) > 0
    ? ok((no += 1), "hesap kartinda profil fotografi alani var")
    : bad((no += 1), "hesap kartinda fotograf alani yok");

  await yoneticiBaglam.close();

  /*
   * Uretilen parola musteri hesabinin sabit parolasini gecersiz kildi; sonraki
   * kontrol ve sonraki kosular TEST_PAROLA bekliyor. Simdi geri aliniyor.
   */
  await parolayiGeriAl(MUSTERI);

  // -------------------------------------------------------------------------
  // YETKI — sirdan kullanici burunme eylemini cagiramaz
  // -------------------------------------------------------------------------
  const yabanciBaglam = await tarayici.newContext();
  const yabanci = await yabanciBaglam.newPage();
  await girisYap(yabanci, MUSTERI, TEST_PAROLA);
  await yabanci.goto(`${KOK}/admin/hesaplar`, { waitUntil: "networkidle" });
  const yabanciGovde = await yabanci.locator("body").innerText();
  !/\/admin(\/|$)/.test(new URL(yabanci.url()).pathname) &&
  !yabanciGovde.includes("Hesap olarak gir")
    ? ok((no += 1), "musteri yonetim sayfasini goremiyor")
    : bad((no += 1), `musteri /admin/hesaplar sayfasini gordu: ${yabanci.url()}`);
  await yabanciBaglam.close();
} catch (hata) {
  /*
   * Beklenmeyen hata SONUCLARI GIZLEMESIN. Onceden dogrudan disari firliyordu
   * ve o ana kadar gecen kontroller hic basilmiyordu; "hangi adimda koptu"
   * sorusunun cevabi kayboluyordu.
   */
  bad((no += 1), `beklenmeyen hata: ${String(hata?.message ?? hata).split("\n")[0]}`);
} finally {
  await tarayici.close();
  /* Yarida kalsa bile deneme hesabi bilinen parolasiyla kalsin. */
  await parolayiGeriAl(MUSTERI).catch(() => {});
  await sql.end();
}

console.log("\nHESABA ERISIM\n" + cikti.join("\n"));
if (hatalar.length > 0) {
  console.error(`\n${hatalar.length} kontrol basarisiz.`);
  process.exit(1);
}
console.log(`\n${no}/${no} kontrol gecti.`);
