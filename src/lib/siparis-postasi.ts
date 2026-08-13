import { epostaGonder } from "./eposta";
import type { Siparis } from "./siparis";

/**
 * SİPARİŞ ÖZETİ POSTASI.
 *
 * HERKESE AYNI POSTA GİDİYOR — yönetici, şef, müşteri ayrımı yok. Kendi
 * sitesinden sipariş veren biri de siparişinin kaydını almalı: postanın işi
 * "bu sipariş gerçekten oluştu" demek ve elde tutulabilir bir kayıt bırakmak.
 * Rol ayrımı yapmak, en çok test eden kişiyi akışın dışında bırakırdı.
 *
 * NE ZAMAN GÖNDERİLİYOR:
 *  - Kapıda ödeme: sipariş oluştuğu an (sipariş kesin).
 *  - Kartla ödeme: ödeme ONAYLANDIKTAN sonra (bkz. iyzico callback). Ödeme
 *    öncesi gönderilseydi, yarıda bırakılan her ödeme için "siparişin alındı"
 *    postası gitmiş olurdu.
 *
 * GÖNDERİM SİPARİŞİ BLOKLAMIYOR: posta sunucusu yavaşsa ya da kapalıysa
 * sipariş yine kaydediliyor. Postanın gitmemesi bir aksaklık, siparişin
 * düşmemesi felaket.
 *
 * Logo GÖRSEL DEĞİL, yazıyla çiziliyor — aynı gerekçe: lib/eposta.ts → kodPostasi.
 */

const para = (kurus: number) =>
  `${kurus.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

/** HTML'e giren her kullanıcı verisi buradan geçiyor — posta da bir HTML belgesi. */
function kacisla(metin: string): string {
  return metin
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function satirToplami(kalem: Siparis["kalemler"][number]): number {
  const ekstra = (kalem.ekstralar ?? []).reduce((t, e) => t + e.fiyat, 0);
  return (kalem.fiyat + ekstra) * kalem.adet;
}

function adresYaz(adres: Siparis["adres"]): string {
  const kapi = [adres.binaNo && `No ${adres.binaNo}`, adres.daireNo && `D. ${adres.daireNo}`]
    .filter(Boolean)
    .join(" ");
  return [adres.mahalle, adres.acikAdres, kapi, adres.ilce].filter(Boolean).join(", ");
}

const ODEME_ADI: Record<string, string> = {
  havale: "Kapıda ödeme",
  iyzico: "Kartla ödendi",
};

export function siparisOzetiPostasi(siparis: Siparis) {
  const { tutarlar } = siparis;
  const odeme = ODEME_ADI[siparis.odemeYontemi] ?? siparis.odemeYontemi;

  const duzMetin = [
    "Ne Yersin?",
    "",
    `Siparişin alındı — ${siparis.siparisNo}`,
    `${siparis.restoranAdi} mutfağından`,
    "",
    ...siparis.kalemler.map((k) => {
      const ekstralar = (k.ekstralar ?? []).map((e) => e.ad).join(", ");
      return `${k.adet} x ${k.ad}${ekstralar ? ` (${ekstralar})` : ""} — ${para(satirToplami(k))}`;
    }),
    "",
    `Ara toplam: ${para(tutarlar.araToplam)}`,
    `Teslimat: ${tutarlar.teslimatUcreti === 0 ? "Ücretsiz" : para(tutarlar.teslimatUcreti)}`,
    ...(tutarlar.indirim > 0
      ? [`İndirim${tutarlar.kuponKodu ? ` (${tutarlar.kuponKodu})` : ""}: -${para(tutarlar.indirim)}`]
      : []),
    `Toplam: ${para(tutarlar.toplam)}`,
    `Ödeme: ${odeme}`,
    "",
    `Teslimat adresi: ${adresYaz(siparis.adres)}`,
    ...(siparis.not ? [`Not: ${siparis.not}`] : []),
    "",
    "Siparişini neyersin.net üzerinden takip edebilirsin.",
    "",
    "—",
    "Ne Yersin? · Beylikdüzü / İstanbul",
    "merhaba@neyersin.net",
  ].join("\n");

  const kalemSatirlari = siparis.kalemler
    .map((k) => {
      const ekstralar = (k.ekstralar ?? []).map((e) => e.ad).join(", ");
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f2eee8;color:#241608;font-size:14px">
            <strong style="font-weight:700">${k.adet} ×</strong> ${kacisla(k.ad)}
            ${
              ekstralar
                ? `<br><span style="color:#8a7355;font-size:12px">+ ${kacisla(ekstralar)}</span>`
                : ""
            }
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f2eee8;color:#241608;font-size:14px;
                     text-align:right;white-space:nowrap">${para(satirToplami(k))}</td>
        </tr>`;
    })
    .join("");

  const ozetSatiri = (etiket: string, deger: string, kalin = false) => `
    <tr>
      <td style="padding:4px 0;color:${kalin ? "#241608" : "#5a4630"};font-size:${kalin ? "16px" : "14px"};
                 font-weight:${kalin ? "800" : "400"}">${etiket}</td>
      <td style="padding:4px 0;color:${kalin ? "#241608" : "#5a4630"};font-size:${kalin ? "16px" : "14px"};
                 font-weight:${kalin ? "800" : "600"};text-align:right;white-space:nowrap">${deger}</td>
    </tr>`;

  const html = `
    <div style="margin:0;padding:24px 12px;background:#FFF6D9">
      <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;
                  margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;
                  border:1px solid #e8e4de">

        <div style="background:#FFC531;padding:18px 24px;text-align:center">
          <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#141210">
            Ne Yersin?
          </span>
        </div>

        <div style="padding:28px 24px">
          <h1 style="color:#241608;margin:0 0 4px;font-size:20px;font-weight:800">
            Siparişin alındı
          </h1>
          <p style="color:#5a4630;line-height:1.6;margin:0 0 4px;font-size:15px">
            <strong style="color:#241608">${kacisla(siparis.restoranAdi)}</strong> mutfağı siparişini hazırlamaya başlıyor.
          </p>
          <p style="color:#8a7355;font-size:13px;margin:0 0 20px">
            Sipariş no: <strong style="color:#5a4630">${kacisla(siparis.siparisNo)}</strong>
          </p>

          <table style="width:100%;border-collapse:collapse;margin:0 0 16px">${kalemSatirlari}</table>

          <table style="width:100%;border-collapse:collapse">
            ${ozetSatiri("Ara toplam", para(tutarlar.araToplam))}
            ${ozetSatiri(
              "Teslimat",
              tutarlar.teslimatUcreti === 0 ? "Ücretsiz" : para(tutarlar.teslimatUcreti),
            )}
            ${
              tutarlar.indirim > 0
                ? ozetSatiri(
                    `İndirim${tutarlar.kuponKodu ? ` (${kacisla(tutarlar.kuponKodu)})` : ""}`,
                    `-${para(tutarlar.indirim)}`,
                  )
                : ""
            }
            ${ozetSatiri("Toplam", para(tutarlar.toplam), true)}
          </table>

          <div style="margin:20px 0 0;padding:14px 16px;background:#FFF8E1;border-radius:14px">
            <p style="margin:0 0 6px;color:#8a7355;font-size:12px;font-weight:700;
                      letter-spacing:0.5px;text-transform:uppercase">Teslimat</p>
            <p style="margin:0;color:#5a4630;font-size:14px;line-height:1.6">
              ${kacisla(adresYaz(siparis.adres))}<br>
              <span style="color:#8a7355;font-size:13px">${kacisla(odeme)}</span>
            </p>
            ${
              siparis.not
                ? `<p style="margin:8px 0 0;color:#8a7355;font-size:13px;line-height:1.6">
                     Not: ${kacisla(siparis.not)}
                   </p>`
                : ""
            }
          </div>
        </div>

        <div style="padding:16px 24px;border-top:1px solid #efece7;background:#fbfaf8">
          <p style="color:#8a7355;font-size:12px;line-height:1.6;margin:0">
            <strong style="color:#5a4630">Ne Yersin?</strong> · Beylikdüzü / İstanbul<br>
            Bu posta, neyersin.net üzerinde verdiğin sipariş üzerine gönderildi.<br>
            <a href="mailto:merhaba@neyersin.net" style="color:#8a7355">merhaba@neyersin.net</a>
          </p>
        </div>
      </div>
    </div>
  `;

  return {
    /* Sipariş no KONUDA: kişi posta kutusunda arayarak bulabilsin. */
    konu: `Siparişin alındı — ${siparis.siparisNo} · Ne Yersin?`,
    metin: duzMetin,
    html,
  };
}

/**
 * Özeti gönderir. Hata FIRLATMIYOR — çağıran akış siparişi kaydetmiş durumda
 * ve postanın gitmemesi siparişi geri almayı gerektirmiyor.
 */
export async function siparisOzetiGonder(siparis: Siparis): Promise<void> {
  const alici = (siparis.musteri.eposta ?? "").trim();
  if (!alici) return;

  try {
    const posta = siparisOzetiPostasi(siparis);
    const sonuc = await epostaGonder({ alici, ...posta });
    if (!sonuc.gonderildi) {
      console.error(`[siparis-postasi] ${siparis.siparisNo} gonderilemedi: ${sonuc.hata}`);
    }
  } catch (hata) {
    console.error("[siparis-postasi] beklenmeyen hata:", hata);
  }
}
