# Vercel'e Deploy

Bu proje Vercel için kurgulandı: Next.js 15 App Router, tüm sayfalar statik üretiliyor
(23 sayfa) ve AI görselleri Vercel Blob CDN üzerinden servis ediliyor.

---

## 0. Ön kontrol (lokal)

Deploy etmeden önce build'in gerçekten geçtiğini doğrula:

```bash
npm install
npm run typecheck     # tsc --noEmit
npm run lint
npm run build         # 23 sayfa statik üretilmeli
npm run start         # http://localhost:3000 — gözle kontrol
```

---

## 1. Vercel Blob store'u oluştur

Görsellerin cloud'da görüntülenebilmesi için gereken tek altyapı bu.

1. Vercel Dashboard → projeyi seç → **Storage** sekmesi
2. **Create Database → Blob** → bir isim ver (ör. `ne-yersin-gorseller`)
3. **Connect to Project** → Production, Preview ve Development ortamlarını işaretle

Bağlantı kurulduğunda `BLOB_READ_WRITE_TOKEN` tüm ortamlara **otomatik enjekte edilir**;
elle eklemek gerekmez.

Lokale çekmek için:

```bash
npx vercel link
npx vercel env pull .env.local
```

---

## 2. Environment variable'ları gir

Vercel Dashboard → **Settings → Environment Variables**:

| Değişken | Değer | Ortam |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://alan-adiniz.com` | Production |
| `IMAGE_PROVIDER` | `openai` \| `google` \| `replicate` | tümü |
| `OPENAI_API_KEY` (veya diğeri) | sağlayıcı anahtarı | tümü |
| `BLOB_READ_WRITE_TOKEN` | — | Blob bağlanınca otomatik |

`NEXT_PUBLIC_SITE_URL` girilmezse Vercel'in `VERCEL_PROJECT_PRODUCTION_URL` değeri
kullanılır (`src/content/site.ts` içindeki `siteUrlBul`).

> Görsel API anahtarı yalnızca `npm run images:generate` betiği tarafından, senin
> makinende veya CI'da kullanılır — runtime'da hiç okunmaz. İstersen Vercel'e hiç
> eklemeden yalnızca `.env.local`'de tutabilirsin.

---

## 3. Görselleri üret ve manifesti commit et

Bu adım **deploy'dan önce lokalde** yapılır:

```bash
npm run images:generate:dry     # planı gör
npm run images:generate         # 27 görsel → Blob → manifest
git add src/content/generated/images.json
git commit -m "AI gorselleri uretildi ve Blob'a yuklendi"
```

Manifest commit edildiğinde Vercel build'i görselleri yeniden üretmez; sadece CDN
URL'lerini okur. Yani **her deploy'da görsel maliyeti doğmaz**.

Bu adımı atlarsan site yine sorunsuz çalışır — görseller marka desenli SVG yer
tutucularla gösterilir, hiçbir yerde kırık görsel oluşmaz.

---

## 4. Deploy

### A) Git üzerinden (önerilen)

```bash
git remote add origin <repo-url>
git push -u origin <branch>
```

Vercel Dashboard → **Add New → Project** → repoyu içe aktar. Framework otomatik
Next.js olarak algılanır; build ayarlarını değiştirmen gerekmez:

- Build Command: `next build` (otomatik)
- Output: `.next` (otomatik)
- Install Command: `npm install` (otomatik)

Her `push` bir Preview deploy, ana branch'e merge Production deploy üretir.

### B) CLI üzerinden

```bash
npx vercel            # preview deploy
npx vercel --prod     # production deploy
```

---

## 5. Deploy sonrası doğrulama

Production URL'de tek tek kontrol et:

- [ ] `/` açılıyor, hero + 13 bölüm eksiksiz
- [ ] `/blog` ve 5 yazı detayı açılıyor (`/blog/restoran-otomasyonu-rehberi` vb.)
- [ ] `/sektorler` ve 8 sektör detayı açılıyor
- [ ] `/veri-degerlendirme` açılıyor
- [ ] **Görseller yükleniyor** — DevTools → Network'te `*.public.blob.vercel-storage.com`
      isteklerinin hepsi `200`, hiç `400/404` yok
- [ ] Görseller HTTPS üzerinden geliyor, mixed-content uyarısı yok
- [ ] `/sitemap.xml` 17 URL döndürüyor ve URL'ler production alan adını gösteriyor
- [ ] `/robots.txt` doğru sitemap adresini işaret ediyor
- [ ] Olmayan bir adres 404 sayfasını gösteriyor
- [ ] Mobil genişlikte yatay kaydırma yok, menü açılıp kapanıyor
- [ ] Lighthouse: görsel kaynaklı belirgin CLS/LCP problemi yok

---

## Sorun giderme

**`Invalid src prop … hostname is not configured`**
`next.config.ts` → `images.remotePatterns` içine ilgili host eklenmeli. Vercel Blob
(`*.public.blob.vercel-storage.com`) zaten tanımlı; başka bir storage'a geçtiysen ekle.

**`BLOB_READ_WRITE_TOKEN tanımlı değil`**
Betik çalıştırılırken token yok. Blob store'u projeye bağla ve `npx vercel env pull
.env.local` çalıştır.

**Görseller lokalde görünüyor, production'da görünmüyor**
`src/content/generated/images.json` commit edilmemiş olabilir. Manifest repoda olmalı.

**Görseller hiç görünmüyor, yerine desenli SVG var**
Bu bir hata değil — manifest boş demektir. `npm run images:generate` çalıştır.

**Türkçe karakterler bozuk**
`next/font` `latin-ext` alt kümesiyle yükleniyor (`src/app/layout.tsx`). Font
değiştirilirse `subsets: ["latin", "latin-ext"]` korunmalı.

---

## Notlar

- OneDrive klasöründe geliştirme yapılıyor. `node_modules` senkronizasyonu yavaşlığa ve
  kilitli dosya hatalarına yol açabilir; sorun yaşarsan projeyi OneDrive dışına
  (ör. `C:\dev\ne-yersin`) taşımak en pratik çözüm.
- `public/` altına AI görseli yazılmaz — repo şişer ve her yeni görsel için yeniden build
  gerekir. Statik marka varlıkları `public/brand/` altında.
