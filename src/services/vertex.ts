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
  projectId: 'votera-ai',
  location: 'us-central1',
  model: 'text-embedding-004',
};

/** Key election FAQ entries for semantic matching. */
const ELECTION_FAQ_CORPUS: readonly { question: string; answer: string }[] = [
  {
    question: 'Who is eligible to vote in India?',
    answer:
      'Every Indian citizen aged 18 or above on the qualifying date (January 1 of the revision year) who is registered in their constituency is eligible to vote.',
  },
  {
    question: 'How do I register to vote?',
    answer:
      'Register online at nvsp.in using Form 6, or through the Voter Helpline App. You need Aadhaar, address proof, age proof, and a passport photo.',
  },
  {
    question: 'What is NOTA?',
    answer:
      'NOTA (None of the Above) has been available since 2013. It lets voters register dissatisfaction without invalidating their vote. The candidate with the highest votes still wins.',
  },
  {
    question: 'What is an EVM and how does VVPAT work?',
    answer:
      'Electronic Voting Machines (EVMs) are standalone devices with no network connectivity. After pressing a button, a VVPAT slip shows your choice for 7 seconds for verification.',
  },
  {
    question: 'How do I find my polling booth?',
    answer:
      'Use the Voter Helpline App, nvsp.in with your EPIC number, SMS "EPIC <number>" to 1950, or check your BLO-delivered voter slip.',
  },
  {
    question: 'Can NRIs vote in Indian elections?',
    answer:
      'Yes. Since 2011, NRIs holding Indian passports can register as overseas electors. They must be present in their constituency on polling day to vote in person. The ECI has been exploring postal ballot and e-voting options for NRIs.',
  },
  {
    question: 'Who can vote by postal ballot?',
    answer:
      'Postal ballot is available to service voters (armed forces, paramilitary), voters on election duty, voters above 80 years, persons with disabilities, voters under preventive detention, and COVID-quarantined persons.',
  },
  {
    question: 'What are Lok Sabha elections?',
    answer:
      "Lok Sabha is the lower house of India's Parliament with 543 directly elected seats. Members are chosen through First Past the Post voting for a 5-year term. The majority party's leader becomes Prime Minister.",
  },
  {
    question: 'How do Panchayat elections work?',
    answer:
      'Panchayat elections are conducted under the 73rd Amendment at three levels: Gram Panchayat (village), Panchayat Samiti (block), and Zila Parishad (district). They are managed by State Election Commissions.',
  },
  {
    question: 'What ID proofs are accepted at the polling booth?',
    answer:
      'The ECI accepts 12 photo ID proofs including EPIC/Voter ID, Aadhaar, Passport, Driving Licence, PAN Card, Service ID, Bank Passbook with Photo, MNREGA Job Card, Health Insurance Smart Card, Pension Document, NPR Smart Card, and official ID from MP/MLA/MLC.',
  },
  {
    question: 'What is the Model Code of Conduct?',
    answer: 'Guidelines for parties/candidates during elections to ensure fairness.',
  },
  {
    question: 'Who are Star Campaigners?',
    answer: 'Nominated party leaders whose travel expenses are not added to candidate limits.',
  },
  {
    question: 'Is voter slip enough to vote?',
    answer: 'No, you must carry an approved photo ID like Aadhaar or EPIC.',
  },
  {
    question: 'What to do if Voter ID is lost?',
    answer: 'Apply for a replacement online or use another approved ID if registered.',
  },
  {
    question: 'What is the spending limit for MPs?',
    answer: 'Up to ₹95 lakh for Lok Sabha in larger states.',
  },
  {
    question: 'What is a Tendered Vote?',
    answer: 'A vote cast on paper if someone else already voted in your name.',
  },
  {
    question: 'What is a Challenged Vote?',
    answer: 'A vote challenged by an agent; decided by the Presiding Officer.',
  },
  {
    question: 'Are exit polls allowed?',
    answer: 'Banned until the last phase of voting concludes in all states.',
  },
  {
    question: 'Where to check real-time turnout?',
    answer: 'Use the official Voter Turnout App by the ECI.',
  },
  {
    question: 'Does EVM have Braille?',
    answer: 'Yes, for visually impaired voters on the right side of buttons.',
  },
  {
    question: 'Can I take a companion to vote?',
    answer: 'Yes, if you are blind or infirm, with a secrecy declaration.',
  },
  {
    question: 'What is the 1950 helpline?',
    answer: 'Toll-free National Voter Helpline for all election queries.',
  },
  {
    question: 'How do polling staff vote?',
    answer: 'Using Election Duty Certificates or Postal Ballots.',
  },
  { question: 'How do NRIs register?', answer: 'Online using Form 6A on the NVSP portal.' },
  {
    question: 'Qualification to be an MP?',
    answer: 'Citizen, 25+ years old (Lok Sabha), registered voter.',
  },
  {
    question: 'Can I ask for a recount?',
    answer: 'Yes, written request to the RO before results are declared.',
  },
  {
    question: 'How are symbols allotted?',
    answer: 'Reserved for recognized parties; free symbols for others.',
  },
  { question: 'How to correct Voter ID?', answer: 'Use Form 8 on NVSP for any entry corrections.' },
  {
    question: 'Who is a BLO?',
    answer: 'Booth Level Officer responsible for local electoral roll maintenance.',
  },
  {
    question: 'Can I vote online?',
    answer: 'No, but service voters use ETPBS; others must visit the booth.',
  },
  { question: 'What is cVIGIL app?', answer: 'App to report Model Code violations in real-time.' },
  {
    question: 'How to transfer Voter ID?',
    answer: 'Use Form 8 (Shifting) to move registration to a new city.',
  },
  {
    question: 'Who can use proxy voting?',
    answer: 'Only Classified Service Voters (Armed Forces).',
  },
  {
    question: 'What is Delimitation?',
    answer: 'Redrawing constituency boundaries based on population.',
  },
  { question: 'What are voting hours?', answer: 'Usually 7 AM to 6 PM; varies by region.' },
  {
    question: 'Why use indelible ink?',
    answer: 'Visual proof of voting to prevent multiple votes.',
  },
  {
    question: 'Vote without voter slip?',
    answer: 'Yes, if registered, using an approved photo ID.',
  },
  {
    question: 'Where to see candidate records?',
    answer: 'Affidavits on ECI website or the KYC app.',
  },
  { question: 'Role of Presiding Officer?', answer: 'In charge of a single polling station.' },
  {
    question: 'Role of Returning Officer?',
    answer: 'Responsible for conduct of elections in a constituency.',
  },
  {
    question: 'Is DigiLocker Voter ID valid?',
    answer: 'Yes, e-EPIC on DigiLocker is a valid ID for voting.',
  },
  { question: 'Change Voter ID photo?', answer: 'Yes, via Form 8 on the NVSP portal.' },
  {
    question: 'Is voting compulsory?',
    answer: 'No, it is a right but not a legal obligation in India.',
  },
  { question: 'What is SVEEP?', answer: 'ECI program for voter education and awareness.' },
  {
    question: 'What is the PVC Voter ID?',
    answer: 'High-security replacement for old paper voter cards.',
  },
  {
    question: 'Who are Election Observers?',
    answer: 'Senior officials overseeing election fairness.',
  },
  {
    question: 'Aadhaar-Voter ID link mandatory?',
    answer: 'No, it is voluntary for cleaning electoral rolls.',
  },
  {
    question: 'What is a Test Vote?',
    answer: 'Verification vote if VVPAT claim is made; false claims lead to action.',
  },
  {
    question: 'What is webcasting?',
    answer: 'Live monitoring of sensitive booths by election officials.',
  },
];

/** Keyword map for FAQ fallback: maps signal keywords to FAQ corpus index. */
const FAQ_KEYWORD_MAP: readonly { keywords: readonly string[]; index: number }[] = [
  { keywords: ['eligible', 'eligib', 'can i vote', 'qualify', 'citizenship', 'citizen'], index: 0 },
  { keywords: ['register', 'registration', 'form 6', 'enrol', 'nvsp'], index: 1 },
  { keywords: ['nota', 'none of the above', 'dissatisfaction'], index: 2 },
  { keywords: ['evm', 'vvpat', 'voting machine', 'electronic voting'], index: 3 },
  {
    keywords: ['polling booth', 'booth', 'poll location', 'election office', 'voter slip'],
    index: 4,
  },
  { keywords: ['nri', 'overseas', 'non-resident', 'abroad'], index: 5 },
  { keywords: ['postal ballot', 'postal vote', 'etpbs', 'service voter'], index: 6 },
  { keywords: ['lok sabha', 'parliament', 'general election'], index: 7 },
  { keywords: ['panchayat', 'village', 'gram', 'zila parishad'], index: 8 },
  { keywords: ['id proof', 'identity', 'aadhaar', 'voter id', 'epic'], index: 9 },
  { keywords: ['mcc', 'code', 'conduct', 'fairness', 'guidelines'], index: 10 },
  { keywords: ['star', 'campaigner', 'expenses', 'party leaders'], index: 11 },
  { keywords: ['slip', 'voter slip', 'identity', 'proof'], index: 12 },
  { keywords: ['lost', 'replace', 'form 001', 'missing'], index: 13 },
  { keywords: ['limit', 'expense', 'money', 'spending'], index: 14 },
  { keywords: ['tendered', 'someone else voted', 'ballot paper'], index: 15 },
  { keywords: ['challenge', 'identity challenge', 'polling agent'], index: 16 },
  { keywords: ['exit poll', 'ban', 'opinion poll', 'multi-phase'], index: 17 },
  { keywords: ['turnout', 'real-time', 'percentage', 'app'], index: 18 },
  { keywords: ['braille', 'blind', 'visually impaired', 'buttons'], index: 19 },
  { keywords: ['companion', 'infirm', 'help voting', '49n'], index: 20 },
  { keywords: ['1950', 'helpline', 'toll free', 'call center'], index: 21 },
  { keywords: ['staff', 'duty', 'edc', 'polling official'], index: 22 },
  { keywords: ['nri', 'overseas', 'form 6a', 'passport'], index: 23 },
  {
    keywords: ['qualification', 'candidate age', 'parliament member', 'lok sabha member'],
    index: 24,
  },
  {
    keywords: ['recount votes', 'counting results', 'returning officer', 'election recount'],
    index: 25,
  },
  { keywords: ['symbol', 'allotment', 'party logo', 'free symbol'], index: 26 },
  { keywords: ['correct', 'edit', 'form 8', 'errors'], index: 27 },
  { keywords: ['blo', 'booth level officer', 'teacher', 'local'], index: 28 },
  { keywords: ['online', 'etpbs', 'internet voting'], index: 29 },
  { keywords: ['cvigil', 'complain', 'report', 'violations'], index: 30 },
  { keywords: ['transfer', 'shift', 'new city', 'address change'], index: 31 },
  { keywords: ['proxy', 'classified', 'armed forces'], index: 32 },
  { keywords: ['delimitation', 'boundaries', 'seats', 'census'], index: 33 },
  { keywords: ['time', 'hours', 'closing', 'opening'], index: 34 },
  { keywords: ['ink', 'mark', 'finger', 'silver nitrate'], index: 35 },
  { keywords: ['no slip', 'not received', 'can i vote'], index: 36 },
  { keywords: ['kyc', 'affidavit', 'criminal', 'records'], index: 37 },
  { keywords: ['presiding', 'booth incharge', 'officer'], index: 38 },
  { keywords: ['returning officer', 'constituency incharge', 'ro '], index: 39 },
  { keywords: ['digilocker', 'digital id', 'e-epic'], index: 40 },
  { keywords: ['photo', 'image', 'change photo'], index: 41 },
  { keywords: ['compulsory', 'mandatory', 'legal'], index: 42 },
  { keywords: ['sveep', 'awareness', 'education', 'program'], index: 43 },
  { keywords: ['pvc', 'plastic card', 'smart card'], index: 44 },
  { keywords: ['observer', 'ias', 'oversight', 'fairness'], index: 45 },
  { keywords: ['link', 'aadhaar', 'voter id link', '6b'], index: 46 },
  { keywords: ['test vote', 'vvpat claim', 'wrong symbol', '49ma'], index: 47 },
  { keywords: ['webcasting', 'live camera', 'monitoring'], index: 48 },
] as const;

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
      // Embed user query and fetch (or reuse) cached corpus embeddings in parallel
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

      const faq = ELECTION_FAQ_CORPUS[bestIndex];
      if (!faq) {return this.keywordFallback(sanitised);}

      return {
        question: faq.question,
        answer: faq.answer,
        score: bestScore,
      };
    } catch {
      return this.keywordFallback(sanitised);
    }
  }

  /**
   * Get pre-computed FAQ corpus embeddings.
   *
   * Computes embeddings for the static FAQ corpus only once, then
   * caches them permanently. Subsequent calls return the cached vectors
   * instantly — saving 5 API calls per FAQ search.
   *
   * Uses a promise guard to prevent concurrent duplicate computations.
   *
   * @returns Cached embedding vectors for all FAQ questions.
   */
  private async getCorpusEmbeddings(): Promise<(number[] | null)[]> {
    // Return cached embeddings immediately if available
    if (this.corpusEmbeddingsCache) {
      return this.corpusEmbeddingsCache;
    }

    // Prevent concurrent computations — return the in-flight promise
    if (this.corpusEmbeddingsPromise) {
      return this.corpusEmbeddingsPromise;
    }

    // Compute and cache corpus embeddings (one-time cost)
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
      parameters: {
        outputDimensionality: 256,
      },
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
   * Uses an explicit keyword-to-index map for deterministic matching,
   * avoiding false positives from common English words like "how", "do", "the".
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

    const faq = ELECTION_FAQ_CORPUS[match.index];
    if (!faq) {return null;}
    return { question: faq.question, answer: faq.answer, score: 0.6 };
  }
}
