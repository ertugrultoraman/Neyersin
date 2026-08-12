// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");

/**
 * Monorepo ayari ELLE YAPILMIYOR.
 *
 * Bir ara `watchFolders`, `nodeModulesPaths` ve `disableHierarchicalLookup`
 * elle veriliyordu — eski Expo monorepo rehberinin onerisi buydu. Guncel
 * `expo/metro-config` calisma alani kokunu kendisi buluyor ve expo-doctor
 * `disableHierarchicalLookup: true` icin uyari veriyor: hiyerarsik aramayi
 * kapatmak, ust dizindeki node_modules'a guvenen paketlerin cozulmemesine
 * yol aciyor.
 *
 * Kapatmanin tek gerekcesi React'in iki kopyasinin cozulme riskiydi; npm
 * workspaces her ikisini de koke hoist ettigi icin (dogrulandi: tek kopya)
 * o risk zaten yok.
 */
module.exports = getDefaultConfig(__dirname);
