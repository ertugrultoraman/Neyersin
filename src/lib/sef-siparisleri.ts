import type { KayitliSiparis, SiparisDepo } from "./depo/tipler";

/**
 * Şefin göreceği siparişler: kendi mutfağınınkiler + kişisel olarak
 * kendisine atananlar.
 *
 * İKİ SORGU, TEK LİSTE. Depo katmanında "şu VEYA bu" diye bir süzgeç yok ve
 * eklemek, dosya deposu ile Postgres için iki ayrı mantık yazmak demekti.
 * İki küçük sorgu birleştirilip sipariş numarasına göre tekilleştiriliyor —
 * aynı sipariş her iki listede de olabilir (kendi mutfağının siparişi
 * kendisine atanmışsa).
 *
 * ORTAK DOSYADA, çünkü aynı liste İKİ ekranda birden çıkıyor: çalışma paneli
 * (/panel) ve hesabın sipariş geçmişi (/hesabim/siparisler). Panelde
 * düzeltilip hesap sayfasında unutulmuştu; şef panelinde gördüğü siparişi
 * "Aldığım siparişler" sekmesinde bulamıyordu. Tek yerde durunca ikisi
 * ayrışamıyor.
 */
export async function sefinSiparisleri(
  depo: SiparisDepo,
  restoranSlug: string | undefined,
  eposta: string,
  limit = 200,
): Promise<KayitliSiparis[]> {
  const [mutfagin, atanan] = await Promise.all([
    restoranSlug ? depo.listele({ restoranSlug, limit }) : Promise.resolve([]),
    depo.listele({ atananSef: eposta, limit }),
  ]);

  const gorulen = new Set<string>();
  return [...mutfagin, ...atanan]
    .filter((s) => (gorulen.has(s.siparisNo) ? false : gorulen.add(s.siparisNo)))
    .sort(
      (a, b) => new Date(b.olusturmaTarihi).getTime() - new Date(a.olusturmaTarihi).getTime(),
    );
}
