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

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

for (const h of HESAPLAR) {
  const ozet = await parolaOzetle(parola);
  const [mevcut] = await sql`SELECT rol FROM hesaplar WHERE eposta = ${h.eposta}`;

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

console.log(`\nDört deneme hesabının parolası da: ${parola}`);
await sql.end();
