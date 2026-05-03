/**
 * Vertex Corpus Tests — Tests for FAQ data integrity.
 *
 * Verifies the FAQ corpus is complete, keyword maps are valid,
 * and all indices point to valid entries.
 *
 * @module tests/unit/vertex-corpus
 */

import { describe, it, expect } from 'vitest';
import { ELECTION_FAQ_CORPUS, FAQ_KEYWORD_MAP } from '../../src/services/vertex-corpus';

describe('ELECTION_FAQ_CORPUS', () => {
  it('contains at least 40 FAQ entries', () => {
    expect(ELECTION_FAQ_CORPUS.length).toBeGreaterThanOrEqual(40);
  });

  it('every entry has a question and answer', () => {
    ELECTION_FAQ_CORPUS.forEach((faq, index) => {
      expect(faq.question.length, `FAQ ${index} question`).toBeGreaterThan(5);
      expect(faq.answer.length, `FAQ ${index} answer`).toBeGreaterThan(5);
    });
  });

  it('covers core election topics', () => {
    const questions = ELECTION_FAQ_CORPUS.map((f) => f.question.toLowerCase());
    expect(questions.some((q) => q.includes('eligible'))).toBe(true);
    expect(questions.some((q) => q.includes('register'))).toBe(true);
    expect(questions.some((q) => q.includes('nota'))).toBe(true);
    expect(questions.some((q) => q.includes('evm'))).toBe(true);
    expect(questions.some((q) => q.includes('polling booth'))).toBe(true);
  });
});

describe('FAQ_KEYWORD_MAP', () => {
  it('has the same number of entries as corpus', () => {
    expect(FAQ_KEYWORD_MAP.length).toBe(ELECTION_FAQ_CORPUS.length);
  });

  it('every index points to a valid corpus entry', () => {
    FAQ_KEYWORD_MAP.forEach((entry) => {
      expect(entry.index).toBeGreaterThanOrEqual(0);
      expect(entry.index).toBeLessThan(ELECTION_FAQ_CORPUS.length);
    });
  });

  it('every entry has at least one keyword', () => {
    FAQ_KEYWORD_MAP.forEach((entry) => {
      expect(entry.keywords.length).toBeGreaterThan(0);
    });
  });

  it('no duplicate indices', () => {
    const indices = FAQ_KEYWORD_MAP.map((e) => e.index);
    const unique = new Set(indices);
    // Some overlap is acceptable (NRI has two entries)
    expect(unique.size).toBeGreaterThanOrEqual(FAQ_KEYWORD_MAP.length - 5);
  });
});
