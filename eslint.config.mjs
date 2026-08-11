import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    /*
     * Derleme çıktısı denetlenmez. `.next-yerel` listede yoktu: yerel üretim
     * derlemesi (bkz. next.config.ts → distDir) alınır alınmaz eslint üretilmiş
     * dosyaları da tarayıp on binlerce uyarı basıyor ve gerçek sorunlar
     * kayboluyordu.
     */
    ignores: [
      ".next/**",
      ".next-yerel/**",
      "node_modules/**",
      "out/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // İçerik dosyalarında Türkçe tırnak ve kesme işaretleri metin olarak geçiyor;
      // JSX metinlerinde kaçış zorunluluğunu okunabilirlik için gevşetiyoruz.
      "react/no-unescaped-entities": "off",
    },
  },
];

export default config;
