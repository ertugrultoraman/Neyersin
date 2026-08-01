import { ButonBaglanti, OkIkon } from "@/components/ui/Buton";
import { ScooterIkon } from "@/components/ui/Ikonlar";

export const metadata = {
  title: "Sayfa bulunamadı",
};

export default function BulunamadiSayfasi() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div aria-hidden="true" className="absolute inset-0 isik" />
      <div className="kap relative text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-4xl bg-sari-500 text-kahve-900 shadow-sari animate-yuzer">
          <ScooterIkon className="size-10" />
        </span>

        <p className="mt-8 font-display text-6xl leading-none font-extrabold text-kahve-900 md:text-7xl">
          404
        </p>
        <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
          Kurye bu adresi bulamadı
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-kahve-600">
          Aradığın sayfa taşınmış veya hiç var olmamış olabilir. Buradan devam edebilirsin.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButonBaglanti href="/" boyut="lg">
            Ana sayfaya dön
            <OkIkon />
          </ButonBaglanti>
          <ButonBaglanti href="/restoranlar" tur="hayalet" boyut="lg">
            Restoranlara göz at
          </ButonBaglanti>
        </div>
      </div>
    </section>
  );
}
