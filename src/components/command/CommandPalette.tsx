import { CheckSquare, Download, Network, Plus, Search } from "lucide-react";
import type { Note, ViewKey } from "../../domain/types";

interface CommandPaletteProps {
  selectedNote?: Note;
  setQuery: (query: string) => void;
  createNote: () => void;
  setView: (view: ViewKey) => void;
  exportMarkdown: (note: Note) => void;
  close: () => void;
}

export function CommandPalette({ selectedNote, setQuery, createNote, setView, exportMarkdown, close }: CommandPaletteProps) {
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="command-palette" onClick={(event) => event.stopPropagation()}>
        <div className="command-input">
          <Search size={18} />
          <input autoFocus placeholder="Komut veya not ara" onChange={(event) => setQuery(event.target.value)} />
        </div>
        <button onClick={createNote}>
          <Plus size={17} /> Yeni not oluştur
        </button>
        <button onClick={() => setView("tasks")}>
          <CheckSquare size={17} /> Görevleri aç
        </button>
        <button onClick={() => setView("graph")}>
          <Network size={17} /> Bilgi grafiğine git
        </button>
        <button disabled={!selectedNote} onClick={() => selectedNote && exportMarkdown(selectedNote)}>
          <Download size={17} /> Seçili notu Markdown indir
        </button>
      </div>
    </div>
  );
}
