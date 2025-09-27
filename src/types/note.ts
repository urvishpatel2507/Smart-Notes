export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isEncrypted: boolean;
  tags: string[];
  summary?: string;
}

export interface EncryptedNote extends Omit<Note, 'content'> {
  encryptedContent: string;
  salt: string;
}

export interface AIFeatures {
  glossaryTerms: GlossaryTerm[];
  summary: string;
  suggestedTags: string[];
  grammarErrors: GrammarError[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  startIndex: number;
  endIndex: number;
}

export interface GrammarError {
  text: string;
  startIndex: number;
  endIndex: number;
  suggestion: string;
}

export interface FormatCommand {
  command: string;
  value?: string;
}