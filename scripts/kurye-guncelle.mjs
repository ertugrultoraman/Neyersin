import { spawn } from "node:child_process";

/**
 * KURYE UYGULAMASINI HAVADAN GÜNCELLER.
 *
 * Neden bir sarmalayıcı: komut doğrudan npm betiği olarak yazıldığında iki
 * sorun çıktı.
 *
 *  1. `eas update` etkileşimsiz kipte `--environment` istiyor; verilmeyince
 *     "The `--environment` flag must be set" diyerek düşüyordu.
 *  2. Mesajdaki BOŞLUKLAR bozuluyordu. npm, Windows'ta betiği cmd üzerinden
 *     çalıştırıyor ve tırnaklar katman katman kaçışlanıyor:
 *     `^^^"Teklif^^^ kartinda^^^ ...`. Sonuç, her kelimenin ayrı bir argüman
 *     olduğu bozuk bir komut.
 *
 * Burada argümanlar DİZİ olarak veriliyor (`shell: false`), yani hiçbir kabuk
 * araya girmiyor ve tırnak sorunu tamamen ortadan kalkıyor.
 *
 *   npm run kurye:guncelle -- "ne degisti"
 */

const mesaj = process.argv.slice(2).join(" ").trim() || "guncelleme";
const dal = process.env.KURYE_DAL ?? "preview";

const argumanlar = [
  "eas-cli@latest",
  "update",
  "--branch",
  dal,
  "--environment",
  dal,
  "--message",
  mesaj,
  "--non-interactive",
];

console.log(`\n[kurye:guncelle] dal "${dal}" · mesaj: ${mesaj}\n`);

const kurye = new URL("../mobil/apps/kurye/", import.meta.url);

/*
 * WINDOWS AYRI ELE ALINIYOR.
 *
 * `npx` orada bir .cmd dosyası; `shell: false` ile doğrudan çalıştırılamıyor
 * (EINVAL). `shell: true` ise argüman DİZİSİNİ kaçışlamadan birleştiriyor —
 * Node bunu açıkça uyarıyor (DEP0190) — ve boşluklu mesaj yine parçalanıyor:
 * "Unexpected arguments: kartinda, oran, ve, ...".
 *
 * Çözüm: komut satırını tırnaklarını kendimiz koyarak TEK DİZGE hâlinde
 * vermek. Böylece kabuk açılıyor ama bölecek bir şey bulamıyor.
 */
const kacisla = (deger) => `"${String(deger).replace(/(["\\])/g, "\\$1")}"`;

const surec =
  process.platform === "win32"
    ? /* `npx` TIRNAKSIZ: tırnaklandığında kabuk onu yol gibi çözmeye çalışıp
         "Cannot find module ...\\npm\\bin\\npx-cli.js" veriyor. Yalnızca
         argümanların tırnaklanması gerekiyor. */
      spawn(["npx", ...argumanlar.map(kacisla)].join(" "), {
        cwd: kurye,
        stdio: "inherit",
        shell: true,
      })
    : spawn("npx", argumanlar, { cwd: kurye, stdio: "inherit" });

surec.on("exit", (kod) => {
  if (kod === 0) {
    console.log(
      "\nGönderildi. Telefondaki uygulamayı KAPATIP AÇ: ilk açılışta güncelleme iner,\n" +
        "ikinci açılışta devreye girer.\n",
    );
  }
  process.exit(kod ?? 1);
});
