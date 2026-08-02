"use client";

import { useActionState } from "react";

import { koduTekrarGonderAction, type KodDurumu } from "@/app/hesap/actions";
import { Buton } from "../ui/Buton";
import { Girdi } from "./Alan";

/**
 * 6 haneli doğrulama kodu girişi — hem kayıtta hem parola sıfırlamada aynı.
 *
 * Kod hiçbir zaman ekranda gösterilmez; yalnızca yazılır. Posta gönderimi
 * yapılandırılmadıysa bunu açıkça söyler — kullanıcı boş yere kodu beklemesin.
 */
export function KodGirdisi({ hazir = true }: { hazir?: boolean }) {
  return (
    <Girdi
      type="text"
      name="kod"
      required
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      autoFocus={hazir}
      placeholder="••••••"
      className="text-center font-display text-2xl font-extrabold tracking-[0.5em]"
    />
  );
}

/** "Kod gelmedi mi?" — yeniden gönderme düğmesi. */
export function KoduTekrarGonder({
  eposta,
  amac,
}: {
  eposta: string;
  amac: "kayit" | "sifre" | "eposta";
}) {
  const [durum, gonder, bekliyor] = useActionState(koduTekrarGonderAction, {} as KodDurumu);

  return (
    <form action={gonder} className="mt-3 text-center">
      <input type="hidden" name="eposta" value={eposta} />
      <input type="hidden" name="amac" value={amac} />
      <Buton type="submit" tur="sade" boyut="sm" disabled={bekliyor}>
        {bekliyor ? "Gönderiliyor…" : "Kod gelmedi mi? Yeniden gönder"}
      </Buton>
      {durum.hata && <p className="mt-1 text-xs font-semibold text-domates-koyu">{durum.hata}</p>}
      {durum.basari && <p className="mt-1 text-xs font-semibold text-nane-koyu">{durum.basari}</p>}
    </form>
  );
}

/** Posta altyapısı hazır değilken gösterilen dürüst uyarı. */
export function PostaGitmediUyarisi() {
  return (
    <p className="rounded-2xl bg-sari-500/14 px-4 py-3 text-xs leading-relaxed text-kahve-800">
      <strong>E-posta gönderimi henüz açık değil.</strong> Kodun oluşturuldu ama posta
      kutuna düşmeyecek. Kodu yöneticiden isteyebilirsin — yönetim panelindeki
      &quot;Doğrulamalar&quot; ekranında görünüyor.
    </p>
  );
}
