# Atlas Notes Architecture

## Desktop Shell

Uygulama Electron ile masaüstü uygulaması olarak çalışır. `electron/main.cjs` güvenli `BrowserWindow` oluşturur, production modunda `dist/index.html` dosyasını yükler, geliştirme modunda Vite dev server'a bağlanır. `electron/preload.cjs` yalnızca sınırlı desktop metadata bilgisini renderer'a açar; `nodeIntegration` kapalı ve `contextIsolation` açıktır.

## Renderer

Vite, React ve TypeScript kullanılır. Uygulama ilk sürümde tamamen local-first çalışır; bu sayede internet yokken not oluşturma ve düzenleme akışı kesilmez.

Ana modüller:

- `src/domain`: Ürün veri modelleri.
- `src/store`: Kalıcı local state, autosave ve note version snapshot.
- `src/services/markdown.ts`: Markdown render, backlink ve okuma metriği.
- `src/services/search.ts`: Operatörlü tam metin arama.
- `src/services/export.ts`: Markdown, JSON ve PDF export.
- `src/services/security.ts`: Dosya yükleme ve AI gizlilik yardımcıları.
- `src/App.tsx`: İlk sürüm ürün kabuğu ve sayfalar.
- `src/styles/app.css`: Tema, responsive layout ve UI sistemi.
- `electron/main.cjs`: Masaüstü pencere, menü ve dış link yönetimi.
- `electron/preload.cjs`: Güvenli renderer köprüsü.

## Product Decisions

- Editör markdown kaynak + canlı önizleme olarak tasarlandı. Blok tabanlı modele geçiş için `NoteBlock` tipi ve `note_blocks` şeması hazır.
- AI varsayılan olarak kapalıdır. `aiEnabled` ve `aiConsent` ayrıdır; özellik açık olsa bile açık rıza yoksa özel içerik gönderilmez.
- Dosya yükleme ilk sürümde tarayıcı object URL ile temsil edilir. Backend aşamasında object storage, MIME doğrulama, checksum ve tarama eklenmelidir.
- Graph view `[[Not Başlığı]]` söz dizimiyle edge üretir.
- Export kullanıcı verisini uygulamaya hapsetmemek için ilk sürümde aktif tutuldu.

## Roadmap Boundaries

MVP:

- Kullanıcı alanı ve güvenlik modeli.
- Not CRUD, markdown editör, autosave.
- Klasör, etiket, favori, pin, arama.
- Dosya eki ve temel export.
- Responsive arayüz, tema, görevler.

Phase 2:

- IndexedDB, import pipeline, gerçek version diff.
- Backlink önerileri, graph filtreleri, daily notes otomasyonu.
- Bildirim merkezi ve reminder worker.

Phase 3:

- Backend auth, sync queue, conflict resolution.
- OCR, speech-to-text, AI providers.
- Paylaşım, yorumlar ve gerçek zamanlı ortak düzenleme.
- Uçtan uca şifreleme veya client-side encrypted notes.
