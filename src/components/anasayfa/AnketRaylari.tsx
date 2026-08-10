"use client";

import { startTransition } from "react";

import { anketSiraAction, type AnketSonucu } from "@/app/anket-actions";
import { cn } from "@/lib/utils";
import { useDil } from "../saglayici/DilBaglami";
import { Anket } from "./Anket";

/**
 * Anketin durduğu taraf, `sira` alanında saklanıyor: 0 = sol, 1 = sağ.
 *
 * Alan eskiden kampanya ızgarasındaki kutu numarasıydı; anketler ızgaradan
 * çıkıp yan boşluklara taşınınca o numaranın karşılığı kalmadı. Yeni bir sütun
 * açmak yerine aynı alan kullanılıyor — kayıtlı eski değerler de anlamlı bir
 * tarafa düşsün diye tek/çift bakılıyor, yönetici düğmeye basınca 0 ya da 1
 * yazılıyor.
 */
export type Taraf = "sol" | "sag";

export function tarafBul(sira: number): Taraf {
  return sira >= 0 && sira % 2 === 1 ? "sag" : "sol";
}

const TARAF_SIRASI: Record<Taraf, number> = { sol: 0, sag: 1 };

/**
 * ANKETLER — içeriğin sağında ve solundaki boşlukta.
 *
 * Geniş ekranda sayfanın yan boşlukları boş duruyordu; anketler oraya taşındı
 * ve okumayı kesmeden sürekli görünür oldular. Dar ekranda (telefon, tablet)
 * yan boşluk yok: kutular sayfa akışına girip alt alta diziliyor — yana konsalar
 * sayfayı sağa sola kaydırılabilir hâle getirirlerdi.
 *
 * Yerleşimin tamamı CSS'te (`globals.css` → "ANKET RAYLARI"); burada yalnızca
 * hangi anketin hangi tarafta olduğu var. Böylece ekran genişliğini JavaScript
 * ile ölçmek gerekmiyor: ölçseydik ilk çizimde anket bir an yanlış yerde
 * görünüp zıplardı.
 */
export function AnketRaylari({
  anketler,
  yonetici = false,
}: {
  anketler: AnketSonucu[];
  yonetici?: boolean;
}) {
  const { c } = useDil();

  if (anketler.length === 0) return null;

  function tarafaTasi(anket: AnketSonucu, taraf: Taraf) {
    const veri = new FormData();
    veri.set("id", anket.anketId);
    veri.set("sira", String(TARAF_SIRASI[taraf]));
    startTransition(() => void anketSiraAction({}, veri));
  }

  function grup(taraf: Taraf) {
    const grubun = anketler.filter((a) => tarafBul(a.sira) === taraf);
    if (grubun.length === 0) return null;

    return (
      <div className={cn("anket-grubu", taraf === "sol" ? "anket-rayi-sol" : "anket-rayi-sag")}>
        {grubun.map((a) => (
          <div key={a.anketId}>
            {yonetici && (
              <div className="mb-2 flex flex-wrap items-center gap-2 rounded-2xl bg-kahve-900/5 px-3 py-1.5">
                <span className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">
                  {c("anket.taraf")}
                </span>
                <span className="ml-auto flex gap-1">
                  {/* Etiketlere sorunun kendisi giriyor: birden fazla anket olabilir. */}
                  <button
                    type="button"
                    onClick={() => tarafaTasi(a, "sol")}
                    disabled={taraf === "sol"}
                    aria-label={c("anket.solaAl", { soru: a.soru })}
                    className="tiklanabilir rounded-lg border border-kahve-900/12 px-2 py-0.5 text-xs
                      font-bold text-kahve-700 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => tarafaTasi(a, "sag")}
                    disabled={taraf === "sag"}
                    aria-label={c("anket.sagaAl", { soru: a.soru })}
                    className="tiklanabilir rounded-lg border border-kahve-900/12 px-2 py-0.5 text-xs
                      font-bold text-kahve-700 disabled:opacity-40"
                  >
                    →
                  </button>
                </span>
              </div>
            )}
            <Anket sonuc={a} baslik={a.soru} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="kap anket-akisi">
      {grup("sol")}
      {grup("sag")}
    </div>
  );
}
