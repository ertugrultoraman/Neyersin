import type { Metadata } from "next";

import { RestoranListesiSayfasi } from "@/components/restoran/RestoranListesiSayfasi";

export const metadata: Metadata = {
  title: "Restoranlar",
  description:
    "Beylikdüzü'ne teslimat yapan ev mutfakları, şefler ve işletmeler. Hazırlık süresine ve minimum sepete göre filtrele.",
  alternates: { canonical: "/restoranlar" },
};

export default async function RestoranlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <RestoranListesiSayfasi tur="hepsi" sorgu={q} />;
}
