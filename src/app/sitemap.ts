import type { MetadataRoute } from "next";

import { yazilar } from "@/content/blog";
import { restoranlar } from "@/content/restoranlar";
import { sektorler } from "@/content/sektorler";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const simdi = new Date();

  const sabitler: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: simdi, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/blog`, lastModified: simdi, changeFrequency: "weekly", priority: 0.8 },
    { url: `${site.url}/sektorler`, lastModified: simdi, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${site.url}/veri-degerlendirme`,
      lastModified: simdi,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    { url: `${site.url}/iletisim`, lastModified: simdi, changeFrequency: "yearly", priority: 0.6 },
  ];

  const restoranSayfalari: MetadataRoute.Sitemap = restoranlar.map((r) => ({
    url: `${site.url}/restoran/${r.slug}`,
    lastModified: simdi,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const blogSayfalari: MetadataRoute.Sitemap = yazilar.map((y) => ({
    url: `${site.url}/blog/${y.slug}`,
    lastModified: new Date(y.guncelleme ?? y.tarih),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const sektorSayfalari: MetadataRoute.Sitemap = sektorler.map((s) => ({
    url: `${site.url}/sektorler/${s.slug}`,
    lastModified: simdi,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...sabitler, ...restoranSayfalari, ...blogSayfalari, ...sektorSayfalari];
}
