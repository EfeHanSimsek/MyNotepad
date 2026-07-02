import type { StorageAdapter, StorageEnvelope } from "./types";

export function createIndexedDbAdapter<T>(databaseName: string, storeName: string, key: string): StorageAdapter<T> {
  async function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function transaction<R>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<R>): Promise<R> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const request = run(tx.objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  return {
    read: () => transaction("readonly", (store) => store.get(key)) as Promise<StorageEnvelope<T> | null>,
    write: (envelope) => transaction("readwrite", (store) => store.put(envelope, key)).then(() => undefined),
    remove: () => transaction("readwrite", (store) => store.delete(key)).then(() => undefined)
  };
}
