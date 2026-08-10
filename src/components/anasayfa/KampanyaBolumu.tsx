import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";
import { Kampanyalar } from "./Kampanyalar";

/** Depo erişilemezse ızgara varsayılan sırayla çizilsin, sayfa patlamasın. */
async function kasikBilgisi(): Promise<{ sira: number; toplam: number }> {
  try {
    const depo = await hesapDepoAl();
    const [siralar, kasiklar] = await Promise.all([
      depo.izgaraSirasiAl(),
      depo.kasiklariListele(),
    ]);
    return {
      sira: siralar.find((s) => s.anahtar === "sef-kasigi")?.sira ?? -1,
      toplam: kasiklar.length,
    };
  } catch {
    return { sira: -1, toplam: 0 };
  }
}

/**
 * Kampanya ızgarasının sunucu tarafı.
 *
 * Şef Kaşığı kartının yeri ve "bakan kişi yönetici mi" bilgisi burada okunup
 * içerideki istemci bileşenine veriliyor. Yöneticilik BURADA belirleniyor,
 * tarayıcıda değil — sürükleme kolunu görmek zaten bir yetki vermiyor ama
 * sunucudaki eylemler rolü ayrıca doğruluyor.
 *
 * Anketler bu ızgarada değil: sayfanın yan boşluklarına taşındılar
 * (bkz. `AnketBolumu`).
 */
export async function KampanyaBolumu() {
  const [oturum, kasik] = await Promise.all([oturumAl(), kasikBilgisi()]);

  return (
    <Kampanyalar
      yonetici={oturum?.rol === "admin"}
      kasikSirasi={kasik.sira}
      kasikToplami={kasik.toplam}
    />
  );
}
