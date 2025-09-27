import React, { useState, useEffect, useCallback } from 'react';
import { Save, Settings, Sparkles, Globe, ShieldCheck, RotateCcw, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { RichTextEditor } from './RichTextEditor';
import { NotesSidebar } from './NotesSidebar';
import { ThemeToggle } from './ThemeToggle';
import { useNotes } from '@/hooks/useNotes';
import { useIsMobile } from '@/hooks/use-mobile';
import { AIService } from '@/utils/ai';
import { Note, EncryptedNote, AIFeatures } from '@/types/note';
import { cn } from '@/lib/utils';

export function NotesApp() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const {
    notes,
    searchQuery,
    setSearchQuery,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    decryptNote,
    loading
  } = useNotes();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [aiFeatures, setAIFeatures] = useState<AIFeatures | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [showEncryptionDialog, setShowEncryptionDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState('es');
  const [translatedContent, setTranslatedContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (!selectedNote || !autoSave) return;

    const timer = setTimeout(() => {
      if (selectedNote && (noteTitle !== selectedNote.title || noteContent !== selectedNote.content)) {
        handleSaveNote();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [noteTitle, noteContent, selectedNote, autoSave]);

  // Handle note selection
  const handleNoteSelect = useCallback(async (note: Note | EncryptedNote) => {
    // Save current note if changes exist
    if (selectedNote && (noteTitle !== selectedNote.title || noteContent !== selectedNote.content)) {
      await handleSaveNote();
    }

    if ('encryptedContent' in note) {
      // Handle encrypted note
      const password = prompt('Enter password to decrypt this note:');
      if (!password) return;

      const decryptedContent = await decryptNote(note.id, password);
      if (decryptedContent === null) {
        toast({
          title: "Decryption Failed",
          description: "Invalid password or corrupted data.",
          variant: "destructive"
        });
        return;
      }

      const decryptedNote: Note = {
        ...note,
        content: decryptedContent,
        isEncrypted: true
      };
      
      setSelectedNote(decryptedNote);
      setNoteTitle(decryptedNote.title);
      setNoteContent(decryptedContent);
    } else {
      setSelectedNote(note);
      setNoteTitle(note.title);
      setNoteContent(note.content);
    }

    setAIFeatures(null);
    
    // Close sidebar on mobile after selecting a note
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [selectedNote, noteTitle, noteContent, decryptNote, toast, isMobile]);

  // Create new note
  const handleCreateNote = useCallback(() => {
    const newTitle = 'New Note';
    const newContent = '';
    
    const noteId = createNote(newTitle, newContent);
    
    const newNote: Note = {
      id: noteId,
      title: newTitle,
      content: newContent,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
      isEncrypted: false,
      tags: []
    };

    setSelectedNote(newNote);
    setNoteTitle(newTitle);
    setNoteContent(newContent);
    setAIFeatures(null);

    toast({
      title: "Note Created",
      description: "New note ready for editing."
    });
  }, [createNote, toast]);

  // Save note
  const handleSaveNote = useCallback(async () => {
    if (!selectedNote) return;

    const updates = {
      title: noteTitle,
      content: noteContent
    };

    updateNote(selectedNote.id, updates);
    
    setSelectedNote(prev => prev ? { ...prev, ...updates } : null);

    if (!autoSave) {
      toast({
        title: "Note Saved",
        description: "Your changes have been saved."
      });
    }
  }, [selectedNote, noteTitle, noteContent, updateNote, autoSave, toast]);

  // Delete note
  const handleDeleteNote = useCallback(async (id: string) => {
    // Check if note is encrypted
    const noteToDelete = notes.find(note => note.id === id);
    const isEncrypted = noteToDelete && ('encryptedContent' in noteToDelete || noteToDelete.isEncrypted);
    
    let password = '';
    if (isEncrypted) {
      password = prompt('Enter password to delete this encrypted note:') || '';
      if (!password) {
        toast({
          title: "Deletion Cancelled",
          description: "Password required to delete encrypted note."
        });
        return;
      }
    }

    const success = await deleteNote(id, password);
    
    if (!success) {
      toast({
        title: "Deletion Failed",
        description: "Invalid password or unable to delete note.",
        variant: "destructive"
      });
      return;
    }

    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setNoteTitle('');
      setNoteContent('');
      setAIFeatures(null);
    }
    
    toast({
      title: "Note Deleted",
      description: "Note has been permanently deleted."
    });
  }, [selectedNote, deleteNote, notes, toast]);

  // Analyze note with AI
  const handleAnalyzeNote = useCallback(async () => {
    if (!noteContent.trim()) {
      toast({
        title: "No Content",
        description: "Add some content to analyze with AI.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const features = await AIService.analyzeNote(noteContent);
      setAIFeatures(features);
      
      // Update note with AI suggestions
      if (selectedNote) {
        updateNote(selectedNote.id, {
          tags: features.suggestedTags,
          summary: features.summary
        });
      }

      toast({
        title: "AI Analysis Complete",
        description: "Note analyzed and enhanced with AI features."
      });
    } catch (error) {
      toast({
        title: "AI Analysis Failed",
        description: "Could not analyze note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [noteContent, selectedNote, updateNote, toast]);

  // Translate note
  const handleTranslateNote = useCallback(async () => {
    if (!noteContent.trim()) return;

    setIsTranslating(true);
    try {
      const translated = await AIService.translateText(noteContent, translationLanguage);
      setTranslatedContent(translated);
      
      toast({
        title: "Translation Complete",
        description: `Note translated to ${translationLanguage}.`
      });
    } catch (error) {
      toast({
        title: "Translation Failed",
        description: "Could not translate note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  }, [noteContent, translationLanguage, toast]);

  // Create encrypted note
  const handleCreateEncryptedNote = useCallback(() => {
    if (!encryptionPassword.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter a password for encryption.",
        variant: "destructive"
      });
      return;
    }

    const newTitle = 'Encrypted Note';
    const newContent = '';
    
    createNote(newTitle, newContent, true, encryptionPassword);
    setShowEncryptionDialog(false);
    setEncryptionPassword('');

    toast({
      title: "Encrypted Note Created",
      description: "Your secure note is ready for editing."
    });
  }, [encryptionPassword, createNote, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-80 flex-shrink-0">
          <NotesSidebar
            notes={notes}
            selectedNoteId={selectedNote?.id || null}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNoteSelect={handleNoteSelect}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleDeleteNote}
            onTogglePin={togglePin}
          />
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <NotesSidebar
              notes={notes}
              selectedNoteId={selectedNote?.id || null}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNoteSelect={handleNoteSelect}
              onCreateNote={handleCreateNote}
              onDeleteNote={handleDeleteNote}
              onTogglePin={togglePin}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Mobile Menu Button */}
                {isMobile && (
                  <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                  </Sheet>
                )}
                
                <div className="flex-1 min-w-0">
                  <Input
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Note title..."
                    className="text-base sm:text-lg font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0"
                  />
                  <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                    {selectedNote.isEncrypted && (
                      <Badge variant="secondary" className="text-xs">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Encrypted</span>
                        <span className="sm:hidden">🔒</span>
                      </Badge>
                    )}
                    {aiFeatures?.suggestedTags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                <ThemeToggle />
                
                <Button
                  onClick={handleAnalyzeNote}
                  disabled={isAnalyzing}
                  size="sm"
                  variant="outline"
                  title="Analyze with AI"
                  className="hidden sm:flex"
                >
                  <Sparkles className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
                  {isAnalyzing ? "Analyzing..." : "AI Analyze"}
                </Button>
                
                {/* Mobile AI Button */}
                <Button
                  onClick={handleAnalyzeNote}
                  disabled={isAnalyzing}
                  size="sm"
                  variant="outline"
                  title="Analyze with AI"
                  className="sm:hidden h-8 w-8 p-0"
                >
                  <Sparkles className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
                </Button>

                <Button
                  onClick={handleSaveNote}
                  size="sm"
                  title="Save note"
                  className="hidden sm:flex"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                
                {/* Mobile Save Button */}
                <Button
                  onClick={handleSaveNote}
                  size="sm"
                  title="Save note"
                  className="sm:hidden h-8 w-8 p-0"
                >
                  <Save className="h-4 w-4" />
                </Button>

                {/* Settings Dialog */}
                <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" title="Settings" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Note Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Translation</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Select value={translationLanguage} onValueChange={setTranslationLanguage}>
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="it">Italian</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handleTranslateNote}
                            disabled={isTranslating}
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            {isTranslating ? "Translating..." : "Translate"}
                          </Button>
                        </div>
                        {translatedContent && (
                          <Textarea
                            value={translatedContent}
                            readOnly
                            className="mt-2 h-32"
                            placeholder="Translation will appear here..."
                          />
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Encryption Dialog */}
                <Dialog open={showEncryptionDialog} onOpenChange={setShowEncryptionDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" title="Create encrypted note" className="h-8 w-8 p-0">
                      <ShieldCheck className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Encrypted Note</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Encryption Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={encryptionPassword}
                          onChange={(e) => setEncryptionPassword(e.target.value)}
                          placeholder="Enter a strong password..."
                        />
                      </div>
                      <Button onClick={handleCreateEncryptedNote} className="w-full">
                        Create Encrypted Note
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* AI Summary */}
            {aiFeatures?.summary && (
              <div className="bg-primary/5 border-b border-border p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">AI Summary</p>
                    <p className="text-sm text-muted-foreground">{aiFeatures.summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rich Text Editor */}
            <div className="flex-1">
              <RichTextEditor
                content={noteContent}
                onChange={setNoteContent}
                glossaryTerms={aiFeatures?.glossaryTerms}
                grammarErrors={aiFeatures?.grammarErrors}
                placeholder="Start writing your note..."
              />
            </div>
          </>
        ) : (
          // Empty state
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md w-full">
              <div className="mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Save className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Welcome to Smart Notes</h2>
                <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                  Create, edit, and organize your notes with AI-powered features and encryption.
                </p>
              </div>
              <div className="space-y-3">
                <Button onClick={handleCreateNote} className="w-full">
                  Create Your First Note
                </Button>
                <Button 
                  onClick={() => setShowEncryptionDialog(true)} 
                  variant="outline" 
                  className="w-full"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Create Encrypted Note
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Encryption Dialog */}
      <Dialog open={showEncryptionDialog} onOpenChange={setShowEncryptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Encrypted Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Encryption Password</Label>
              <Input
                id="password"
                type="password"
                value={encryptionPassword}
                onChange={(e) => setEncryptionPassword(e.target.value)}
                placeholder="Enter a strong password..."
              />
              <p className="text-xs text-muted-foreground">
                Choose a strong password. You'll need it to decrypt your note.
              </p>
            </div>
            <Button onClick={handleCreateEncryptedNote} className="w-full">
              Create Encrypted Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}