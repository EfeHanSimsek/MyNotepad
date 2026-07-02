import type { AppState, Note, NoteVersion } from "./types";

const now = new Date();
const iso = (offsetDays = 0) => new Date(now.getTime() + offsetDays * 86400000).toISOString();

export const seedState: AppState = {
  user: {
    id: "user-1",
    name: "Efe",
    email: "efe@example.com",
    role: "owner",
    avatar: "EF",
    createdAt: iso(-30),
    updatedAt: iso()
  },
  folders: [
    { id: "inbox", name: "Gelen Kutusu", color: "#2f6fed", createdAt: iso(-20), updatedAt: iso(-2) },
    { id: "work", name: "Projeler", color: "#0f9f6e", createdAt: iso(-18), updatedAt: iso(-1) },
    { id: "research", name: "Araştırma", color: "#a855f7", parentId: "work", createdAt: iso(-16), updatedAt: iso(-1) },
    { id: "journal", name: "Günlük", color: "#f97316", createdAt: iso(-10), updatedAt: iso() }
  ],
  tags: [
    { id: "tag-product", name: "ürün", color: "#2f6fed", createdAt: iso(-12), updatedAt: iso() },
    { id: "tag-meeting", name: "toplantı", color: "#0f9f6e", createdAt: iso(-11), updatedAt: iso() },
    { id: "tag-idea", name: "fikir", color: "#f97316", createdAt: iso(-9), updatedAt: iso() },
    { id: "tag-private", name: "özel", color: "#ef4444", createdAt: iso(-8), updatedAt: iso() }
  ],
  notes: [
    {
      id: "note-1",
      ownerId: "user-1",
      title: "Atlas Notes ürün planı",
      folderId: "work",
      tagIds: ["tag-product", "tag-idea"],
      isFavorite: true,
      isPinned: true,
      isArchived: false,
      isEncrypted: false,
      isShared: false,
      createdAt: iso(-6),
      updatedAt: iso(-1),
      content:
        "# Atlas Notes ürün planı\n\nModern bir bilgi yönetimi uygulaması için ilk sürüm kapsamı.\n\n- [ ] Zengin markdown editörü\n- [x] Local-first autosave\n- [ ] Graph görünümü\n\n[[Haftalık plan]] ile bağlantılı.\n\n> Odak: hızlı, sade ve güvenli not deneyimi.\n\n```ts\nconst autosave = debounce(saveNote, 800);\n```\n\n::callout Bilgi\nVeri modeli backend'e taşınmaya hazır tutulur.\n::"
    },
    {
      id: "note-2",
      ownerId: "user-1",
      title: "Haftalık plan",
      folderId: "journal",
      tagIds: ["tag-meeting"],
      isFavorite: false,
      isPinned: true,
      isArchived: false,
      isEncrypted: false,
      isShared: true,
      createdAt: iso(-3),
      updatedAt: iso(),
      content:
        "# Haftalık plan\n\n## Öncelikler\n\n1. Not editörü kullanılabilirliği\n2. Arama operatörleri\n3. Export akışı\n\n- [ ] Pazartesi ürün toplantısı\n- [ ] Cuma demo hazırlığı\n\nBağlantı: [[Atlas Notes ürün planı]]"
    },
    {
      id: "note-3",
      ownerId: "user-1",
      title: "Araştırma kaynakları",
      folderId: "research",
      tagIds: ["tag-product"],
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isEncrypted: false,
      isShared: false,
      createdAt: iso(-2),
      updatedAt: iso(-2),
      content:
        "# Araştırma kaynakları\n\n| Ürün | Güçlü taraf |\n| --- | --- |\n| Obsidian | Backlink ve graph |\n| Notion | Blok editörü |\n| Joplin | Açık kaynak ve offline |\n\n```mermaid\ngraph TD\nA[Not] --> B[Etiket]\nA --> C[Backlink]\n```"
    }
  ],
  tasks: [
    {
      id: "task-1",
      noteId: "note-1",
      title: "Markdown export doğrula",
      description: "Seçili not ve tüm notlar için export akışını test et.",
      dueDate: iso(1),
      priority: "high",
      status: "in-progress",
      tagIds: ["tag-product"],
      reminderAt: iso(1),
      createdAt: iso(-4),
      updatedAt: iso()
    },
    {
      id: "task-2",
      noteId: "note-2",
      title: "Haftalık demo notu hazırla",
      description: "Dashboard metriklerini ve graph görünümünü gözden geçir.",
      dueDate: iso(3),
      priority: "medium",
      status: "todo",
      tagIds: ["tag-meeting"],
      createdAt: iso(-2),
      updatedAt: iso()
    }
  ],
  templates: [
    { id: "tpl-blank", name: "Boş not", description: "Temiz başlangıç", content: "# Başlıksız not\n\n", isDefault: true, createdAt: iso(-5), updatedAt: iso() },
    { id: "tpl-meeting", name: "Toplantı notu", description: "Ajanda, kararlar ve aksiyonlar", content: "# Toplantı notu\n\n## Ajanda\n\n## Kararlar\n\n## Aksiyonlar\n- [ ] ", createdAt: iso(-5), updatedAt: iso() },
    { id: "tpl-daily", name: "Günlük not", description: "Gün planı ve kısa değerlendirme", content: "# Günlük not\n\n## Odak\n\n## Notlar\n\n## Kapanış\n", createdAt: iso(-5), updatedAt: iso() },
    { id: "tpl-bug", name: "Hata raporu", description: "Teknik problem takibi", content: "# Hata raporu\n\n## Beklenen\n\n## Gerçekleşen\n\n## Adımlar\n\n## Öncelik\n", createdAt: iso(-5), updatedAt: iso() }
  ],
  attachments: [
    { id: "att-1", noteId: "note-3", name: "research-outline.pdf", type: "application/pdf", size: 184000, url: "#", ocrText: "Obsidian Notion Joplin araştırma", createdAt: iso(-2), updatedAt: iso(-2) }
  ],
  versions: [],
  sharedNotes: [{ id: "share-1", noteId: "note-2", permission: "comment", publicToken: "demo-token", createdAt: iso(-1), updatedAt: iso() }],
  comments: [{ id: "comment-1", noteId: "note-2", authorId: "user-1", body: "Demo öncesi task durumlarını güncelle.", resolved: false, createdAt: iso(-1), updatedAt: iso() }],
  notifications: [
    { id: "notif-1", type: "task", title: "Yaklaşan görev", body: "Markdown export doğrulaması yarın.", read: false, createdAt: iso() },
    { id: "notif-2", type: "sync", title: "Local-first aktif", body: "Değişiklikler bu cihazda güvenle saklanıyor.", read: true, createdAt: iso(-1) }
  ],
  canvases: [
    {
      id: "canvas-1",
      name: "Ürün haritası",
      createdAt: iso(-1),
      updatedAt: iso(),
      nodes: [
        { id: "node-1", canvasId: "canvas-1", type: "note", refId: "note-1", title: "Ürün planı", x: 120, y: 120, width: 190, height: 110, color: "#2f6fed" },
        { id: "node-2", canvasId: "canvas-1", type: "text", title: "Graph + backlink", x: 390, y: 210, width: 180, height: 100, color: "#0f9f6e" }
      ],
      edges: [{ id: "edge-1", canvasId: "canvas-1", fromNodeId: "node-1", toNodeId: "node-2", label: "sonraki", color: "#62748e" }]
    }
  ],
  savedQueries: [{ id: "query-1", name: "Favori ürün notları", query: "tag:ürün is:favorite", createdAt: iso(-1) }],
  auditLogs: [],
  settings: {
    theme: "system",
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 1.65,
    autosaveMs: 700,
    defaultFolderId: "inbox",
    defaultTemplateId: "tpl-blank",
    aiEnabled: false,
    aiConsent: false,
    notificationsEnabled: true,
    syncEnabled: true,
    lockAfterMinutes: 15
  },
  lastSyncAt: iso()
};

export function createVersion(note: Note, userId: string): NoteVersion {
  return {
    id: crypto.randomUUID(),
    noteId: note.id,
    title: note.title,
    content: note.content,
    createdBy: userId,
    createdAt: new Date().toISOString()
  };
}
