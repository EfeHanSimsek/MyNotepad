# Atlas Notes Database Schema

Bu şema mevcut local-first uygulama modelinin backend'e taşınabilir halidir. İlk sürüm tarayıcıda `localStorage` ile çalışır; aynı alanlar PostgreSQL, SQLite veya IndexedDB katmanına doğrudan taşınabilir.

## Core Tables

### users

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid pk | Kullanıcı kimliği |
| name | text | Görünen ad |
| email | citext unique | Login alanı |
| password_hash | text | Argon2id veya bcrypt |
| role | text | owner, member |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |
| deleted_at | timestamptz null | Hesap silme için soft delete |

### notes

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid pk |  |
| owner_id | uuid fk users.id | Row-level ownership |
| folder_id | uuid fk folders.id null | Varsayılan klasör opsiyonel |
| title | text | Aramada ağırlıklı |
| content | text | Markdown kaynak |
| is_favorite | boolean |  |
| is_pinned | boolean |  |
| is_archived | boolean |  |
| is_encrypted | boolean | Şifreli not işareti |
| is_shared | boolean | Paylaşım hızlı filtresi |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |
| deleted_at | timestamptz null | Çöp kutusu |

Index önerileri: `(owner_id, updated_at desc)`, `(owner_id, is_pinned)`, full-text index `to_tsvector(title || content)`.

### note_blocks

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid pk |  |
| note_id | uuid fk notes.id |  |
| type | text | paragraph, heading, todo, quote, code, callout, table, media |
| content | text | Blok içerik |
| sort_order | integer | Drag and drop sırası |
| checked | boolean null | Todo blokları |
| metadata | jsonb | Medya, tablo, callout ayarları |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

### folders

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid pk |  |
| owner_id | uuid fk users.id |  |
| parent_id | uuid fk folders.id null | İç içe klasör |
| name | text |  |
| color | text | UI swatch |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |
| deleted_at | timestamptz null |  |

### tags and note_tags

`tags`: `id`, `owner_id`, `name`, `color`, `created_at`, `updated_at`.

`note_tags`: `note_id`, `tag_id`, `created_at`. Composite primary key: `(note_id, tag_id)`.

### attachments

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid pk |  |
| note_id | uuid fk notes.id |  |
| owner_id | uuid fk users.id | Yetki doğrulama |
| name | text | Orijinal dosya adı |
| mime_type | text | Sunucu doğrulamalı |
| size_bytes | bigint | Limit kontrolü |
| storage_key | text | Object storage path |
| checksum | text | Dedup ve bütünlük |
| ocr_text | text null | OCR sonrası arama |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |
| deleted_at | timestamptz null |  |

### tasks

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid pk |  |
| owner_id | uuid fk users.id |  |
| note_id | uuid fk notes.id null | Not içi görev bağlantısı |
| title | text |  |
| description | text |  |
| due_date | timestamptz null |  |
| priority | text | low, medium, high |
| status | text | todo, in-progress, done |
| reminder_at | timestamptz null | Bildirim |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |
| deleted_at | timestamptz null |  |

### note_versions

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid pk |  |
| note_id | uuid fk notes.id |  |
| title | text | Snapshot |
| content | text | Snapshot |
| created_by | uuid fk users.id |  |
| created_at | timestamptz |  |

### sharing and collaboration

`shared_notes`: `id`, `note_id`, `permission`, `public_token_hash`, `expires_at`, `created_at`, `updated_at`.

`comments`: `id`, `note_id`, `block_id`, `author_id`, `body`, `resolved`, `created_at`, `updated_at`.

`notifications`: `id`, `user_id`, `type`, `title`, `body`, `read`, `created_at`.

### canvas

`canvases`: `id`, `owner_id`, `name`, `created_at`, `updated_at`, `deleted_at`.

`canvas_nodes`: `id`, `canvas_id`, `type`, `ref_id`, `title`, `x`, `y`, `width`, `height`, `color`, `metadata`.

`canvas_edges`: `id`, `canvas_id`, `from_node_id`, `to_node_id`, `label`, `color`.

### saved queries, settings, audit

`search_saved_queries`: `id`, `owner_id`, `name`, `query`, `created_at`.

`user_settings`: `user_id`, `theme`, `font_family`, `font_size`, `line_height`, `autosave_ms`, `default_folder_id`, `default_template_id`, `ai_enabled`, `ai_consent`, `notifications_enabled`, `sync_enabled`, `lock_after_minutes`, `updated_at`.

`audit_logs`: `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`.

## Security Controls

- Tüm not sorguları `owner_id = current_user.id` filtresi veya database row-level security ile çalışmalı.
- Parolalar Argon2id ile hashlenmeli; refresh tokenlar hashlenmiş saklanmalı ve rotasyon uygulanmalı.
- Markdown HTML çıktısı sanitize edilmeli. Mevcut frontend `DOMPurify` kullanır.
- Dosya yüklemede boyut, MIME, uzantı, checksum, virüs taraması ve object storage izinleri kontrol edilmeli.
- Paylaşım linklerinde ham token yerine hash saklanmalı; izinler `view`, `comment`, `edit` olarak ayrılmalı.
- AI özellikleri kapalı varsayılan gelir. Kullanıcı açık rıza vermeden özel not içeriği dış servise gönderilmemeli.
- Audit log, paylaşım, export, silme, login ve yetki değişiklikleri için tutulmalı.

## Offline-first Sync Strategy

1. Her değişiklik local store'a yazılır ve `updated_at` güncellenir.
2. Arka plan sync kuyruğu entity, operation, payload ve client timestamp saklar.
3. Sunucu dönüşünde canonical version alınır.
4. Çakışmada aynı notun iki versiyonu diff ekranına düşer.
5. Snapshot sistemi `note_versions` ile veri kaybını azaltır.

## MVP Coverage

Mevcut uygulamada çalışan ilk sürüm kapsamı:

- Dashboard, not listesi, responsive sidebar.
- Markdown editör, canlı önizleme, autosave, kelime/karakter/okuma süresi.
- Klasör, etiket, favori, sabitleme, arşiv, çöp kutusu alanları.
- Arama operatörleri: `tag:`, `folder:`, `has:attachment`, `has:task`, `is:favorite`, `is:pinned`.
- Dosya eki ekleme ve güvenli dosya türü kontrolü.
- Görev sayfası, öncelik ve durum yönetimi.
- Şablonlar, günlük/takvim görünümü, graph ve canvas başlangıç altyapısı.
- Markdown, JSON ve PDF export.
- Tema, editör, AI rızası, gizlilik ve veri export ayarları.
