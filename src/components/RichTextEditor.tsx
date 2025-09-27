import React, { useRef, useCallback, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Eye,
  EyeOff,
  List,
  ListOrdered
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FormatCommand, GlossaryTerm, GrammarError } from '@/types/note';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  glossaryTerms?: GlossaryTerm[];
  grammarErrors?: GrammarError[];
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  glossaryTerms = [],
  grammarErrors = [],
  placeholder = "Start writing your note...",
  className
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<Set<string>>(new Set());

  // Update editor content when content prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
    }
  }, [onChange]);

  // Execute format command
  const execCommand = useCallback((command: FormatCommand) => {
    document.execCommand(command.command, false, command.value);
    editorRef.current?.focus();
    
    // Update selected format state
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const formats = new Set<string>();
        if (document.queryCommandState('bold')) formats.add('bold');
        if (document.queryCommandState('italic')) formats.add('italic');
        if (document.queryCommandState('underline')) formats.add('underline');
        setSelectedFormat(formats);
      }
    }, 10);
  }, []);

  // Handle selection change to update toolbar state
  const handleSelectionChange = useCallback(() => {
    if (document.activeElement === editorRef.current) {
      const formats = new Set<string>();
      if (document.queryCommandState('bold')) formats.add('bold');
      if (document.queryCommandState('italic')) formats.add('italic');
      if (document.queryCommandState('underline')) formats.add('underline');
      setSelectedFormat(formats);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  // Format content with glossary and grammar highlighting
  const formatContentWithHighlights = useCallback((text: string): string => {
    if (isPreviewMode) return text;

    let formatted = text;
    
    // Add grammar error highlights
    grammarErrors.forEach(error => {
      const errorText = formatted.substring(error.startIndex, error.endIndex);
      const highlighted = `<span class="grammar-error" title="${error.suggestion}">${errorText}</span>`;
      formatted = formatted.substring(0, error.startIndex) + 
                 highlighted + 
                 formatted.substring(error.endIndex);
    });

    // Add glossary highlights
    glossaryTerms.forEach(term => {
      const termRegex = new RegExp(`\\b${term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      formatted = formatted.replace(termRegex, (match) => 
        `<span class="glossary-term" data-definition="${term.definition}">${match}</span>`
      );
    });

    return formatted;
  }, [glossaryTerms, grammarErrors, isPreviewMode]);

  const toolbarButtons = [
    {
      command: { command: 'bold' },
      icon: Bold,
      label: 'Bold',
      active: selectedFormat.has('bold')
    },
    {
      command: { command: 'italic' },
      icon: Italic,
      label: 'Italic',
      active: selectedFormat.has('italic')
    },
    {
      command: { command: 'underline' },
      icon: Underline,
      label: 'Underline',
      active: selectedFormat.has('underline')
    },
    {
      command: { command: 'insertUnorderedList' },
      icon: List,
      label: 'Bullet List',
      active: false
    },
    {
      command: { command: 'insertOrderedList' },
      icon: ListOrdered,
      label: 'Numbered List',
      active: false
    },
    {
      command: { command: 'justifyLeft' },
      icon: AlignLeft,
      label: 'Align Left',
      active: false
    },
    {
      command: { command: 'justifyCenter' },
      icon: AlignCenter,
      label: 'Align Center',
      active: false
    },
    {
      command: { command: 'justifyRight' },
      icon: AlignRight,
      label: 'Align Right',
      active: false
    }
  ];

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
  const fontFamilies = [
    { label: 'Default', value: 'inherit' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Verdana', value: 'Verdana, sans-serif' }
  ];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
        {/* Format buttons */}
        {toolbarButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <Button
              key={index}
              variant={button.active ? "default" : "ghost"}
              size="sm"
              onClick={() => execCommand(button.command)}
              title={button.label}
              className="h-8 w-8 p-0"
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}

        {/* Font controls */}
        <div className="flex items-center gap-2 ml-4 border-l border-border pl-4">
          {/* Font family selector */}
          <select
            className="text-sm border border-border rounded px-2 py-1 bg-background min-w-[120px]"
            onChange={(e) => execCommand({ command: 'fontName', value: e.target.value })}
            defaultValue="inherit"
          >
            {fontFamilies.map(font => (
              <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                {font.label}
              </option>
            ))}
          </select>

          {/* Font size selector */}
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <select
              className="text-sm border border-border rounded px-2 py-1 bg-background"
              onChange={(e) => execCommand({ command: 'fontSize', value: e.target.value })}
              defaultValue="16px"
            >
              {fontSizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview toggle */}
        <div className="ml-auto">
          <Button
            variant={isPreviewMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
            className="h-8"
          >
            {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="ml-1 text-xs">
              {isPreviewMode ? "Edit" : "Preview"}
            </span>
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <div
          ref={editorRef}
          contentEditable={!isPreviewMode}
          onInput={handleInput}
          className={cn(
            "w-full h-full p-4 outline-none resize-none bg-background",
            "prose prose-sm max-w-none",
            "[&_.glossary-term]:bg-primary/10 [&_.glossary-term]:border-b-2 [&_.glossary-term]:border-primary/30 [&_.glossary-term]:cursor-help",
            "[&_.grammar-error]:bg-destructive/10 [&_.grammar-error]:border-b-2 [&_.grammar-error]:border-destructive [&_.grammar-error]:border-dotted [&_.grammar-error]:cursor-help",
            isPreviewMode && "cursor-default bg-muted/20",
            !content && "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none"
          )}
          data-placeholder={placeholder}
          suppressContentEditableWarning
          dangerouslySetInnerHTML={
            isPreviewMode 
              ? { __html: formatContentWithHighlights(content) }
              : undefined
          }
        />

      </div>
    </div>
  );
}