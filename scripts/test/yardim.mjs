import crypto from "node:crypto";
import fs from "node:fs";

/**
 * Test yardimcilari.
 *
 * "Ben robot degilim" kapisi eklendikten sonra her test once kapiyi gecmek
 * zorunda. Kutuyu tikayip beklemek yerine bileti DOGRUDAN URETIYORUZ: kapi
 * HMAC imzali bir cerezle calisiyor ve imza anahtari testlerin de bildigi
 * ADMIN_PASSWORD (bkz. lib/insan-dogrulama.ts → anahtar()).
 *
 * Bu bir arka kapi DEGIL: anahtari bilmeyen bilet uretemez. Sunucu tarafinda
 * hicbir sey gevsetilmedi.
 */
function anahtar() {
  const gizli = process.env.OTURUM_ANAHTARI ?? process.env.ADMIN_PASSWORD;
  if (!gizli) {
    throw new Error("OTURUM_ANAHTARI veya ADMIN_PASSWORD tanimli degil — kapi gecilemez.");
  }
  return gizli;
}

/*
 * Bilet omru, uygulamadaki GECERLILIK_GUN ile AYNI kaynaktan okunuyor.
 * Onceden burada sabit 30 gun yaziyordu; sure kisaltilinca sunucu "izin
 * verilenden uzak bitis tarihi" gerekcesiyle bileti reddetti ve butun
 * takimlar kapida kaldi.
 */
const KAYNAK = fs.readFileSync(
  new URL("../../src/lib/insan-dogrulama.ts", import.meta.url),
  "utf8",
);
const GECERLILIK_GUN = Number(KAYNAK.match(/GECERLILIK_GUN\s*=\s*(\d+)/)?.[1] ?? 1);

export function insanBileti() {
  // Ust sinira takilmamak icin sureyi tam degil, biraz altinda kullaniyoruz.
  const omur = Math.max(GECERLILIK_GUN * 24 * 60 * 60 * 1000 - 60_000, 60_000);
  const bitis = String(Date.now() + omur);
  const imza = crypto.createHmac("sha256", anahtar()).update(bitis).digest("base64url");
  return `${bitis}.${imza}`;
}

/** Verilen tarayici baglamina insan bileti cerezini yazar. */
export async function kapiyiGec(baglam, alan = "neyersin.local") {
  await baglam.addCookies([
    { name: "ny_insan", value: insanBileti(), domain: alan, path: "/" },
  ]);
}

/**
 * Tarayiciyi sarmalar: bundan sonra ACILAN HER BAGLAM kapiyi gecmis olur.
 * Boylece her test dosyasinda tek satir degisiklik yetiyor.
 *
 * Kapinin KENDISINI test etmek icin `hamBaglam` kullanilir — o, bilet
 * yazmadan temiz bir ziyaretci acar.
 */
export function kapiliTarayici(tarayici, alan = "neyersin.local") {
  const asil = tarayici.newContext.bind(tarayici);
  tarayici.hamBaglam = asil;
  tarayici.newContext = async (...arg) => {
    const baglam = await asil(...arg);
    await kapiyiGec(baglam, alan);
    return baglam;
  };
  return tarayici;
}
