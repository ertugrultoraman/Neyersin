/* eslint-disable @typescript-eslint/no-unused-expressions -- test dosyasi */
import postgres from "postgres";

import {
  mesajEkle,
  mesajlariListele,
  mesajlasmaAcikMi,
} from "../../src/lib/siparis-mesajlari";
import { maskelemeAcikMi, maskeliHatAl } from "../../src/lib/telefon-maskeleme";

/**
 * SIPARIS YAZISMASI — kurye ile musteri, numara paylasmadan.
 *
 * EN ONEMLI KONTROL yazismanin KAPANMASI. Numaralari gizlemenin amaci,
 * teslimattan sonra da suren bir bag kurulmasini onlemekti; kalici bir kanal
 * birakmak butun isi bosa cikarirdi. Bu zamana bagli oldugu icin tarayiciyla
 * olculemez — modul dogrudan cagriliyor.
 *
 * MASKELEME KAPALIYKEN NUMARA UYDURULMADIGI da burada dogrulaniyor: gercek
 * numaraya dusmektense arama secenegi hic gorunmemeli.
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
const SIPARIS = `TEST-MSJ-${damga}`;
const BOS_SIPARIS = `TEST-MSJ-BOS-${damga}`;

async function bitir(patlama?: unknown) {
  await sql`DELETE FROM siparis_mesajlari WHERE siparis_no IN (${SIPARIS}, ${BOS_SIPARIS})`.catch(() => {});
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

/* ════════════ 1. YAZ VE OKU ════════════ */
(await mesajlariListele(BOS_SIPARIS)).length === 0
  ? ok((no += 1), "hic mesaji olmayan siparis bos donuyor")
  : bad((no += 1), "bos siparis bos donmedi");

await mesajEkle({
  siparisNo: SIPARIS,
  gonderen: "kurye",
  gonderenAdi: "Test Kuryesi",
  metin: "Kapinizdayim, zil calismiyor.",
});
await mesajEkle({
  siparisNo: SIPARIS,
  gonderen: "musteri",
  gonderenAdi: "Test Musterisi",
  metin: "Geldim, bir dakika.",
});

const liste = await mesajlariListele(SIPARIS);
liste.length === 2
  ? ok((no += 1), "iki mesaj da kaydedildi")
  : bad((no += 1), `mesaj sayisi ${liste.length}, 2 bekleniyordu`);

/* Sira ESKIDEN YENIYE olmali; karisirsa konusma anlamsizlasir. */
liste[0]?.gonderen === "kurye" && liste[1]?.gonderen === "musteri"
  ? ok((no += 1), "mesajlar eskiden yeniye siralaniyor")
  : bad((no += 1), "mesaj sirasi yanlis");

liste[0]?.gonderenAdi === "Test Kuryesi"
  ? ok((no += 1), "gonderen adi saklaniyor")
  : bad((no += 1), "gonderen adi kayip");

/* ════════════ 2. BASKA SIPARISIN MESAJI KARISMIYOR ════════════ */
/*
 * Yazisma siparise bagli. Sizsaydi bir musteri baska bir siparisin
 * konusmasini gorurdu.
 */
await mesajEkle({
  siparisNo: BOS_SIPARIS,
  gonderen: "musteri",
  gonderenAdi: "Baskasi",
  metin: "Bu baska bir siparisin mesaji.",
});
(await mesajlariListele(SIPARIS)).length === 2
  ? ok((no += 1), "baska siparisin mesaji listeye karismiyor")
  : bad((no += 1), "mesajlar siparisler arasinda siziyor");

/* ════════════ 3. BOS MESAJ VE UZUNLUK ════════════ */
try {
  await mesajEkle({ siparisNo: SIPARIS, gonderen: "kurye", gonderenAdi: "X", metin: "   " });
  bad((no += 1), "bos mesaj kabul edildi");
} catch {
  ok((no += 1), "bos mesaj reddediliyor");
}

await mesajEkle({
  siparisNo: SIPARIS,
  gonderen: "kurye",
  gonderenAdi: "X",
  metin: "a".repeat(1500),
});
{
  const sonuncu = (await mesajlariListele(SIPARIS)).at(-1);
  sonuncu?.metin.length === 1000
    ? ok((no += 1), "uzun mesaj 1000 karaktere kirpiliyor")
    : bad((no += 1), `kirpma calismadi: ${sonuncu?.metin.length}`);
}

/* ════════════ 4. YAZISMA NE ZAMAN ACIK ════════════ */
const simdi = new Date().toISOString();
const ucSaatOnce = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
const birSaatOnce = new Date(Date.now() - 60 * 60 * 1000).toISOString();

mesajlasmaAcikMi("yolda", simdi) === true
  ? ok((no += 1), "yoldaki siparis yazismasi acik")
  : bad((no += 1), "yoldaki siparis yazismasi kapali");

mesajlasmaAcikMi("odendi", simdi) === true
  ? ok((no += 1), "hazirlanmakta olan siparis yazismasi acik")
  : bad((no += 1), "hazirlanan siparis yazismasi kapali");

/*
 * IPTAL: yazisma hic acilmiyor. Iptal edilmis bir siparis uzerinden konusmaya
 * devam etmek, siparisi bahane ederek acilmis bir kanal olurdu.
 */
mesajlasmaAcikMi("iptal", simdi) === false
  ? ok((no += 1), "iptal edilen siparisin yazismasi kapali")
  : bad((no += 1), "iptal edilen sipariste yazisilabiliyor");

mesajlasmaAcikMi("teslim-edildi", birSaatOnce) === true
  ? ok((no += 1), "teslimattan 1 saat sonra hala acik (sorun cozulebilsin)")
  : bad((no += 1), "teslimattan hemen sonra kapanmis");

/*
 * ASIL KONTROL: iki saat sonra KAPANIYOR. Acik kalsaydi kurye ile musteri
 * arasinda kalici bir kanal olurdu ve numaralari gizlemenin anlami kalmazdi.
 */
mesajlasmaAcikMi("teslim-edildi", ucSaatOnce) === false
  ? ok((no += 1), "teslimattan 3 saat sonra yazisma KAPANIYOR")
  : bad((no += 1), "yazisma teslimattan sonra kapanmiyor — kalici kanal acik kalmis");

mesajlasmaAcikMi("teslim-edildi", undefined) === false
  ? ok((no += 1), "tarihi bilinmeyen teslim edilmis siparis kapali sayiliyor")
  : bad((no += 1), "tarihsiz teslimatta yazisma acik kalmis");

/* ════════════ 5. MASKELEME KAPALIYKEN NUMARA UYDURULMUYOR ════════════ */
maskelemeAcikMi() === false
  ? ok((no += 1), "maskeleme kapali (saglayici baglanmamis)")
  : ok((no += 1), "maskeleme acik — saglayici yapilandirilmis");

(await maskeliHatAl({ siparisNo: SIPARIS, taraf: "kurye" })) === null
  ? ok((no += 1), "saglayici yokken ara numara null donuyor, numara uydurulmuyor")
  : bad((no += 1), "saglayici yokken numara uretildi");

await bitir();
