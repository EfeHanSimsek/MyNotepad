import { StorageReadError, StorageWriteError, type StorageAdapter, type StorageEnvelope } from "./types";

export function createLocalStorageAdapter<T>(key: string): StorageAdapter<T> {
  return {
    async read() {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StorageEnvelope<T>;
      } catch {
        throw new StorageReadError("Local data is not valid JSON.", raw);
      }
    },
    async write(envelope) {
      try {
        localStorage.setItem(key, JSON.stringify(envelope));
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "unknown";
        throw new StorageWriteError(`Local data could not be saved (${name}).`, error);
      }
    },
    async remove() {
      localStorage.removeItem(key);
    }
  };
}
