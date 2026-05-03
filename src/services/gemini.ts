/**
 * Google Gemini / Vertex AI Integration — Election Coach reasoning layer.
 *
 * Handles conversational guidance, step-by-step tutoring, summarisation,
 * and tool-call orchestration (Translation, Maps, FAQ routing).
 * Integrates with Google Cloud Natural Language API and Firestore
 * analytics via the ElectionAnalyticsService.
 *
 * @module services/gemini
 */

import { SafeApiClient } from './api-client';
import type { CoachMessage } from '../types/index';
import { sanitizeFull } from '../utils/sanitize';
import { ElectionCache, makeCacheKey } from '../utils/cache';
import { ElectionAnalyticsService } from './analytics';
import { ElectionTranslationService } from './translation';
import { ElectionMapsService } from './maps';
import { ElectionVertexService } from './vertex';
import { GeminiToolHandlers } from './gemini-tool-handlers';
import {
  ELECTION_TOOLS,
  ELECTION_COACH_SYSTEM_PROMPT,
  STATIC_RESPONSE_MAP,
  DEFAULT_STATIC_RESPONSE,
} from './gemini-config';
import type { GeminiApiResponse, GeminiPart } from './gemini-config';

// Re-export for consumers that import from this module
export { ELECTION_TOOLS } from './gemini-config';

/**
 * Gemini-powered election coaching service.
 *
 * Manages conversation state, tool calling, response caching,
 * and graceful fallback when the API is unavailable.
 * Integrates with Google Cloud Natural Language API for analytics.
 */
export class ElectionCoachService {
  private readonly client: SafeApiClient;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly cache: ElectionCache<string>;
  private readonly analytics: ElectionAnalyticsService;
  private readonly toolHandlers: GeminiToolHandlers;
  private conversationHistory: CoachMessage[];

  /**
   * Initialize the Election Coach Gemini Service.
   *
   * Instantiates downstream service adapters for Translation, Maps,
   * and Vertex AI so that Gemini tool calls can be dispatched to
   * real Google Cloud services.
   */
  constructor() {
    this.apiKey = String(
      import.meta.env['VITE_GEMINI_API_KEY'] || import.meta.env['VITE_GEMINI_KEY'] || '',
    );
    this.model = String(import.meta.env['VITE_GEMINI_MODEL'] || 'gemini-1.5-flash');
    this.client = new SafeApiClient({
      baseUrl: 'https://generativelanguage.googleapis.com',
      timeoutMs: 30000,
      retries: 1,
    });
    this.cache = new ElectionCache<string>({ defaultTtlMs: 10 * 60 * 1000, maxEntries: 50 });
    this.analytics = new ElectionAnalyticsService();
    this.toolHandlers = new GeminiToolHandlers(
      new ElectionTranslationService(),
      new ElectionMapsService(),
      new ElectionVertexService(),
    );
    this.conversationHistory = [];
  }

  /**
   * Check if the Gemini API is configured.
   *
   * @returns True if an API key is present.
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Send a user message and receive an election coaching response.
   *
   * Checks cache first, then calls Gemini API with tool declarations.
   * Falls back to static guidance if the API is unavailable.
   *
   * @param userMessage - The voter's question or message.
   * @returns The assistant's response message.
   */
  async chat(userMessage: string): Promise<CoachMessage> {
    const sanitised = sanitizeFull(userMessage, 2000);
    const cacheKey = makeCacheKey('coach', sanitised.toLowerCase().slice(0, 100));

    // Track query with Google Cloud Natural Language API + Firestore analytics
    void this.analytics.trackQuery(sanitised);

    // Check cache for identical recent queries
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return this.createMessage('assistant', cached);
    }

    // Record user message
    this.conversationHistory.push(this.createMessage('user', sanitised));

    // Try Gemini API
    if (this.isConfigured()) {
      const response = await this.callGeminiApi(sanitised);
      if (response) {
        this.cache.set(cacheKey, response);
        const message = this.createMessage('assistant', response);
        this.conversationHistory.push(message);
        return message;
      }
    }

    // Fallback: static response
    const fallback = this.getStaticResponse(sanitised);
    this.cache.set(cacheKey, fallback);
    const message = this.createMessage('assistant', fallback);
    this.conversationHistory.push(message);
    return message;
  }

  /**
   * Call the Gemini API with conversation context and tools.
   *
   * @param query - Sanitised user query.
   * @returns Response text or null on failure.
   */
  private async callGeminiApi(query: string): Promise<string | null> {
    const endpoint = `/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${ELECTION_COACH_SYSTEM_PROMPT}\n\nUser question: ${query}` }],
        },
      ],
      tools: [
        {
          functionDeclarations: ELECTION_TOOLS.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          })),
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        topP: 0.8,
      },
    };

    const response = await this.client.post<GeminiApiResponse>(endpoint, body);

    if (!response.ok || !response.data) {
      return null;
    }

    const candidate = response.data.candidates?.[0];
    if (!candidate) {
      return null;
    }

    return this.extractResponse(candidate.content.parts);
  }

  /**
   * Extract text and tool call results from Gemini response parts.
   *
   * @param parts - Response parts from Gemini candidate.
   * @returns Combined response text or null.
   */
  private async extractResponse(parts: GeminiPart[]): Promise<string | null> {
    const textParts = parts.filter((p): p is GeminiPart & { text: string } => !!p.text);
    const toolParts = parts.filter(
      (p): p is GeminiPart & { functionCall: { name: string; args: Record<string, unknown> } } =>
        !!p.functionCall,
    );

    let responseText = textParts.map((p) => p.text).join('\n');

    // Process tool calls — dispatch to actual Google Cloud services
    if (toolParts.length > 0) {
      const toolResults = await Promise.all(
        toolParts.map((p) => this.toolHandlers.processToolCall(p.functionCall)),
      );
      const toolSummary = toolResults
        .map((r) => `[${r.toolName}]: ${String(r.result)}`)
        .join('\n');
      responseText += `\n\n${toolSummary}`;
    }

    return responseText || null;
  }

  /**
   * Provide a static fallback response when Gemini is unavailable.
   *
   * @param query - User's question.
   * @returns Helpful static response string.
   */
  private getStaticResponse(query: string): string {
    const lower = query.toLowerCase();
    const match = STATIC_RESPONSE_MAP.find((entry) =>
      entry.keywords.some((kw) => lower.includes(kw)),
    );
    return match?.response ?? DEFAULT_STATIC_RESPONSE;
  }

  /**
   * Create a typed coach message.
   *
   * @param role - Message role.
   * @param content - Message content.
   * @returns Typed CoachMessage.
   */
  private createMessage(role: 'user' | 'assistant' | 'system', content: string): CoachMessage {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      content,
      timestamp: Date.now(),
    };
  }

  /**
   * Get the full conversation history.
   *
   * @returns Array of coach messages.
   */
  getHistory(): readonly CoachMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history.
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }
}
