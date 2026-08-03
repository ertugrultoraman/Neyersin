import { AramaSaglayici } from "@/components/anasayfa/AramaBaglami";
import { AnketSeridi } from "@/components/anasayfa/AnketSeridi";
import { AyinHanimlari } from "@/components/anasayfa/AyinHanimlari";
import { CagriBandi } from "@/components/anasayfa/CagriBandi";
import { Ekranlar } from "@/components/anasayfa/Ekranlar";
import { EvHanimiCagrisi } from "@/components/anasayfa/EvHanimiCagrisi";
import { GirisSecimi } from "@/components/anasayfa/GirisSecimi";
import { Hero } from "@/components/anasayfa/Hero";
import { Kampanyalar } from "@/components/anasayfa/Kampanyalar";
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
      <KategoriRayi />
      <Kampanyalar />
      <OneCikanlar />
      <RozetSeridi />
      <NasilCalisir />
      <Ekranlar />
      <TeslimatTakibi />
      <Restoranlar />
      {/* Anket sağda; mutfak listesinden sonra, ev hanımları bölümünden önce. */}
      <AnketSeridi />
      <AyinHanimlari />
      <EvHanimiCagrisi />
      <MobilUygulama />
      <Sss />
      <CagriBandi />
    </AramaSaglayici>
  );
}
