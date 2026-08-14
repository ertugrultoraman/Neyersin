import nodemailer from "nodemailer";
import { VARSAYILAN_DIL, type Dil } from "./dil";

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

/**
 * Posta metinleri — iki dilde.
 *
 * Posta, kullanıcının sitede seçtiği dilde gidiyor: turist İngilizce siteden
 * kayıt olup Türkçe bir posta almasın.
 */
const METINLER = {
  tr: {
    basliklar: {
      kayit: "E-posta doğrulama kodun",
      sifre: "Parola sıfırlama kodun",
      eposta: "Yeni e-posta adresin için doğrulama kodu",
    },
    aciklamalar: {
      kayit: "Ne Yersin? hesabını açmak için aşağıdaki kodu ekrana yaz.",
      sifre: "Parolanı sıfırlamak için aşağıdaki kodu ekrana yaz.",
      eposta:
        "Hesabının e-posta adresini bu adrese taşımak için aşağıdaki kodu ekrana yaz. " +
        "Kodu girmeden adresin değişmez.",
    },
    kodun: "Kodun:",
    gecerlilik: "Kod 15 dakika geçerlidir.",
    senYapmadiysan:
      "Bu isteği sen yapmadıysan bu postayı yok sayabilirsin; hesabında bir değişiklik olmaz.",
    gecerlilikTek:
      "Kod 15 dakika geçerlidir. Bu isteği sen yapmadıysan bu postayı yok sayabilirsin; hesabında bir değişiklik olmaz.",
    /*
     * Bu ibare kullanıcının açık isteğiyle duruyor ve METNİ AYNEN korunuyor.
     * Değiştirilmesi gerekirse önce kullanıcıya sorulur.
     */
    girisim:
      "Bu millet için yola çıkmış, istihdama katkı sağlamaya çalışan bir girişimiz. Yorumlarınızı bekliyoruz.",
    altBilgi: "Bu posta, neyersin.net üzerinde yapılan bir işlem üzerine gönderildi.",
    hosGeldin: {
      konu: "Aramıza hoş geldin",
      baslik: "Hoş geldin",
      aciklama:
        "Hesabın hazır. Beylikdüzü'ndeki ev mutfaklarını, şef tabaklarını ve restoranları " +
        "tek yerden sipariş edebilirsin.",
      parolaNotu:
        "Parolanı belirledin: artık hesabına hem Google ile hem e-posta ve parolanla " +
        "girebilirsin. Google hesabına erişimini kaybetsen bile kapıda kalmazsın.",
      baglantiMetni: "Mutfaklara göz at",
    },
  },
  en: {
    basliklar: {
      kayit: "Your email verification code",
      sifre: "Your password reset code",
      eposta: "Verification code for your new email address",
    },
    aciklamalar: {
      kayit: "Type the code below on screen to open your Ne Yersin? account.",
      sifre: "Type the code below on screen to reset your password.",
      eposta:
        "Type the code below on screen to move your account's email to this address. " +
        "Your address will not change until you enter the code.",
    },
    kodun: "Your code:",
    gecerlilik: "The code is valid for 15 minutes.",
    senYapmadiysan:
      "If you did not request this, you can ignore this email; nothing on your account changes.",
    gecerlilikTek:
      "The code is valid for 15 minutes. If you did not request this, you can ignore this email; nothing on your account changes.",
    girisim:
      "We are a young venture set up for this country, trying to create jobs. We'd love to hear what you think.",
    altBilgi: "This email was sent because of an action taken on neyersin.net.",
    hosGeldin: {
      konu: "Welcome aboard",
      baslik: "Welcome",
      aciklama:
        "Your account is ready. Order from home kitchens, chef plates and restaurants " +
        "in Beylikdüzü — all in one place.",
      parolaNotu:
        "You've set your password: you can now sign in either with Google or with your " +
        "email and password. Even if you lose access to your Google account, you're not locked out.",
      baglantiMetni: "Browse kitchens",
    },
  },
} as const;

/**
 * HOŞ GELDİN POSTASI — Google ile açılan hesap parolasını belirleyince.
 *
 * NEDEN KAYIT ANINDA DEĞİL: Google ile gelen kişi tek dokunuşla içeri
 * giriyor, hesabının açıldığını fark bile etmiyor ve parolası olmadığı için
 * Google'a erişimini kaybederse hesabına bir daha giremiyor. Karşılama
 * postası, kişi parolasını belirledikten sonra gidiyor — o an hesap
 * gerçekten "kendi ayakları üzerinde" duruyor ve posta, söylenecek şeyi
 * (artık iki yoldan da girebilirsin) doğru anda söylüyor.
 *
 * KOD YOK, BAĞLANTI VAR: bu bir doğrulama postası değil; kişi zaten oturum
 * açmış durumda. Tek işi hoş geldin demek ve yolu göstermek.
 */
export function hosGeldinPostasi(ad: string, dil: Dil = VARSAYILAN_DIL) {
  const m = METINLER[dil] ?? METINLER[VARSAYILAN_DIL];
  const h = m.hosGeldin;
  const isim = ad.trim().split(/\s+/)[0] || "";
  const baslik = isim ? `${h.baslik}, ${isim}!` : `${h.baslik}!`;

  return {
    konu: `${h.konu} — Ne Yersin?`,
    metin: [
      "Ne Yersin?",
      "",
      baslik,
      h.aciklama,
      "",
      h.parolaNotu,
      "",
      `${h.baglantiMetni}: https://neyersin.net/restoranlar`,
      "",
      `${m.girisim} ♥`,
      "",
      "—",
      "Ne Yersin? · Beylikdüzü / İstanbul",
      m.altBilgi,
      "merhaba@neyersin.net",
    ].join("\n"),
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
            <p style="color:#5a4630;line-height:1.6;margin:0 0 16px;font-size:15px">${h.aciklama}</p>
            <p style="color:#5a4630;font-size:14px;line-height:1.6;margin:0 0 22px;padding:12px 14px;
                      background:#FFF8E1;border-radius:12px">${h.parolaNotu}</p>

            <a href="https://neyersin.net/restoranlar"
               style="display:inline-block;background:#241608;color:#FFD873;text-decoration:none;
                      font-weight:800;font-size:15px;padding:13px 22px;border-radius:14px">
              ${h.baglantiMetni}
            </a>

            <p style="color:#5a4630;font-size:13px;line-height:1.6;margin:22px 0 0;padding:12px 14px;
                      background:#FFF8E1;border-radius:12px">
              ${m.girisim}
              <span style="color:#E8607F">&#10084;</span>
            </p>
          </div>

          <div style="padding:16px 24px;border-top:1px solid #efece7;background:#fbfaf8">
            <p style="color:#8a7355;font-size:12px;line-height:1.6;margin:0">
              <strong style="color:#5a4630">Ne Yersin?</strong> · Beylikdüzü / İstanbul<br>
              ${m.altBilgi}<br>
              <a href="mailto:merhaba@neyersin.net" style="color:#8a7355">merhaba@neyersin.net</a>
            </p>
          </div>
        </div>
      </div>
    `,
  };
}

/** Doğrulama kodu postasının gövdesi — tek yerden. */
export function kodPostasi(
  kod: string,
  amac: "kayit" | "sifre" | "eposta",
  dil: Dil = VARSAYILAN_DIL,
) {
  const m = METINLER[dil] ?? METINLER[VARSAYILAN_DIL];
  const baslik = m.basliklar[amac];
  const aciklama = m.aciklamalar[amac];

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
      `${m.kodun} ${kod}`,
      "",
      m.gecerlilik,
      m.senYapmadiysan,
      "",
      `${m.girisim} ♥`,
      "",
      "—",
      "Ne Yersin? · Beylikdüzü / İstanbul",
      m.altBilgi,
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
              ${m.gecerlilikTek}
            </p>
            <p style="color:#5a4630;font-size:13px;line-height:1.6;margin:16px 0 0;padding:12px 14px;
                      background:#FFF8E1;border-radius:12px">
              ${m.girisim}
              <span style="color:#E8607F">&#10084;</span>
            </p>
          </div>

          <div style="padding:16px 24px;border-top:1px solid #efece7;background:#fbfaf8">
            <p style="color:#8a7355;font-size:12px;line-height:1.6;margin:0">
              <strong style="color:#5a4630">Ne Yersin?</strong> · Beylikdüzü / İstanbul<br>
              ${m.altBilgi}<br>
              <a href="mailto:merhaba@neyersin.net" style="color:#8a7355">merhaba@neyersin.net</a>
            </p>
          </div>
        </div>
      </div>
    `,
  };
}
