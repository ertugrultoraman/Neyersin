#!/usr/bin/env node
/**
 * Ne Yersin? — yerel geliştirme için HTTPS sertifikası
 * ============================================================================
 *
 * Tarayıcının "Bu siteye bağlantınız güvenli değil" uyarısı, sitenin HTTP
 * üzerinden sunulmasından kaynaklanır. Bu script yerel bir sertifika otoritesi
 * (CA) ve ona bağlı bir sunucu sertifikası üretir. CA Windows'un güvenilen kök
 * deposuna eklendiğinde tarayıcı yeşil/nötr kilit gösterir.
 *
 * ÜRETİMDE GEREKMEZ: Vercel her alan adına ücretsiz ve otomatik sertifika verir.
 * Bu yalnızca `https://neyersin.local` gibi yerel adresler içindir.
 *
 * Kullanım:
 *   node scripts/sertifika-uret.mjs
 *   (sonra) npm run guven   → CA'yı Windows'a tanıtır (yönetici onayı ister)
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KLASOR = path.join(KOK, ".sertifika");
const ALAN_ADLARI = ["neyersin.local", "www.neyersin.local", "localhost"];

function calistir(args) {
  return execFileSync("openssl", args, { cwd: KLASOR, stdio: ["ignore", "pipe", "pipe"] });
}

function main() {
  mkdirSync(KLASOR, { recursive: true });

  if (existsSync(path.join(KLASOR, "sunucu.crt"))) {
    console.log("Sertifika zaten var: .sertifika/sunucu.crt");
    console.log("Yeniden üretmek için .sertifika klasörünü sil.");
    return;
  }

  // SAN (Subject Alternative Name) yapılandırması — modern tarayıcılar CN'e bakmaz.
  writeFileSync(
    path.join(KLASOR, "sunucu.cnf"),
    [
      "[req]",
      "distinguished_name = dn",
      "req_extensions = v3_req",
      "prompt = no",
      "",
      "[dn]",
      "CN = neyersin.local",
      "O = Ne Yersin Yerel Gelistirme",
      "",
      "[v3_req]",
      "basicConstraints = CA:FALSE",
      "keyUsage = digitalSignature, keyEncipherment",
      "extendedKeyUsage = serverAuth",
      "subjectAltName = @alt",
      "",
      "[alt]",
      ...ALAN_ADLARI.map((ad, i) => `DNS.${i + 1} = ${ad}`),
      "IP.1 = 127.0.0.1",
    ].join("\n"),
    "utf8",
  );

  console.log("1/4  Yerel sertifika otoritesi (CA) üretiliyor…");
  calistir(["genrsa", "-out", "ca.key", "2048"]);
  calistir([
    "req", "-x509", "-new", "-nodes", "-key", "ca.key", "-sha256", "-days", "3650",
    "-out", "ca.crt", "-subj", "/CN=Ne Yersin Yerel CA/O=Ne Yersin",
  ]);

  console.log("2/4  Sunucu anahtarı üretiliyor…");
  calistir(["genrsa", "-out", "sunucu.key", "2048"]);

  console.log("3/4  Sertifika isteği hazırlanıyor…");
  calistir(["req", "-new", "-key", "sunucu.key", "-out", "sunucu.csr", "-config", "sunucu.cnf"]);

  console.log("4/4  Sertifika imzalanıyor…");
  calistir([
    "x509", "-req", "-in", "sunucu.csr", "-CA", "ca.crt", "-CAkey", "ca.key",
    "-CAcreateserial", "-out", "sunucu.crt", "-days", "825", "-sha256",
    "-extfile", "sunucu.cnf", "-extensions", "v3_req",
  ]);

  console.log("");
  console.log("✓ Sertifika hazır: .sertifika/sunucu.crt");
  console.log(`  Geçerli alan adları: ${ALAN_ADLARI.join(", ")}`);
  console.log("");
  console.log("Sıradaki adım:  npm run guven   (CA'yı Windows'a tanıtır)");
  console.log("Sonra:          npm run start:https");
}

try {
  main();
} catch (hata) {
  console.error("");
  console.error("Sertifika üretilemedi:", hata instanceof Error ? hata.message : hata);
  console.error("openssl kurulu mu? (Git for Windows ile birlikte gelir)");
  process.exit(1);
}
