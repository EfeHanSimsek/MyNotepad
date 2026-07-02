import type { AppState, Note } from "../domain/types";

export interface SearchResult {
  note: Note;
  score: number;
  highlights: string[];
}

function readOperator(query: string, operator: string): string | undefined {
  const match = query.match(new RegExp(`${operator}:([^\\s]+)`, "i"));
  return match?.[1]?.toLowerCase();
}

function hasFlag(query: string, flag: string): boolean {
  return query.toLowerCase().includes(flag.toLowerCase());
}

function stripOperators(query: string): string {
  return query
    .replace(/\b(tag|folder|created|updated|has|is):[^\s]+/gi, "")
    .trim()
    .toLowerCase();
}

export function searchNotes(state: AppState, query: string, sourceNotes = state.notes): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return sourceNotes
      .filter((note) => !note.deletedAt)
      .map((note) => ({ note, score: note.isPinned ? 2 : note.isFavorite ? 1 : 0, highlights: [] }))
      .sort((a, b) => b.note.updatedAt.localeCompare(a.note.updatedAt));
  }

  const tag = readOperator(normalized, "tag");
  const folder = readOperator(normalized, "folder");
  const has = readOperator(normalized, "has");
  const is = readOperator(normalized, "is");
  const created = readOperator(normalized, "created");
  const updated = readOperator(normalized, "updated");
  const text = stripOperators(normalized);

  return sourceNotes
    .filter((note) => !note.deletedAt)
    .filter((note) => {
      if (tag) {
        const tagMatch = state.tags.some((item) => note.tagIds.includes(item.id) && item.name.toLowerCase().includes(tag));
        if (!tagMatch) return false;
      }
      if (folder) {
        const folderMatch = state.folders.some((item) => note.folderId === item.id && item.name.toLowerCase().includes(folder));
        if (!folderMatch) return false;
      }
      if (has === "attachment" && !state.attachments.some((item) => item.noteId === note.id && !item.deletedAt)) return false;
      if (has === "task" && !state.tasks.some((item) => item.noteId === note.id && !item.deletedAt)) return false;
      if (is === "favorite" && !note.isFavorite) return false;
      if (is === "pinned" && !note.isPinned) return false;
      if (hasFlag(normalized, "is:archived") && !note.isArchived) return false;
      if (created && !matchesDateOperator(note.createdAt, created)) return false;
      if (updated && !matchesDateOperator(note.updatedAt, updated)) return false;
      if (!text) return true;
      return `${note.title} ${note.content}`.toLowerCase().includes(text);
    })
    .map((note) => {
      const haystack = `${note.title}\n${note.content}`.toLowerCase();
      const titleHit = text && note.title.toLowerCase().includes(text) ? 8 : 0;
      const contentHit = text && haystack.includes(text) ? 3 : 0;
      const score = titleHit + contentHit + (note.isPinned ? 2 : 0) + (note.isFavorite ? 1 : 0);
      const highlights = text ? note.content.split("\n").filter((line) => line.toLowerCase().includes(text)).slice(0, 2) : [];
      return { note, score, highlights };
    })
    .sort((a, b) => b.score - a.score || b.note.updatedAt.localeCompare(a.note.updatedAt));
}

function matchesDateOperator(value: string, operator: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  const valueDay = date.toISOString().slice(0, 10);

  if (operator === "today") return valueDay === today.toISOString().slice(0, 10);
  if (operator === "week") {
    const diff = today.getTime() - date.getTime();
    return diff >= 0 && diff <= 7 * 86400000;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(operator)) return valueDay === operator;
  return valueDay.startsWith(operator);
}
