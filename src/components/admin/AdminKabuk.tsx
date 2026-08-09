import type { ReactNode } from "react";

import { adminCikis } from "@/app/admin/actions";
import { Buton } from "../ui/Buton";
import { KontrolIkon } from "../ui/Ikonlar";
import { AdminSekmeler } from "./AdminSekmeler";

/** Admin sayfalarının ortak üst çerçevesi. */
export function AdminKabuk({
  eposta,
  baslik,
  aciklama,
  kaliciDepo,
  serverless,
  children,
  yan,
}: {
  eposta: string;
  baslik: string;
  aciklama?: string;
  kaliciDepo: boolean;
  serverless: boolean;
  children: ReactNode;
  yan?: ReactNode;
}) {
  return (
    <div className="kap py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-2xs font-extrabold tracking-[0.18em] text-sari-700 uppercase">
            Yönetim paneli
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-extrabold sm:text-4xl">{baslik}</h1>
          {aciklama && <p className="mt-2 text-sm text-kahve-600">{aciklama}</p>}
        </div>

        <div className="flex items-center gap-3">
          {yan}
          <span className="hidden text-xs font-semibold text-kahve-500 sm:block">{eposta}</span>
          <form action={adminCikis}>
            <Buton type="submit" tur="hayalet" boyut="sm">
              Çıkış
            </Buton>
          </form>
        </div>
      </div>

      {/* Depo durumu — kalıcı değilse net uyarı */}
      {!kaliciDepo && (
        <div
          className={`mt-6 rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
            serverless
              ? "bg-domates/10 text-domates-koyu"
              : "bg-sari-500/12 text-kahve-800"
          }`}
        >
          {serverless ? (
            <>
              <strong>Dikkat: siparişler kalıcı olarak saklanmıyor.</strong> Serverless ortamda
              (Vercel) dosya sistemi geçicidir — bu listedeki kayıtlar her deploy&apos;da ve
              çoğu zaman istekler arasında kaybolur.{" "}
              <code className="font-mono text-xs">DATABASE_URL</code> tanımlayıp Postgres
              bağlayın.
            </>
          ) : (
            <>
              Siparişler yerel <code className="font-mono text-xs">.veri/siparisler.json</code>{" "}
              dosyasında tutuluyor. Geliştirme için yeterli; üretimde{" "}
              <code className="font-mono text-xs">DATABASE_URL</code> ile Postgres kullanın.
            </>
          )}
        </div>
      )}

      {kaliciDepo && (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-nane/10 px-4 py-3 text-sm font-semibold text-nane-koyu">
          <KontrolIkon className="size-4 shrink-0" strokeWidth="2.6" />
          Postgres bağlı — siparişler kalıcı olarak saklanıyor.
        </p>
      )}

      <AdminSekmeler />

      <div className="mt-8">{children}</div>
    </div>
  );
}
