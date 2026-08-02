import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminKabuk } from "@/components/admin/AdminKabuk";
import { Rozet } from "@/components/ui/Rozet";
import { depoKaliciMi, serverlessMi } from "@/lib/depo";
import { epostaYapilandirildiMi, gonderenAdresi } from "@/lib/eposta";
import { hesapDepoAl, type DogrulamaKodu, type Hesap } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Doğrulamalar — Yönetim",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AMAC_ETIKETI: Record<string, string> = {
  kayit: "Kayıt doğrulama",
  sifre: "Parola sıfırlama",
  eposta: "E-posta değişikliği",
};

function zaman(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminDogrulamalarSayfasi() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");

  const postaAcik = epostaYapilandirildiMi();

  let hesaplar: Hesap[] = [];
  let kodlar: DogrulamaKodu[] = [];
  try {
    const depo = await hesapDepoAl();
    [hesaplar, kodlar] = await Promise.all([depo.hesaplariListele(), depo.kodlariListele()]);
  } catch {
    // depo erişilemiyorsa sayfa boş listelerle açılır
  }

  const simdi = Date.now();
  const acikKodlar = kodlar.filter(
    (k) => !k.kullanildi && new Date(k.sonGecerlilik).getTime() > simdi,
  );
  const dogrulanmamis = hesaplar.filter((h) => h.epostaDogrulandi === false);

  return (
    <AdminKabuk
      eposta={oturum.eposta}
      baslik="Doğrulamalar"
      aciklama={`${acikKodlar.length} açık kod · ${dogrulanmamis.length} doğrulanmamış hesap`}
      kaliciDepo={depoKaliciMi()}
      serverless={serverlessMi()}
    >
      {/* Posta altyapısının durumu — kodların gerçekten gidip gitmediği */}
      {postaAcik ? (
        <p className="rounded-2xl bg-nane/10 px-4 py-3.5 text-sm leading-relaxed text-nane-koyu">
          <strong>E-posta gönderimi açık.</strong> Kodlar{" "}
          <strong>{gonderenAdresi()}</strong> adresinden gönderiliyor. Kodun kendisi burada
          gösterilmez — yalnızca özeti saklanıyor.
        </p>
      ) : (
        <div className="rounded-2xl bg-domates/10 px-4 py-3.5 text-sm leading-relaxed text-domates-koyu">
          <p>
            <strong>E-posta gönderimi kapalı.</strong> Kodlar üretiliyor ama kimseye
            ulaşmıyor; aşağıdaki tabloda okuyup kişiye elle iletebilirsin.
          </p>
          <p className="mt-2 text-xs">
            Açmak için <code className="font-mono">SMTP_KULLANICI</code> ve{" "}
            <code className="font-mono">SMTP_PAROLA</code> ortam değişkenlerini tanımla
            (Google Workspace uygulama şifresi) ve sunucuyu yeniden başlat. Tanımlandığı anda
            kodlar burada GÖSTERİLMEZ olur.
          </p>
        </div>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { etiket: "Açık kod", deger: String(acikKodlar.length) },
          {
            etiket: "Doğrulanmamış hesap",
            deger: String(dogrulanmamis.length),
            dikkat: dogrulanmamis.length > 0,
          },
          { etiket: "Toplam hesap", deger: String(hesaplar.length) },
          { etiket: "Posta", deger: postaAcik ? "Açık" : "Kapalı", dikkat: !postaAcik },
        ].map((k) => (
          <div
            key={k.etiket}
            className={`rounded-3xl border p-5 shadow-yumusak ${
              k.dikkat ? "border-domates/30 bg-domates/8" : "border-kahve-900/8 bg-white"
            }`}
          >
            <dt
              className={`text-2xs font-bold tracking-wide uppercase ${
                k.dikkat ? "text-domates-koyu" : "text-kahve-400"
              }`}
            >
              {k.etiket}
            </dt>
            <dd
              className={`mt-1.5 font-display text-2xl font-extrabold md:text-3xl ${
                k.dikkat ? "text-domates-koyu" : "text-kahve-900"
              }`}
            >
              {k.deger}
            </dd>
          </div>
        ))}
      </dl>

      {/* Açık kodlar */}
      <h2 className="mt-10 font-display text-lg font-extrabold text-kahve-900">
        Bekleyen kodlar
      </h2>
      {acikKodlar.length === 0 ? (
        <p className="mt-4 rounded-3xl border border-dashed border-kahve-900/15 bg-white/60 px-6 py-10 text-center text-sm text-kahve-500">
          Şu an bekleyen doğrulama kodu yok.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-3xl border border-kahve-900/10">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-kahve-900 text-sari-200">
                {["E-posta", "Amaç", "İstendi", "Geçerlilik", "Posta", "Kod"].map((b) => (
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
              {acikKodlar.map((k) => (
                <tr key={k.id} className="transition-colors duration-300 hover:bg-sari-500/6">
                  <td className="px-4 py-3.5 font-semibold text-kahve-900">{k.eposta}</td>
                  <td className="px-4 py-3.5 text-kahve-600">
                    {AMAC_ETIKETI[k.amac] ?? k.amac}
                  </td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap text-kahve-500">
                    {zaman(k.olusturmaTarihi)}
                  </td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap text-kahve-500">
                    {zaman(k.sonGecerlilik)}&apos;e kadar
                  </td>
                  <td className="px-4 py-3.5">
                    {k.gonderildi ? (
                      <Rozet ton="nane">Gönderildi</Rozet>
                    ) : (
                      <Rozet ton="domates">Gitmedi</Rozet>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {k.duzKod ? (
                      <span className="font-mono text-base font-extrabold tracking-widest text-kahve-900">
                        {k.duzKod}
                      </span>
                    ) : (
                      <span className="text-xs text-kahve-400">gizli</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hesapların doğrulama durumu */}
      <h2 className="mt-12 font-display text-lg font-extrabold text-kahve-900">
        Hesapların doğrulama durumu
      </h2>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-kahve-900/10">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-kahve-900 text-sari-200">
              {["E-posta", "Ad", "Rol", "E-posta doğrulandı mı?"].map((b) => (
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
            {hesaplar.map((h) => (
              <tr key={h.eposta} className="transition-colors duration-300 hover:bg-sari-500/6">
                <td className="px-4 py-3.5 font-semibold text-kahve-900">{h.eposta}</td>
                <td className="px-4 py-3.5 text-kahve-600">{h.ad}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-kahve-500 uppercase">{h.rol}</td>
                <td className="px-4 py-3.5">
                  {h.epostaDogrulandi === false ? (
                    <Rozet ton="domates">Doğrulanmadı</Rozet>
                  ) : (
                    <Rozet ton="nane">Doğrulandı</Rozet>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminKabuk>
  );
}
