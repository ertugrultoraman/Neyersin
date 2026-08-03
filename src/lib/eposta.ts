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

/**
 * RFC 2606 / RFC 6761 ile AYRILMIŞ alan adları: bunlar internette asla
 * var olamaz, dolayısıyla gerçek bir müşterinin adresi olamaz.
 *
 * Bu adreslere posta göndermeye çalışmak iki zarar veriyordu:
 *  - Teslim edilemeyen her posta geri dönüş (bounce) üretir; bounce oranı
 *    yükselince gönderen itibarı düşer ve GERÇEK müşteri postaları spam'e
 *    düşmeye başlar.
 *  - Gmail bu adresleri gönderim anında kabul ettiği için sistem "gitti"
 *    sanıyor, kodu düz metin saklamıyordu; test takımları kodu okuyamaz
 *    hâle gelmişti.
 *
 * Bu yüzden bu adreslere hiç bağlanmıyoruz: gönderim başarısız sayılır,
 * kod yönetici panelinde görünür.
 */
export function ayrilmisTestAdresiMi(adres: string): boolean {
  const alan = adres.trim().toLowerCase().split("@")[1] ?? "";
  return (
    /\.(test|example|invalid|localhost)$/.test(alan) ||
    /^(.*\.)?example\.(com|net|org)$/.test(alan)
  );
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
  if (ayrilmisTestAdresiMi(girdi.alici)) {
    return { gonderildi: false, hata: "Ayrılmış test alan adı; posta gönderilmedi." };
  }
  try {
    await tasiyiciAl().sendMail({
      from: `"Ne Yersin?" <${gonderenAdresi()}>`,
      to: girdi.alici,
      /*
       * Yanıt adresi açıkça veriliyor: cevaplanabilir bir adresten gelen posta
       * spam süzgeçlerinde daha iyi puan alıyor, üstelik kullanıcı gerçekten
       * yanıtlayabiliyor.
       */
      replyTo: gonderenAdresi(),
      subject: girdi.konu,
      text: girdi.metin,
      html: girdi.html,
      headers: {
        /*
         * RFC 3834: bu posta bir işlem sonucu otomatik üretildi, pazarlama
         * postası değil. Süzgeçlere ve otomatik yanıt sistemlerine doğru
         * sınıfı bildiriyor — otomatik "ofiste değilim" yanıtları da dönmez.
         */
        "Auto-Submitted": "auto-generated",
        /* Toplu/pazarlama postası olmadığını belirtir. */
        Precedence: "transactional",
      },
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

  /*
   * Konu satırında kod YOK. Kodu konuya yazmak, postanın önizlemede
   * okunmasına ve "kod/şifre" kalıbıyla gereksiz kutusuna atanmasına yol
   * açıyordu.
   */
  return {
    konu: `${baslik} — Ne Yersin?`,
    metin: [
      `Ne Yersin?`,
      "",
      baslik,
      aciklama,
      "",
      `Kodun: ${kod}`,
      "",
      "Kod 15 dakika geçerlidir.",
      "Bu isteği sen yapmadıysan bu postayı yok sayabilirsin; hesabında bir değişiklik olmaz.",
      "",
      "Bu millet için yola çıkmış, istihdama katkı sağlamaya çalışan bir girişimiz. Yorumlarınızı bekliyoruz. ♥",
      "",
      "—",
      "Ne Yersin? · Beylikdüzü / İstanbul",
      "Bu posta, neyersin.net üzerinde yapılan bir işlem üzerine gönderildi.",
      "merhaba@neyersin.net",
    ].join("\n"),
    /*
     * Logo GÖRSEL DEĞİL, yazıyla çiziliyor. Posta istemcileri uzak görselleri
     * varsayılan olarak engelliyor; görselli bir başlık çoğu kişide boş kutu
     * olarak görünür, üstelik görsel ağırlıklı postalar spam puanını yükseltir.
     * Kelime markası her istemcide, engelleme açıkken bile görünür.
     */
    html: `
      <div style="margin:0;padding:24px 12px;background:#FFF6D9">
        <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:480px;
                    margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;
                    border:1px solid #e8e4de">

          <div style="background:#FFC531;padding:18px 24px;text-align:center">
            <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#141210">
              Ne Yersin?
            </span>
          </div>

          <div style="padding:28px 24px">
            <h1 style="color:#241608;margin:0 0 8px;font-size:20px;font-weight:800">${baslik}</h1>
            <p style="color:#5a4630;line-height:1.6;margin:0 0 20px;font-size:15px">${aciklama}</p>
            <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#241608;
                      background:#FFF4CC;padding:16px 20px;border-radius:16px;text-align:center;margin:0">
              ${kod}
            </p>
            <p style="color:#8a7355;font-size:13px;line-height:1.6;margin:20px 0 0">
              Kod 15 dakika geçerlidir. Bu isteği sen yapmadıysan bu postayı yok sayabilirsin;
              hesabında bir değişiklik olmaz.
            </p>
            <p style="color:#5a4630;font-size:13px;line-height:1.6;margin:16px 0 0;padding:12px 14px;
                      background:#FFF8E1;border-radius:12px">
              Bu millet için yola çıkmış, istihdama katkı sağlamaya çalışan bir girişimiz.
              Yorumlarınızı bekliyoruz.
              <span style="color:#E8607F">&#10084;</span>
            </p>
          </div>

          <div style="padding:16px 24px;border-top:1px solid #efece7;background:#fbfaf8">
            <p style="color:#8a7355;font-size:12px;line-height:1.6;margin:0">
              <strong style="color:#5a4630">Ne Yersin?</strong> · Beylikdüzü / İstanbul<br>
              Bu posta, neyersin.net üzerinde yapılan bir işlem üzerine gönderildi.<br>
              <a href="mailto:merhaba@neyersin.net" style="color:#8a7355">merhaba@neyersin.net</a>
            </p>
          </div>
        </div>
      </div>
    `,
  };
}
