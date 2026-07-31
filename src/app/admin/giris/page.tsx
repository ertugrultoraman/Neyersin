import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GirisFormu } from "@/components/admin/GirisFormu";
import { adminEpostalari, adminYapilandirildiMi, oturumAl } from "@/lib/oturum";

export const metadata: Metadata = {
  title: "Yönetici Girişi",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";

export default async function AdminGirisSayfasi() {
  const mevcut = await oturumAl();
  if (mevcut) redirect(mevcut.rol === "admin" ? "/admin" : "/panel");

  const yapilandirildi = adminYapilandirildiMi();

  return (
    <div className="kap flex min-h-[70dvh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-kahve-900/8 bg-white p-7 shadow-kart md:p-9">
          <h1 className="font-display text-2xl font-extrabold text-kahve-900">
            Yönetici girişi
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-kahve-600">
            Sipariş paneline erişmek için yönetici hesabınla giriş yap.
          </p>

          {yapilandirildi ? (
            <GirisFormu />
          ) : (
            <div className="mt-6 rounded-2xl bg-domates/10 px-4 py-4 text-sm leading-relaxed text-domates-koyu">
              <p className="font-bold">Panel henüz yapılandırılmadı.</p>
              <p className="mt-2">
                Varsayılan parola ile açık bırakmak güvenli olmadığı için panel kapalı. Açmak
                için <code className="font-mono text-xs">ADMIN_PASSWORD</code> ortam değişkenini
                tanımlayıp sunucuyu yeniden başlat.
              </p>
              <p className="mt-3 text-xs">
                Yetkili e-posta{adminEpostalari().length > 1 ? "lar" : ""}:{" "}
                <strong>{adminEpostalari().join(", ")}</strong>
              </p>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-kahve-400">
          Bu sayfa arama motorlarına kapalıdır.
        </p>
      </div>
    </div>
  );
}
