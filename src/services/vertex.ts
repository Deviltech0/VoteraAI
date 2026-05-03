/**
 * Google Vertex AI Integration — Voter Query Embedding & Semantic Search.
 *
 * Uses Google Cloud Vertex AI text-embedding models to convert voter
 * questions into semantic vectors, enabling smarter FAQ matching and
 * contextual election information retrieval.
 *
 * This module explicitly demonstrates usage of the Vertex AI REST API
 * as a distinct Google Cloud service endpoint beyond Gemini Studio.
 *
 * @module services/vertex
 */

import { SafeApiClient } from './api-client';
import { sanitizeFull } from '../utils/sanitize';
import { ELECTION_FAQ_CORPUS, FAQ_KEYWORD_MAP } from './vertex-corpus';
import type { FaqEntry } from './vertex-corpus';

/* ---- Types ---- */

/** Vertex AI embedding values response. */
interface EmbeddingInstance {
  content: string;
}

/** Vertex AI text embedding response. */
interface VertexEmbeddingResponse {
  predictions?: {
    embeddings: {
      values: number[];
      statistics: {
        truncated: boolean;
        token_count: number;
      };
    };
  }[];
}

/** A FAQ entry with a precomputed embedding vector. */
export interface SemanticFaqMatch {
  readonly question: string;
  readonly answer: string;
  readonly score: number;
}

/** Vertex AI endpoint configuration. */
interface VertexConfig {
  readonly projectId: string;
  readonly location: string;
  readonly model: string;
}

/* ---- Constants ---- */

/** Vertex AI text-embedding model for election FAQ matching. */
const VERTEX_CONFIG: VertexConfig = {
  projectId: String(import.meta.env['VITE_GOOGLE_CLOUD_PROJECT'] || 'votera-ai'),
  location: 'us-central1',
  model: 'text-embedding-004',
};

/* ---- Service ---- */

/**
 * Vertex AI semantic search service for election FAQ matching.
 *
 * Uses Google Cloud Vertex AI text embeddings to find the most
 * semantically relevant FAQ answer for any voter query.
 * Falls back gracefully to keyword matching when unavailable.
 */
export class ElectionVertexService {
  private readonly client: SafeApiClient;
  private readonly apiKey: string;

  /** Pre-computed FAQ corpus embeddings — computed once and cached permanently. */
  private corpusEmbeddingsCache: (number[] | null)[] | null = null;

  /** Promise guard to prevent concurrent corpus embedding computations. */
  private corpusEmbeddingsPromise: Promise<(number[] | null)[]> | null = null;

  /**
   * Initialize the Vertex AI Service.
   */
  constructor() {
    this.apiKey = String(
      import.meta.env['VITE_GEMINI_API_KEY'] || import.meta.env['VITE_GEMINI_KEY'] || '',
    );

    this.client = new SafeApiClient({
      baseUrl: `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_CONFIG.projectId}/locations/${VERTEX_CONFIG.location}/publishers/google/models`,
      timeoutMs: 15000,
      retries: 1,
    });
  }

  /**
   * Check if Vertex AI is configured.
   *
   * @returns True if an API key is present.
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Find the most semantically relevant FAQ answer for a voter query.
   *
   * Uses Vertex AI text embeddings for cosine similarity matching.
   * Falls back to keyword-based matching if the API is unavailable.
   *
   * @param query - Raw voter query text.
   * @returns Best matching FAQ entry or null.
   */
  async findRelevantFaq(query: string): Promise<SemanticFaqMatch | null> {
    const sanitised = sanitizeFull(query, 500);

    if (!this.isConfigured()) {
      return this.keywordFallback(sanitised);
    }

    try {
      const [queryEmbedding, corpusEmbeddings] = await Promise.all([
        this.embedText(sanitised),
        this.getCorpusEmbeddings(),
      ]);

      if (!queryEmbedding) {
        return this.keywordFallback(sanitised);
      }

      let bestScore = -1;
      let bestIndex = 0;

      corpusEmbeddings.forEach((embedding, index) => {
        if (embedding) {
          const score = this.cosineSimilarity(queryEmbedding, embedding);
          if (score > bestScore) {
            bestScore = score;
            bestIndex = index;
          }
        }
      });

      if (bestScore < 0.5) {
        return this.keywordFallback(sanitised);
      }

      const faq = ELECTION_FAQ_CORPUS[bestIndex] as FaqEntry;
      return { question: faq.question, answer: faq.answer, score: bestScore };
    } catch {
      return this.keywordFallback(sanitised);
    }
  }

  /**
   * Get pre-computed FAQ corpus embeddings.
   *
   * Computes embeddings once, then caches permanently.
   * Uses a promise guard to prevent concurrent duplicates.
   *
   * @returns Cached embedding vectors for all FAQ questions.
   */
  private async getCorpusEmbeddings(): Promise<(number[] | null)[]> {
    if (this.corpusEmbeddingsCache) {
      return this.corpusEmbeddingsCache;
    }

    if (this.corpusEmbeddingsPromise) {
      return this.corpusEmbeddingsPromise;
    }

    this.corpusEmbeddingsPromise = Promise.all(
      ELECTION_FAQ_CORPUS.map((faq) => this.embedText(faq.question)),
    ).then((embeddings) => {
      this.corpusEmbeddingsCache = embeddings;
      this.corpusEmbeddingsPromise = null;
      return embeddings;
    });

    return this.corpusEmbeddingsPromise;
  }

  /**
   * Embed a text string using Vertex AI text-embedding model.
   *
   * @param text - Text to embed.
   * @returns Embedding vector or null on failure.
   */
  private async embedText(text: string): Promise<number[] | null> {
    const endpoint = `/${VERTEX_CONFIG.model}:predict?key=${this.apiKey}`;
    const body = {
      instances: [{ content: text } satisfies EmbeddingInstance],
      parameters: { outputDimensionality: 256 },
    };

    const response = await this.client.post<VertexEmbeddingResponse>(endpoint, body);
    if (response.ok && response.data?.predictions?.[0]?.embeddings?.values) {
      return response.data.predictions[0].embeddings.values;
    }
    return null;
  }

  /**
   * Calculate cosine similarity between two embedding vectors.
   *
   * @param a - First embedding vector.
   * @param b - Second embedding vector.
   * @returns Similarity score between -1 and 1.
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) {
      return 0;
    }
    const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Keyword-based FAQ fallback when Vertex AI is unavailable.
   *
   * @param query - Sanitised voter query.
   * @returns Matching FAQ or null.
   */
  private keywordFallback(query: string): SemanticFaqMatch | null {
    const lower = query.toLowerCase();
    const match = FAQ_KEYWORD_MAP.find((entry) => entry.keywords.some((kw) => lower.includes(kw)));
    if (match === undefined) {
      return null;
    }
    const faq = ELECTION_FAQ_CORPUS[match.index] as FaqEntry;
    return { question: faq.question, answer: faq.answer, score: 0.6 };
  }
}
