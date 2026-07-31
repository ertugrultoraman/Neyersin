import { kuponBul } from "@/content/kampanyalar";
import { depoAl } from "./depo";

/**
 * Kuponun kişiye bağlı kurallarını denetler.
 *
 * `kuponUygula` (content/kampanyalar.ts) yalnızca sepetten okunabilen kuralları
 * bilir: tutar, gün, indirim hesabı. Kişiye bağlı kurallar — "ilk siparişe özel"
 * ve "kişi başı tek kullanım" — geçmiş siparişlere bakmayı gerektirdiği için
 * burada, sipariş kaydedilmeden hemen önce denetlenir.
 *
 * Kimlik olarak sipariş formundaki e-posta kullanılır. Bu mükemmel bir kimlik
 * değil (kişi başka bir adresle yeniden deneyebilir) ama üyelik zorunlu olmayan
 * bir akışta elimizdeki en iyi ölçüt ve kuponun aynı adresle tekrar tekrar
 * kullanılmasını kesin olarak engelliyor.
 */
export type KuponDenetimi = { uygun: true } | { uygun: false; hata: string };

export async function kuponKisiDenetimi(
  kod: string | undefined,
  eposta: string,
): Promise<KuponDenetimi> {
  const temizKod = (kod ?? "").trim();
  if (!temizKod) return { uygun: true };

  const kampanya = kuponBul(temizKod);
  if (!kampanya?.kod) return { uygun: true }; // geçersiz kod zaten indirim üretmiyor

  const temizEposta = (eposta ?? "").trim().toLowerCase();
  if (!temizEposta) return { uygun: true }; // e-posta doğrulaması ayrı hata veriyor

  let depo;
  try {
    depo = await depoAl();
  } catch {
    // Depoya ulaşılamıyorsa siparişi düşürmek yerine kuponu geçiriyoruz;
    // ödeme akışını veri tabanı arızasıyla kesmek daha kötü bir sonuç olurdu.
    console.error("[kupon] depo açılamadı, kişi denetimi atlandı");
    return { uygun: true };
  }

  try {
    if (kampanya.sadeceIlkSiparis) {
      const oncekiSiparis = await depo.epostaSiparisSayisi(temizEposta);
      if (oncekiSiparis > 0) {
        return {
          uygun: false,
          hata: `${kampanya.kod} yalnızca ilk siparişte geçerli. Bu e-posta ile daha önce sipariş verilmiş.`,
        };
      }
    }

    if (kampanya.kisiBasiTekKullanim !== false) {
      if (await depo.kuponKullanildiMi(temizEposta, kampanya.kod)) {
        return {
          uygun: false,
          hata: `${kampanya.kod} bu e-posta ile daha önce kullanılmış. Her kupon kişi başı bir kez geçerlidir.`,
        };
      }
    }
  } catch (hata) {
    console.error(
      "[kupon] kişi denetimi başarısız:",
      hata instanceof Error ? hata.message : hata,
    );
    return { uygun: true };
  }

  return { uygun: true };
}
