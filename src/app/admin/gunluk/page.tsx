import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { oturumAl } from "@/lib/oturum";
import { vekilKayitlariniListele, type VekilKaydi } from "@/lib/vekil-kaydi";
import { gunlukOku, type GunlukKaydi, type YonetimEylemi } from "@/lib/yonetim-gunlugu";

export const metadata: Metadata = {
  title: "Yönetim defteri — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * YÖNETİM DEFTERİ — kim, neyi, ne zaman değiştirdi.
 *
 * Bir yanlışlık ya da ihlal sonrası ilk bakılacak yer. Önceden bu soru
 * cevapsızdı: yalnızca vekâlet kayıtları tutuluyordu, yani "kim kime
 * büründü". Yöneticinin kendi kimliğiyle yaptığı rol yükseltme, hesap silme,
 * oturum kesme gibi işler hiçbir yere yazılmıyordu.
 *
 * VEKÂLET KAYITLARI DA BURADA: iki defter ayrı tablolarda duruyor ama aynı
 * soruya hizmet ediyorlar ve ayrı sayfalara bölmek, olayı kovalayan kişiyi
 * iki sekme arasında gidip gelmeye zorlardı.
 */
const EYLEM_ADI: Record<YonetimEylemi, string> = {
  "rol-degistir": "Rol değiştirdi",
  "hesap-sil": "Hesap sildi",
  "parola-uret": "Parola üretti",
  "mutfak-bagla": "Mutfak bağladı",
  "altin-sef": "Altın Şef unvanı",
  "basvuru-onayla": "Başvuru onayladı",
  "basvuru-reddet": "Başvuru reddetti",
  "siparis-durum": "Sipariş durumu",
  "siparis-ata": "Sipariş atadı",
  "oturum-kes": "Mobil oturumları kesti",
  "vardiya-ac": "Vardiya açtı",
  "vardiya-sil": "Vardiya sildi",
  "engel-kaldir": "Bot engeli kaldırdı",
};

/** Geri alınması zor ya da yetki genişleten eylemler ayırt ediliyor. */
const AGIR_EYLEMLER = new Set<YonetimEylemi>([
  "hesap-sil",
  "rol-degistir",
  "parola-uret",
  "oturum-kes",
]);

export default async function GunlukSayfasi() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  let kayitlar: GunlukKaydi[] = [];
  let vekalet: VekilKaydi[] = [];
  try {
    [kayitlar, vekalet] = await Promise.all([gunlukOku(200), vekilKayitlariniListele(50)]);
  } catch {
    /* Defter okunamazsa sayfa yine açılsın; boş liste görünür. */
  }

  const tarih = (iso: string) =>
    new Date(iso).toLocaleString("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Yönetim defteri"
      aciklama={`${kayitlar.length} kayıt · ${vekalet.length} vekâlet`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      <div className="rounded-2xl bg-kahve-900/4 px-4 py-3.5 text-sm leading-relaxed text-kahve-700">
        Panelde yapılan her <strong className="font-bold">değiştirici</strong> işlem buraya
        yazılıyor. Kayıt işlemin <strong className="font-bold">başında</strong> atılıyor, yani
        defter denemeleri de tutuyor — ele geçirilmiş bir hesabın denediği ama tutmayan işler,
        güvenlik açısından başardıkları kadar değerli. Bir satırın gerçekten uygulanıp
        uygulanmadığını hedefin son durumuna bakarak görürsün.
        <br />
        <span className="text-kahve-600">
          Sayfa açmak, liste okumak deftere girmiyor: her okumayı yazsaydık &ldquo;bu hesabı kim
          sildi&rdquo; satırını bulmak imkânsızlaşırdı.
        </span>
      </div>

      {kayitlar.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-16 text-center text-sm text-kahve-500">
          Defter henüz boş. Panelde bir değişiklik yaptığında burada görünecek.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-kahve-900/10">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-kahve-900 text-sari-200">
                {["Zaman", "Yönetici", "Eylem", "Hedef", "Ayrıntı", "IP"].map((b) => (
                  <th
                    key={b}
                    className="px-4 py-3.5 font-display text-2xs font-extrabold tracking-wide uppercase"
                  >
                    {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-kahve-900/8 bg-white">
              {kayitlar.map((k, i) => (
                <tr
                  key={`${k.zaman}-${i}`}
                  className={AGIR_EYLEMLER.has(k.eylem) ? "bg-domates/4" : ""}
                >
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-kahve-500">
                    {tarih(k.zaman)}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-kahve-900">{k.yonetici}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold ${
                        AGIR_EYLEMLER.has(k.eylem) ? "text-domates-koyu" : "text-kahve-800"
                      }`}
                    >
                      {EYLEM_ADI[k.eylem] ?? k.eylem}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs break-all text-kahve-700">
                    {k.hedef || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-kahve-600">{k.ayrinti || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-kahve-400">{k.ip || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg font-extrabold text-kahve-900">Vekâlet kayıtları</h2>
        <p className="mt-1 text-sm text-kahve-600">
          Yöneticinin başka bir hesaba büründüğü anlar. Vekâletle yapılan değişiklikler o hesabın
          kendisi yapmış gibi görünür; bu liste olmasa ikisi ayırt edilemezdi.
        </p>

        {vekalet.length === 0 ? (
          <p className="mt-3 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-10 text-center text-sm text-kahve-500">
            Hiç vekâlet kaydı yok.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {vekalet.map((v, i) => (
              <li
                key={`${v.zaman}-${i}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-kahve-900/8 bg-white px-4 py-3 text-sm"
              >
                <span className="font-semibold text-kahve-900">{v.yonetici}</span>
                <span className="text-kahve-400">→</span>
                <span className="text-kahve-700">{v.hedef}</span>
                <span className="ml-auto text-xs text-kahve-500">{tarih(v.zaman)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminKabuk>
  );
}
