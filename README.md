# Atlas Notes

Atlas Notes, Electron tabanlı local-first masaüstü not defteri ve bilgi yönetimi uygulamasıdır. İlk sürüm; not oluşturma, markdown/zengin önizleme, klasörler, etiketler, görevler, arama operatörleri, dosya eki altyapısı, tema ayarları, markdown/pdf export ve responsive arayüz içerir.

## Çalıştırma

```powershell
npm run desktop
```

Bu komut production renderer build alır ve uygulamayı masaüstü penceresi olarak açar.

Geliştirme modunda hızlı yenileme ile çalıştırmak için:

```powershell
npm run desktop:dev
```

## Üretim derlemesi

```powershell
npm run build
```

## Mimari

- `src/domain`: Veri modelleri ve seed veriler.
- `src/store`: Local-first state, autosave ve versiyon snapshot mantığı.
- `src/services`: Arama, export, markdown ve güvenlik yardımcıları.
- `src/components`: Yeniden kullanılabilir UI parçaları.
- `src/styles`: Tema, layout ve responsive tasarım.
- `electron`: Masaüstü ana süreç ve güvenli preload katmanı.
- `docs/database-schema.md`: İlişkisel veri modeli ve ileride backend'e taşınabilecek şema.
