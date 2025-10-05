/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {boolean} isPinned
 * @property {boolean} isEncrypted
 * @property {string[]} tags
 * @property {string} [summary]
 */

/**
 * @typedef {Object} EncryptedNote
 * @property {string} id
 * @property {string} title
 * @property {string} encryptedContent
 * @property {string} salt
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {boolean} isPinned
 * @property {boolean} isEncrypted
 * @property {string[]} tags
 * @property {string} [summary]
 */

/**
 * @typedef {Object} AIFeatures
 * @property {GlossaryTerm[]} glossaryTerms
 * @property {string} summary
 * @property {string[]} suggestedTags
 * @property {GrammarError[]} grammarErrors
 */

/**
 * @typedef {Object} GlossaryTerm
 * @property {string} term
 * @property {string} definition
 * @property {number} startIndex
 * @property {number} endIndex
 */

/**
 * @typedef {Object} GrammarError
 * @property {string} text
 * @property {number} startIndex
 * @property {number} endIndex
 * @property {string} suggestion
 */

/**
 * @typedef {Object} FormatCommand
 * @property {string} command
 * @property {string} [value]
 */

// Export empty object since we're just providing type definitions
export {};
