import React, { useState } from 'react';
import { Search, Plus, Pin, Lock, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Note, EncryptedNote } from '@/types/note';

interface NotesSidebarProps {
  notes: (Note | EncryptedNote)[];
  selectedNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNoteSelect: (note: Note | EncryptedNote) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  className?: string;
}

function NoteCard({ 
  note, 
  isSelected, 
  onSelect, 
  onDelete, 
  onTogglePin 
}: {
  note: Note | EncryptedNote;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  
  const isEncrypted = 'encryptedContent' in note;
  const preview = isEncrypted 
    ? "🔒 Encrypted note - click to decrypt"
    : note.content.replace(/<[^>]*>/g, '').substring(0, 100);

  return (
    <div
      className={cn(
        "group p-3 rounded-lg border cursor-pointer transition-all duration-200",
        "hover:shadow-sm hover:border-primary/20",
        isSelected 
          ? "bg-primary/5 border-primary/30 shadow-sm" 
          : "bg-card border-border hover:bg-muted/30"
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header with title and actions */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {note.isPinned && (
              <Pin className="h-3 w-3 text-primary fill-current" />
            )}
            {isEncrypted && (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <h3 className={cn(
            "font-medium text-sm line-clamp-2 leading-tight",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {note.title || "Untitled Note"}
          </h3>
        </div>

        {/* Actions */}
        <div className={cn(
          "flex items-center gap-1 ml-2 transition-opacity",
          showActions ? "opacity-100" : "opacity-0"
        )}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            
          >
            <Pin className={cn(
              "h-3 w-3",
              note.isPinned ? "text-primary fill-current" : "text-muted-foreground"
            )} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Preview */}
      <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
        {preview}
      </p>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
              {tag}
            </Badge>
          ))}
          {note.tags.length > 3 && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              +{note.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {new Date(note.updatedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
        {note.summary && (
          <Eye className="h-3 w-3" />
        )}
      </div>
    </div>
  );
}

export function NotesSidebar({
  notes,
  selectedNoteId,
  searchQuery,
  onSearchChange,
  onNoteSelect,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  className
}: NotesSidebarProps) {
  return (
    <div className={cn("flex flex-col h-full bg-muted/30 border-r border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-foreground">Notes</h1>
          <Button
            onClick={onCreateNote}
            size="sm"
            className="h-8 w-8 p-0"
            title="Create new note"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-2">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "No notes found" : "No notes yet"}
            </p>
            {!searchQuery && (
              <Button onClick={onCreateNote} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create your first note
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={selectedNoteId === note.id}
                onSelect={() => onNoteSelect(note)}
                onDelete={() => onDeleteNote(note.id)}
                onTogglePin={() => onTogglePin(note.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </p>
      </div>
    </div>
  );
}