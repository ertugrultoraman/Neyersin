import type { MetadataRoute } from "next";

import { restoranlar } from "@/content/restoranlar";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const simdi = new Date();

  const sabitler: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: simdi, changeFrequency: "daily", priority: 1 },
    {
      url: `${site.url}/ev-hanimlari`,
      lastModified: simdi,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${site.url}/seflerin-elinden`,
      lastModified: simdi,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${site.url}/isletmeler`,
      lastModified: simdi,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${site.url}/restoranlar`,
      lastModified: simdi,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${site.url}/hakkimizda`,
      lastModified: simdi,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/nasil-calisir`,
      lastModified: simdi,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${site.url}/ekranlar`, lastModified: simdi, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/iletisim`, lastModified: simdi, changeFrequency: "yearly", priority: 0.6 },
  ];

  const restoranSayfalari: MetadataRoute.Sitemap = restoranlar.map((r) => ({
    url: `${site.url}/restoran/${r.slug}`,
    lastModified: simdi,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...sabitler, ...restoranSayfalari];
}
