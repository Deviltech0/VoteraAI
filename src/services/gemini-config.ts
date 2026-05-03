/**
 * Gemini Service Configuration — Tool declarations, system prompt, and static responses.
 *
 * Extracted from gemini.ts to keep each module under 200 lines.
 * Contains all static configuration data used by the ElectionCoachService.
 *
 * @module services/gemini-config
 */

import type { GeminiToolDeclaration } from '../types/index';

/* ---- Gemini API Response Types ---- */

/** Single candidate response from Gemini API. */
export interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
    role: string;
  };
}

/** Part of a Gemini response — either text or a function call. */
export interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
}

/** Top-level Gemini API response structure. */
export interface GeminiApiResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string };
}

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

/* ---- System Prompt ---- */

/** Gemini system prompt prepended to every API call. Never modifiable by user input. */
export const ELECTION_COACH_SYSTEM_PROMPT = `You are "Votera AI", an expert election education assistant for Indian voters.

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
export const STATIC_RESPONSE_MAP: readonly {
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
export const DEFAULT_STATIC_RESPONSE =
  'Welcome to Votera AI! I can help you with:\n• Checking voter eligibility\n• Registering to vote (Form 6)\n• Understanding EVMs and VVPAT\n• Finding your polling booth\n• Learning about Lok Sabha, Rajya Sabha, State Assembly, Panchayat, and Municipal elections\n• Election timelines and key deadlines\n\nAsk me anything about Indian elections, or visit eci.gov.in for official information!';
