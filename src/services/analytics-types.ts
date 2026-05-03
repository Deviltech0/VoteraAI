/**
 * Analytics Shared Types — Data structures for Google Cloud Analytics.
 *
 * @module services/analytics-types
 */

/** Categories of voter intent detected by Natural Language API. */
export type QueryIntent =
  | 'eligibility'
  | 'registration'
  | 'polling_location'
  | 'election_type'
  | 'evm_vvpat'
  | 'candidate_info'
  | 'timeline'
  | 'general';

/** Anonymised analytics event stored in Firestore. */
export interface AnalyticsEvent {
  readonly sessionId: string;
  readonly queryCategory: QueryIntent;
  readonly languageCode: string;
  readonly timestamp: string;
  readonly entities: readonly string[];
  readonly sentiment: 'positive' | 'neutral' | 'negative';
}

/** Natural Language API entity result. */
export interface NLEntity {
  name: string;
  type: string;
  salience: number;
}

/** Natural Language API sentiment result. */
export interface NLSentiment {
  score: number;
  magnitude: number;
}

/** Natural Language API response structure. */
export interface NLApiResponse {
  entities?: NLEntity[];
  documentSentiment?: NLSentiment;
  language?: string;
}

/** Firestore document write response. */
export interface FirestoreWriteResponse {
  name?: string;
  fields?: Record<string, unknown>;
}
