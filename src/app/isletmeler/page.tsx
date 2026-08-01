import type { Metadata } from "next";

import { RestoranListesiSayfasi } from "@/components/restoran/RestoranListesiSayfasi";

export const metadata: Metadata = {
  title: "İşletmeler",
  description:
    "Beylikdüzü'ne teslimat yapan restoranlar, marketler ve fırınlar. Burger, pizza, döner, kebap " +
    "ve daha fazlası — hepsinde ücretsiz teslimat.",
  alternates: { canonical: "/isletmeler" },
};

export default async function IsletmelerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <RestoranListesiSayfasi tur="isletme" sorgu={q} />;
}
