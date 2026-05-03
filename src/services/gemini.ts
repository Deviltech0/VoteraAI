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
import type { CoachMessage, GeminiToolDeclaration, ToolCallResult } from '../types/index';
import { sanitizeFull } from '../utils/sanitize';
import { ElectionCache, makeCacheKey } from '../utils/cache';
import { ElectionAnalyticsService } from './analytics';
import { ElectionTranslationService } from './translation';
import { ElectionMapsService } from './maps';
import { ElectionVertexService } from './vertex';
import { getAllTimelineEvents, getDeadlineEvents } from '../data/timeline';
import { validateVoterAge } from '../utils/validate';

/* ---- Tool Declarations for Gemini Function Calling ---- */

/** Tool schemas that Gemini can invoke during election coaching. */
export const ELECTION_TOOLS: readonly GeminiToolDeclaration[] = [
  {
    name: 'translate_text',
    description: 'Translate English text to a local Indian language like Hindi, Telugu, or Tamil.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to translate',
        },
        targetLang: {
          type: 'string',
          description: 'The ISO code for the target language, e.g. hi, te, ta',
        },
      },
      required: ['text', 'targetLang'],
    },
  },
  {
    name: 'find_polling_location',
    description:
      "Find the nearest polling booth, election office, or voter registration centre using Google Maps based on the voter's location or PIN code.",
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search query such as "polling booth near me" or "election office in Mumbai"',
        },
        pin_code: {
          type: 'string',
          description: 'Indian 6-digit PIN code for location context',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'lookup_election_faq',
    description:
      'Search the election FAQ database for answers to common questions about Indian elections, voting procedures, eligibility, and more.',
    parameters: {
      type: 'object',
      properties: {
        search_query: {
          type: 'string',
          description: "The voter's question or search keywords",
        },
      },
      required: ['search_query'],
    },
  },
  {
    name: 'check_voter_eligibility',
    description: 'Check if a person is eligible to vote based on their age and citizenship status.',
    parameters: {
      type: 'object',
      properties: {
        age: {
          type: 'number',
          description: 'Age of the person in years',
        },
        is_indian_citizen: {
          type: 'boolean',
          description: 'Whether the person is an Indian citizen',
        },
      },
      required: ['age'],
    },
  },
  {
    name: 'get_election_timeline',
    description:
      'Retrieve the election timeline showing key dates, deadlines, and milestones for an upcoming election.',
    parameters: {
      type: 'object',
      properties: {
        election_type: {
          type: 'string',
          description: 'Type of election',
          enum: [
            'LOK_SABHA',
            'RAJYA_SABHA',
            'STATE_ASSEMBLY',
            'PANCHAYAT',
            'MUNICIPAL',
            'BY_ELECTION',
          ],
        },
      },
      required: ['election_type'],
    },
  },
] as const;

/* ---- Gemini API Response Types ---- */

interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
    role: string;
  };
}

interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
}

interface GeminiApiResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string };
}

/* ---- System Prompt ---- */

const ELECTION_COACH_SYSTEM_PROMPT = `You are "Votera AI", an expert election education assistant for Indian voters.

Your role:
- Help voters understand every type of Indian election: Lok Sabha, Rajya Sabha, State Assembly, Panchayat, Municipal, and By-elections.
- Guide voters through eligibility checks, registration, candidate research, voting methods, timelines, polling-day procedures, and post-vote engagement.
- Provide accurate, factual information based on Election Commission of India (ECI) guidelines.
- Use the provided tools to translate text, find polling locations, search FAQs, check eligibility, and retrieve timelines.
- Always respond in a friendly, clear, and educational manner.
- If unsure, direct voters to official ECI resources (eci.gov.in, nvsp.in, Voter Helpline 1950).

Important rules:
- Never provide legal advice — only educational guidance.
- Never ask for or store personal identification numbers or sensitive data.
- Always encourage voters to verify information with official sources.
- Respond in English, but understand and acknowledge Hindi terms when used.`;

/* ---- Static Response Lookup Table ---- */

/**
 * Keyword matchers for static fallback responses.
 *
 * Each entry contains a list of keywords and a corresponding response.
 * This replaces a complex if-else chain to stay within complexity limits.
 */
const STATIC_RESPONSE_MAP: readonly {
  readonly keywords: readonly string[];
  readonly response: string;
}[] = [
  {
    keywords: ['eligib', 'can i vote', 'age'],
    response:
      'To vote in Indian elections, you must be an Indian citizen aged 18 or above on the qualifying date (January 1 of the revision year). You must be registered as a voter in your constituency. Check your status at nvsp.in or call the Voter Helpline at 1950.',
  },
  {
    keywords: ['register', 'enrol', 'form 6'],
    response:
      "You can register to vote online at nvsp.in using Form 6, or through the Voter Helpline App. You'll need: Aadhaar, address proof, age proof, and a passport-sized photo. You can also visit your nearest Electoral Registration Office in person.",
  },
  {
    keywords: ['evm', 'machine', 'vvpat'],
    response:
      'India uses Electronic Voting Machines (EVMs) with VVPAT paper trail verification. EVMs are standalone devices with no network connectivity — they cannot be hacked remotely. After you press the button, a VVPAT slip shows your choice for 7 seconds.',
  },
  {
    keywords: ['nota'],
    response:
      'NOTA (None of the Above) has been available since 2013. If NOTA gets the most votes, the candidate with the next highest votes still wins. NOTA is a way to register dissatisfaction without invalidating your vote.',
  },
  {
    keywords: ['booth', 'polling', 'where'],
    response:
      'Find your polling booth using: (1) Voter Helpline App, (2) nvsp.in with your EPIC number, (3) SMS "EPIC <number>" to 1950, or (4) the voter slip delivered by your BLO. Carry your Voter ID or any of the 12 approved photo IDs.',
  },
  {
    keywords: ['lok sabha', 'parliament'],
    response:
      "Lok Sabha is the lower house of India's Parliament with 543 directly elected seats. Members are chosen by voters through FPTP (First Past the Post) voting. The term is 5 years. The majority party's leader becomes Prime Minister.",
  },
  {
    keywords: ['panchayat', 'village', 'gram'],
    response:
      'Panchayat elections are conducted under the 73rd Amendment (1992) at three levels: Gram Panchayat (village), Panchayat Samiti (block), and Zila Parishad (district). They are managed by State Election Commissions and cover 29 subjects including water, roads, and health.',
  },
  {
    keywords: ['municipal', 'city', 'nagar'],
    response:
      'Municipal elections govern urban areas under the 74th Amendment. Three tiers: Nagar Panchayat, Municipal Council, and Municipal Corporation. Elected councillors manage urban services like water supply, sanitation, roads, and planning.',
  },
] as const;

/** Default welcome response when no keyword matches. */
const DEFAULT_STATIC_RESPONSE =
  'Welcome to Votera AI! I can help you with:\n• Checking voter eligibility\n• Registering to vote (Form 6)\n• Understanding EVMs and VVPAT\n• Finding your polling booth\n• Learning about Lok Sabha, Rajya Sabha, State Assembly, Panchayat, and Municipal elections\n• Election timelines and key deadlines\n\nAsk me anything about Indian elections, or visit eci.gov.in for official information!';

/* ---- Gemini Client ---- */

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
  private readonly translationService: ElectionTranslationService;
  private readonly mapsService: ElectionMapsService;
  private readonly vertexService: ElectionVertexService;
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
    this.translationService = new ElectionTranslationService();
    this.mapsService = new ElectionMapsService();
    this.vertexService = new ElectionVertexService();
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

    // Extract text and tool calls
    const parts = candidate.content.parts;
    const textParts = parts.filter((p): p is GeminiPart & { text: string } => !!p.text);
    const toolParts = parts.filter(
      (p): p is GeminiPart & { functionCall: { name: string; args: Record<string, unknown> } } =>
        !!p.functionCall,
    );

    let responseText = textParts.map((p) => p.text).join('\n');

    // Process tool calls — dispatch to actual Google Cloud services
    if (toolParts.length > 0) {
      const toolResults = await Promise.all(
        toolParts.map((p) => this.processToolCall(p.functionCall)),
      );
      const toolSummary = toolResults
        .map(
          (r) =>
            `[${r.toolName}]: ${r.status === 'success' ? String(r.result) : 'Service unavailable'}`,
        )
        .join('\n');
      responseText += `\n\n${toolSummary}`;
    }

    return responseText || null;
  }

  /**
   * Process a Gemini tool call by dispatching to the appropriate Google Cloud service.
   *
   * Uses a handler map to dispatch tool calls to dedicated handler methods,
   * keeping cyclomatic complexity low and each handler focused.
   *
   * @param functionCall - The tool call from Gemini.
   * @returns Tool call result with actual service response.
   */
  private async processToolCall(functionCall: {
    name: string;
    args: Record<string, unknown>;
  }): Promise<ToolCallResult> {
    /** Map of tool names to their handler functions. */
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

  /**
   * Provide a static fallback response when Gemini is unavailable.
   *
   * Uses a lookup table to match keywords to pre-written election guidance.
   * This pure-function approach keeps cyclomatic complexity at 2 (well within limits).
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
