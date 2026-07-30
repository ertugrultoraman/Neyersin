/**
 * `iyzipay` resmî SDK'sı tip tanımı içermiyor. Burada yalnızca bu projede
 * kullanılan yüzeyi tanımlıyoruz — tamamını değil.
 */
declare module "iyzipay" {
  export type IyzipayAyar = {
    apiKey: string;
    secretKey: string;
    uri: string;
  };

  export type SepetKalemi = {
    id: string;
    name: string;
    category1: string;
    itemType: string;
    price: string;
  };

  export type Alici = {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    zipCode?: string;
  };

  export type Adres = {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode?: string;
  };

  export type CheckoutFormIstegi = {
    locale: string;
    conversationId: string;
    price: string;
    paidPrice: string;
    currency: string;
    basketId: string;
    paymentGroup: string;
    callbackUrl: string;
    enabledInstallments: number[];
    buyer: Alici;
    shippingAddress: Adres;
    billingAddress: Adres;
    basketItems: SepetKalemi[];
  };

  export type CheckoutFormCevabi = {
    status: "success" | "failure";
    errorCode?: string;
    errorMessage?: string;
    locale?: string;
    conversationId?: string;
    token?: string;
    checkoutFormContent?: string;
    paymentPageUrl?: string;
    tokenExpireTime?: number;
    signature?: string;
  };

  export type CheckoutFormSonucu = {
    status: "success" | "failure";
    errorCode?: string;
    errorMessage?: string;
    paymentStatus?: string;
    paymentId?: string;
    currency?: string;
    basketId?: string;
    conversationId?: string;
    paidPrice?: string;
    price?: string;
    token?: string;
    signature?: string;
    fraudStatus?: number;
    mdStatus?: string;
  };

  type GeriCagri<T> = (hata: Error | null, sonuc: T) => void;

  export default class Iyzipay {
    constructor(ayar: IyzipayAyar);

    static LOCALE: { TR: string; EN: string };
    static CURRENCY: { TRY: string; EUR: string; USD: string; GBP: string };
    static PAYMENT_GROUP: { PRODUCT: string; LISTING: string; SUBSCRIPTION: string };
    static BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };

    checkoutFormInitialize: {
      create(istek: CheckoutFormIstegi, cb: GeriCagri<CheckoutFormCevabi>): void;
    };

    checkoutForm: {
      retrieve(
        istek: { locale: string; conversationId?: string; token: string },
        cb: GeriCagri<CheckoutFormSonucu>,
      ): void;
    };
  }
}
