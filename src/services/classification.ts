/**
 * Analytics Intent Classifier — Logic for mapping queries to election categories.
 *
 * Extracted from analytics.ts to keep modules modular and maintain
 * file complexity within strict quality limits.
 *
 * @module services/classification
 */

import type { QueryIntent } from './analytics-types';

/**
 * Keyword-to-intent map for local pre-classification.
 */
const INTENT_MAP: readonly {
  readonly keywords: readonly string[];
  readonly intent: QueryIntent;
}[] = [
  { keywords: ['eligib', 'can i vote', 'age'], intent: 'eligibility' },
  { keywords: ['register', 'enrol', 'form 6'], intent: 'registration' },
  { keywords: ['booth', 'polling', 'where'], intent: 'polling_location' },
  { keywords: ['evm', 'vvpat', 'machine'], intent: 'evm_vvpat' },
  { keywords: ['lok sabha', 'rajya', 'panchayat', 'municipal'], intent: 'election_type' },
  { keywords: ['candidate', 'party', 'mp'], intent: 'candidate_info' },
  { keywords: ['date', 'schedule', 'deadline'], intent: 'timeline' },
] as const;

/**
 * Classify a voter query into an intent category using keyword matching.
 *
 * @param query - Lowercase sanitised query.
 * @returns Matched intent category or 'general'.
 */
export function classifyVoterIntent(query: string): QueryIntent {
  const lower = query.toLowerCase();
  const match = INTENT_MAP.find((entry) => entry.keywords.some((kw) => lower.includes(kw)));
  return match?.intent ?? 'general';
}
