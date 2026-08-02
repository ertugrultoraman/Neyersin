import nodemailer from "nodemailer";

/**
 * E-posta gönderimi — doğrulama kodları ve parola sıfırlama için.
 *
 * Google Workspace (neyersin.net) SMTP'si üzerinden gönderir. Ayarlar ortam
 * değişkenlerinden okunur; hiçbiri koda yazılmaz:
 *
 *   SMTP_HOST     varsayılan smtp.gmail.com
 *   SMTP_PORT     varsayılan 465 (SSL)
 *   SMTP_KULLANICI    ör. merhaba@neyersin.net
 *   SMTP_PAROLA       Google "uygulama şifresi" (normal hesap parolası DEĞİL)
 *   SMTP_GONDEREN     görünen gönderen; verilmezse SMTP_KULLANICI
 *
 * Yapılandırma yoksa gönderim sessizce başarısız olur ve çağıran taraf kodu
 * yönetici paneline düşürür — böylece posta hazır olmadan da akış test
 * edilebiliyor, ama kod ASLA kullanıcının tarayıcısına yazılmıyor.
 */

export type GonderimSonucu = { gonderildi: boolean; hata?: string };

export function epostaYapilandirildiMi(): boolean {
  return Boolean(process.env.SMTP_KULLANICI && process.env.SMTP_PAROLA);
}

export function gonderenAdresi(): string {
  return process.env.SMTP_GONDEREN ?? process.env.SMTP_KULLANICI ?? "merhaba@neyersin.net";
}

let tasiyici: nodemailer.Transporter | null = null;

function tasiyiciAl(): nodemailer.Transporter {
  if (!tasiyici) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    tasiyici = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_KULLANICI ?? "",
        pass: process.env.SMTP_PAROLA ?? "",
      },
    });
  }
  return tasiyici;
}

export async function epostaGonder(girdi: {
  alici: string;
  konu: string;
  metin: string;
  html?: string;
}): Promise<GonderimSonucu> {
  if (!epostaYapilandirildiMi()) {
    return { gonderildi: false, hata: "E-posta gönderimi henüz yapılandırılmadı." };
  }
  try {
    await tasiyiciAl().sendMail({
      from: `"Ne Yersin?" <${gonderenAdresi()}>`,
      to: girdi.alici,
      subject: girdi.konu,
      text: girdi.metin,
      html: girdi.html,
    });
    return { gonderildi: true };
  } catch (hata) {
    return { gonderildi: false, hata: hata instanceof Error ? hata.message : "Gönderilemedi." };
  }
}

/** Doğrulama kodu postasının gövdesi — tek yerden. */
export function kodPostasi(kod: string, amac: "kayit" | "sifre" | "eposta") {
  const basliklar = {
    kayit: "E-posta doğrulama kodun",
    sifre: "Parola sıfırlama kodun",
    eposta: "Yeni e-posta adresin için doğrulama kodu",
  } as const;
  const aciklamalar = {
    kayit: "Ne Yersin? hesabını açmak için aşağıdaki kodu ekrana yaz.",
    sifre: "Parolanı sıfırlamak için aşağıdaki kodu ekrana yaz.",
    eposta:
      "Hesabının e-posta adresini bu adrese taşımak için aşağıdaki kodu ekrana yaz. " +
      "Kodu girmeden adresin değişmez.",
  } as const;

  const baslik = basliklar[amac];
  const aciklama = aciklamalar[amac];

  return {
    konu: `${baslik}: ${kod}`,
    metin: [
      `${aciklama}`,
      "",
      `Kodun: ${kod}`,
      "",
      "Kod 15 dakika geçerlidir.",
      "Bu isteği sen yapmadıysan bu postayı yok sayabilirsin; hesabında bir değişiklik olmaz.",
      "",
      "Ne Yersin?",
    ].join("\n"),
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px">
        <h2 style="color:#241608;margin:0 0 8px">${baslik}</h2>
        <p style="color:#5a4630;line-height:1.6;margin:0 0 20px">${aciklama}</p>
        <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#241608;
                  background:#FFF4CC;padding:16px 20px;border-radius:16px;text-align:center;margin:0">
          ${kod}
        </p>
        <p style="color:#8a7355;font-size:13px;line-height:1.6;margin:20px 0 0">
          Kod 15 dakika geçerlidir. Bu isteği sen yapmadıysan bu postayı yok sayabilirsin;
          hesabında bir değişiklik olmaz.
        </p>
      </div>
    `,
  };
}
