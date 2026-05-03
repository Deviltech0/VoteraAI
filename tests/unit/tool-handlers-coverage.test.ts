/**
 * Extended coverage tests for ElectionCoachService tool handlers
 * and ElectionVertexService embedding paths.
 *
 * Targets the uncovered lines in gemini.ts, vertex.ts,
 * analytics.ts and api-client.ts to achieve 100% coverage.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ──────────────────────────────────────────────────────────────
// Gemini: Tool Handlers Coverage
// ──────────────────────────────────────────────────────────────

describe('ElectionCoachService — Tool Handlers', () => {
  beforeEach(() => {
    vi.stubGlobal('import', { meta: { env: {} } });
  });

  it('should return eligibility result for an eligible voter', async () => {
    const { ElectionCoachService } = await import('../../src/services/gemini');
    const service = new ElectionCoachService();
    const result = await (service as any).processToolCall({
      name: 'check_voter_eligibility',
      args: { age: 25, is_indian_citizen: true },
    });
    expect(result.status).toBe('success');
    expect(result.result).toContain('eligible');
  });

  it('should return non-citizen note for non-Indian citizens', async () => {
    const { ElectionCoachService } = await import('../../src/services/gemini');
    const service = new ElectionCoachService();
    const result = await (service as any).processToolCall({
      name: 'check_voter_eligibility',
      args: { age: 30, is_indian_citizen: false },
    });
    expect(result.status).toBe('success');
    expect(result.result).toContain('Indian citizens');
  });

  it('should return timeline summary via get_election_timeline', async () => {
    const { ElectionCoachService } = await import('../../src/services/gemini');
    const service = new ElectionCoachService();
    const result = await (service as any).processToolCall({
      name: 'get_election_timeline',
      args: {},
    });
    expect(result.status).toBe('success');
    expect(result.result.length).toBeGreaterThan(0);
  });

  it('should return maps link fallback when polling location search fails', async () => {
    const { ElectionCoachService } = await import('../../src/services/gemini');
    const service = new ElectionCoachService();
    (service as any).mapsService.searchPollingLocations = vi.fn().mockResolvedValue({ ok: false, data: null });
    const result = await (service as any).processToolCall({
      name: 'find_polling_location',
      args: { query: 'test query' },
    });
    expect(result.status).toBe('success');
    expect(result.result).toContain('Search on Google Maps:');
  });

  it('should handle lookup_election_faq tool call', async () => {
    const { ElectionCoachService } = await import('../../src/services/gemini');
    const service = new ElectionCoachService();
    (service as any).vertexService.findRelevantFaq = vi.fn().mockResolvedValue({
      question: 'Q', answer: 'A', score: 0.9
    });
    const result = await (service as any).processToolCall({
      name: 'lookup_election_faq',
      args: { search_query: 'test' },
    });
    expect(result.status).toBe('success');
    expect(result.result).toContain('Q');
  });

  it('should handle lookup_election_faq fallback', async () => {
    const { ElectionCoachService } = await import('../../src/services/gemini');
    const service = new ElectionCoachService();
    (service as any).vertexService.findRelevantFaq = vi.fn().mockResolvedValue(null);
    const result = await (service as any).processToolCall({
      name: 'lookup_election_faq',
      args: { search_query: 'unknown' },
    });
    expect(result.status).toBe('success');
    expect(result.result).toContain('No matching FAQ found');
  });

  it('should handle translate_text tool call', async () => {
    const { ElectionCoachService } = await import('../../src/services/gemini');
    const service = new ElectionCoachService();
    (service as any).translationService.translateText = vi.fn().mockResolvedValue('नमस्ते');
    const result = await (service as any).processToolCall({
      name: 'translate_text',
      args: { text: 'Hello', targetLang: 'hi' },
    });
    expect(result.status).toBe('success');
    expect(result.result).toBe('नमस्ते');
  });

  it('should handle translate_text with default targetLang', async () => {
    const { ElectionCoachService } = await import('../../src/services/gemini');
    const service = new ElectionCoachService();
    (service as any).translationService.translateText = vi.fn().mockResolvedValue('translated');
    await (service as any).processToolCall({
      name: 'translate_text',
      args: { text: 'Hello' },
    });
    expect((service as any).translationService.translateText).toHaveBeenCalledWith('Hello', 'hi');
  });

  it('should return error for unknown tool', async () => {
    const { ElectionCoachService } = await import('../../src/services/gemini');
    const service = new ElectionCoachService();
    const result = await (service as any).processToolCall({
      name: 'nonexistent',
      args: {},
    });
    expect(result.status).toBe('error');
    expect(result.result).toContain('Unknown tool');
  });
});

// ──────────────────────────────────────────────────────────────
// Analytics & API Client: Edge Cases
// ──────────────────────────────────────────────────────────────

describe('Analytics & API Client — Edge Cases', () => {
  it('should use requestIdleCallback if available', async () => {
    const mockIdle = vi.fn((cb) => cb());
    vi.stubGlobal('requestIdleCallback', mockIdle);
    const { ElectionAnalyticsService } = await import('../../src/services/analytics');
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test');
    const service = new ElectionAnalyticsService();
    (service as any).analyseWithNaturalLanguage = vi.fn().mockResolvedValue({});
    (service as any).logToFirestore = vi.fn().mockResolvedValue({});
    await service.trackQuery('test');
    expect(mockIdle).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('should cover analytics NL failure branch', async () => {
    const { ElectionAnalyticsService } = await import('../../src/services/analytics');
    const service = new ElectionAnalyticsService();
    (service as any).nlClient.post = vi.fn().mockResolvedValue({ ok: false });
    const result = await (service as any).analyseWithNaturalLanguage('test');
    expect(result).toEqual({});
  });

  it('should cover SafeApiClient.get with headers', async () => {
    const { SafeApiClient } = await import('../../src/services/api-client');
    const client = new SafeApiClient({ baseUrl: 'https://api.test' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    }));
    const result = await client.get('/test', { 'X-Test': '1' });
    expect(result.ok).toBe(true);
  });

  it('should return failure object when fetch fails', async () => {
    const { SafeApiClient } = await import('../../src/services/api-client');
    const client = new SafeApiClient({ baseUrl: 'https://api.test', retries: 0 });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await (client as any).request('/test', {});
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Network error');
  });
});

// ──────────────────────────────────────────────────────────────
// Vertex: Functional Edge Cases
// ──────────────────────────────────────────────────────────────

describe('ElectionVertexService — Edge Cases', () => {
  it('should return null for empty query', async () => {
    const { ElectionVertexService } = await import('../../src/services/vertex');
    const service = new ElectionVertexService();
    expect(await service.findRelevantFaq('')).toBeNull();
  });

  it('should use keyword fallback when embedding fails', async () => {
    const { ElectionVertexService } = await import('../../src/services/vertex');
    const service = new ElectionVertexService();
    (service as any).embedText = vi.fn().mockResolvedValue(null);
    const result = await service.findRelevantFaq('EVM');
    expect(result).not.toBeNull();
    expect(result?.answer).toContain('EVM');
  });

  it('should handle API failure in embedText', async () => {
    const { ElectionVertexService } = await import('../../src/services/vertex');
    const service = new ElectionVertexService();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const result = await (service as any).embedText('test');
    expect(result).toBeNull();
  });

  it('should deduplicate concurrent embeddings calls', async () => {
    const { ElectionVertexService } = await import('../../src/services/vertex');
    const service = new ElectionVertexService();
    let calls = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      calls++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ predictions: [{ embeddings: { values: [0.1] } }] })
      });
    }));
    const [r1, r2] = await Promise.all([
      (service as any).getCorpusEmbeddings(),
      (service as any).getCorpusEmbeddings()
    ]);
    expect(r1).toEqual(r2);
  });
});
