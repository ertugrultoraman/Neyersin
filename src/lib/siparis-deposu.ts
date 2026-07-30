import type { OdemeYontemi } from "@/content/odeme";
import { depoAl } from "./depo";
import type { Siparis, SiparisDurumu } from "./siparis";

/**
 * Sipariş kayıt katmanı — üç hedefe birlikte yazar:
 *
 *  1. **Kalıcı depo** (`lib/depo`): admin paneli buradan okur.
 *     DATABASE_URL varsa Postgres, yoksa yerel dosya.
 *  2. **Webhook** (`SIPARIS_WEBHOOK_URL`): n8n / Zapier / kendi API'niz.
 *  3. **Sunucu günlüğü**: ilk ikisi başarısız olsa da sipariş kaybolmasın.
 *
 * Depoya yazma hatası siparişi düşürmez — müşteri sipariş numarasını yine alır,
 * hata günlüğe yazılır. Ödeme akışını veri tabanı arızası yüzünden kesmek,
 * siparişi tamamen kaybetmekten daha kötü bir sonuç üretirdi.
 *
 * Vercel Blob BİLİNÇLİ OLARAK kullanılmadı: Blob yalnızca public erişim
 * sunuyor, sipariş kaydı ad/telefon/adres içeriyor — kişisel veri tahmin
 * edilmesi zor bir URL'in arkasına konulamaz.
 */
export async function siparisiKaydet(siparis: Siparis): Promise<void> {
  // 1) Kalıcı depo — admin paneli buradan okur
  try {
    const depo = await depoAl();
    await depo.ekle(siparis);
  } catch (hata) {
    console.error(
      `[siparis] depoya yazılamadı (${siparis.siparisNo}):`,
      hata instanceof Error ? hata.message : hata,
    );
  }

  // 2) Webhook (varsa)
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
      odemeYontemi: siparis.odemeYontemi,
      durum: siparis.durum,
      ilce: siparis.adres.ilce,
      telefon: siparis.musteri.telefon,
      kalemAdedi: siparis.kalemler.length,
    }),
  );
}

export type OdemeSonucKaydi = {
  siparisNo: string;
  odemeYontemi: OdemeYontemi;
  durum: SiparisDurumu;
  /** iyzico paymentId — mutabakat ve iade için gerekli. */
  saglayiciOdemeId?: string;
  odenenTutar?: string;
  mesaj?: string;
};

/**
 * Ödeme sonucunu kaydeder (iyzico callback'inden sonra çağrılır).
 *
 * Kalıcı veritabanı bağlanana kadar sipariş durumu güncellenemiyor; bu kayıt
 * webhook + sunucu günlüğüne düşer. Mutabakat için `saglayiciOdemeId` kritik —
 * iade işlemleri bu kimlikle yapılır.
 */
export async function odemeSonucuKaydet(kayit: OdemeSonucKaydi): Promise<void> {
  // 1) Depodaki siparişin durumunu güncelle
  try {
    const depo = await depoAl();
    await depo.durumGuncelle(kayit.siparisNo, kayit.durum, {
      saglayiciOdemeId: kayit.saglayiciOdemeId,
      odenenTutar: kayit.odenenTutar,
      odemeMesaji: kayit.mesaj,
    });
  } catch (hata) {
    console.error(
      `[odeme] depo güncellenemedi (${kayit.siparisNo}):`,
      hata instanceof Error ? hata.message : hata,
    );
  }

  const webhook = process.env.SIPARIS_WEBHOOK_URL;

  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tip: "odeme-sonucu", ...kayit, zaman: new Date().toISOString() }),
      });
    } catch (hata) {
      console.error(
        `[odeme] webhook'a ulaşılamadı (${kayit.siparisNo}):`,
        hata instanceof Error ? hata.message : hata,
      );
    }
  }

  console.info("[odeme]", JSON.stringify(kayit));
}
