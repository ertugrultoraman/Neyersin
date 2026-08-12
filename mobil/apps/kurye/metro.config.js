// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projeKoku = __dirname;
const calismaAlaniKoku = path.resolve(projeKoku, "../..");

const config = getDefaultConfig(projeKoku);

/** Ayrıntılı açıklama için bkz. apps/musteri/metro.config.js */
config.watchFolders = [calismaAlaniKoku];
config.resolver.nodeModulesPaths = [
  path.resolve(projeKoku, "node_modules"),
  path.resolve(calismaAlaniKoku, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
