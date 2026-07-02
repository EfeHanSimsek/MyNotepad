import { jsPDF } from "jspdf";
import type { AppState, Note } from "../domain/types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportNoteMarkdown(note: Note) {
  downloadBlob(new Blob([`# ${note.title}\n\n${note.content}`], { type: "text/markdown;charset=utf-8" }), `${note.title}.md`);
}

export function exportNoteJson(note: Note) {
  downloadBlob(new Blob([JSON.stringify(note, null, 2)], { type: "application/json;charset=utf-8" }), `${note.title}.json`);
}

export function exportAllJson(state: AppState) {
  downloadBlob(new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" }), "atlas-notes-export.json");
}

export function exportNotePdf(note: Note) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const lines = doc.splitTextToSize(`${note.title}\n\n${note.content.replace(/[#>*_`[\]-]/g, "")}`, 500);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(note.title, margin, margin);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(lines.slice(2), margin, margin + 34);
  doc.save(`${note.title}.pdf`);
}
