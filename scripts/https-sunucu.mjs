#!/usr/bin/env node
/**
 * Ne Yersin? — yerel HTTPS sunucusu
 * ============================================================================
 *
 * Next.js üretim sunucusu (`next start`) HTTPS konuşmaz. Bu script, üretilen
 * yerel sertifikayla 443 portunda bir HTTPS sunucusu açar ve istekleri arka
 * plandaki Next sunucusuna (127.0.0.1:3000) iletir.
 *
 * Sonuç: https://neyersin.local — tarayıcıda kilit simgesi, "Güvenli değil" yok.
 *
 * ÜRETİMDE KULLANILMAZ: Vercel HTTPS'i kendi sağlar.
 */

import http from "node:http";
import https from "node:https";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KLASOR = path.join(KOK, ".sertifika");

const HEDEF_PORT = Number(process.env.NEXT_PORT ?? 3000);
const HTTPS_PORT = Number(process.env.HTTPS_PORT ?? 443);

let sertifika;
try {
  sertifika = {
    key: readFileSync(path.join(KLASOR, "sunucu.key")),
    cert: readFileSync(path.join(KLASOR, "sunucu.crt")),
  };
} catch {
  console.error("Sertifika bulunamadı. Önce çalıştır:  npm run sertifika");
  process.exit(1);
}

const sunucu = https.createServer(sertifika, (istek, cevap) => {
  const vekil = http.request(
    {
      host: "127.0.0.1",
      port: HEDEF_PORT,
      method: istek.method,
      path: istek.url,
      headers: {
        ...istek.headers,
        // Oturum çerezinin `Secure` işareti bu başlıktan türetiliyor
        // (bkz. lib/oturum.ts). HTTPS üzerinden geldiğini böyle bildiriyoruz.
        "x-forwarded-proto": "https",
        "x-forwarded-host": istek.headers.host ?? "",
      },
    },
    (vekilCevabi) => {
      cevap.writeHead(vekilCevabi.statusCode ?? 502, vekilCevabi.headers);
      vekilCevabi.pipe(cevap, { end: true });
    },
  );

  vekil.on("error", (hata) => {
    cevap.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    cevap.end(
      `Next sunucusuna ulaşılamadı (127.0.0.1:${HEDEF_PORT}).\n` +
        `Önce 'npm start' ile Next'i başlat.\n\n${hata.message}`,
    );
  });

  istek.pipe(vekil, { end: true });
});

// WebSocket (Next'in canlı yenileme kanalı) yükseltmelerini de aktar.
sunucu.on("upgrade", (istek, soket, baslik) => {
  const vekil = http.request({
    host: "127.0.0.1",
    port: HEDEF_PORT,
    method: istek.method,
    path: istek.url,
    headers: istek.headers,
  });
  vekil.on("upgrade", (vekilCevabi, vekilSoket, vekilBaslik) => {
    soket.write(
      `HTTP/1.1 101 Switching Protocols\r\n` +
        Object.entries(vekilCevabi.headers)
          .map(([a, d]) => `${a}: ${d}\r\n`)
          .join("") +
        "\r\n",
    );
    vekilSoket.write(vekilBaslik);
    vekilSoket.pipe(soket).pipe(vekilSoket);
  });
  vekil.on("error", () => soket.destroy());
  vekil.end(baslik);
});

/**
 * Hangi arayüzde dinlensin?
 *
 *   varsayılan (AG=1)  → 0.0.0.0, aynı WiFi/ağdaki cihazlar da girebilir
 *   AG=0               → yalnızca 127.0.0.1, sadece bu bilgisayar
 *
 * Her iki hâlde de site YALNIZCA yerel ağda; internete açık değil. Dışarıdan
 * erişim için modemde port yönlendirme gerekir, o da yapılmadı.
 */
const AGA_ACIK = process.env.AG !== "0";
const ARAYUZ = AGA_ACIK ? "0.0.0.0" : "127.0.0.1";

/** Aynı ağdaki cihazların yazacağı adresler. */
function yerelAgAdresleri() {
  const adresler = [];
  for (const [ad, arayuzler] of Object.entries(os.networkInterfaces())) {
    if (/vEthernet|VirtualBox|VMware|Loopback|WSL|Docker/i.test(ad)) continue;
    for (const a of arayuzler ?? []) {
      if (a.family === "IPv4" && !a.internal && !a.address.startsWith("169.254.")) {
        adresler.push(a.address);
      }
    }
  }
  return [...new Set(adresler)];
}

sunucu.listen(HTTPS_PORT, ARAYUZ, () => {
  const ek = HTTPS_PORT === 443 ? "" : `:${HTTPS_PORT}`;
  console.log(`HTTPS hazır → https://neyersin.local${ek}`);
  if (AGA_ACIK) {
    for (const ip of yerelAgAdresleri()) {
      console.log(`  aynı ağdaki cihazlar → https://${ip}${ek}`);
    }
    console.log("  (yalnızca yerel ağ — internete açık değil)");
  } else {
    console.log("  (yalnızca bu bilgisayar)");
  }
  console.log(`  istekler 127.0.0.1:${HEDEF_PORT} adresindeki Next'e iletiliyor`);
});
