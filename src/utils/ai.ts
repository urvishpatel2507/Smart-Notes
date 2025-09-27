import { AIFeatures, GlossaryTerm, GrammarError } from '@/types/note';

// Mock AI service - In production, integrate with Groq, OpenAI, or other AI service
export class AIService {
  static async analyzeNote(content: string): Promise<AIFeatures> {
    // Simulate API delay
    await this.delay(1000);

    return {
      glossaryTerms: this.extractGlossaryTerms(content),
      summary: this.generateSummary(content),
      suggestedTags: this.generateTags(content),
      grammarErrors: this.findGrammarErrors(content)
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static extractGlossaryTerms(content: string): GlossaryTerm[] {
    const terms: GlossaryTerm[] = [];
    
    // Mock glossary - in production, use AI to identify key terms
    const glossary: Record<string, string> = {
      'artificial intelligence': 'A branch of computer science that aims to create intelligent machines.',
      'machine learning': 'A subset of AI that enables computers to learn without explicit programming.',
      'algorithm': 'A set of rules or instructions for solving a problem.',
      'database': 'A structured collection of data stored electronically.',
      'encryption': 'The process of converting information into a secret code.',
      'API': 'Application Programming Interface - a set of protocols for building software.',
      'framework': 'A platform for developing software applications.',
      'responsive': 'Web design that adapts to different screen sizes.'
    };

    const lowerContent = content.toLowerCase();
    
    Object.entries(glossary).forEach(([term, definition]) => {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        terms.push({
          term: match[0],
          definition,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });

    return terms;
  }

  private static generateSummary(content: string): string {
    if (content.length < 50) {
      return content.substring(0, 100) + (content.length > 100 ? '...' : '');
    }

    // Mock summary generation
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 'Empty note';
    
    const firstSentence = sentences[0].trim();
    const secondSentence = sentences[1]?.trim();
    
    if (secondSentence) {
      return `${firstSentence}. ${secondSentence.substring(0, 50)}${secondSentence.length > 50 ? '...' : ''}.`;
    }
    
    return firstSentence.substring(0, 120) + (firstSentence.length > 120 ? '...' : '');
  }

  private static generateTags(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const commonWords = new Set(['this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']);
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      if (!commonWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    const tags = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    // Add some contextual tags based on content
    const contextualTags = [];
    if (content.toLowerCase().includes('meeting') || content.toLowerCase().includes('discussion')) {
      contextualTags.push('meeting');
    }
    if (content.toLowerCase().includes('todo') || content.toLowerCase().includes('task')) {
      contextualTags.push('todo');
    }
    if (content.toLowerCase().includes('idea') || content.toLowerCase().includes('brainstorm')) {
      contextualTags.push('ideas');
    }

    return [...new Set([...contextualTags, ...tags])].slice(0, 5);
  }

  private static findGrammarErrors(content: string): GrammarError[] {
    const errors: GrammarError[] = [];
    
    // Mock grammar checking - in production, use AI grammar service
    const commonErrors = [
      { pattern: /\bi\s/gi, replacement: 'I ', error: 'i should be capitalized' },
      { pattern: /\bits\s/gi, replacement: "it's ", error: "did you mean it's?" },
      { pattern: /\byou\s+is\b/gi, replacement: 'you are', error: 'subject-verb disagreement' },
      { pattern: /\btheir\s+is\b/gi, replacement: 'there is', error: 'incorrect their/there usage' },
      { pattern: /\bthere\s+are\s+a\b/gi, replacement: 'there is a', error: 'singular/plural disagreement' }
    ];

    commonErrors.forEach(({ pattern, replacement, error }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        errors.push({
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: replacement
        });
      }
    });

    return errors;
  }

  static async translateText(text: string, targetLanguage: string): Promise<string> {
    await this.delay(1500);
    
    // Mock translation - in production, use AI translation service
    const translations: Record<string, Record<string, string>> = {
      'es': { 'hello': 'hola', 'world': 'mundo', 'note': 'nota', 'text': 'texto' },
      'fr': { 'hello': 'bonjour', 'world': 'monde', 'note': 'note', 'text': 'texte' },
      'de': { 'hello': 'hallo', 'world': 'welt', 'note': 'notiz', 'text': 'text' }
    };

    let translated = text;
    const langDict = translations[targetLanguage];
    
    if (langDict) {
      Object.entries(langDict).forEach(([english, foreign]) => {
        const regex = new RegExp(`\\b${english}\\b`, 'gi');
        translated = translated.replace(regex, foreign);
      });
    }

    return translated;
  }
}