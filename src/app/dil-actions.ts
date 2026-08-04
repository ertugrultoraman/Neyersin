"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { dilGecerliMi, DIL_COOKIE, DIL_GUN, VARSAYILAN_DIL } from "@/lib/dil";

/**
 * Dil seçimini çereze yazar.
 *
 * Çerez `httpOnly` DEĞİL: sunucu bileşenleri okuyor ama istemci tarafındaki
 * bazı kontroller de bakabilsin. İçinde yalnızca "tr" ya da "en" var, hiçbir
 * yetki taşımıyor — biri elle değiştirse en fazla siteyi başka dilde görür.
 * Gelen değer yine de doğrulanıyor; sözlükte olmayan bir dile düşülmüyor.
 */
export async function dilSecAction(formVerisi: FormData): Promise<void> {
  const istenen = String(formVerisi.get("dil") ?? "");
  const dil = dilGecerliMi(istenen) ? istenen : VARSAYILAN_DIL;

  (await cookies()).set(DIL_COOKIE, dil, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DIL_GUN * 24 * 60 * 60,
  });

  // Bütün sayfalar dile bağlı; tek yol yeterli değil.
  revalidatePath("/", "layout");
}
