/**
 * Ortak paketin dis yuzu.
 *
 * Uygulamalar yalnizca buradan import ediyor (`import { renk } from "ortak"`).
 * Dosya yollarina dogrudan girilmiyor ki ic yapi degistiginde iki uygulamada
 * birden import duzeltmek gerekmesin.
 */

export * from "./tasarim";
export * from "./tipler";
export * from "./api/istemci";
export * from "./api/hesap";
export * from "./api/katalog";
export * from "./api/kurye";
export * from "./api/mutfak";
export * from "./api/siparis";
export * from "./api/yonetim";
