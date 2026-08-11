/**
 * OTOMATİK TÜRKÇE → İNGİLİZCE ÇEVİRİ (yönetici içeriği için).
 *
 * Nerede kullanılıyor: anket sorusu ve şıkları. Bu metinler koda değil
 * veritabanına yazılıyor, yani `sozluk.ts` onları göremiyor; İngilizce siteye
 * geçen ziyaretçi anketi Türkçe görüyordu.
 *
 * TASARIM KARARLARI
 *
 *  - Çeviri YAZMA anında yapılıyor, çizim anında değil. Her sayfa açılışında
 *    dış servise gitmek hem yavaş hem pahalı olurdu; anket yılda birkaç kez
 *    yazılıyor, milyonlarca kez okunuyor.
 *
 *  - ASLA istisna fırlatmıyor. Çeviri, anket kaydetmenin yan işi; servis
 *    kapalıysa anketin kaydedilememesi kabul edilemez. Başarısızlıkta
 *    `null` dönüyor ve alan boş kalıyor — boş İngilizce alan zaten Türkçesine
 *    düşüyor (bkz. `sec` / `secDil`).
 *
 *  - Yönetici elle İngilizce yazdıysa ona dokunulmuyor; otomatik çeviri
 *    yalnızca BOŞ alanları dolduruyor.
 */

/*
 * Sürüm numarası SABİTLENMEDİ, "latest" takma adı kullanılıyor: sabit sürümler
 * emekliye ayrılınca istek 404 dönüyor ve çeviri sessizce ölüyor. Çeviri basit
 * bir iş, en ucuz sınıf yetiyor. `GOOGLE_CEVIRI_MODELI` ile değiştirilebilir.
 */
const MODEL = process.env.GOOGLE_CEVIRI_MODELI ?? "gemini-flash-lite-latest";
const ZAMAN_ASIMI_MS = 15_000;

function anahtar(): string | null {
  const a = (process.env.GOOGLE_API_KEY ?? "").trim();
  return a.length > 0 ? a : null;
}

/** Çeviri özelliği açık mı — anahtar yoksa sessizce kapalı. */
export function otomatikCeviriVarMi(): boolean {
  return anahtar() !== null;
}

/**
 * Birden çok kısa metni TEK çağrıda çevirir.
 *
 * Neden toplu: soru + şıklar ayrı ayrı gönderilseydi bir anket için 5-6 istek
 * atılırdı. Ayrıca model şıkları soruyla birlikte görünce daha isabetli
 * çeviriyor ("Kötü teslimat" bir anket şıkkı mı, cümle mi?).
 *
 * Dönüş: girişle AYNI uzunlukta dizi. Çevrilemeyen öğe `null`.
 */
export async function ingilizceyeCevir(metinler: string[]): Promise<(string | null)[]> {
  const bos = metinler.map(() => null);
  const api = anahtar();
  if (!api || metinler.length === 0) return bos;
  if (metinler.every((m) => m.trim().length === 0)) return bos;

  /*
   * Modelden JSON dizi isteniyor ve `responseMimeType` ile bağlanıyor; düz
   * metin istendiğinde araya "Here is the translation:" gibi cümleler
   * karışıyor ve ayrıştırma kırılgan oluyordu.
   */
  const yonerge =
    "Translate each Turkish string in the input array into natural English. " +
    "These are poll questions and short answer options on a food delivery website. " +
    "Keep them short and idiomatic; do not add punctuation that is not there. " +
    "Return ONLY a JSON array of strings, same length and order as the input.";

  const govde = {
    system_instruction: { parts: [{ text: yonerge }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify(metinler) }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  const durdurucu = new AbortController();
  const sayac = setTimeout(() => durdurucu.abort(), ZAMAN_ASIMI_MS);

  try {
    const cevap = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": api },
        body: JSON.stringify(govde),
        signal: durdurucu.signal,
      },
    );

    if (!cevap.ok) {
      console.error(`Çeviri servisi ${cevap.status} döndü; alanlar boş bırakıldı.`);
      return bos;
    }

    const veri = (await cevap.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const ham = veri.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!ham) return bos;

    const cozulen: unknown = JSON.parse(ham);
    if (!Array.isArray(cozulen)) return bos;

    /*
     * Uzunluk tutmuyorsa hiçbirini kullanmıyoruz: kaydırılmış bir dizi
     * şıkları birbirine karıştırırdı ("Evet" -> "Bad delivery").
     */
    if (cozulen.length !== metinler.length) return bos;

    return cozulen.map((d) => (typeof d === "string" && d.trim().length > 0 ? d.trim() : null));
  } catch (hata) {
    console.error("Otomatik çeviri başarısız:", hata);
    return bos;
  } finally {
    clearTimeout(sayac);
  }
}
