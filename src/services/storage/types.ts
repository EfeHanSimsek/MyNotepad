export interface StorageEnvelope<T> {
  app: "atlas-notes";
  version: number;
  savedAt: string;
  data: T;
}

export interface StorageAdapter<T> {
  read(): Promise<StorageEnvelope<T> | null>;
  write(envelope: StorageEnvelope<T>): Promise<void>;
  remove(): Promise<void>;
}

export class StorageReadError extends Error {
  constructor(message: string, public readonly raw?: string) {
    super(message);
    this.name = "StorageReadError";
  }
}

export class StorageWriteError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "StorageWriteError";
  }
}
