import type { Metadata } from "next";

import { RestoranListesiSayfasi } from "@/components/restoran/RestoranListesiSayfasi";

export const metadata: Metadata = {
  title: "Şeflerin Elinden",
  description:
    "Kendi mutfağından pişiren ev hanımları ve şefler. Dükkân kirası yok, o fark fiyata binmiyor. " +
    "Beylikdüzü'ne ücretsiz teslimat.",
  alternates: { canonical: "/seflerin-elinden" },
};

export default async function SeflerinElindenSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <RestoranListesiSayfasi tur="sef" sorgu={q} />;
}
