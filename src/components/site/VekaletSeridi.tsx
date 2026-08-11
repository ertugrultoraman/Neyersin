import { vekaletiBitirAction } from "@/app/admin/yonetim-actions";
import { oturumAl } from "@/lib/oturum";

/**
 * VEKÂLET ŞERİDİ — "şu an bu hesabı yönetici olarak görüntülüyorsun".
 *
 * Neden her sayfada: yönetici bir hesaba büründüğünde ekran o kişinin
 * ekranından ayırt edilemiyor. Şerit olmasaydı yönetici kendi hesabında
 * sandığı bir işlemi (sipariş iptali, fiyat değişikliği) başkasının adına
 * yapabilirdi. Sayfanın en üstünde, kapatılamaz.
 *
 * Vekâlet yoksa hiçbir şey çizmiyor — sıradan ziyaretçi bu bileşenin
 * varlığını fark etmiyor.
 */
export async function VekaletSeridi() {
  const oturum = await oturumAl();
  if (!oturum?.vekil) return null;

  return (
    <div className="sticky top-0 z-50 bg-domates text-white">
      <div className="kap flex flex-wrap items-center justify-between gap-2 py-2">
        <p className="text-sm font-bold">
          <span className="opacity-80">Yönetici olarak görüntülüyorsun:</span> {oturum.ad}
          <span className="opacity-80"> ({oturum.eposta})</span>
        </p>
        <form action={vekaletiBitirAction}>
          <button
            type="submit"
            className="tiklanabilir rounded-xl bg-white/15 px-3 py-1.5 text-sm font-bold
              transition-colors hover:bg-white/25"
          >
            Yöneticiliğe dön
          </button>
        </form>
      </div>
    </div>
  );
}
