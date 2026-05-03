/**
 * Gemini Tool Call Handlers — Dispatchers for each Gemini function call.
 *
 * Extracted from gemini.ts to keep each module under 200 lines.
 * Each handler routes a Gemini tool call to the appropriate Google Cloud service.
 *
 * @module services/gemini-tool-handlers
 */

import type { ToolCallResult } from '../types/index';
import { ElectionTranslationService } from './translation';
import { ElectionMapsService } from './maps';
import { ElectionVertexService } from './vertex';
import { getAllTimelineEvents, getDeadlineEvents } from '../data/timeline';
import { validateVoterAge } from '../utils/validate';

/**
 * Handles Gemini tool call dispatch to Google Cloud services.
 *
 * Provides dedicated handler methods for each tool declaration,
 * keeping cyclomatic complexity low and each handler focused.
 */
export class GeminiToolHandlers {
  private readonly translationService: ElectionTranslationService;
  private readonly mapsService: ElectionMapsService;
  private readonly vertexService: ElectionVertexService;

  constructor(
    translationService: ElectionTranslationService,
    mapsService: ElectionMapsService,
    vertexService: ElectionVertexService,
  ) {
    this.translationService = translationService;
    this.mapsService = mapsService;
    this.vertexService = vertexService;
  }

  /**
   * Process a Gemini tool call by dispatching to the appropriate handler.
   *
   * Uses a handler map to keep cyclomatic complexity low.
   *
   * @param functionCall - The tool call from Gemini.
   * @returns Tool call result with actual service response.
   */
  async processToolCall(functionCall: {
    name: string;
    args: Record<string, unknown>;
  }): Promise<ToolCallResult> {
    const handlers: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
      translate_text: (args) => this.handleTranslateText(args),
      find_polling_location: (args) => this.handleFindPollingLocation(args),
      lookup_election_faq: (args) => this.handleLookupFaq(args),
      check_voter_eligibility: (args) => this.handleCheckEligibility(args),
      get_election_timeline: () => this.handleGetTimeline(),
    };

    try {
      const handler = handlers[functionCall.name];
      if (!handler) {
        return {
          toolName: functionCall.name,
          args: functionCall.args,
          result: `Unknown tool "${functionCall.name}". Available tools: ${Object.keys(handlers).join(', ')}.`,
          status: 'error',
        };
      }

      const result = await handler(functionCall.args);
      return {
        toolName: functionCall.name,
        args: functionCall.args,
        result,
        status: 'success',
      };
    } catch {
      return {
        toolName: functionCall.name,
        args: functionCall.args,
        result: `Service temporarily unavailable for "${functionCall.name}". Please try again.`,
        status: 'error',
      };
    }
  }

  /**
   * Handle the `translate_text` tool call via Google Cloud Translation API.
   *
   * @param args - Tool call arguments containing text and targetLang.
   * @returns Translated text string.
   */
  private async handleTranslateText(args: Record<string, unknown>): Promise<string> {
    const rawText = args['text'];
    const rawLang = args['targetLang'];
    const text = typeof rawText === 'string' ? rawText : '';
    const targetLang = typeof rawLang === 'string' ? rawLang : 'hi';
    return this.translationService.translateText(text, targetLang);
  }

  /**
   * Handle the `find_polling_location` tool call via Google Maps Places API.
   *
   * @param args - Tool call arguments containing query and optional pin_code.
   * @returns Formatted location results or a Maps search link fallback.
   */
  private async handleFindPollingLocation(args: Record<string, unknown>): Promise<string> {
    const rawQuery = args['query'];
    const query = typeof rawQuery === 'string' ? rawQuery : '';
    const result = await this.mapsService.searchPollingLocations(query);

    if (result.ok && result.data) {
      const locations = result.data.map((loc) => `${loc.name} — ${loc.address}`).join('; ');
      return locations || 'No locations found. Try a more specific query.';
    }

    const mapsLink = this.mapsService.generateMapsLink(query);
    return `Search on Google Maps: ${mapsLink}`;
  }

  /**
   * Handle the `lookup_election_faq` tool call via Vertex AI semantic search.
   *
   * @param args - Tool call arguments containing search_query.
   * @returns Matching FAQ or a "not found" message.
   */
  private async handleLookupFaq(args: Record<string, unknown>): Promise<string> {
    const rawSearchQuery = args['search_query'];
    const searchQuery = typeof rawSearchQuery === 'string' ? rawSearchQuery : '';
    const faqMatch = await this.vertexService.findRelevantFaq(searchQuery);

    if (faqMatch) {
      return `Q: ${faqMatch.question}\nA: ${faqMatch.answer} (Relevance: ${Math.round(faqMatch.score * 100)}%)`;
    }

    return 'No matching FAQ found. Please try rephrasing your question or visit eci.gov.in.';
  }

  /**
   * Handle the `check_voter_eligibility` tool call via local validation.
   *
   * @param args - Tool call arguments containing age and is_indian_citizen.
   * @returns Eligibility result string.
   */
  private handleCheckEligibility(args: Record<string, unknown>): Promise<string> {
    const age = Number(args['age'] ?? 0);
    const isCitizen = args['is_indian_citizen'] !== false;
    const validation = validateVoterAge(age);
    const citizenNote = isCitizen
      ? ''
      : ' Note: Only Indian citizens are eligible to vote in Indian elections.';
    return Promise.resolve(
      `${validation.sanitizedValue || validation.errors.join('. ')}${citizenNote}`,
    );
  }

  /**
   * Handle the `get_election_timeline` tool call via local timeline data.
   *
   * @returns Formatted timeline summary string.
   */
  private handleGetTimeline(): Promise<string> {
    const deadlines = getDeadlineEvents();
    const all = getAllTimelineEvents();
    const events = deadlines.length > 0 ? deadlines : all.slice(0, 5);
    const summary = events
      .map((e) => `${e.date}: ${e.title} — ${e.description}${e.isDeadline ? ' ⚠️ DEADLINE' : ''}`)
      .join('\n');
    return Promise.resolve(summary || 'No upcoming election events found.');
  }
}
