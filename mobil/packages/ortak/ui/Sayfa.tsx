import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bosluk, renk } from "../src/tasarim";

import { Metin } from "./Metin";

/**
 * Ekranların ortak kabuğu: güvenli alan boşlukları + başlık.
 *
 * `SafeAreaView` yerine `useSafeAreaInsets` kullanılıyor. `SafeAreaView`
 * boşluğu bir View'a padding olarak basıyor ve o View kaydırılabilir alanın
 * DIŞINDA kalıyor; sonuç, çentik altında sabit duran beyaz bir şerit ve
 * altına kayan içerik oluyor. Boşluğu doğrudan `contentContainerStyle`e
 * vermek, içeriğin çentiğin altından geçip kaymasını sağlıyor.
 */
export function Sayfa({
  baslik,
  altBaslik,
  children,
  kaydirilabilir = true,
}: {
  baslik?: string;
  altBaslik?: string;
  children: ReactNode;
  kaydirilabilir?: boolean;
}) {
  const kenar = useSafeAreaInsets();

  const govde = (
    <>
      {baslik ? (
        <View style={{ marginBottom: bosluk.xl }}>
          <Metin baslik boyut="3xl">
            {baslik}
          </Metin>
          {altBaslik ? (
            <Metin boyut="sm" renkli={renk.metinIkincil} style={{ marginTop: bosluk.xs }}>
              {altBaslik}
            </Metin>
          ) : null}
        </View>
      ) : null}
      {children}
    </>
  );

  if (!kaydirilabilir) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: renk.beyaz,
          paddingHorizontal: bosluk.xl,
          paddingTop: kenar.top + bosluk.xl,
          paddingBottom: kenar.bottom,
        }}
      >
        {govde}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: renk.beyaz }}
      contentContainerStyle={{
        paddingHorizontal: bosluk.xl,
        paddingTop: kenar.top + bosluk.xl,
        paddingBottom: kenar.bottom + bosluk["2xl"],
      }}
    >
      {govde}
    </ScrollView>
  );
}

/**
 * Henüz yazılmamış ekranlar için dürüst yer tutucu.
 *
 * Boş bir ekran ya da sahte veri göstermek yerine ne olduğunu söylüyor:
 * uygulamayı deneyen kişi "bozuk mu, yoksa daha yapılmadı mı" diye
 * düşünmesin. Ekran gerçek içeriğiyle geldiğinde bu bileşen kaldırılıyor.
 */
export function Yakinda({ ne }: { ne: string }) {
  return (
    <View
      style={{
        borderRadius: 20,
        borderWidth: 1,
        borderColor: renk.cizgi,
        backgroundColor: renk.krem,
        padding: bosluk.xl,
        gap: bosluk.sm,
      }}
    >
      <Metin baslik boyut="lg">
        Yapım aşamasında
      </Metin>
      <Metin boyut="sm" renkli={renk.metinIkincil}>
        {ne}
      </Metin>
    </View>
  );
}
