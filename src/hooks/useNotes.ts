import { useState, useEffect, useCallback } from 'react';
import { Note, EncryptedNote } from '@/types/note';
import { NotesStorage, NoteEncryption } from '@/utils/storage';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [encryptedNotes, setEncryptedNotes] = useState<EncryptedNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Load notes on mount
  useEffect(() => {
    const loadedNotes = NotesStorage.getNotes();
    const loadedEncryptedNotes = NotesStorage.getEncryptedNotes();
    setNotes(loadedNotes);
    setEncryptedNotes(loadedEncryptedNotes);
    setLoading(false);
  }, []);

  // Save notes whenever they change
  useEffect(() => {
    if (!loading) {
      NotesStorage.saveNotes(notes);
    }
  }, [notes, loading]);

  useEffect(() => {
    if (!loading) {
      NotesStorage.saveEncryptedNotes(encryptedNotes);
    }
  }, [encryptedNotes, loading]);

  const createNote = useCallback((title: string, content: string, isEncrypted = false, password?: string) => {
    const note: Note = {
      id: NotesStorage.generateId(),
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
      isEncrypted,
      tags: [],
      summary: undefined
    };

    if (isEncrypted && password) {
      // Create encrypted note
      NoteEncryption.encrypt(content, password).then(({ encrypted, salt }) => {
        const { content, ...noteWithoutContent } = note;
        const encryptedNote: EncryptedNote = {
          ...noteWithoutContent,
          encryptedContent: encrypted,
          salt
        };
        setEncryptedNotes(prev => [...prev, encryptedNote]);
      });
    } else {
      setNotes(prev => [...prev, note]);
    }

    return note.id;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>, password?: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: new Date() }
        : note
    ));

    // Handle encrypted notes
    if (password) {
      setEncryptedNotes(prev => prev.map(note => 
        note.id === id 
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      ));
    }
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    setEncryptedNotes(prev => prev.filter(note => note.id !== id));
  }, []);

  const togglePin = useCallback((id: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, isPinned: !note.isPinned, updatedAt: new Date() }
        : note
    ));

    setEncryptedNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, isPinned: !note.isPinned, updatedAt: new Date() }
        : note
    ));
  }, []);

  const decryptNote = useCallback(async (id: string, password: string): Promise<string | null> => {
    const encryptedNote = encryptedNotes.find(note => note.id === id);
    if (!encryptedNote) return null;

    try {
      const decrypted = await NoteEncryption.decrypt(
        encryptedNote.encryptedContent,
        password,
        encryptedNote.salt
      );
      return decrypted;
    } catch {
      return null;
    }
  }, [encryptedNotes]);

  // Filter and sort notes
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) || 
           note.content.toLowerCase().includes(query) ||
           note.tags.some(tag => tag.toLowerCase().includes(query));
  });

  const filteredEncryptedNotes = encryptedNotes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) ||
           note.tags.some(tag => tag.toLowerCase().includes(query));
  });

  // Sort notes (pinned first, then by updated date)
  const sortedNotes = [...filteredNotes, ...filteredEncryptedNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return {
    notes: sortedNotes,
    searchQuery,
    setSearchQuery,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    decryptNote,
    loading
  };
}