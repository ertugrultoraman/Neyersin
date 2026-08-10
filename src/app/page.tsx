import { AnketBolumu } from "@/components/anasayfa/AnketBolumu";
import { AramaSaglayici } from "@/components/anasayfa/AramaBaglami";
import { AyinHanimlari } from "@/components/anasayfa/AyinHanimlari";
import { CagriBandi } from "@/components/anasayfa/CagriBandi";
import { Ekranlar } from "@/components/anasayfa/Ekranlar";
import { EvHanimiCagrisi } from "@/components/anasayfa/EvHanimiCagrisi";
import { GirisSecimi } from "@/components/anasayfa/GirisSecimi";
import { Hero } from "@/components/anasayfa/Hero";
import { KampanyaBolumu } from "@/components/anasayfa/KampanyaBolumu";
import { KategoriRayi } from "@/components/anasayfa/KategoriRayi";
import { MobilUygulama } from "@/components/anasayfa/MobilUygulama";
import { NasilCalisir } from "@/components/anasayfa/NasilCalisir";
import { OneCikanlar } from "@/components/anasayfa/OneCikanlar";
import { Restoranlar } from "@/components/anasayfa/Restoranlar";
import { RozetSeridi } from "@/components/anasayfa/RozetSeridi";
import { Sss } from "@/components/anasayfa/Sss";
import { TeslimatTakibi } from "@/components/anasayfa/TeslimatTakibi";

export default function AnaSayfa() {
  return (
    <AramaSaglayici>
      {/* Siteye ilk girişte "Şeflerin Elinden / İşletmeler" seçim ekranı */}
      <GirisSecimi />
      <Hero />
      {/*
        ANKETLER içeriğin sağındaki ve solundaki boşlukta duruyor (geniş ekran)
        ya da burada, akışta alt alta (telefon/tablet). Yerleşim tamamen CSS
        ile: bkz. globals.css → "ANKET RAYLARI". Sayfada bu noktada durması
        yalnızca dar ekrandaki sırasını belirliyor.
      */}
      <AnketBolumu />
      <KategoriRayi />
      <KampanyaBolumu />
      <OneCikanlar />
      <RozetSeridi />
      <NasilCalisir />
      <Ekranlar />
      <TeslimatTakibi />
      <Restoranlar />
      <AyinHanimlari />
      <EvHanimiCagrisi />
      <MobilUygulama />
      <Sss />
      <CagriBandi />
    </AramaSaglayici>
  );
}
