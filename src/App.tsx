import { MouseEvent, PointerEvent, WheelEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Download,
  FileText,
  Folder,
  Gauge,
  GripVertical,
  HelpCircle,
  Image,
  LayoutDashboard,
  Link2,
  Lock,
  Menu,
  Moon,
  Network,
  Palette,
  PanelLeftClose,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Tag,
  Trash2,
  Upload,
  Wand2,
  X
} from "lucide-react";
import type { Note, Task, ThemeMode, ViewKey } from "./domain/types";
import { useAppStore } from "./store/useAppStore";
import { exportAllJson, exportNoteJson, exportNoteMarkdown, exportNotePdf } from "./services/export";
import { buildGraph } from "./services/graph";
import { extractBacklinks, extractTitle, getReadingStats, insertMarkdownCommand, renderMarkdown } from "./services/markdown";
import { searchNotes } from "./services/search";
import { validateUpload } from "./services/security";

const navItems: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "all", label: "Tüm notlar", icon: FileText },
  { key: "recent", label: "Son düzenlenen", icon: RefreshCw },
  { key: "favorites", label: "Favoriler", icon: Star },
  { key: "pinned", label: "Sabitlenen", icon: Pin },
  { key: "archive", label: "Arşiv", icon: Archive },
  { key: "trash", label: "Çöp kutusu", icon: Trash2 },
  { key: "folders", label: "Klasörler", icon: Folder },
  { key: "tags", label: "Etiketler", icon: Tag },
  { key: "tasks", label: "Görevler", icon: CheckSquare },
  { key: "calendar", label: "Takvim", icon: CalendarDays },
  { key: "daily", label: "Günlük notlar", icon: BookOpen },
  { key: "templates", label: "Şablonlar", icon: Wand2 },
  { key: "graph", label: "Bilgi grafiği", icon: Network },
  { key: "canvas", label: "Canvas", icon: GripVertical },
  { key: "attachments", label: "Dosyalar", icon: Paperclip },
  { key: "settings", label: "Ayarlar", icon: Settings },
  { key: "help", label: "Kısayollar", icon: HelpCircle }
];

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
    : "Tarih yok";

function resolveTheme(theme: ThemeMode) {
  if (theme === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  return theme;
}

export function App() {
  const store = useAppStore();
  const { state, activeNotes, syncStatus, createNote, updateNote, createTask, updateTask, addAttachment, setTheme, updateSettings, resetDemo } = store;
  const [view, setView] = useState<ViewKey>("dashboard");
  const [selectedId, setSelectedId] = useState(state.notes[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState("");

  const selectedNote = state.notes.find((note) => note.id === selectedId) ?? state.notes[0];

  useEffect(() => {
    document.documentElement.dataset.theme = resolveTheme(state.settings.theme);
  }, [state.settings.theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (mod && event.key.toLowerCase() === "n") {
        event.preventDefault();
        createNote();
        setView("all");
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createNote]);

  const notesForView = useMemo(() => {
    const base = [...state.notes].filter((note) => {
      if (view === "archive") return note.isArchived && !note.deletedAt;
      if (view === "trash") return Boolean(note.deletedAt);
      if (view === "favorites") return note.isFavorite && !note.deletedAt;
      if (view === "pinned") return note.isPinned && !note.deletedAt;
      return !note.deletedAt && !note.isArchived;
    });
    if (view === "recent") return base.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 20);
    return base.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [state.notes, view]);

  const searchResults = useMemo(() => searchNotes(state, query, notesForView), [state, query, notesForView]);
  const graph = useMemo(() => buildGraph(activeNotes), [activeNotes]);
  const readingStats = selectedNote ? getReadingStats(selectedNote.content) : { words: 0, characters: 0, readingMinutes: 0 };
  const backlinks = selectedNote ? extractBacklinks(selectedNote.content) : [];
  const incomingLinks = selectedNote
    ? activeNotes.filter((note) => note.id !== selectedNote.id && extractBacklinks(note.content).some((title) => title.toLowerCase() === selectedNote.title.toLowerCase()))
    : [];

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function handleCreateNote(templateId?: string) {
    createNote(templateId);
    setView("all");
    notify("Yeni not oluşturuldu.");
  }

  function handleContentChange(note: Note, content: string) {
    updateNote(note.id, { content, title: extractTitle(content) });
  }

  function handleFile(note: Note, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const validation = validateUpload(file);
    if (!validation.ok) {
      notify(validation.reason);
      return;
    }
    addAttachment(note.id, file);
    notify("Dosya eklendi.");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>Atlas Notes</strong>
            <span>Local-first workspace</span>
          </div>
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Menüyü kapat">
            <X size={18} />
          </button>
        </div>

        <button className="primary-action" onClick={() => handleCreateNote()}>
          <Plus size={18} /> Yeni not
        </button>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={view === item.key ? "active" : ""}
                onClick={() => {
                  setView(item.key);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sync-pill">
            <span className={`status-dot ${syncStatus}`} />
            {syncStatus === "saving" ? "Kaydediliyor" : syncStatus === "error" ? "Sync hatası" : "Kaydedildi"}
          </div>
          <div className="profile-chip">
            <div>{state.user.avatar}</div>
            <span>{state.user.name}</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Menüyü aç">
            <Menu size={19} />
          </button>
          <div className="search-box">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ara: tag:ürün has:task is:pinned" />
          </div>
          <button className="ghost-button" onClick={() => setCommandOpen(true)}>
            <Sparkles size={17} /> Komut
          </button>
          <button className="icon-button" onClick={() => setTheme(state.settings.theme === "dark" ? "light" : "dark")} aria-label="Tema değiştir">
            {resolveTheme(state.settings.theme) === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="icon-button" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Bildirimler">
            <Bell size={18} />
            {state.notifications.some((item) => !item.read) && <span className="badge-dot" />}
          </button>
          {notificationsOpen && (
            <NotificationPanel
              state={state}
              markRead={store.markNotificationRead}
              markAllRead={store.markAllNotificationsRead}
              close={() => setNotificationsOpen(false)}
            />
          )}
        </header>

        {view === "dashboard" ? (
          <Dashboard state={state} setView={setView} handleCreateNote={handleCreateNote} />
        ) : view === "tasks" ? (
          <TasksPanel state={state} createTask={createTask} updateTask={updateTask} />
        ) : view === "settings" ? (
          <SettingsPanel state={state} updateSettings={updateSettings} setTheme={setTheme} resetDemo={resetDemo} exportAll={() => exportAllJson(state)} />
        ) : view === "folders" ? (
          <FoldersPanel state={state} createFolder={store.createFolder} updateNote={updateNote} setSelectedId={setSelectedId} setView={setView} />
        ) : view === "tags" ? (
          <TagsPanel state={state} createTag={store.createTag} updateNote={updateNote} setSelectedId={setSelectedId} setView={setView} />
        ) : view === "graph" ? (
          <GraphPanel notes={activeNotes} graph={graph} setSelectedId={setSelectedId} setView={setView} />
        ) : view === "canvas" ? (
          <CanvasPanel
            state={state}
            updateCanvasNode={store.updateCanvasNode}
            createCanvasNoteNode={store.createCanvasNoteNode}
            createCanvasTextNode={store.createCanvasTextNode}
            createCanvasNode={store.createCanvasNode}
            deleteCanvasNode={store.deleteCanvasNode}
            duplicateCanvasNode={store.duplicateCanvasNode}
            updateCanvasEdge={store.updateCanvasEdge}
            deleteCanvasEdge={store.deleteCanvasEdge}
            connectCanvasNodes={store.connectCanvasNodes}
            setSelectedId={setSelectedId}
            setView={setView}
          />
        ) : view === "templates" ? (
          <TemplatesPanel state={state} handleCreateNote={handleCreateNote} />
        ) : view === "calendar" || view === "daily" ? (
          <CalendarPanel state={state} handleCreateNote={handleCreateNote} />
        ) : view === "help" ? (
          <HelpPanel />
        ) : (
          <section className="notes-layout">
            <NoteList
              state={state}
              results={searchResults}
              selectedId={selectedNote?.id}
              onSelect={(id) => setSelectedId(id)}
              onCreate={() => handleCreateNote()}
            />
            {selectedNote ? (
              <EditorPanel
                note={selectedNote}
                state={state}
                preview={preview}
                setPreview={setPreview}
                readingStats={readingStats}
                backlinks={backlinks}
                incomingLinks={incomingLinks}
                updateNote={updateNote}
                handleContentChange={handleContentChange}
                handleFile={handleFile}
                notify={notify}
              />
            ) : (
              <div className="empty-panel">Not seçin veya yeni not oluşturun.</div>
            )}
          </section>
        )}
      </main>

      {commandOpen && (
        <div className="modal-backdrop" onClick={() => setCommandOpen(false)}>
          <div className="command-palette" onClick={(event) => event.stopPropagation()}>
            <div className="command-input">
              <Search size={18} />
              <input autoFocus placeholder="Komut veya not ara" onChange={(event) => setQuery(event.target.value)} />
            </div>
            <button onClick={() => handleCreateNote()}>
              <Plus size={17} /> Yeni not oluştur
            </button>
            <button onClick={() => setView("tasks")}>
              <CheckSquare size={17} /> Görevleri aç
            </button>
            <button onClick={() => setView("graph")}>
              <Network size={17} /> Bilgi grafiğine git
            </button>
            <button onClick={() => selectedNote && exportNoteMarkdown(selectedNote)}>
              <Download size={17} /> Seçili notu Markdown indir
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Dashboard({ state, setView, handleCreateNote }: { state: ReturnType<typeof useAppStore>["state"]; setView: (view: ViewKey) => void; handleCreateNote: () => void }) {
  const active = state.notes.filter((note) => !note.deletedAt && !note.isArchived);
  const due = state.tasks.filter((task) => task.status !== "done");
  return (
    <section className="dashboard">
      <div className="hero-band">
        <div>
          <span className="eyebrow">Bugünkü çalışma alanı</span>
          <h1>Notlar, görevler ve bağlantılar tek yerde.</h1>
          <p>Offline-first kayıt, hızlı arama ve markdown editör çekirdeği aktif.</p>
        </div>
        <div className="hero-actions">
          <button className="primary-action" onClick={handleCreateNote}>
            <Plus size={18} /> Yeni not
          </button>
          <button className="ghost-button" onClick={() => setView("graph")}>
            <Network size={17} /> Grafiği aç
          </button>
        </div>
      </div>
      <div className="metric-grid">
        <Metric icon={FileText} label="Aktif not" value={active.length} />
        <Metric icon={CheckSquare} label="Açık görev" value={due.length} />
        <Metric icon={Tag} label="Etiket" value={state.tags.length} />
        <Metric icon={Paperclip} label="Dosya" value={state.attachments.length} />
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-title"><Pin size={17} /> Sabitlenen notlar</div>
          {active.filter((note) => note.isPinned).map((note) => (
            <div className="compact-row" key={note.id}>
              <span>{note.title}</span>
              <small>{formatDate(note.updatedAt)}</small>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title"><Bell size={17} /> Bildirim merkezi</div>
          {state.notifications.map((item) => (
            <div className="compact-row" key={item.id}>
              <span>{item.title}</span>
              <small>{item.read ? "Okundu" : "Yeni"}</small>
            </div>
          ))}
        </div>
        <div className="panel wide">
          <div className="panel-title"><ShieldCheck size={17} /> Güvenlik ve gizlilik</div>
          <div className="security-grid">
            <span><Lock size={16} /> Not bazlı kilit altyapısı</span>
            <span><ShieldCheck size={16} /> XSS korumalı markdown</span>
            <span><Upload size={16} /> Dosya türü doğrulama</span>
            <span><Share2 size={16} /> Paylaşım izin modeli</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  return (
    <div className="metric">
      <Icon size={20} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function NoteList({ state, results, selectedId, onSelect, onCreate }: { state: ReturnType<typeof useAppStore>["state"]; results: ReturnType<typeof searchNotes>; selectedId?: string; onSelect: (id: string) => void; onCreate: () => void }) {
  return (
    <aside className="note-list">
      <div className="list-header">
        <div>
          <strong>Notlar</strong>
          <span>{results.length} sonuç</span>
        </div>
        <button className="icon-button" onClick={onCreate} aria-label="Yeni not"><Plus size={17} /></button>
      </div>
      {results.length === 0 && <div className="empty-state">Eşleşen not yok.</div>}
      {results.map(({ note, highlights }) => {
        const folder = state.folders.find((item) => item.id === note.folderId);
        return (
          <button key={note.id} className={`note-card ${selectedId === note.id ? "selected" : ""}`} onClick={() => onSelect(note.id)}>
            <div className="note-card-title">
              <span>{note.title}</span>
              <span>{note.isPinned && <Pin size={14} />}{note.isFavorite && <Star size={14} />}</span>
            </div>
            <p>{highlights[0] ?? note.content.replace(/[#>*_`[\]]/g, "").slice(0, 120)}</p>
            <div className="note-meta">
              <span>{folder?.name ?? "Klasör yok"}</span>
              <span>{formatDate(note.updatedAt)}</span>
            </div>
          </button>
        );
      })}
    </aside>
  );
}

function EditorPanel(props: {
  note: Note;
  state: ReturnType<typeof useAppStore>["state"];
  preview: boolean;
  setPreview: (value: boolean) => void;
  readingStats: ReturnType<typeof getReadingStats>;
  backlinks: string[];
  incomingLinks: Note[];
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  handleContentChange: (note: Note, content: string) => void;
  handleFile: (note: Note, files: FileList | null) => void;
  notify: (message: string) => void;
}) {
  const { note, state, preview, setPreview, readingStats, backlinks, incomingLinks, updateNote, handleContentChange, handleFile, notify } = props;
  const attachments = state.attachments.filter((item) => item.noteId === note.id && !item.deletedAt);
  return (
    <section className="editor-shell">
      <div className="editor-toolbar">
        <div className="tool-group">
          <button onClick={() => handleContentChange(note, `${note.content}\n# Başlık\n`)}>H1</button>
          <button onClick={() => handleContentChange(note, `${note.content}\n**kalın**`)}>B</button>
          <button onClick={() => handleContentChange(note, `${note.content}\n_italik_`)}>I</button>
          <button onClick={() => handleContentChange(note, insertMarkdownCommand(note.content, "task"))}><CheckSquare size={16} /></button>
          <button onClick={() => handleContentChange(note, insertMarkdownCommand(note.content, "table"))}>Tablo</button>
          <button onClick={() => handleContentChange(note, insertMarkdownCommand(note.content, "code"))}>Kod</button>
          <button onClick={() => handleContentChange(note, insertMarkdownCommand(note.content, "callout"))}>Callout</button>
        </div>
        <div className="tool-group">
          <label className="upload-button">
            <Paperclip size={16} />
            <input type="file" onChange={(event) => handleFile(note, event.target.files)} />
          </label>
          <button onClick={() => exportNoteMarkdown(note)}><Download size={16} /> MD</button>
          <button onClick={() => exportNotePdf(note)}><Download size={16} /> PDF</button>
          <button onClick={() => exportNoteJson(note)}><Download size={16} /> JSON</button>
          <button className={preview ? "active" : ""} onClick={() => setPreview(!preview)}>Önizleme</button>
        </div>
      </div>

      <div className="editor-header">
        <input value={note.title} onChange={(event) => updateNote(note.id, { title: event.target.value })} />
        <div className="note-actions">
          <button className={note.isFavorite ? "active" : ""} onClick={() => updateNote(note.id, { isFavorite: !note.isFavorite })}><Star size={17} /></button>
          <button className={note.isPinned ? "active" : ""} onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}><Pin size={17} /></button>
          <button onClick={() => updateNote(note.id, { isArchived: !note.isArchived })}><Archive size={17} /></button>
          <button onClick={() => updateNote(note.id, { deletedAt: new Date().toISOString() })}><Trash2 size={17} /></button>
        </div>
      </div>

      <div className={`editor-grid ${preview ? "with-preview" : ""}`}>
        <textarea
          value={note.content}
          onChange={(event) => handleContentChange(note, event.target.value)}
          spellCheck
          style={{ fontSize: state.settings.fontSize, lineHeight: state.settings.lineHeight, fontFamily: state.settings.fontFamily }}
        />
        {preview && <article className="markdown-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }} />}
      </div>

      <footer className="editor-footer">
        <span>{readingStats.words} kelime</span>
        <span>{readingStats.characters} karakter</span>
        <span>{readingStats.readingMinutes} dk okuma</span>
        <span>Son kayıt {formatDate(note.updatedAt)}</span>
      </footer>

      <div className="inspector-grid">
        <div className="panel">
          <div className="panel-title"><Link2 size={17} /> Backlink</div>
          <p>Giden: {backlinks.length ? backlinks.join(", ") : "Yok"}</p>
          <p>Gelen: {incomingLinks.length ? incomingLinks.map((item) => item.title).join(", ") : "Yok"}</p>
        </div>
        <div className="panel">
          <div className="panel-title"><Paperclip size={17} /> Ekler</div>
          {attachments.length === 0 ? <p>Dosya eklenmedi.</p> : attachments.map((item) => <p key={item.id}>{item.name} · {(item.size / 1024).toFixed(1)} KB</p>)}
        </div>
        <div className="panel">
          <div className="panel-title"><Sparkles size={17} /> AI alanı</div>
          <p>AI kapalıyken notlar dış servise gönderilmez. Ayarlardan açık rıza ile etkinleşir.</p>
          <button className="ghost-button" onClick={() => notify("AI modülü mimari olarak hazır; kullanıcı onayı bekleniyor.")}>Özet taslağı</button>
        </div>
      </div>
    </section>
  );
}

function TasksPanel({ state, createTask, updateTask }: { state: ReturnType<typeof useAppStore>["state"]; createTask: ReturnType<typeof useAppStore>["createTask"]; updateTask: ReturnType<typeof useAppStore>["updateTask"] }) {
  const [title, setTitle] = useState("");
  const grouped: Task["status"][] = ["todo", "in-progress", "done"];
  return (
    <section className="page-panel">
      <div className="page-title"><CheckSquare size={21} /><h1>Görevler</h1></div>
      <div className="inline-form">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Yeni görev" />
        <button className="primary-action" onClick={() => {
          if (!title.trim()) return;
          createTask({ title, description: "", priority: "medium", status: "todo", tagIds: [] });
          setTitle("");
        }}>Ekle</button>
      </div>
      <div className="kanban">
        {grouped.map((status) => (
          <div className="panel" key={status}>
            <div className="panel-title">{status === "todo" ? "Yapılacak" : status === "in-progress" ? "Devam ediyor" : "Tamamlandı"}</div>
            {state.tasks.filter((task) => task.status === status && !task.deletedAt).map((task) => (
              <div className="task-card" key={task.id}>
                <strong>{task.title}</strong>
                <p>{task.description || "Açıklama yok"}</p>
                <small>{task.priority} · {task.dueDate ? formatDate(task.dueDate) : "Tarih yok"}</small>
                <button onClick={() => updateTask(task.id, { status: status === "done" ? "todo" : "done" })}>{status === "done" ? "Geri al" : "Tamamla"}</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function SettingsPanel({ state, updateSettings, setTheme, resetDemo, exportAll }: { state: ReturnType<typeof useAppStore>["state"]; updateSettings: ReturnType<typeof useAppStore>["updateSettings"]; setTheme: (theme: ThemeMode) => void; resetDemo: () => void; exportAll: () => void }) {
  return (
    <section className="page-panel">
      <div className="page-title"><Settings size={21} /><h1>Ayarlar</h1></div>
      <div className="settings-grid">
        <div className="panel">
          <div className="panel-title"><Palette size={17} /> Tema</div>
          <div className="segmented">
            {(["light", "dark", "system"] as ThemeMode[]).map((theme) => <button key={theme} className={state.settings.theme === theme ? "active" : ""} onClick={() => setTheme(theme)}>{theme}</button>)}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><FileText size={17} /> Editör</div>
          <label>Yazı boyutu <input type="range" min="14" max="22" value={state.settings.fontSize} onChange={(event) => updateSettings({ fontSize: Number(event.target.value) })} /></label>
          <label>Satır aralığı <input type="range" min="1.3" max="2" step="0.05" value={state.settings.lineHeight} onChange={(event) => updateSettings({ lineHeight: Number(event.target.value) })} /></label>
        </div>
        <div className="panel">
          <div className="panel-title"><ShieldCheck size={17} /> Gizlilik</div>
          <label><input type="checkbox" checked={state.settings.aiEnabled} onChange={(event) => updateSettings({ aiEnabled: event.target.checked })} /> AI özelliklerini etkinleştir</label>
          <label><input type="checkbox" checked={state.settings.aiConsent} onChange={(event) => updateSettings({ aiConsent: event.target.checked })} /> Notları AI için kullanmaya açık rıza ver</label>
          <label>Otomatik kilit <input type="number" value={state.settings.lockAfterMinutes} onChange={(event) => updateSettings({ lockAfterMinutes: Number(event.target.value) })} /> dk</label>
        </div>
        <div className="panel">
          <div className="panel-title"><Download size={17} /> Import / Export</div>
          <button className="ghost-button" onClick={exportAll}>Tüm verilerimi JSON indir</button>
          <button className="danger-button" onClick={resetDemo}>Demo verisini sıfırla</button>
        </div>
      </div>
    </section>
  );
}

function NotificationPanel({
  state,
  markRead,
  markAllRead,
  close
}: {
  state: ReturnType<typeof useAppStore>["state"];
  markRead: (notificationId: string) => void;
  markAllRead: () => void;
  close: () => void;
}) {
  return (
    <div className="notification-popover">
      <div className="popover-header">
        <strong>Bildirimler</strong>
        <button className="ghost-button" onClick={markAllRead}>Tümünü okundu yap</button>
      </div>
      {state.notifications.length === 0 && <div className="empty-state">Bildirim yok.</div>}
      {state.notifications.map((notification) => (
        <button
          key={notification.id}
          className={`notification-item ${notification.read ? "" : "unread"}`}
          onClick={() => {
            markRead(notification.id);
            close();
          }}
        >
          <span>{notification.title}</span>
          <small>{notification.body}</small>
          <em>{formatDate(notification.createdAt)}</em>
        </button>
      ))}
    </div>
  );
}

function FoldersPanel({
  state,
  createFolder,
  updateNote,
  setSelectedId,
  setView
}: {
  state: ReturnType<typeof useAppStore>["state"];
  createFolder: (name: string, parentId?: string) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  setSelectedId: (id: string) => void;
  setView: (view: ViewKey) => void;
}) {
  const [name, setName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState(state.folders[0]?.id ?? "");
  const notes = state.notes.filter((note) => !note.deletedAt && note.folderId === selectedFolderId);

  return (
    <section className="page-panel">
      <div className="page-title"><Folder size={21} /><h1>Klasörler</h1></div>
      <div className="manager-layout">
        <aside className="manager-list">
          <div className="inline-form compact">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Yeni klasör" />
            <button className="primary-action" onClick={() => {
              if (!name.trim()) return;
              createFolder(name.trim());
              setName("");
            }}>Ekle</button>
          </div>
          {state.folders.map((folder) => (
            <button
              key={folder.id}
              className={`manager-row ${folder.id === selectedFolderId ? "active" : ""}`}
              onClick={() => setSelectedFolderId(folder.id)}
            >
              <span className="color-dot" style={{ background: folder.color }} />
              <span>{folder.parentId ? "↳ " : ""}{folder.name}</span>
              <small>{state.notes.filter((note) => note.folderId === folder.id && !note.deletedAt).length}</small>
            </button>
          ))}
        </aside>
        <div className="panel manager-detail">
          <div className="panel-title">Klasördeki notlar</div>
          {notes.length === 0 && <p>Bu klasörde not yok. Bir notu buraya taşıyabilirsiniz.</p>}
          {notes.map((note) => (
            <button key={note.id} className="compact-note" onClick={() => {
              setSelectedId(note.id);
              setView("all");
            }}>
              <strong>{note.title}</strong>
              <small>{formatDate(note.updatedAt)}</small>
            </button>
          ))}
          <div className="panel-title move-title">Not taşı</div>
          {state.notes.filter((note) => !note.deletedAt).map((note) => (
            <div className="move-row" key={note.id}>
              <span>{note.title}</span>
              <select value={note.folderId ?? ""} onChange={(event) => updateNote(note.id, { folderId: event.target.value || undefined })}>
                <option value="">Klasör yok</option>
                {state.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TagsPanel({
  state,
  createTag,
  updateNote,
  setSelectedId,
  setView
}: {
  state: ReturnType<typeof useAppStore>["state"];
  createTag: (name: string) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  setSelectedId: (id: string) => void;
  setView: (view: ViewKey) => void;
}) {
  const [name, setName] = useState("");
  const [selectedTagId, setSelectedTagId] = useState(state.tags[0]?.id ?? "");
  const notes = state.notes.filter((note) => !note.deletedAt && note.tagIds.includes(selectedTagId));

  function toggleTag(note: Note, tagId: string) {
    updateNote(note.id, {
      tagIds: note.tagIds.includes(tagId) ? note.tagIds.filter((id) => id !== tagId) : [...note.tagIds, tagId]
    });
  }

  return (
    <section className="page-panel">
      <div className="page-title"><Tag size={21} /><h1>Etiketler</h1></div>
      <div className="manager-layout">
        <aside className="manager-list">
          <div className="inline-form compact">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Yeni etiket" />
            <button className="primary-action" onClick={() => {
              if (!name.trim()) return;
              createTag(name.trim());
              setName("");
            }}>Ekle</button>
          </div>
          {state.tags.map((tag) => (
            <button key={tag.id} className={`manager-row ${tag.id === selectedTagId ? "active" : ""}`} onClick={() => setSelectedTagId(tag.id)}>
              <span className="color-dot" style={{ background: tag.color }} />
              <span>{tag.name}</span>
              <small>{state.notes.filter((note) => note.tagIds.includes(tag.id) && !note.deletedAt).length}</small>
            </button>
          ))}
        </aside>
        <div className="panel manager-detail">
          <div className="panel-title">Etiketli notlar</div>
          {notes.length === 0 && <p>Bu etikete bağlı not yok.</p>}
          {notes.map((note) => (
            <button key={note.id} className="compact-note" onClick={() => {
              setSelectedId(note.id);
              setView("all");
            }}>
              <strong>{note.title}</strong>
              <small>{formatDate(note.updatedAt)}</small>
            </button>
          ))}
          <div className="panel-title move-title">Not etiketleri</div>
          {state.notes.filter((note) => !note.deletedAt).map((note) => (
            <div className="tag-editor-row" key={note.id}>
              <span>{note.title}</span>
              <div>
                {state.tags.map((tag) => (
                  <button key={tag.id} className={note.tagIds.includes(tag.id) ? "tag-chip active" : "tag-chip"} onClick={() => toggleTag(note, tag.id)}>
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GraphPanel({ notes, graph, setSelectedId, setView }: { notes: Note[]; graph: ReturnType<typeof buildGraph>; setSelectedId: (id: string) => void; setView: (view: ViewKey) => void }) {
  const [linkedOnly, setLinkedOnly] = useState(false);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const linkedIds = new Set(graph.edges.flatMap((edge) => [edge.from, edge.to]));
  const visibleNotes = linkedOnly ? notes.filter((note) => linkedIds.has(note.id)) : notes;
  const visibleNoteKey = visibleNotes.map((note) => note.id).join("|");
  const [positions, setPositions] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});

  useEffect(() => {
    setPositions((current) => {
      const next = { ...current };
      visibleNotes.forEach((note, index) => {
        if (!next[note.id]) {
          const angle = (index / Math.max(visibleNotes.length, 1)) * Math.PI * 2;
          const radius = 180 + Math.floor(index / 8) * 120;
          next[note.id] = {
            x: 560 + Math.cos(angle) * radius,
            y: 280 + Math.sin(angle) * radius,
            width: 178,
            height: 70
          };
        }
      });
      return next;
    });
  }, [visibleNoteKey]);

  function startDrag(event: PointerEvent<HTMLButtonElement>, id: string) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setDragging({ id, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top });
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const target = event.currentTarget;
    const board = target.getBoundingClientRect();
    const nextX = Math.max(0, event.clientX - board.left - dragging.offsetX + target.scrollLeft);
    const nextY = Math.max(0, event.clientY - board.top - dragging.offsetY + target.scrollTop);
    setPositions((current) => ({
      ...current,
      [dragging.id]: {
        ...(current[dragging.id] ?? { width: 178, height: 70 }),
        x: nextX,
        y: nextY
      }
    }));
  }

  function openNote(id: string) {
    if (dragging) return;
    setSelectedId(id);
    setView("all");
  }

  return (
    <section className="page-panel">
      <div className="page-title graph-title">
        <div><Network size={21} /><h1>Bilgi grafiği</h1></div>
        <div className="canvas-toolbar">
          <button className={linkedOnly ? "active" : ""} onClick={() => setLinkedOnly(!linkedOnly)}>Sadece bağlantılı</button>
          <span>{visibleNotes.length} node · {graph.edges.length} bağlantı</span>
        </div>
      </div>
      <div
        className="graph-board"
        onPointerMove={moveDrag}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
        onPointerCancel={() => setDragging(null)}
      >
        <svg className="graph-svg" aria-hidden="true">
          {graph.edges.map((edge) => {
            const from = positions[edge.from];
            const to = positions[edge.to];
            if (linkedOnly && (!linkedIds.has(edge.from) || !linkedIds.has(edge.to))) return null;
            if (!from || !to) return null;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x + from.width}
                y1={from.y + from.height / 2}
                x2={to.x}
                y2={to.y + to.height / 2}
              />
            );
          })}
        </svg>
        {visibleNotes.map((note) => (
          <button
            key={note.id}
            className="graph-node"
            style={{ left: positions[note.id]?.x, top: positions[note.id]?.y }}
            onPointerDown={(event) => startDrag(event, note.id)}
            onDoubleClick={() => openNote(note.id)}
          >
            <Network size={16} /> {note.title}
          </button>
        ))}
      </div>
    </section>
  );
}

function CanvasPanel({
  state,
  updateCanvasNode,
  createCanvasNoteNode,
  createCanvasTextNode,
  createCanvasNode,
  deleteCanvasNode,
  duplicateCanvasNode,
  updateCanvasEdge,
  deleteCanvasEdge,
  connectCanvasNodes,
  setSelectedId,
  setView
}: {
  state: ReturnType<typeof useAppStore>["state"];
  updateCanvasNode: ReturnType<typeof useAppStore>["updateCanvasNode"];
  createCanvasNoteNode: ReturnType<typeof useAppStore>["createCanvasNoteNode"];
  createCanvasTextNode: ReturnType<typeof useAppStore>["createCanvasTextNode"];
  createCanvasNode: ReturnType<typeof useAppStore>["createCanvasNode"];
  deleteCanvasNode: ReturnType<typeof useAppStore>["deleteCanvasNode"];
  duplicateCanvasNode: ReturnType<typeof useAppStore>["duplicateCanvasNode"];
  updateCanvasEdge: ReturnType<typeof useAppStore>["updateCanvasEdge"];
  deleteCanvasEdge: ReturnType<typeof useAppStore>["deleteCanvasEdge"];
  connectCanvasNodes: ReturnType<typeof useAppStore>["connectCanvasNodes"];
  setSelectedId: (id: string) => void;
  setView: (view: ViewKey) => void;
}) {
  const canvas = state.canvases[0];
  const [dragging, setDragging] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [panning, setPanning] = useState<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(canvas.nodes[0]?.id ?? null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "pan" | "connect" | "comment">("select");
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [grid, setGrid] = useState(true);
  const [snap, setSnap] = useState(true);
  const [minimap, setMinimap] = useState(true);
  const [presentation, setPresentation] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; canvasX: number; canvasY: number; nodeId?: string; edgeId?: string } | null>(null);
  const selectedNode = canvas.nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = canvas.edges.find((edge) => edge.id === selectedEdgeId);
  const gridSize = 24;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        setTool("pan");
      }
      if (event.key === "Delete" && selectedNodeId) {
        deleteCanvasNode(canvas.id, selectedNodeId);
        setSelectedNodeId(null);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") setTool("select");
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [canvas.id, deleteCanvasNode, selectedNodeId]);

  function startDrag(event: PointerEvent<HTMLDivElement>, nodeId: string) {
    if (tool === "pan") return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const rect = target.getBoundingClientRect();
    setDragging({ nodeId, offsetX: (event.clientX - rect.left) / viewport.zoom, offsetY: (event.clientY - rect.top) / viewport.zoom });
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setContextMenu(null);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    if (panning) {
      setViewport((current) => ({ ...current, x: panning.x + event.clientX - panning.startX, y: panning.y + event.clientY - panning.startY }));
      return;
    }
    if (!dragging) return;
    const board = target.getBoundingClientRect();
    const rawX = (event.clientX - board.left - viewport.x) / viewport.zoom - dragging.offsetX;
    const rawY = (event.clientY - board.top - viewport.y) / viewport.zoom - dragging.offsetY;
    const nextX = snap ? Math.round(rawX / gridSize) * gridSize : rawX;
    const nextY = snap ? Math.round(rawY / gridSize) * gridSize : rawY;
    updateCanvasNode(canvas.id, dragging.nodeId, {
      x: Math.max(0, nextX),
      y: Math.max(0, nextY)
    });
  }

  function boardPoint(event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - viewport.x) / viewport.zoom,
      y: (event.clientY - rect.top - viewport.y) / viewport.zoom
    };
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;
    const nextZoom = Math.min(2.4, Math.max(0.35, viewport.zoom - event.deltaY * 0.0012));
    const worldX = (cursorX - viewport.x) / viewport.zoom;
    const worldY = (cursorY - viewport.y) / viewport.zoom;
    setViewport({
      zoom: nextZoom,
      x: cursorX - worldX * nextZoom,
      y: cursorY - worldY * nextZoom
    });
  }

  function addNode(type: Parameters<typeof createCanvasNode>[1]) {
    createCanvasNode(canvas.id, type, { x: 220 - viewport.x / viewport.zoom, y: 180 - viewport.y / viewport.zoom });
  }

  function exportCanvasJson() {
    const blob = new Blob([JSON.stringify(canvas, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${canvas.name}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function fitToScreen() {
    if (canvas.nodes.length === 0) {
      setViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const minX = Math.min(...canvas.nodes.map((node) => node.x));
    const minY = Math.min(...canvas.nodes.map((node) => node.y));
    setViewport({ x: 120 - minX, y: 110 - minY, zoom: 0.9 });
  }

  const toolItems: Array<{ type: Parameters<typeof createCanvasNode>[1]; label: string; icon: typeof FileText }> = [
    { type: "text", label: "Metin", icon: FileText },
    { type: "sticky", label: "Sticky", icon: BookOpen },
    { type: "note", label: "Not", icon: FileText },
    { type: "task", label: "Görev", icon: CheckSquare },
    { type: "checklist", label: "Checklist", icon: CheckSquare },
    { type: "link", label: "Link", icon: Link2 },
    { type: "code", label: "Kod", icon: PanelLeftClose },
    { type: "quote", label: "Alıntı", icon: HelpCircle },
    { type: "callout", label: "Callout", icon: Bell },
    { type: "group", label: "Grup", icon: Folder },
    { type: "kanban", label: "Kanban", icon: LayoutDashboard },
    { type: "table", label: "Tablo", icon: GripVertical },
    { type: "mind", label: "Mind", icon: Network },
    { type: "image", label: "Görsel", icon: Image },
    { type: "file", label: "Dosya", icon: Paperclip }
  ];

  return (
    <section className={`canvas-studio ${presentation ? "presentation" : ""}`}>
      <div className="canvas-topbar">
        <div>
          <strong>{canvas.name}</strong>
          <span>Kaydedildi · {Math.round(viewport.zoom * 100)}%</span>
        </div>
        <div className="canvas-toolbar">
          <button onClick={() => setViewport((current) => ({ ...current, zoom: Math.max(0.35, current.zoom - 0.1) }))}>-</button>
          <button onClick={() => setViewport((current) => ({ ...current, zoom: Math.min(2.4, current.zoom + 0.1) }))}>+</button>
          <button onClick={fitToScreen}>Fit</button>
          <button className={grid ? "active" : ""} onClick={() => setGrid(!grid)}>Grid</button>
          <button className={snap ? "active" : ""} onClick={() => setSnap(!snap)}>Snap</button>
          <button className={minimap ? "active" : ""} onClick={() => setMinimap(!minimap)}>Mini map</button>
          <button onClick={exportCanvasJson}><Download size={16} /> JSON</button>
          <button onClick={() => setPresentation(!presentation)}>Sunum</button>
        </div>
      </div>

      <div className="canvas-body">
        <aside className="canvas-toolrail">
          <button title="Seçim" className={tool === "select" ? "active" : ""} onClick={() => setTool("select")}><Palette size={17} /></button>
          <button title="El / pan" className={tool === "pan" ? "active" : ""} onClick={() => setTool("pan")}><GripVertical size={17} /></button>
          <button title="Bağlantı" className={tool === "connect" ? "active" : ""} onClick={() => setTool("connect")}><Link2 size={17} /></button>
          {toolItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.type} title={item.label} onClick={() => addNode(item.type)}><Icon size={17} /></button>;
          })}
        </aside>

        <div
          className={`canvas-board advanced ${grid ? "show-grid" : ""} ${tool === "pan" ? "panning" : ""}`}
          onWheel={handleWheel}
          onPointerMove={moveDrag}
          onPointerDown={(event) => {
            const point = boardPoint(event);
            setContextMenu(null);
            if (event.target === event.currentTarget || tool === "pan") {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
              setPanning({ x: viewport.x, y: viewport.y, startX: event.clientX, startY: event.clientY });
            }
            if (event.detail === 2 && event.target === event.currentTarget) createCanvasNode(canvas.id, "sticky", point);
          }}
          onPointerUp={() => {
            setDragging(null);
            setPanning(null);
          }}
          onPointerCancel={() => {
            setDragging(null);
            setPanning(null);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            const point = boardPoint(event);
            setContextMenu({ x: event.clientX, y: event.clientY, canvasX: point.x, canvasY: point.y });
          }}
        >
          {canvas.nodes.length === 0 && (
            <div className="canvas-empty">
              <strong>Canvas boş</strong>
              <span>Soldaki araçlardan kart ekleyin veya boş alana çift tıklayın.</span>
            </div>
          )}
          <div className="canvas-world" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
            <svg className="canvas-edge-layer" aria-hidden="true">
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
                </marker>
              </defs>
              {canvas.edges.map((edge) => {
                const from = canvas.nodes.find((node) => node.id === edge.fromNodeId);
                const to = canvas.nodes.find((node) => node.id === edge.toNodeId);
                if (!from || !to) return null;
                const x1 = from.x + from.width;
                const y1 = from.y + from.height / 2;
                const x2 = to.x;
                const y2 = to.y + to.height / 2;
                const midX = (x1 + x2) / 2;
                const path = edge.strokeStyle === "curved" ? `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}` : `M ${x1} ${y1} L ${x2} ${y2}`;
                return (
                  <g key={edge.id} className={selectedEdgeId === edge.id ? "edge selected" : "edge"} onClick={() => {
                    setSelectedEdgeId(edge.id);
                    setSelectedNodeId(null);
                  }}>
                    <path d={path} stroke={edge.color} className={`${edge.strokeStyle ?? "solid"}`} markerEnd={edge.direction === "two-way" ? undefined : "url(#arrow)"} />
                    {edge.label && <text x={midX} y={(y1 + y2) / 2 - 8}>{edge.label}</text>}
                  </g>
                );
              })}
            </svg>
            {canvas.nodes.map((node) => (
              <div
                className={`canvas-node pro ${connectFrom === node.id ? "selected-connect" : ""} ${selectedNodeId === node.id ? "selected" : ""} ${node.locked ? "locked" : ""} ${node.type}`}
                key={node.id}
                style={{ left: node.x, top: node.y, width: node.width, height: node.height, borderColor: node.color, zIndex: node.zIndex ?? 1 }}
                onPointerDown={(event) => startDrag(event, node.id)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setContextMenu({ x: event.clientX, y: event.clientY, canvasX: node.x, canvasY: node.y, nodeId: node.id });
                }}
                onDoubleClick={() => {
                  if ((node.type === "note" || node.linkedNoteId) && (node.refId || node.linkedNoteId)) {
                    setSelectedId(node.refId ?? node.linkedNoteId!);
                    setView("all");
                  }
                }}
              >
                <div className="node-head">
                  <span className="node-icon" style={{ background: node.color }}>{node.icon ?? node.type.slice(0, 1).toUpperCase()}</span>
                  <strong>{node.title}</strong>
                </div>
                {!node.collapsed && <p>{node.content ?? (node.type === "note" ? "Bağlı not" : "Kart içeriği")}</p>}
                <div className="node-meta">
                  <span>{node.type}</span>
                  {node.locked && <Lock size={13} />}
                </div>
                <div className="node-actions">
                  <button onPointerDown={(event) => event.stopPropagation()} onClick={(event) => {
                    event.stopPropagation();
                    duplicateCanvasNode(canvas.id, node.id);
                  }}>Çoğalt</button>
                  <button onPointerDown={(event) => event.stopPropagation()} onClick={(event) => {
                    event.stopPropagation();
                    if (!connectFrom || tool === "connect") {
                      setConnectFrom(node.id);
                      setTool("connect");
                      return;
                    }
                    connectCanvasNodes(canvas.id, connectFrom, node.id);
                    setConnectFrom(null);
                    setTool("select");
                  }}>{connectFrom ? "Buraya bağla" : "Bağla"}</button>
                </div>
                <button
                  className="resize-handle"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    const startX = event.clientX;
                    const startY = event.clientY;
                    const startWidth = node.width;
                    const startHeight = node.height;
                    const onMove = (moveEvent: globalThis.PointerEvent) => {
                      updateCanvasNode(canvas.id, node.id, {
                        width: Math.max(160, startWidth + (moveEvent.clientX - startX) / viewport.zoom),
                        height: Math.max(90, startHeight + (moveEvent.clientY - startY) / viewport.zoom)
                      });
                    };
                    const onUp = () => {
                      window.removeEventListener("pointermove", onMove);
                      window.removeEventListener("pointerup", onUp);
                    };
                    window.addEventListener("pointermove", onMove);
                    window.addEventListener("pointerup", onUp);
                  }}
                  aria-label="Yeniden boyutlandır"
                />
              </div>
            ))}
          </div>

          {contextMenu && (
            <div className="canvas-context" style={{ left: contextMenu.x, top: contextMenu.y }}>
              {!contextMenu.nodeId && <button onClick={() => { createCanvasNode(canvas.id, "text", { x: contextMenu.canvasX, y: contextMenu.canvasY }); setContextMenu(null); }}>Yeni metin kartı</button>}
              {!contextMenu.nodeId && <button onClick={() => { createCanvasNode(canvas.id, "sticky", { x: contextMenu.canvasX, y: contextMenu.canvasY }); setContextMenu(null); }}>Yeni sticky note</button>}
              {!contextMenu.nodeId && <button onClick={() => { createCanvasNode(canvas.id, "task", { x: contextMenu.canvasX, y: contextMenu.canvasY }); setContextMenu(null); }}>Yeni görev</button>}
              {contextMenu.nodeId && <button onClick={() => { duplicateCanvasNode(canvas.id, contextMenu.nodeId!); setContextMenu(null); }}>Çoğalt</button>}
              {contextMenu.nodeId && <button onClick={() => { updateCanvasNode(canvas.id, contextMenu.nodeId!, { locked: !canvas.nodes.find((node) => node.id === contextMenu.nodeId)?.locked }); setContextMenu(null); }}>Kilitle / aç</button>}
              {contextMenu.nodeId && <button onClick={() => { deleteCanvasNode(canvas.id, contextMenu.nodeId!); setContextMenu(null); }}>Sil</button>}
              <button onClick={() => { fitToScreen(); setContextMenu(null); }}>Görünümü merkeze al</button>
            </div>
          )}

          {minimap && (
            <div className="mini-map">
              {canvas.nodes.map((node) => (
                <span key={node.id} style={{ left: node.x / 10, top: node.y / 10, width: Math.max(8, node.width / 12), height: Math.max(6, node.height / 12), background: node.color }} />
              ))}
            </div>
          )}
        </div>

        <aside className="canvas-properties">
          {selectedNode ? (
            <>
              <div className="panel-title">Node özellikleri</div>
              <label>Başlık<input value={selectedNode.title} onChange={(event) => updateCanvasNode(canvas.id, selectedNode.id, { title: event.target.value })} /></label>
              <label>İçerik<textarea value={selectedNode.content ?? ""} onChange={(event) => updateCanvasNode(canvas.id, selectedNode.id, { content: event.target.value })} /></label>
              <label>Renk<input type="color" value={selectedNode.color} onChange={(event) => updateCanvasNode(canvas.id, selectedNode.id, { color: event.target.value })} /></label>
              <div className="property-grid">
                <label>Genişlik<input type="number" value={Math.round(selectedNode.width)} onChange={(event) => updateCanvasNode(canvas.id, selectedNode.id, { width: Number(event.target.value) })} /></label>
                <label>Yükseklik<input type="number" value={Math.round(selectedNode.height)} onChange={(event) => updateCanvasNode(canvas.id, selectedNode.id, { height: Number(event.target.value) })} /></label>
              </div>
              <label><input type="checkbox" checked={Boolean(selectedNode.locked)} onChange={(event) => updateCanvasNode(canvas.id, selectedNode.id, { locked: event.target.checked })} /> Kilitli</label>
              <button className="ghost-button" onClick={() => duplicateCanvasNode(canvas.id, selectedNode.id)}>Çoğalt</button>
              <button className="danger-button" onClick={() => deleteCanvasNode(canvas.id, selectedNode.id)}>Sil</button>
            </>
          ) : selectedEdge ? (
            <>
              <div className="panel-title">Bağlantı özellikleri</div>
              <label>Etiket<input value={selectedEdge.label ?? ""} onChange={(event) => updateCanvasEdge(canvas.id, selectedEdge.id, { label: event.target.value })} /></label>
              <label>Tip<select value={selectedEdge.type ?? "related"} onChange={(event) => updateCanvasEdge(canvas.id, selectedEdge.id, { type: event.target.value as NonNullable<typeof selectedEdge.type> })}>
                <option value="related">bağlı</option>
                <option value="cause">neden-sonuç</option>
                <option value="source">kaynak</option>
                <option value="task">görev</option>
                <option value="reference">referans</option>
                <option value="idea">fikir</option>
                <option value="decision">karar</option>
                <option value="risk">risk</option>
              </select></label>
              <label>Çizgi<select value={selectedEdge.strokeStyle ?? "curved"} onChange={(event) => updateCanvasEdge(canvas.id, selectedEdge.id, { strokeStyle: event.target.value as NonNullable<typeof selectedEdge.strokeStyle> })}>
                <option value="curved">kavisli</option>
                <option value="solid">düz</option>
                <option value="dashed">kesikli</option>
                <option value="bold">kalın</option>
              </select></label>
              <label>Renk<input type="color" value={selectedEdge.color} onChange={(event) => updateCanvasEdge(canvas.id, selectedEdge.id, { color: event.target.value })} /></label>
              <button className="danger-button" onClick={() => deleteCanvasEdge(canvas.id, selectedEdge.id)}>Bağlantıyı sil</button>
            </>
          ) : (
            <>
              <div className="panel-title">Canvas özellikleri</div>
              <p>Boş alanda çift tıkla sticky note oluştur. Mouse tekerleği zoom yapar. Space + sürükle veya el aracı pan yapar.</p>
              <label><input type="checkbox" checked={grid} onChange={(event) => setGrid(event.target.checked)} /> Grid görünümü</label>
              <label><input type="checkbox" checked={snap} onChange={(event) => setSnap(event.target.checked)} /> Snap to grid</label>
              <label><input type="checkbox" checked={minimap} onChange={(event) => setMinimap(event.target.checked)} /> Mini map</label>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

function TemplatesPanel({ state, handleCreateNote }: { state: ReturnType<typeof useAppStore>["state"]; handleCreateNote: (templateId?: string) => void }) {
  return (
    <section className="page-panel">
      <div className="page-title"><Wand2 size={21} /><h1>Şablonlar</h1></div>
      <div className="template-grid">
        {state.templates.map((template) => (
          <div className="panel" key={template.id}>
            <div className="panel-title">{template.name}</div>
            <p>{template.description}</p>
            <button className="ghost-button" onClick={() => handleCreateNote(template.id)}>Bu şablonla not oluştur</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CalendarPanel({ state, handleCreateNote }: { state: ReturnType<typeof useAppStore>["state"]; handleCreateNote: () => void }) {
  return (
    <section className="page-panel">
      <div className="page-title"><CalendarDays size={21} /><h1>Takvim ve günlük notlar</h1></div>
      <div className="calendar-grid">
        {Array.from({ length: 14 }).map((_, index) => {
          const date = new Date();
          date.setDate(date.getDate() + index - 3);
          return (
            <div className="day-cell" key={date.toISOString()}>
              <strong>{date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}</strong>
              <span>{state.tasks.filter((task) => task.dueDate?.slice(0, 10) === date.toISOString().slice(0, 10)).length} görev</span>
            </div>
          );
        })}
      </div>
      <button className="primary-action" onClick={handleCreateNote}><BookOpen size={18} /> Bugünün notunu oluştur</button>
    </section>
  );
}

function HelpPanel() {
  const shortcuts = ["Ctrl/Cmd + N: yeni not", "Ctrl/Cmd + K: komut paleti", "Ctrl/Cmd + F: arama", "Ctrl/Cmd + B: kalın", "Esc: panel kapat", "/: slash komut fikri"];
  return (
    <section className="page-panel">
      <div className="page-title"><HelpCircle size={21} /><h1>Kısayollar</h1></div>
      <div className="shortcut-grid">
        {shortcuts.map((shortcut) => <div className="shortcut" key={shortcut}><ChevronRight size={16} />{shortcut}</div>)}
      </div>
    </section>
  );
}
