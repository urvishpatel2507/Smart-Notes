const STORAGE_KEY = 'smart-notes';
const ENCRYPTED_STORAGE_KEY = 'smart-notes-encrypted';

// Simple encryption using Web Crypto API
export class NoteEncryption {
  static async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(text, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveKey(password, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(text)
    );

    const encryptedArray = new Uint8Array(encrypted);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv);
    result.set(encryptedArray, iv.length);

    return {
      encrypted: btoa(String.fromCharCode(...result)),
      salt: btoa(String.fromCharCode(...salt))
    };
  }

  static async decrypt(encryptedData, password, saltString) {
    const decoder = new TextDecoder();
    const salt = new Uint8Array(atob(saltString).split('').map(c => c.charCodeAt(0)));
    const key = await this.deriveKey(password, salt);
    
    const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  }
}

export class NotesStorage {
  static getNotes() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const notes = JSON.parse(stored);
      return notes.map((note) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt)
      }));
    } catch {
      return [];
    }
  }

  static saveNotes(notes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }

  static getEncryptedNotes() {
    try {
      const stored = localStorage.getItem(ENCRYPTED_STORAGE_KEY);
      if (!stored) return [];
      
      const notes = JSON.parse(stored);
      return notes.map((note) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt)
      }));
    } catch {
      return [];
    }
  }

  static saveEncryptedNotes(notes) {
    localStorage.setItem(ENCRYPTED_STORAGE_KEY, JSON.stringify(notes));
  }

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
