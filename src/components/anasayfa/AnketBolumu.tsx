import { anketSonuclari } from "@/app/anket-actions";
import { oturumAl } from "@/lib/oturum";
import { AnketRaylari } from "./AnketRaylari";

/**
 * Anket raylarının sunucu tarafı.
 *
 * Yayındaki anketlerin sonuçları ve "bakan kişi yönetici mi" bilgisi burada
 * okunuyor. Yöneticilik BURADA belirleniyor, tarayıcıda değil — taraf
 * düğmelerini görmek zaten bir yetki vermiyor ama sunucudaki eylem rolü
 * ayrıca doğruluyor.
 */
export async function AnketBolumu() {
  const [sonuclar, oturum] = await Promise.all([anketSonuclari(), oturumAl()]);

  return <AnketRaylari anketler={sonuclar} yonetici={oturum?.rol === "admin"} />;
}
