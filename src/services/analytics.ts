/**
 * Google Cloud Analytics — Firestore + Natural Language API Integration.
 *
 * Logs anonymised voter queries to Google Cloud Firestore for aggregated
 * analysis and uses the Google Cloud Natural Language API to classify
 * query intent and extract election-related entities.
 *
 * @module services/analytics
 */

import { SafeApiClient } from './api-client';
import { sanitizeFull } from '../utils/sanitize';
import { generateA11yId } from '../utils/a11y';
import { classifyVoterIntent } from './classification';
import type { 
  AnalyticsEvent, 
  NLApiResponse, 
  NLSentiment, 
  FirestoreWriteResponse 
} from './analytics-types';

/**
 * Election Analytics Service.
 *
 * Integrates Google Cloud Natural Language API for query intent classification
 * and Google Cloud Firestore for anonymised event logging.
 */
export class ElectionAnalyticsService {
  /** API client for Natural Language API. */
  private readonly nlClient: SafeApiClient;
  
  /** API client for Firestore REST API. */
  private readonly firestoreClient: SafeApiClient;
  
  /** Unified Google Cloud API Key. */
  private readonly apiKey: string;
  
  /** Unique session identifier for anonymised tracking. */
  private readonly sessionId: string;

  /**
   * Initialize the Analytics Service and generate a session ID.
   */
  constructor() {
    this.apiKey = String(
      import.meta.env['VITE_GOOGLE_CLOUD_API_KEY'] ||
        import.meta.env['VITE_GEMINI_API_KEY'] ||
        import.meta.env['VITE_GEMINI_KEY'] ||
        '',
    );

    this.sessionId = generateA11yId('session');

    this.nlClient = new SafeApiClient({
      baseUrl: 'https://language.googleapis.com/v1',
      timeoutMs: 10000,
    });

    this.firestoreClient = new SafeApiClient({
      baseUrl: 'https://firestore.googleapis.com/v1/projects/votera-ai/databases/(default)/documents',
      timeoutMs: 8000,
    });
  }

  /**
   * Track a voter query using Natural Language API + Firestore.
   *
   * @param query - Raw voter query text.
   */
  async trackQuery(query: string): Promise<void> {
    if (!this.apiKey) {return;}

    const sanitised = sanitizeFull(query, 500);

    try {
      const [intent, nlResult] = await Promise.all([
        Promise.resolve(classifyVoterIntent(sanitised)),
        this.analyseWithNaturalLanguage(sanitised),
      ]);

      const event: AnalyticsEvent = {
        sessionId: this.sessionId,
        queryCategory: intent,
        languageCode: nlResult.language ?? 'en',
        timestamp: new Date().toISOString(),
        entities: nlResult.entities?.slice(0, 5).map((e) => e.type) ?? [],
        sentiment: this.normaliseSentiment(nlResult.documentSentiment),
      };

      this.dispatchLog(event);
    } catch {
      // Fail silently to never block the voter experience
    }
  }

  /**
   * Dispatch the log event asynchronously using idle time if possible.
   *
   * @param event - The event to log.
   */
  private dispatchLog(event: AnalyticsEvent): void {
    const logTask = (): void => void this.logToFirestore(event);
    
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(logTask);
    } else {
      setTimeout(logTask, 0);
    }
  }

  /**
   * Analyse text using Google Cloud Natural Language API.
   *
   * @param text - Text to analyse.
   * @returns Natural Language API result.
   */
  private async analyseWithNaturalLanguage(text: string): Promise<NLApiResponse> {
    const endpoint = `/documents:analyzeEntities?key=${this.apiKey}`;
    const body = {
      document: { type: 'PLAIN_TEXT', content: text, language: 'en' },
      encodingType: 'UTF8',
    };

    const response = await this.nlClient.post<NLApiResponse>(endpoint, body);
    return response.ok && response.data ? response.data : {};
  }

  /**
   * Write an analytics event to Google Cloud Firestore.
   *
   * @param event - Anonymised analytics event.
   */
  private async logToFirestore(event: AnalyticsEvent): Promise<void> {
    const endpoint = `/voter_queries?key=${this.apiKey}`;
    const firestoreDoc = {
      fields: {
        sessionId: { stringValue: event.sessionId },
        queryCategory: { stringValue: event.queryCategory },
        languageCode: { stringValue: event.languageCode },
        timestamp: { timestampValue: event.timestamp },
        sentiment: { stringValue: event.sentiment },
        entityTypes: {
          arrayValue: { values: event.entities.map((e) => ({ stringValue: e })) },
        },
      },
    };

    await this.firestoreClient.post<FirestoreWriteResponse>(endpoint, firestoreDoc);
  }

  /**
   * Normalise a Natural Language API sentiment score.
   *
   * @param sentiment - Raw sentiment object.
   * @returns Sentiment label.
   */
  private normaliseSentiment(sentiment: NLSentiment | undefined): 'positive' | 'neutral' | 'negative' {
    if (!sentiment) {return 'neutral';}
    if (sentiment.score > 0.15) {return 'positive';}
    if (sentiment.score < -0.15) {return 'negative';}
    return 'neutral';
  }

  /**
   * Check if analytics services are configured.
   *
   * @returns True if an API key is present.
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }
}
