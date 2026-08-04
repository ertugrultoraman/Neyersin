import { anketSonucu } from "@/app/anket-actions";
import { oturumAl } from "@/lib/oturum";
import { Kampanyalar } from "./Kampanyalar";

/**
 * Kampanya ızgarasının sunucu tarafı.
 *
 * Anket sonucu ve "bakan kişi yönetici mi" bilgisi burada okunup içerideki
 * istemci bileşenine veriliyor. Yöneticilik BURADA belirleniyor, tarayıcıda
 * değil — sürükleme kolunu görmek zaten bir yetki vermiyor ama sunucudaki
 * `anketSiraAction` da rolü ayrıca doğruluyor.
 */
export async function KampanyaBolumu() {
  const [sonuc, oturum] = await Promise.all([anketSonucu(), oturumAl()]);

  return <Kampanyalar anket={sonuc} yonetici={oturum?.rol === "admin"} />;
}
