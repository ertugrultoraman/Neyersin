// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projeKoku = __dirname;
const calismaAlaniKoku = path.resolve(projeKoku, "../..");

const config = getDefaultConfig(projeKoku);

/**
 * Monorepo ayarı — `packages/ortak` iki uygulamada da paylaşılıyor.
 *
 * `watchFolders` olmadan Metro çalışma alanı kökünü izlemez ve ortak paketteki
 * değişiklik hot reload'a düşmez. `disableHierarchicalLookup` ise Metro'nun
 * yukarı doğru node_modules araması yapmasını kapatıyor; açık kalırsa React'in
 * iki ayrı kopyası çözülüp "invalid hook call" hatası çıkabiliyor.
 */
config.watchFolders = [calismaAlaniKoku];
config.resolver.nodeModulesPaths = [
  path.resolve(projeKoku, "node_modules"),
  path.resolve(calismaAlaniKoku, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
