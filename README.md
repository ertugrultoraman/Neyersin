# Ne Yersin? — Web Sitesi

Yemek siparişi, kurye yönetimi ve teslimat takibini tek sistemde birleştiren **Ne Yersin?**
markasının kurumsal web sitesi. Yemeksepeti'nin bilgi mimarisi referans alındı; tasarım,
renk paleti ve tüm içerik özgün olarak üretildi.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · framer-motion
· Vercel Blob

---

## Hızlı başlangıç

```bash
npm install
npm run dev          # http://localhost:3000
```

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build |
| `npm run start` | Build çıktısını servis eder |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run images:generate` | AI görsellerini üretip Vercel Blob'a yükler |
| `npm run images:generate:dry` | Hiçbir çağrı yapmadan üretim planını gösterir |

---

## Sayfalar

| Rota | İçerik |
| --- | --- |
| `/` | Ana sayfa — 13 bölüm: hero + adres/arama, kategoriler, kampanyalar, öne çıkan restoranlar, nasıl çalışır, **Kullanıcı/Kurye/Restoran ekranları**, **canlı teslimat takibi**, tüm restoranlar (filtre + arama + sıralama), sektör önizleme, mobil uygulama, blog önizleme, SSS, çağrı bandı |
| `/blog` | Kategori filtreli yazı listesi + öne çıkan yazı |
| `/blog/[slug]` | 5 uzun-form yazı; içindekiler (scroll-spy), okuma çubuğu, blok tabanlı içerik, Article JSON-LD |
| `/sektorler` | 8 sektör kartı |
| `/sektorler/[slug]` | Sektör detayı: zorluklar, otomasyon senaryoları, çözüm bileşenleri, metrikler, entegrasyonlar, SSS |
| `/veri-degerlendirme` | "Şirketlerin datasını değerlendiriyoruz" hizmet sayfası — tanı, 5 adımlı süreç, kapsam, teslimler, SSS |
| `/sitemap.xml`, `/robots.txt` | Otomatik üretiliyor |

---

## Görsel altyapısı — Vercel Blob (kritik)

Site Vercel'de çalışacak şekilde kurgulandı. Vercel'in dosya sistemi **kalıcı değildir**
(serverless, salt-okunur, geçici), bu yüzden AI ile üretilen görseller runtime'da diske
yazılmaz. Akış şöyle:

```
prompt kaydı → AI görsel API'si → PNG buffer → Vercel Blob (public CDN)
            → src/content/generated/images.json manifestine public URL yazılır
            → next/image bu URL'i CDN'den servis eder
```

### Dosyalar

| Dosya | Görevi |
| --- | --- |
| `src/content/image-prompts.json` | 27 görselin anahtarı, oranı, `alt` metni ve prompt'u (elle düzenlenir) |
| `src/content/generated/images.json` | Üretim çıktısı: anahtar → Blob CDN URL'i (**commit edilir**) |
| `scripts/generate-images.mjs` | Üretim + yükleme betiği (OpenAI / Google / Replicate) |
| `src/lib/images.ts` | Manifestte kayıt varsa uzak URL, yoksa placeholder döndürür |
| `src/components/ui/AkilliGorsel.tsx` | Tek görsel bileşeni — iki durumu da yönetir |
| `src/components/ui/MarkaPlaceholder.tsx` | Anahtardan türeyen kararlı marka SVG'si |

### Neden placeholder var?

Manifest boşken site **kırık görsel göstermez**: anahtardan türetilen, her build'de aynı
görünen marka desenli bir SVG çizilir. Böylece API anahtarı olmadan da site eksiksiz
görünür. Anahtar geldiğinde tek komutla gerçek görsellere geçilir.

### Görselleri üretmek

```bash
cp .env.example .env.local        # anahtarları doldur
npm run images:generate:dry       # planı gör (API çağrısı yapmaz)
npm run images:generate           # üret + Blob'a yükle + manifesti yaz
npm run images:generate -- --only=home/hero,veri/hero
npm run images:generate -- --force        # hepsini yenile
```

Üretim sonrası **`src/content/generated/images.json` dosyasını commit et** — Vercel build'i
görselleri bu manifestten okur, yeniden üretim yapmaz (maliyet doğmaz).

Betik `addRandomSuffix: false` kullanır: aynı anahtar her zaman aynı Blob URL'ine yazılır,
yani tekrar çalıştırmak çöp dosya biriktirmez.

### `next.config.ts` uyarısı

Uzak görsel host'u `images.remotePatterns` içinde izinli olmalı; aksi hâlde `next/image`
production'da hata verir. `*.public.blob.vercel-storage.com` zaten tanımlı — başka bir
storage'a geçilirse buraya eklenmeli.

> `public/` altına **AI görseli yazılmaz** (repo şişer, her yeni görsel yeniden build
> gerektirir). `public/brand/` yalnızca statik marka varlıklarını tutar.

---

## Ortam değişkenleri

Tamamı yalnızca sunucu tarafında kullanılır — hiçbiri `NEXT_PUBLIC_` değil, client
bundle'a sızmaz. Şablon: [`.env.example`](.env.example)

| Değişken | Zorunlu | Not |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | hayır | Kanonik adres. Yoksa Vercel'in `VERCEL_PROJECT_PRODUCTION_URL`'i kullanılır |
| `BLOB_READ_WRITE_TOKEN` | görsel üretimi için | Vercel Blob store bağlanınca otomatik enjekte edilir |
| `IMAGE_PROVIDER` | görsel üretimi için | `openai` \| `google` \| `replicate` |
| `OPENAI_API_KEY` / `GOOGLE_API_KEY` / `REPLICATE_API_TOKEN` | seçilen sağlayıcı için | |

`.env*` dosyaları `.gitignore`'da — secret commit edilmez.

---

## Klasör yapısı

```
src/
  app/                     # rotalar, layout, sitemap, robots, icon
  components/
    anasayfa/              # ana sayfa bölümleri
    blog/                  # yazı kartı, blok render, içindekiler, okuma çubuğu
    site/                  # Header, Footer, duyuru bandı, sayfa başlığı, logo
    ui/                    # Buton, Rozet, Bolum, Reveal, Akordiyon, ikonlar, görsel
  content/                 # tüm içerik (TypeScript veri dosyaları)
    blog/yazilar/          # 5 uzun-form yazı
    sektorler.ts           # 8 sektör
    restoranlar.ts         # 16 restoran
  lib/                     # görsel çözümleme, yardımcılar
scripts/generate-images.mjs
public/brand/              # logo ve mockup dosyaları
```

İçerik tamamı `src/content/` altında ve tip güvenli — yeni blog yazısı veya sektör eklemek
için yalnızca ilgili veri dosyası düzenlenir, JSX'e dokunulmaz.

---

## Tasarım sistemi

Tokenlar `src/app/globals.css` içindeki `@theme` bloğunda.

- **Sarı `#FDC806`** — logo dosyasından pikselden örneklendi (`sari-500`)
- **Espresso kahve `#241608`** — `kahve-900`; krem yüzey `#FFF9EF`
- Vurgular: domates `#E4452C`, nane `#12A67A`
- Tipografi: **Baloo 2** (başlık, logodaki yuvarlak dile yakın) + **Manrope** (gövde),
  ikisi de `latin-ext` ile Türkçe karakter desteği
- Easing tokenları: `--ease-yumusak`, `--ease-cikis`, `--ease-yayli` — hiçbir geçiş `linear`
  veya varsayılan `ease` değil
- Yardımcılar: `kap`, `metin-sari`, `doku`, `isik`, `parlayan`, `kart-kalk`, `gizli-scroll`

### Erişilebilirlik ve hareket

- `prefers-reduced-motion` hem CSS'te hem `useReducedMotion` ile JS tarafında karşılanıyor;
  dekoratif animasyonlar tamamen susuyor
- Klavye ile görünen "İçeriğe geç" bağlantısı, `:focus-visible` ring'i, `aria-live` sonuç
  duyurusu, native `<details>` akordiyon
- Renk tek başına bilgi taşımıyor (ör. teslimat takibinde ikon + kalınlık da değişiyor)

---

## Bilinen eksikler / sonraki adımlar

| Konu | Durum |
| --- | --- |
| AI görselleri | Pipeline hazır, manifest boş — API anahtarı verilince `npm run images:generate` |
| Mobil uygulama QR kodu | `MobilUygulama.tsx` içindeki desen **taranabilir gerçek QR değil**, marka yer tutucusu. Mağaza bağlantıları yayına girince `qrcode` benzeri bir paketle gerçek kod üretilmeli |
| App Store / Play Store bağlantıları | Yer tutucu (`#mobil-uygulama`) — gerçek mağaza URL'leri gelince güncellenmeli |
| Restoran kart görselleri | Bilinçli tercih: isimden türeyen marka gradyanı. Gerçek fotoğraf istenirse `RestoranKarti.tsx` içindeki `Kapak` bileşeni `AkilliGorsel` ile değiştirilebilir |
| Form gönderimleri | "Restoranını ekle" / "Kurye ol" çağrıları henüz sayfa içi çapa. Backend/CRM hedefi belirlenince form + server action eklenmeli |
| Restoran/sipariş verisi | Statik demo içerik. Gerçek API'ye bağlanacaksa `src/content/restoranlar.ts` yerine veri katmanı eklenir |

---

## Deploy

Vercel adımları için: [`DEPLOY.md`](DEPLOY.md)
