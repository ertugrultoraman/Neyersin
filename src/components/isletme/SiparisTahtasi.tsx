import { HazirDugmesi } from "@/components/panel/HazirDugmesi";
import { DurumRozeti } from "@/components/admin/DurumRozeti";
import type { KayitliSiparis } from "@/lib/depo";
import { paraFormatla } from "@/lib/utils";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

/**
 * SİPARİŞ TAHTASI — işletmenin ana ekranı.
 *
 * NEDEN KART LİSTESİ DEĞİL: şef günde birkaç sipariş alıyor, işletme onlarca.
 * Tek bir uzun listede "hangisini şimdi pişireceğim, hangisi kuryede" sorusu
 * her seferinde baştan taranarak cevaplanıyordu. Tahtada sipariş bulunduğu
 * AŞAMANIN sütununda duruyor; mutfak ekranı gibi bakışta okunuyor.
 *
 * TAMAMLANANLAR TAHTADA YOK: teslim edilmiş ve iptal edilmiş siparişler
 * sütunları şişirip bugünün işini görünmez yapardı. Geçmiş "Siparişlerim"
 * ekranında duruyor.
 *
 * Müşterinin adı ve telefonu burada GÖSTERİLMİYOR: mutfağın işi yemeği
 * hazırlamak, kişisel veri yalnızca teslimatı yapan kuryede ve yöneticide
 * duruyor (aynı tercih: components/panel/SiparisKarti.tsx).
 */
const SUTUNLAR = [
  { durum: "odendi", baslik: "isletme.sutunYeni", ton: "border-domates/40 bg-domates/6" },
  { durum: "hazir", baslik: "isletme.sutunHazir", ton: "border-sari-500/40 bg-sari-500/8" },
  { durum: "yolda", baslik: "isletme.sutunYolda", ton: "border-nane/40 bg-nane/8" },
] as const;

export async function SiparisTahtasi({ siparisler }: { siparisler: KayitliSiparis[] }) {
  const c = ceviri(await aktifDil());

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-kahve-900">
        {c("isletme.tahtaBaslik")}
      </h2>
      <p className="mt-1 text-sm text-kahve-600">{c("isletme.tahtaAciklama")}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {SUTUNLAR.map((sutun) => {
          const bunlar = siparisler.filter((s) => s.durum === sutun.durum);
          return (
            <section
              key={sutun.durum}
              className={`rounded-[1.75rem] border p-4 ${sutun.ton}`}
              aria-label={c(sutun.baslik)}
            >
              <header className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-extrabold text-kahve-900">
                  {c(sutun.baslik)}
                </h3>
                <span
                  className="grid min-w-6 place-items-center rounded-full bg-kahve-900/10 px-2
                    text-xs font-extrabold text-kahve-900"
                >
                  {bunlar.length}
                </span>
              </header>

              {bunlar.length === 0 ? (
                <p className="mt-4 text-xs text-kahve-500">{c("isletme.sutunBos")}</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {bunlar.map((s) => (
                    <li
                      key={s.siparisNo}
                      className="rounded-2xl border border-kahve-900/8 bg-white p-3 shadow-yumusak"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-kahve-700">
                          {s.siparisNo}
                        </span>
                        <span className="font-display text-sm font-extrabold text-kahve-900">
                          {paraFormatla(s.tutarlar.toplam)}
                        </span>
                      </div>

                      <ul className="mt-2 space-y-0.5">
                        {/*
                          Anahtar `satirId`: aynı ürün farklı ekstralarla ayrı
                          satır olabiliyor, ada göre anahtarlansaydı çakışırdı.
                        */}
                        {s.kalemler.map((k) => (
                          <li key={k.satirId} className="text-xs text-kahve-700">
                            <span className="font-bold text-kahve-900">{k.adet}×</span> {k.ad}
                          </li>
                        ))}
                      </ul>

                      {s.not && (
                        <p className="mt-2 rounded-xl bg-sari-500/12 px-2.5 py-1.5 text-xs leading-relaxed text-kahve-800">
                          <span className="font-bold">{c("siparis.notEtiketi")}</span> {s.not}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <DurumRozeti durum={s.durum} />
                        {s.durum === "odendi" && <HazirDugmesi siparisNo={s.siparisNo} />}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
