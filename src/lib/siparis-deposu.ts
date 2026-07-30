import type { Siparis } from "./siparis";

/**
 * Sipariş kayıt katmanı.
 *
 * DURUM: Kalıcı bir veritabanı henüz bağlı değil.
 *  - `SIPARIS_WEBHOOK_URL` tanımlıysa sipariş bu adrese POST edilir. Küçük
 *    ölçekte çalışan pratik bir yol: n8n / Zapier / Google Apps Script uçları
 *    ya da işletmenin kendi API'si.
 *  - Her durumda sipariş sunucu günlüğüne yazılır (Vercel → Logs).
 *
 * ÜRETİME ÇIKMADAN ÖNCE: gerçek bir veritabanı bağlanmalı (Vercel Postgres,
 * Neon, Supabase vb.). Vercel Blob BİLİNÇLİ OLARAK kullanılmadı: Blob yalnızca
 * public erişim sunuyor, sipariş kaydı ad/telefon/adres içeriyor — kişisel veri
 * tahmin edilmesi zor bir URL'in arkasına konulamaz.
 */
export async function siparisiKaydet(siparis: Siparis): Promise<void> {
  const webhook = process.env.SIPARIS_WEBHOOK_URL;

  if (webhook) {
    try {
      const cevap = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siparis),
      });
      if (!cevap.ok) {
        console.error(
          `[siparis] webhook ${cevap.status} döndü — sipariş ${siparis.siparisNo} yalnızca günlükte`,
        );
      }
    } catch (hata) {
      console.error(
        `[siparis] webhook'a ulaşılamadı (${siparis.siparisNo}):`,
        hata instanceof Error ? hata.message : hata,
      );
    }
  }

  // Günlük kaydı: webhook olmasa da sipariş kaybolmasın.
  console.info(
    "[siparis]",
    JSON.stringify({
      siparisNo: siparis.siparisNo,
      tarih: siparis.olusturmaTarihi,
      restoran: siparis.restoranAdi,
      toplam: siparis.tutarlar.toplam,
      ilce: siparis.adres.ilce,
      telefon: siparis.musteri.telefon,
      kalemAdedi: siparis.kalemler.length,
    }),
  );
}
