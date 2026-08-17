import { epostaGonder, epostaYapilandirildiMi } from "./eposta";

/**
 * YÖNETİCİ BİLDİRİMLERİ — "sitede ne oldu" postaları.
 *
 * Yöneticinin paneli açmadan haberdar olması gereken olaylar buradan
 * gidiyor: yeni hesap, e-posta doğrulama, yeni sipariş, yeni destek talebi.
 *
 * ANLIK, ÖZET DEĞİL: kullanıcının tercihi. Günlük özet daha az posta üretirdi
 * ama "kim şu an katıldı" sorusunu ertesi güne bırakırdı.
 *
 * ADRES `ADMIN_EMAILS`TEN: yönetici hesabı zaten o listeyle tanımlanıyor
 * (bkz. lib/oturum → adminEpostalari). Ayrı bir ortam değişkeni eklenseydi
 * yönetici değiştiğinde iki yerin birden güncellenmesi gerekir, biri
 * unutulurdu.
 *
 * HİÇBİR AKIŞI KESMİYOR: gönderim başarısız olsa bile çağıran işlem devam
 * ediyor. Kayıt olan kişi, posta kutumuz doluyken hesabını açamamazlık
 * etmemeli. Bu yüzden bütün çağrılar `void` ve hata yutuluyor — yalnızca
 * sunucu günlüğüne düşüyor.
 */

export type BildirimSatiri = { etiket: string; deger: string };

/** `lib/oturum` ile aynı varsayılan — kullanıcının kendi adresi. */
const VARSAYILAN_ADMINLER = ["ertugrultoraman@hotmail.com"];

/**
 * Bildirim adresleri — `ADMIN_EMAILS`, yönetici girişindeki listenin aynısı.
 *
 * `lib/oturum → adminEpostalari` ÇAĞRILMIYOR, bilerek: o dosya `next/headers`
 * içeri alıyor (çerez/oturum işi) ve buradan çağrılsaydı `lib/hesaplar` →
 * bildirim → oturum → hesaplar diye bir halka kurulur, üstelik istek bağlamı
 * dışında (betikler, arka plan işleri) `next/headers` patlardı. Kopyalanan
 * şey bir ortam değişkenini virgülden ayırmak; kural değil.
 */
function bildirimAlicilari(): string[] {
  const ham = process.env.ADMIN_EMAILS;
  const liste = ham
    ? ham.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : VARSAYILAN_ADMINLER;
  return liste.length > 0 ? liste : VARSAYILAN_ADMINLER;
}

/** Postanın gövdesi — tek yerden, marka görünümüyle. */
function govde(baslik: string, satirlar: BildirimSatiri[], not?: string) {
  const metin = [
    "Ne Yersin? — yönetici bildirimi",
    "",
    baslik,
    "",
    ...satirlar.map((s) => `${s.etiket}: ${s.deger}`),
    ...(not ? ["", not] : []),
    "",
    "—",
    "Bu posta neyersin.net üzerindeki bir olay üzerine otomatik gönderildi.",
  ].join("\n");

  const satirHtml = satirlar
    .map(
      (s) => `
        <tr>
          <td style="padding:6px 0;color:#8a7355;font-size:13px;white-space:nowrap">${s.etiket}</td>
          <td style="padding:6px 0 6px 16px;color:#241608;font-size:14px;font-weight:700">${s.deger}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="margin:0;padding:24px 12px;background:#FFF6D9">
      <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;
                  margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;
                  border:1px solid #e8e4de">
        <div style="background:#FFC531;padding:14px 24px">
          <span style="font-size:18px;font-weight:800;letter-spacing:-0.5px;color:#141210">
            Ne Yersin? · yönetici
          </span>
        </div>
        <div style="padding:24px">
          <h1 style="color:#241608;margin:0 0 16px;font-size:18px;font-weight:800">${baslik}</h1>
          <table style="width:100%;border-collapse:collapse">${satirHtml}</table>
          ${
            not
              ? `<p style="color:#5a4630;font-size:13px;line-height:1.6;margin:18px 0 0;
                          padding:12px 14px;background:#FFF8E1;border-radius:12px">${not}</p>`
              : ""
          }
        </div>
        <div style="padding:14px 24px;border-top:1px solid #efece7;background:#fbfaf8">
          <p style="color:#8a7355;font-size:12px;margin:0">
            Bu posta neyersin.net üzerindeki bir olay üzerine otomatik gönderildi.
          </p>
        </div>
      </div>
    </div>`;

  return { metin, html };
}

/**
 * Yöneticilere bildirim gönderir.
 *
 * `void` ile çağrılmak üzere yazıldı: hiçbir kullanıcı akışı bu postanın
 * gönderilmesini BEKLEMEMELİ. Kayıt eylemi postayı beklerse, SMTP yavaş
 * olduğunda kullanıcı ekranda boşuna bekler.
 */
export async function yoneticiyeBildir(
  baslik: string,
  satirlar: BildirimSatiri[],
  not?: string,
): Promise<void> {
  if (!epostaYapilandirildiMi()) return;

  const aliciListesi = bildirimAlicilari();
  if (aliciListesi.length === 0) return;

  const { metin, html } = govde(baslik, satirlar, not);

  await Promise.all(
    aliciListesi.map(async (alici) => {
      try {
        await epostaGonder({ alici, konu: `${baslik} — Ne Yersin?`, metin, html });
      } catch (hata) {
        console.error(
          "[bildirim] gönderilemedi:",
          hata instanceof Error ? hata.message : hata,
        );
      }
    }),
  );
}

/**
 * Yeni destek talebi bildirimi — beş ayrı yerden açılabiliyor.
 *
 * TEK YERDE TOPLANDI: talep site formundan, iletişim sayfasından, altın şef
 * başvurusundan, mutfağın adres bildiriminden ve kurye uygulamasından
 * açılabiliyor. Her birinde ayrı posta metni yazılsaydı biri eklenirken
 * bildirim unutulur, o kanaldan gelen talepler sessizce beklerdi.
 */
export function destekTalebiBildir(talep: {
  no: string;
  konu: string;
  mesaj: string;
  ad: string;
  eposta: string;
  telefon?: string;
  siparisNo?: string;
}): void {
  void yoneticiyeBildir(
    "Yeni destek talebi",
    [
      { etiket: "Talep", deger: talep.no },
      { etiket: "Konu", deger: talep.konu },
      { etiket: "Kişi", deger: talep.ad },
      { etiket: "E-posta", deger: talep.eposta },
      ...(talep.telefon ? [{ etiket: "Telefon", deger: talep.telefon }] : []),
      ...(talep.siparisNo ? [{ etiket: "Sipariş", deger: talep.siparisNo }] : []),
      { etiket: "Saat", deger: saatYaz() },
    ],
    talep.mesaj,
  );
}

/** Tarih/saat — postada okunacak biçimde. */
export function saatYaz(tarih: string | Date = new Date()): string {
  return new Date(tarih).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
