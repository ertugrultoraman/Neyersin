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

/**
 * Verilen tarayici baglamina kapi cerezlerini yazar.
 *
 * IKI AYRI KAPI var ve testin ikisini de gecmesi gerekiyor:
 *
 *  1. "Ben robot degilim" bileti (`ny_insan`) — her zaman yaziliyor.
 *
 *  2. BAKIM MODU bileti (`ny_bilet`) — yalnizca BAKIM_ANAHTARI tanimliysa.
 *     Site bakim modundayken her istek duz bir 404 donuyor ve butun takimlar
 *     tek satir bile calismadan dusuyordu. Cerezin degeri anahtarin kendisi
 *     (bkz. src/middleware.ts); anahtari bilmeyen uretemez, yani bu da bir
 *     arka kapi degil. Sunucu tarafinda hicbir sey gevsetilmedi.
 *
 * Bakim modu KAPALIYKEN fazladan cerez zararsiz: ara katman onu hic okumuyor.
 */
export async function kapiyiGec(baglam, alan = "neyersin.local") {
  const cerezler = [{ name: "ny_insan", value: insanBileti(), domain: alan, path: "/" }];

  const bakimAnahtari = (process.env.BAKIM_ANAHTARI ?? "").trim();
  if (bakimAnahtari.length >= 16) {
    cerezler.push({ name: "ny_bilet", value: bakimAnahtari, domain: alan, path: "/" });
  }

  await baglam.addCookies(cerezler);
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

  /*
   * `hamBaglam` INSAN bileti yazmiyor ama BAKIM bileti yaziyor.
   *
   * Amaci "ben robot degilim" kapisini test etmek; bakim modunun 404'unu
   * degil. Ikisi de atlansaydi test insan kapisi yerine bakim sayfasini
   * gorup "bilet sizmis olabilir" diye dusuyordu — gercekte kapi calisiyor,
   * yalnizca sayfaya hic ulasilamiyordu.
   */
  tarayici.hamBaglam = async (...arg) => {
    const baglam = await asil(...arg);
    const bakimAnahtari = (process.env.BAKIM_ANAHTARI ?? "").trim();
    if (bakimAnahtari.length >= 16) {
      await baglam.addCookies([
        { name: "ny_bilet", value: bakimAnahtari, domain: alan, path: "/" },
      ]);
    }
    return baglam;
  };

  tarayici.newContext = async (...arg) => {
    const baglam = await asil(...arg);
    await kapiyiGec(baglam, alan);
    return baglam;
  };
  return tarayici;
}
