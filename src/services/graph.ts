import type { Note } from "../domain/types";
import { extractBacklinks } from "./markdown";

export interface GraphNode {
  id: string;
  label: string;
  group: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export function buildGraph(notes: Note[]) {
  const titleMap = new Map(notes.map((note) => [note.title.toLowerCase(), note.id]));
  const nodes: GraphNode[] = notes.map((note) => ({ id: note.id, label: note.title, group: note.folderId ?? "none" }));
  const edges: GraphEdge[] = [];

  notes.forEach((note) => {
    extractBacklinks(note.content).forEach((title) => {
      const target = titleMap.get(title.toLowerCase());
      if (target) edges.push({ from: note.id, to: target });
    });
  });

  return { nodes, edges };
}
