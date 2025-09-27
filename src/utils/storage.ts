import { Note, EncryptedNote } from '@/types/note';

const STORAGE_KEY = 'shareable-notes';
const ENCRYPTED_STORAGE_KEY = 'encrypted-notes';

// Simple encryption using Web Crypto API
export class NoteEncryption {
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
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

  static async encrypt(text: string, password: string): Promise<{ encrypted: string; salt: string }> {
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

  static async decrypt(encryptedData: string, password: string, saltString: string): Promise<string> {
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
  static getNotes(): Note[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const notes = JSON.parse(stored);
      return notes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt)
      }));
    } catch {
      return [];
    }
  }

  static saveNotes(notes: Note[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }

  static getEncryptedNotes(): EncryptedNote[] {
    try {
      const stored = localStorage.getItem(ENCRYPTED_STORAGE_KEY);
      if (!stored) return [];
      
      const notes = JSON.parse(stored);
      return notes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt)
      }));
    } catch {
      return [];
    }
  }

  static saveEncryptedNotes(notes: EncryptedNote[]): void {
    localStorage.setItem(ENCRYPTED_STORAGE_KEY, JSON.stringify(notes));
  }

  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}