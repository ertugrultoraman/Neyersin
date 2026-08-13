import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * YEREL DERLEME ÖNCESİ TEMİZLİK.
 *
 * Proje klasörü OneDrive içinde. Next/webpack derleme sırasında `.next-yerel`
 * altına saniyede onlarca kez yazıyor; OneDrive bunları senkronlamaya
 * çalışırken yarım kalmış dosya bırakıyor ve SONRAKİ derleme, kaynağı hiç
 * belli olmayan bir yerde çöküyor:
 *
 *   TypeError: Cannot read properties of undefined (reading 'length')
 *       at WasmHash._updateWithBuffer (...webpack/bundle5.js)
 *
 * Hata bağımlılık uyumsuzluğu gibi görünüyor — bir kez bu yüzden paket
 * sürümleri şüpheli sanıldı. Oysa tek belirti şu: klasör silinip yeniden
 * derlenince geçiyor, sonraki artımlı derlemede yine düşüyor. Üç kez bu
 * döngüye girildi, bu yüzden temizlik derleme adımının kendisine bağlandı.
 *
 * VERCEL'DE ÇALIŞMIYOR: orada her derleme zaten temiz bir makinede başlıyor
 * ve önbelleği silmek derlemeyi boşuna uzatırdı.
 */

if (process.env.VERCEL) {
  process.exit(0);
}

const silinecekler = [
  path.resolve(process.env.NEXT_DIST_DIR ?? ".next-yerel"),
  path.join(os.tmpdir(), "ne-yersin-webpack"),
];

for (const yol of silinecekler) {
  try {
    fs.rmSync(yol, { recursive: true, force: true });
  } catch (hata) {
    /*
     * Silinemezse derleme yine denensin: dosya kilidi geçici olabilir ve
     * temizlik bir kolaylık, ön koşul değil.
     */
    console.warn(`[derleme-temizle] silinemedi: ${yol} — ${hata.message}`);
  }
}
