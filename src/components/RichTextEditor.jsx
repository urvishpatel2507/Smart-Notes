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
  ListOrdered,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function RichTextEditor({
  content,
  onChange,
  glossaryTerms = [],
  grammarErrors = [],
  placeholder = "Start writing your note...",
  className
}) {
  const editorRef = useRef(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const execCommand = useCallback((command) => {
    // Handle list commands specially
    if (command.command === 'insertUnorderedList' || command.command === 'insertOrderedList') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const listType = command.command === 'insertUnorderedList' ? 'ul' : 'ol';
        
        // Check if we're already in a list
        let listElement = range.commonAncestorContainer.parentElement;
        while (listElement && listElement !== editorRef.current) {
          if (listElement.tagName === 'UL' || listElement.tagName === 'OL') {
            // If we're in a list of the same type, remove the list
            if (listElement.tagName === listType.toUpperCase()) {
              const listItems = Array.from(listElement.children);
              listItems.forEach(li => {
                const textNode = document.createTextNode(li.textContent + '\n');
                listElement.parentNode?.insertBefore(textNode, listElement);
              });
              listElement.remove();
            } else {
              // Convert to the other list type
              const newList = document.createElement(listType);
              const listItems = Array.from(listElement.children);
              listItems.forEach(li => {
                newList.appendChild(li.cloneNode(true));
              });
              listElement.parentNode?.replaceChild(newList, listElement);
            }
            editorRef.current?.focus();
            handleInput();
            return;
          }
          listElement = listElement.parentElement;
        }
        
        // Create new list
        const list = document.createElement(listType);
        const listItem = document.createElement('li');
        
        // If there's selected text, put it in the list item
        if (selection.toString()) {
          listItem.textContent = selection.toString();
          range.deleteContents();
        } else {
          listItem.textContent = '• '; // Add bullet point for unordered lists
        }
        
        list.appendChild(listItem);
        range.insertNode(list);
        
        // Position cursor after the bullet/number
        const newRange = document.createRange();
        newRange.setStartAfter(listItem);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } else {
      document.execCommand(command.command, false, command.value);
    }
    
    editorRef.current?.focus();
    
    // Update selected format state
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const formats = new Set();
        if (document.queryCommandState('bold')) formats.add('bold');
        if (document.queryCommandState('italic')) formats.add('italic');
        if (document.queryCommandState('underline')) formats.add('underline');
        setSelectedFormat(formats);
      }
    }, 10);
  }, [handleInput]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Handle Enter key in lists
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let listElement = range.commonAncestorContainer.parentElement;
        
        // Check if we're in a list item
        while (listElement && listElement !== editorRef.current) {
          if (listElement.tagName === 'LI') {
            const list = listElement.parentElement;
            if (list && (list.tagName === 'UL' || list.tagName === 'OL')) {
              // If the list item is empty, exit the list
              if (listElement.textContent?.trim() === '' || listElement.textContent?.trim() === '•') {
                e.preventDefault();
                const newParagraph = document.createElement('p');
                newParagraph.innerHTML = '<br>';
                list.parentNode?.insertBefore(newParagraph, list);
                
                // Position cursor in the new paragraph
                const newRange = document.createRange();
                newRange.setStart(newParagraph, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
                
                // Remove the empty list item
                listElement.remove();
                
                // If list is now empty, remove the list
                if (list.children.length === 0) {
                  list.remove();
                }
              } else {
                // Create a new list item
                e.preventDefault();
                const newListItem = document.createElement('li');
                newListItem.innerHTML = '<br>';
                list.appendChild(newListItem);
                
                // Position cursor in the new list item
                const newRange = document.createRange();
                newRange.setStart(newListItem, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
              handleInput();
              return;
            }
          }
          listElement = listElement.parentElement;
        }
      }
    }
    
    // Handle Tab key for indentation in lists
    if (e.key === 'Tab') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let listElement = range.commonAncestorContainer.parentElement;
        
        // Check if we're in a list item
        while (listElement && listElement !== editorRef.current) {
          if (listElement.tagName === 'LI') {
            e.preventDefault();
            const list = listElement.parentElement;
            if (list && (list.tagName === 'UL' || list.tagName === 'OL')) {
              if (e.shiftKey) {
                // Outdent (move to parent list)
                const parentList = list.parentElement;
                if (parentList && (parentList.tagName === 'UL' || parentList.tagName === 'OL')) {
                  const parentListItem = parentList.parentElement;
                  if (parentListItem && parentListItem.tagName === 'LI') {
                    parentList.insertBefore(listElement, parentListItem.nextSibling);
                  }
                }
              } else {
                // Indent (create nested list)
                const previousItem = listElement.previousElementSibling;
                if (previousItem && previousItem.tagName === 'LI') {
                  let nestedList = previousItem.querySelector('ul, ol');
                  if (!nestedList) {
                    nestedList = document.createElement(list.tagName);
                    previousItem.appendChild(nestedList);
                  }
                  nestedList.appendChild(listElement);
                }
              }
              handleInput();
              return;
            }
          }
          listElement = listElement.parentElement;
        }
      }
    }
  }, [handleInput]);

  // Handle selection change to update toolbar state
  const handleSelectionChange = useCallback(() => {
    if (document.activeElement === editorRef.current) {
      const formats = new Set();
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
  const formatContentWithHighlights = useCallback((text) => {
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
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 overflow-x-auto">
        {/* Mobile: Show only essential buttons */}
        {isMobile ? (
          <>
            {/* Essential format buttons */}
            {toolbarButtons.slice(0, 4).map((button, index) => {
              const Icon = button.icon;
              return (
                <Button
                  key={index}
                  variant={button.active ? "default" : "ghost"}
                  size="sm"
                  onClick={() => execCommand(button.command)}
                  title={button.label}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
            
            {/* More options dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {toolbarButtons.slice(4).map((button, index) => {
                  const Icon = button.icon;
                  return (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => execCommand(button.command)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {button.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          /* Desktop: Show all buttons */
          <>
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
          </>
        )}

        {/* Font controls - Desktop only */}
        {!isMobile && (
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
        )}

        {/* Preview toggle */}
        <div className="ml-auto">
          <Button
            variant={isPreviewMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
            className={cn("h-8", isMobile && "px-2")}
          >
            {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {!isMobile && (
              <span className="ml-1 text-xs">
                {isPreviewMode ? "Edit" : "Preview"}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <div
          ref={editorRef}
          contentEditable={!isPreviewMode}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className={cn(
            "rich-text-editor w-full h-full p-3 sm:p-4 outline-none resize-none bg-background",
            "prose prose-sm max-w-none",
            "[&_.glossary-term]:bg-primary/10 [&_.glossary-term]:border-b-2 [&_.glossary-term]:border-primary/30 [&_.glossary-term]:cursor-help",
            "[&_.grammar-error]:bg-destructive/10 [&_.grammar-error]:border-b-2 [&_.grammar-error]:border-destructive [&_.grammar-error]:border-dotted [&_.grammar-error]:cursor-help",
            isPreviewMode && "cursor-default bg-muted/20",
            !content && "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
            "text-sm sm:text-base leading-relaxed"
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
