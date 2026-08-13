import type { NextRequest } from "next/server";

import { basarili, gecersiz, govdeOku, hata } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import type { SiparisOlusturGirdisi, SiparisOlusturSonucu } from "@/lib/mobil/tipler";
import { siparisOlustur } from "@/lib/siparis-olustur";
import { VARSAYILAN_DIL } from "@/lib/dil";
import { ceviri } from "@/lib/sozluk";

/**
 * POST /api/mobil/v1/siparis
 *
 * Sipariş oluşturur. Mantık web ödeme formuyla ORTAK (lib/siparis-olustur.ts);
 * burada yalnızca mobil bağlamı toplanıyor: oturum Bearer jetonundan, IP
 * başlıklardan.
 *
 * GİRİŞ ZORUNLU — kataloğun aksine. Sipariş adres, telefon ve ödeme demek;
 * ayrıca kişi başı kupon sınırı ancak kimliği bilinen birine uygulanabiliyor.
 *
 * DOĞRULAMA HATALARI 400 + `alanlar` ile dönüyor. Zarfın `alanlar` alanı tam
 * bunun için var (bkz. lib/mobil/cevap.ts): uygulama hangi alanın altına ne
 * yazacağını biliyor, tek bir genel hata metni göstermek zorunda kalmıyor.
 *
 * HIZ SINIRI "ağır": bu uç menüyü çözüyor, tutarları hesaplıyor, kupon
 * geçmişine bakıyor ve kart ödemesinde iyzico'ya çıkıyor — mobil uçlar
 * içindeki en pahalısı. Varsayılan yazma bütçesi (dakikada 40) buraya fazla
 * geniş kalırdı; aynı kişinin dakikada 5'ten fazla sipariş vermesi gerçek bir
 * kullanım değil.
 */
export async function POST(istek: NextRequest) {
  return korumali(istek, { hiz: "agir" }, async (oturum) => {
    const govde = await govdeOku<SiparisOlusturGirdisi>(istek);
    if (!govde || typeof govde.restoranSlug !== "string" || !Array.isArray(govde.kalemler)) {
      return gecersiz("Sipariş bilgisi okunamadı.");
    }

    const yontem = govde.odemeYontemi === "iyzico" ? "iyzico" : "havale";

    const sonuc = await siparisOlustur({
      restoranSlug: govde.restoranSlug,
      sepet: govde.kalemler.map((k) => ({
        urunId: String(k.urunId),
        adet: Number(k.adet),
        ...(Array.isArray(k.ekstraIdler) ? { ekstraIdleri: k.ekstraIdler } : {}),
      })),
      form: {
        musteri: {
          adSoyad: govde.musteri?.adSoyad ?? "",
          telefon: govde.musteri?.telefon ?? "",
          /* Oturumdan yazılacak; buradaki değer kullanılmıyor. */
          eposta: "",
        },
        adres: {
          ilce: govde.adres?.ilce ?? "",
          mahalle: govde.adres?.mahalle ?? "",
          acikAdres: govde.adres?.acikAdres ?? "",
          binaNo: govde.adres?.binaNo ?? "",
          daireNo: govde.adres?.daireNo ?? "",
          tarif: govde.adres?.tarif ?? "",
        },
        not: govde.not ?? "",
        ...(govde.kuponKodu ? { kuponKodu: govde.kuponKodu } : {}),
      },
      odemeYontemi: yontem,
      oturumEpostasi: oturum.eposta,
      ip: istemciIp(istek),
      /*
       * Uygulama şimdilik tek dilde; hata metinleri Türkçe dönüyor. Uygulamaya
       * dil seçimi geldiğinde buraya `Accept-Language` ya da bir sorgu
       * parametresi bağlanacak.
       */
      c: ceviri(VARSAYILAN_DIL),
    });

    if (!sonuc.basarili) {
      /*
       * `odeme` alanı bir FORM alanı değil, akışın kendisi hakkında: kart
       * sağlayıcısına ulaşılamadı, giriş gerekiyor gibi. Uygulama onu form
       * altına değil, üstteki uyarı şeridine yazıyor.
       */
      return hata("gecersiz_istek", sonuc.hatalar.odeme ?? "Sipariş oluşturulamadı.", 400, {
        ...sonuc.hatalar,
      });
    }

    const cevap: SiparisOlusturSonucu = {
      siparisNo: sonuc.siparisNo,
      ...(sonuc.yontem === "iyzico" && sonuc.paymentPageUrl
        ? { odemeUrl: sonuc.paymentPageUrl }
        : {}),
    };

    /*
     * KART SEÇİLDİ AMA ADRES GELMEDİYSE bu bir hata: sipariş kaydedildi,
     * kullanıcı ödeyemez ve "ödeme bekliyor" durumunda asılı kalır.
     * `checkoutFormContent` (gömülü HTML) mobilde kullanılmıyor — uygulama
     * kendi ekranında kart formu barındırmıyor, tarayıcıya yönlendiriyor.
     */
    if (sonuc.yontem === "iyzico" && !cevap.odemeUrl) {
      return hata(
        "sunucu_hatasi",
        "Ödeme sayfası açılamadı. Siparişin kaydedildi, destek ekibiyle iletişime geç.",
        502,
      );
    }

    return basarili(cevap, 201);
  });
}

/** Proxy arkasında gerçek istemci IP'si — iyzico risk analizi için. */
function istemciIp(istek: NextRequest): string {
  const forwarded = istek.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return istek.headers.get("x-real-ip") ?? "85.34.78.112";
}
