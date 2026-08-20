import type {
  BasvuruGirdisi,
  BasvuruTuruDto,
  DogrulamaGirdisi,
  KayitGirdisi,
  KayitSonucu,
  KodTekrarGirdisi,
  OturumCevabi,
  ParolaSifirlamaGirdisi,
} from "../tipler";
import type { ApiIstemcisi } from "./istemci";

const TABAN = "/api/mobil/v1/hesap";

/**
 * HESAP UÇLARI — kayıt, e-posta doğrulama, parola sıfırlama.
 *
 * Hepsi `jetonsuz: true` ile çağrılıyor. Bu uçlar tanımı gereği oturumu OLMAYAN
 * kişiye ait; istemci elindeki (muhtemelen süresi geçmiş) jetonu eklerse sunucu
 * 401 döner, istemci tazelemeye kalkar ve kayıt akışı ortasında oturum
 * "düştü" sayılırdı.
 */
export function hesap(api: ApiIstemcisi) {
  return {
    kayit: (girdi: KayitGirdisi) =>
      api.post<KayitSonucu>(`${TABAN}/kayit`, girdi, { jetonsuz: true }),

    /** Kod doğruysa oturum da açılıyor — ayrıca giriş yapmak gerekmiyor. */
    dogrula: (girdi: DogrulamaGirdisi) =>
      api.post<OturumCevabi>(`${TABAN}/dogrula`, girdi, { jetonsuz: true }),

    kodIste: (girdi: KodTekrarGirdisi) =>
      api.post<{ postaGitmedi: boolean }>(`${TABAN}/kod`, girdi, { jetonsuz: true }),

    parolaSifirla: (girdi: ParolaSifirlamaGirdisi) =>
      api.post<{ eposta: string }>(`${TABAN}/parola-sifirla`, girdi, { jetonsuz: true }),

    /**
     * Başvuru türleri — etiket ve açıklama SUNUCUDAN.
     *
     * Uygulamaya kopyalanmıyor: web'e yeni bir tür eklendiğinde burada da
     * kendiliğinden görünsün. Kopya bir liste sessizce eskir ve bunu ancak
     * iki formu yan yana koyan biri fark ederdi.
     */
    basvuruTurleri: () => api.get<BasvuruTuruDto[]>(`${TABAN}/basvuru`, { jetonsuz: true }),

    /** Şef / ev hanımı / kurye / işletme başvurusu. */
    basvuru: (girdi: BasvuruGirdisi) =>
      api.post<{ basari: string }>(`${TABAN}/basvuru`, girdi, { jetonsuz: true }),

    /* ----------------------------------------------------------------------
     * Oturum GEREKTİREN hesap ayarları — jetonsuz DEĞİL.
     *
     * Yukarıdakiler oturumu olmayan kişiye ait; buradakiler kişinin kendi
     * hesabına dokunuyor ve jeton zorunlu.
     * ------------------------------------------------------------------- */

    /**
     * Parola değiştirme (ya da Google ile gelen hesapta ilk kez belirleme).
     *
     * `mevcutParola` parolasız hesapta GÖNDERİLMİYOR; sunucu hesapta parola
     * olup olmadığını kendisi okuyor, istemcinin sözüne bakmıyor.
     */
    parolaDegistir: (girdi: {
      mevcutParola?: string;
      yeniParola: string;
      yeniParolaTekrar: string;
    }) => api.post<{ basari: string }>(`${TABAN}/parola-degistir`, girdi),

    /** E-posta değişimi — 1. adım: parola doğrulanır, YENİ adrese kod gider. */
    epostaDegistir: (girdi: { parola: string; yeniEposta: string }) =>
      api.post<{ eposta: string; postaGitmedi: boolean }>(`${TABAN}/eposta-degistir`, girdi),

    /**
     * E-posta değişimi — 2. adım: kod doğrulanır, adres değişir.
     *
     * YENİ JETON ÇİFTİ dönüyor: eldeki jeton eski adrese yazılmıştı ve bir
     * sonraki istekte artık var olmayan bir hesabı gösterirdi.
     */
    epostaOnayla: (girdi: { eposta: string; kod: string }) =>
      api.post<OturumCevabi & { tasinanSiparis: number }>(`${TABAN}/eposta-onayla`, girdi),

    /**
     * Profil fotoğrafı — hesabın yüzü.
     *
     * HEDEF HESAP HER ZAMAN OTURUMUNKİ; adres gönderilmiyor. Fotoğraf CDN'e
     * (Vercel Blob) gidiyor, veritabanında yalnızca adresi duruyor.
     */
    fotografYukle: (dosya: { uri: string; ad: string; tur: string }) => {
      const form = new FormData();
      form.append("fotograf", {
        uri: dosya.uri,
        name: dosya.ad,
        type: dosya.tur,
      } as unknown as Blob);
      return api.post<{ fotografUrl: string }>(`${TABAN}/fotograf`, form);
    },

    /** Fotoğrafı kaldırır — hesap yine adın baş harfleriyle görünür. */
    fotografSil: () =>
      api.istek<{ fotografUrl: null }>(`${TABAN}/fotograf`, { yontem: "DELETE" }),
  };
}
