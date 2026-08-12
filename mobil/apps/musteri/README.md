# Ne Yersin? — Müşteri uygulaması

iOS/Android müşteri uygulaması. Ortak kod (API istemcisi, tasarım dili, UI
ilkelleri, oturum mantığı) `packages/ortak` içinde; kurye uygulamasıyla
paylaşılıyor.

## Geliştirme

```bash
npm install                 # depo kökünden (npm workspaces)
npx expo start --dev-client
```

### API adresi

Geliştirmede API adresi **`eas.json`'dan gelmiyor**. `developmentClient`
açıkken JS paketi Metro'dan servis ediliyor ve `app.config.ts`, `expo start`
komutunu çalıştıran kabukta çözümleniyor. Adresi orada ver:

```bash
EXPO_PUBLIC_API_TABAN=http://192.168.0.5:3000 npx expo start --dev-client
```

Verilmezse `https://neyersin.net` kullanılıyor. Telefon geliştirme makinesinin
`localhost`'una ulaşamaz — yerel sunucuyu test ederken makinenin LAN adresini
yaz.

Google Maps için `GOOGLE_MAPS_ANAHTARI` ortam değişkeni (bu uygulamanın paketi:
`net.neyersin.app`). Verilmezse harita yapılandırması eklenmiyor.

## Derleme

`eas.json` bu klasörde; EAS komutları da buradan çalıştırılıyor.

```bash
eas build --platform android --profile preview      # dahili test APK'sı
eas build --platform all --profile production       # mağaza sürümü
```

Profiller: `development` (dev-client APK), `preview` (dahili dağıtım APK),
`production` (mağaza; Android app bundle, sürüm numarası EAS'te artıyor).
