import { AramaSaglayici } from "@/components/anasayfa/AramaBaglami";
import { AyinHanimlari } from "@/components/anasayfa/AyinHanimlari";
import { BlogOnizleme } from "@/components/anasayfa/BlogOnizleme";
import { CagriBandi } from "@/components/anasayfa/CagriBandi";
import { Ekranlar } from "@/components/anasayfa/Ekranlar";
import { Hero } from "@/components/anasayfa/Hero";
import { Kampanyalar } from "@/components/anasayfa/Kampanyalar";
import { KategoriRayi } from "@/components/anasayfa/KategoriRayi";
import { MobilUygulama } from "@/components/anasayfa/MobilUygulama";
import { NasilCalisir } from "@/components/anasayfa/NasilCalisir";
import { OneCikanlar } from "@/components/anasayfa/OneCikanlar";
import { Restoranlar } from "@/components/anasayfa/Restoranlar";
import { RozetSeridi } from "@/components/anasayfa/RozetSeridi";
import { SektorOnizleme } from "@/components/anasayfa/SektorOnizleme";
import { Sss } from "@/components/anasayfa/Sss";
import { TeslimatTakibi } from "@/components/anasayfa/TeslimatTakibi";

export default function AnaSayfa() {
  return (
    <AramaSaglayici>
      <Hero />
      <KategoriRayi />
      <Kampanyalar />
      <OneCikanlar />
      <RozetSeridi />
      <NasilCalisir />
      <Ekranlar />
      <TeslimatTakibi />
      <Restoranlar />
      <AyinHanimlari />
      <SektorOnizleme />
      <MobilUygulama />
      <BlogOnizleme />
      <Sss />
      <CagriBandi />
    </AramaSaglayici>
  );
}
