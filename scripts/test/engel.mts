/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import postgres from "postgres";

import {
  ENGEL_SURESI,
  ESIK,
  botEngelliMi,
  botIsareti,
  engelleriListele,
  engeliKaldir,
} from "../../src/lib/bot-engeli";
import { girdiyiDenetle } from "../../src/lib/insan-dogrulama";

/**
 * BOT ENGELI — esik, sure, unutma ve geri alma.
 *
 * NEDEN TARAYICI TESTI DEGIL: engelin butun kritik davranislari ZAMANA bagli
 * — uc gun once alinan bir isaret sayilmamali, engel alti ay surmeli, tekrar
 * denemek sureyi uzatmamali. Tarayiciyla bunlari olcmek icin ya alti ay
 * beklemek ya da saati kandirmak gerekirdi. Modul dogrudan cagrilinca
 * veritabanindaki `son` alanini geriye cekip ayni sorulari saniyeler icinde
 * sorabiliyoruz.
 *
 * EN ONEMLI KONTROL — "isaretsiz" bir bot isareti SAYILMAMALI. Kutuyu
 * isaretlemeyi unutan gercek bir insan, uc denemede kendini alti ay siteden
 * atilmis bulurdu. CGNAT yuzunden o IP'nin arkasinda binlerce kisi olabilir
 * (bkz. lib/bot-engeli.ts).
 *
 * Test KENDI IP'lerini kullaniyor (`test-engel-...`), gercek bir ziyaretcinin
 * kaydina dokunmuyor ve cikarken hepsini siliyor.
 */
const cikti: string[] = [];
const hatalar: string[] = [];
const ok = (n: number, m: string) => cikti.push(`  OK  ${String(n).padStart(2)}. ${m}`);
const bad = (n: number, m: string) => {
  hatalar.push(m);
  cikti.push(`  X   ${String(n).padStart(2)}. ${m}`);
};

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("  !   DATABASE_URL yok — test veritabani olmadan calisamaz");
  process.exit(1);
}
const sql = postgres(url, { max: 2, ssl: url.includes("sslmode=disable") ? false : "require" });

const damga = Date.now().toString().slice(-8);
const IP_HIZ = `test-engel-hiz-${damga}`;
const IP_KUPU = `test-engel-kupu-${damga}`;
const IP_UNUTMA = `test-engel-unutma-${damga}`;
const IP_KALDIR = `test-engel-kaldir-${damga}`;
const HEPSI = [IP_HIZ, IP_KUPU, IP_UNUTMA, IP_KALDIR];

async function bitir(patlama?: unknown) {
  await sql`DELETE FROM bot_engelleri WHERE ip = ANY(${HEPSI})`.catch(() => {});
  await sql.end().catch(() => {});
  if (patlama) cikti.push(`  !   test yarida kesildi: ${String(patlama).split("\n")[0]}`);
  console.log(cikti.join("\n"));
  const sorun = hatalar.length + (patlama ? 1 : 0);
  console.log("\n" + (sorun === 0 ? `TUMU GECTI (${cikti.length} kontrol)` : `${sorun} SORUN`));
  process.exit(sorun === 0 ? 0 : 1);
}
process.on("unhandledRejection", (e) => void bitir(e));
process.on("uncaughtException", (e) => void bitir(e));

let no = 0;
const bitisiAl = async (ip: string) =>
  (await sql<{ bitis: Date | null }[]>`SELECT bitis FROM bot_engelleri WHERE ip = ${ip}`)[0]?.bitis ?? null;

/* ════════════ 1. TEMIZ IP GECER ════════════ */
(await botEngelliMi(IP_HIZ)).engelli === false
  ? ok((no += 1), "hic isareti olmayan IP engelli degil")
  : bad((no += 1), "temiz IP engelli gorunuyor");

/* ════════════ 2. ESIGE KADAR ENGEL YOK ════════════ */
/*
 * Ilk ESIK-1 isaret engellememeli. Tek bir hatali gonderim icin bir IP'yi
 * alti ay kapatmak, CGNAT arkasindaki butun mahalleyi disarida birakirdi.
 */
for (let i = 1; i < ESIK; i += 1) {
  const engellendi = await botIsareti(IP_HIZ, "hiz");
  engellendi === false
    ? ok((no += 1), `${i}. hiz isareti engellemedi (esik ${ESIK})`)
    : bad((no += 1), `${i}. isaret erken engelledi`);
}

/* ════════════ 3. ESIKTE ENGEL DUSUYOR ════════════ */
(await botIsareti(IP_HIZ, "hiz")) === true
  ? ok((no += 1), `${ESIK}. isarette engel kondu`)
  : bad((no += 1), `${ESIK}. isarette engel KONMADI`);

const hizDurumu = await botEngelliMi(IP_HIZ);
hizDurumu.engelli === true
  ? ok((no += 1), "engelli IP kapidan geciremiyor")
  : bad((no += 1), "engel konduktan sonra IP hala geciyor");

/* ════════════ 4. SURE ALTI AY ════════════ */
{
  const bitis = await bitisiAl(IP_HIZ);
  const fark = bitis ? new Date(bitis).getTime() - Date.now() : 0;
  /* Bir saatlik pay: sure veritabaninin saatiyle hesaplaniyor. */
  Math.abs(fark - ENGEL_SURESI) < 60 * 60 * 1000
    ? ok((no += 1), `engel suresi ${Math.round(ENGEL_SURESI / 86400000)} gun`)
    : bad((no += 1), `engel suresi yanlis: ${Math.round(fark / 86400000)} gun`);
}

/* ════════════ 5. TEKRAR DENEMEK SUREYI UZATMIYOR ════════════ */
/*
 * Botun ne kadar ugrastiginin onemi yok: engel alti ay. Uzasaydi, engelli
 * bir IP'yi durmadan deneyen bir bot kendi cezasini sonsuza tasirdi ve
 * arkasindaki gercek kullanicilar hic kurtulamazdi.
 */
{
  const once = await bitisiAl(IP_HIZ);
  await botIsareti(IP_HIZ, "hiz");
  const sonra = await bitisiAl(IP_HIZ);
  String(once) === String(sonra)
    ? ok((no += 1), "engelliyken tekrar denemek sureyi uzatmiyor")
    : bad((no += 1), "tekrar deneme engel suresini uzatti");
}

/* ════════════ 6. BAL KUPU TEK VURUSTA ════════════ */
/*
 * Bal kupu alanini yalnizca formu otomatik dolduran bir yazilim doldurabilir;
 * insan onu goremiyor bile. Birikmeyi beklemeye gerek yok.
 */
(await botIsareti(IP_KUPU, "bal-kupu")) === true
  ? ok((no += 1), "bal kupu tek isarette engelledi")
  : bad((no += 1), "bal kupu tek isarette engellemedi");

/* ════════════ 7. "ISARETSIZ" BOT ISARETI SAYILMIYOR ════════════ */
/*
 * Kutuyu isaretlemeyi unutmak insanca bir hata. Sunucu eylemi bu sebebi
 * sayaca HIC yollamiyor (bkz. app/insan-actions.ts); burada sozlesmenin iki
 * ucu da dogrulaniyor: denetci "isaretsiz" diyebiliyor mu, ve o sebep
 * agirlikta bal kupuyle esit tutulmus mu.
 */
{
  const sonuc = girdiyiDenetle({ isaretli: false, balKupu: "", acilisZamani: String(Date.now() - 5000) });
  !sonuc.gecerli && sonuc.sebep === "isaretsiz"
    ? ok((no += 1), "kutusuz gonderim 'isaretsiz' sebebiyle donuyor")
    : bad((no += 1), `kutusuz gonderimin sebebi yanlis: ${JSON.stringify(sonuc)}`);

  const hizli = girdiyiDenetle({ isaretli: true, balKupu: "", acilisZamani: String(Date.now()) });
  !hizli.gecerli && hizli.sebep === "hiz"
    ? ok((no += 1), "anlik gonderim 'hiz' sebebiyle donuyor")
    : bad((no += 1), `hizli gonderimin sebebi yanlis: ${JSON.stringify(hizli)}`);

  const kupu = girdiyiDenetle({ isaretli: true, balKupu: "bot@bot", acilisZamani: String(Date.now() - 5000) });
  !kupu.gecerli && kupu.sebep === "bal-kupu"
    ? ok((no += 1), "dolu bal kupu 'bal-kupu' sebebiyle donuyor")
    : bad((no += 1), `bal kupunun sebebi yanlis: ${JSON.stringify(kupu)}`);

  const temiz = girdiyiDenetle({ isaretli: true, balKupu: "", acilisZamani: String(Date.now() - 5000) });
  temiz.gecerli === true
    ? ok((no += 1), "kurallara uyan gonderim geciyor")
    : bad((no += 1), "gecerli gonderim reddedildi");
}

/* ════════════ 8. ESKI SAYAC UNUTULUYOR ════════════ */
/*
 * Bir yil once bir kez hatali gonderim yapmis bir IP, bugunku tek bir hatayla
 * esigi doldurmamali. `son` bir gunden eskiyse sayac sifirdan basliyor.
 */
{
  await botIsareti(IP_UNUTMA, "hiz");
  await botIsareti(IP_UNUTMA, "hiz");
  /* Sayaci "iki gun once" yapiyoruz — unutma suresi bir gun. */
  await sql`UPDATE bot_engelleri SET son = now() - interval '2 days' WHERE ip = ${IP_UNUTMA}`;

  const engellendi = await botIsareti(IP_UNUTMA, "hiz");
  const sayac = (await sql<{ sayac: number }[]>`SELECT sayac FROM bot_engelleri WHERE ip = ${IP_UNUTMA}`)[0]?.sayac;

  engellendi === false && sayac === 1
    ? ok((no += 1), "bir gunden eski sayac sifirlaniyor")
    : bad((no += 1), `eski sayac unutulmadi (sayac=${sayac}, engellendi=${engellendi})`);
}

/* ════════════ 9. YONETICI ENGELI KALDIRABILIYOR ════════════ */
/*
 * CGNAT yuzunden yanlislikla engellenen gercek bir kullanici olabilir;
 * yonetici bunu geri alamasaydi hata alti ay boyunca duzeltilemezdi.
 */
{
  await botIsareti(IP_KALDIR, "bal-kupu");
  (await botEngelliMi(IP_KALDIR)).engelli === true
    ? ok((no += 1), "kaldirma testi icin engel konuldu")
    : bad((no += 1), "kaldirma testi icin engel konulamadi");

  await engeliKaldir(IP_KALDIR);
  (await botEngelliMi(IP_KALDIR)).engelli === false
    ? ok((no += 1), "yonetici engeli kaldirinca IP tekrar geciyor")
    : bad((no += 1), "engel kaldirilmadi");

  (await sql`SELECT ip FROM bot_engelleri WHERE ip = ${IP_KALDIR}`).length === 0
    ? ok((no += 1), "kaldirilan engel kayittan da siliniyor")
    : bad((no += 1), "kayit veritabaninda kalmis");
}

/* ════════════ 10. YONETICI LISTESI ════════════ */
{
  const liste = await engelleriListele();
  const kayit = liste.find((k) => k.ip === IP_KUPU);
  kayit
    ? ok((no += 1), "engellenen IP yonetici listesinde gorunuyor")
    : bad((no += 1), "engellenen IP listede yok — yonetici goremez");
  kayit && kayit.sebep === "bal-kupu"
    ? ok((no += 1), "listede engel sebebi yaziyor")
    : bad((no += 1), `listede sebep yanlis: ${kayit?.sebep}`);
  kayit && kayit.bitis !== null
    ? ok((no += 1), "listede engel bitis tarihi var")
    : bad((no += 1), "listede bitis tarihi yok");
}

/* ════════════ 11. IP BILINMIYORSA HIC KAYIT ACILMIYOR ════════════ */
/*
 * `istekIpsi()` IP'yi cozemezse bos donebiliyor. Bos anahtarla kayit acilsa
 * IP'si okunamayan BUTUN ziyaretciler tek bir sayacta toplanir ve ucuncu
 * hatada hepsi birden engellenirdi.
 */
(await botIsareti("", "bal-kupu")) === false
  ? ok((no += 1), "bos IP icin engel acilmiyor")
  : bad((no += 1), "bos IP engellendi — IP'si okunamayan herkes kapanir");

(await botEngelliMi("")).engelli === false
  ? ok((no += 1), "bos IP engelli sayilmiyor")
  : bad((no += 1), "bos IP engelli sayildi");

await bitir();
