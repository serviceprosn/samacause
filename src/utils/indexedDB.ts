export interface PendingSignature {
  petitionId: string;
  name: string;
  email: string;
  phone: string;
}

class IndexedDBHelper {
  private dbName = 'SunuYiteDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported on this environment'));
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('petitions')) {
          db.createObjectStore('petitions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cagnottes')) {
          db.createObjectStore('cagnottes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tontines')) {
          db.createObjectStore('tontines', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending_signatures')) {
          db.createObjectStore('pending_signatures', { autoIncrement: true });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Generic Save all items
  async saveAll(storeName: string, items: any[]): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      // Clear existing records first
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        items.forEach(item => {
          store.put(item);
        });
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Generic Get all items
  async getAll(storeName: string): Promise<any[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Add pending signature
  async addPendingSignature(sig: PendingSignature): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pending_signatures', 'readwrite');
      const store = transaction.objectStore('pending_signatures');
      store.add(sig);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get all pending signatures
  async getPendingSignatures(): Promise<{ key: any; value: PendingSignature }[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pending_signatures', 'readonly');
      const store = transaction.objectStore('pending_signatures');
      const list: { key: any; value: PendingSignature }[] = [];

      store.openCursor().onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          list.push({ key: cursor.key, value: cursor.value });
          cursor.continue();
        } else {
          resolve(list);
        }
      };
    });
  }

  // Remove pending signature by key
  async removePendingSignature(key: any): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pending_signatures', 'readwrite');
      const store = transaction.objectStore('pending_signatures');
      store.delete(key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const dbHelper = new IndexedDBHelper();
