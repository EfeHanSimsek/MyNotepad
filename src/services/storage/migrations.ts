import { seedState } from "../../domain/seed";
import type { AppState } from "../../domain/types";
import type { StorageEnvelope } from "./types";

export const STORAGE_VERSION = 2;
export const STORAGE_KEY = "atlas-notes-state-v2";
export const LEGACY_STORAGE_KEYS = ["atlas-notes-state-v1"];

function mergeWithSeed(data: Partial<AppState>): AppState {
  return {
    ...seedState,
    ...data,
    user: { ...seedState.user, ...data.user },
    settings: { ...seedState.settings, ...data.settings },
    notes: Array.isArray(data.notes) ? data.notes : seedState.notes,
    folders: Array.isArray(data.folders) ? data.folders : seedState.folders,
    tags: Array.isArray(data.tags) ? data.tags : seedState.tags,
    tasks: Array.isArray(data.tasks) ? data.tasks : seedState.tasks,
    canvases: Array.isArray(data.canvases) ? data.canvases : seedState.canvases
  };
}

export function createEnvelope(data: AppState): StorageEnvelope<AppState> {
  return {
    app: "atlas-notes",
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    data
  };
}

export function migrateEnvelope(envelope: StorageEnvelope<AppState> | AppState): AppState {
  if ("data" in envelope && envelope.app === "atlas-notes") {
    return mergeWithSeed(envelope.data);
  }
  return mergeWithSeed(envelope as AppState);
}
