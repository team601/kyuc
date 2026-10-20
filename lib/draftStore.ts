// Local, per-browser draft storage backed by IndexedDB.
// Holds unsaved recordings (Blob) so a refresh, a failed upload or the
// homepage → signup handoff does not silently destroy a storyteller's voice.
// This is NOT durable cloud storage: it lives only in this browser.

export type DraftKey = 'landing' | 'story-new';

export interface StoryDraft {
  audio?: Blob | null;
  audioMime?: string | null;
  text?: string;
  title?: string;
  transcript?: string;
  photoCaption?: string;
  category?: string;
  questionId?: string;
  questionEn?: string;
  questionVi?: string;
  savedAt: number;
}

const DB_NAME = 'kyuc-drafts';
const STORE = 'drafts';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Saves a draft. Resolves false if this browser cannot store it (e.g. private mode). */
export async function saveDraft(key: DraftKey, draft: StoryDraft): Promise<boolean> {
  try {
    await run('readwrite', store => store.put(draft, key));
    return true;
  } catch {
    return false;
  }
}

export async function loadDraft(key: DraftKey): Promise<StoryDraft | null> {
  try {
    const draft = await run<StoryDraft | undefined>('readonly', store => store.get(key));
    return draft ?? null;
  } catch {
    return null;
  }
}

export async function clearDraft(key: DraftKey): Promise<void> {
  try {
    await run('readwrite', store => store.delete(key));
  } catch {
    // Nothing stored or storage unavailable.
  }
}

export function draftHasContent(draft: StoryDraft | null): boolean {
  return !!draft && (!!draft.audio || !!draft.text?.trim() || !!draft.transcript?.trim());
}
