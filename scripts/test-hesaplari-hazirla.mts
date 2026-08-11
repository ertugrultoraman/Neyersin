/**
 * Deneme hesaplarına SABİT parola verir.
 *
 * Neden var: gerçek hesapların parolası tek yönlü özet olarak saklandığı için
 * unutulunca geri getirilemiyor ve her denemede "hangi paroladı" turu
 * başlıyordu. Bu betik yalnızca aşağıdaki DÖRT sahte hesaba dokunuyor;
 * parolaları `.env.local`daki `TEST_PAROLA` değerine eşitliyor.
 *
 * Kullanım:  npm run hesap:test
 *
 * SINIRLAR — bilerek dar tutuldu:
 *  - Listede olmayan hiçbir hesaba dokunmaz. Gerçek kullanıcıların parolası
 *    hiçbir koşulda bu betikten değişmez.
 *  - `TEST_PAROLA` tanımlı değilse hiçbir şey yazmadan çıkar. Varsayılan bir
 *    parola KOYULMADI: kod depoda duruyor, `.env.local` durmuyor — gömülü bir
 *    varsayılan, canlıdaki deneme hesaplarını herkese açık hâle getirirdi.
 *  - Var olan hesabın ROLÜNE dokunmaz, yalnızca parolasını yazar. Rol denemesi
 *    yaparken panelden verdiğiniz rol geri alınmasın diye.
 *  - PANELDEN ÜRETİLMİŞ PAROLAYI EZMEZ. Parolası `TEST_PAROLA` OLMAYAN hesap
 *    atlanıyor: birileri onu bilerek değiştirmiş demektir. Bu betik önce sessizce
 *    üzerine yazıyordu ve yönetim panelinden üretilip bir yere not edilen parola,
 *    hiç kullanılmadan geçersiz kalıyordu — parola "tek kullanımlık" sanılıyordu.
 *    Yine de ezmek için:  npm run hesap:test -- --zorla
 */
import postgres from "postgres";

import { parolaDogrula, parolaOzetle } from "../src/lib/hesaplar/parola";
import type { Rol } from "../src/lib/hesaplar/tipler";

/** Yoksa açılacak deneme hesapları. Buradaki rol YALNIZCA ilk açılışta geçerli. */
const HESAPLAR: { eposta: string; ad: string; rol: Rol }[] = [
  { eposta: "ornek@gmail.com", ad: "Örnek İşletme", rol: "isletme" },
  { eposta: "ornek1@gmail.com", ad: "Örnek Şef", rol: "sef" },
  { eposta: "ornek2@gmail.com", ad: "Örnek Kurye", rol: "kurye" },
  { eposta: "ornek3@gmail.com", ad: "Örnek Müşteri", rol: "musteri" },
];

const parola = (process.env.TEST_PAROLA ?? "").trim();
if (parola.length < 8) {
  console.error(
    "TEST_PAROLA tanımlı değil (ya da 8 karakterden kısa).\n" +
      ".env.local dosyasına ekleyin, örnek:\n" +
      '  TEST_PAROLA="Deneme!2026-parola"\n' +
      "Hiçbir şey yazılmadı.",
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL yok. Hiçbir şey yazılmadı.");
  process.exit(1);
}

/** `--zorla`: elle değiştirilmiş parolayı da geri al. */
const zorla = process.argv.includes("--zorla");

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
let atlanan = 0;

for (const h of HESAPLAR) {
  const ozet = await parolaOzetle(parola);
  const [mevcut] = await sql`SELECT rol, parola_hash FROM hesaplar WHERE eposta = ${h.eposta}`;

  /*
   * Parola zaten TEST_PAROLA ise yazmanın bir anlamı yok; DEĞİLSE birileri onu
   * bilerek değiştirmiş (büyük ihtimalle panelden "Yeni parola üret"). Sessizce
   * ezmek, not edilmiş parolayı hiç kullanılmadan geçersiz kılıyordu.
   */
  if (mevcut && !zorla && !(await parolaDogrula(parola, mevcut.parola_hash))) {
    atlanan += 1;
    console.log(
      `atlandi ${h.eposta.padEnd(20)} parolasi elle degistirilmis` +
        " — ezmek icin: npm run hesap:test -- --zorla",
    );
    continue;
  }

  if (mevcut) {
    await sql`UPDATE hesaplar SET parola_hash = ${ozet}, saglayici = 'parola',
                                  eposta_dogrulandi = TRUE
              WHERE eposta = ${h.eposta}`;
  } else {
    await sql`INSERT INTO hesaplar (eposta, ad, parola_hash, rol, olusturma_tarihi,
                                    eposta_dogrulandi, saglayici)
              VALUES (${h.eposta}, ${h.ad}, ${ozet}, ${h.rol}, NOW(), TRUE, 'parola')`;
  }

  /* Yazılanı gerçek doğrulayıcıyla sına — biçim uyuşmazlığı sessiz kalmasın. */
  const [kontrol] = await sql`SELECT parola_hash, rol FROM hesaplar WHERE eposta = ${h.eposta}`;
  const gecerli = await parolaDogrula(parola, kontrol.parola_hash);

  /* Eski başarısız denemeler yolu kapatmasın. */
  await sql`DELETE FROM giris_denemeleri WHERE anahtar LIKE ${h.eposta + "|%"}`;

  console.log(
    `${gecerli ? "tamam " : "HATA  "} ${h.eposta.padEnd(20)} rol=${kontrol.rol}` +
      `${mevcut ? "" : "  (yeni açıldı)"}`,
  );
}

console.log(
  atlanan === 0
    ? `\nDört deneme hesabının parolası da: ${parola}`
    : `\n${HESAPLAR.length - atlanan} hesabın parolası: ${parola}` +
        `\n${atlanan} hesap atlandı — parolaları panelden değiştirilmiş, öyle bırakıldı.`,
);
await sql.end();
