/**
 * Paylasilan arayuz ilkelleri.
 *
 * Iki uygulama da AYNI markayi konusuyor; bu bilesenler ekran degil, marka
 * dilinin kendisi. Uygulamalara kopyalansalardi biri digerinden sessizce
 * ayrilirdi — dugme yaricapi bir uygulamada degisip otekinde kalirdi.
 *
 * Ayri bir giris (`ortak/ui`): cekirdek `ortak` girisi React'e ve
 * react-native'e DOKUNMUYOR, saf mantik ve tip. Config eklentileri onu Node
 * icinde yukluyor; React bilesenleri oraya karissaydi yapilandirma okuma
 * asamasinda patlardi.
 */
export { Metin, type MetinProps } from "./Metin";
export { Dugme, Bosluk, type DugmeProps } from "./Dugme";
export { Alan, type AlanProps } from "./Alan";
export { Sayfa, Yakinda } from "./Sayfa";
