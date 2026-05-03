/**
 * Gemini Tool Handler Tests — Tests for tool call dispatch.
 *
 * Verifies each tool handler routes correctly and handles edge cases.
 *
 * @module tests/unit/gemini-tool-handlers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GeminiToolHandlers } from '../../src/services/gemini-tool-handlers';
import { ElectionTranslationService } from '../../src/services/translation';
import { ElectionMapsService } from '../../src/services/maps';
import { ElectionVertexService } from '../../src/services/vertex';

describe('GeminiToolHandlers — processToolCall()', () => {
  let handlers: GeminiToolHandlers;
  let mockTranslationService: ElectionTranslationService;
  let mockMapsService: ElectionMapsService;
  let mockVertexService: ElectionVertexService;

  beforeEach(() => {
    mockTranslationService = new ElectionTranslationService();
    mockMapsService = new ElectionMapsService();
    mockVertexService = new ElectionVertexService();
    handlers = new GeminiToolHandlers(
      mockTranslationService,
      mockMapsService,
      mockVertexService,
    );
  });

  it('handles unknown tool names with error status', async () => {
    const result = await handlers.processToolCall({
      name: 'nonexistent_tool',
      args: {},
    });
    expect(result.status).toBe('error');
    expect(String(result.result)).toContain('Unknown tool');
    expect(result.toolName).toBe('nonexistent_tool');
  });

  it('handles check_voter_eligibility with valid age', async () => {
    const result = await handlers.processToolCall({
      name: 'check_voter_eligibility',
      args: { age: 25, is_indian_citizen: true },
    });
    expect(result.status).toBe('success');
    expect(result.result).toBeTruthy();
  });

  it('handles check_voter_eligibility with missing arguments (branch coverage)', async () => {
    const result = await handlers.processToolCall({
      name: 'check_voter_eligibility',
      args: {},
    });
    expect(result.status).toBe('success');
    expect(String(result.result)).toContain('18 year');
  });

  it('handles check_voter_eligibility with underage', async () => {
    const result = await handlers.processToolCall({
      name: 'check_voter_eligibility',
      args: { age: 16 },
    });
    expect(result.status).toBe('success');
    expect(result.result).toBeTruthy();
  });

  it('handles check_voter_eligibility with non-citizen flag', async () => {
    const result = await handlers.processToolCall({
      name: 'check_voter_eligibility',
      args: { age: 25, is_indian_citizen: false },
    });
    expect(result.status).toBe('success');
    expect(String(result.result)).toContain('Indian citizens');
  });

  it('handles get_election_timeline', async () => {
    const result = await handlers.processToolCall({
      name: 'get_election_timeline',
      args: { election_type: 'LOK_SABHA' },
    });
    expect(result.status).toBe('success');
    expect(String(result.result).length).toBeGreaterThan(0);
  });

  it('handles find_polling_location with fallback', async () => {
    const result = await handlers.processToolCall({
      name: 'find_polling_location',
      args: { query: 'polling booth Mumbai' },
    });
    expect(result.status).toBe('success');
    expect(result.result).toBeTruthy();
  });

  it('handles lookup_election_faq', async () => {
    const result = await handlers.processToolCall({
      name: 'lookup_election_faq',
      args: { search_query: 'What is NOTA?' },
    });
    expect(result.status).toBe('success');
  });

  it('lookup_election_faq returns Vertex AI response', async () => {
    vi.spyOn(mockVertexService, 'findRelevantFaq').mockResolvedValue({
      question: 'Q',
      answer: 'A',
      score: 0.9
    });

    const call = {
      name: 'lookup_election_faq',
      args: { search_query: 'test faq' },
    };
    const result = await handlers.processToolCall(call);

    expect(result.status).toBe('success');
    expect(result.result).toContain('Q: Q');
  });

  it('lookup_election_faq handles null response from Vertex AI', async () => {
    vi.spyOn(mockVertexService, 'findRelevantFaq').mockResolvedValue(null);

    const call = {
      name: 'lookup_election_faq',
      args: { search_query: 'nothing matches this' },
    };
    const result = await handlers.processToolCall(call);

    expect(result.status).toBe('success');
    expect(result.result).toContain('No matching FAQ found');
  });

  it('find_polling_location falls back to Maps link when no data returned', async () => {
    vi.spyOn(mockMapsService, 'searchPollingLocations').mockResolvedValue({
      ok: false, data: null, error: 'err', status: 500
    });
    vi.spyOn(mockMapsService, 'generateMapsLink').mockReturnValue('https://maps.test');

    const call = {
      name: 'find_polling_location',
      args: { query: 'nowhere' },
    };
    const result = await handlers.processToolCall(call);

    expect(result.status).toBe('success');
    expect(result.result).toContain('Search on Google Maps:');
  });

  it('processToolCall handles handler exceptions gracefully', async () => {
    vi.spyOn(mockTranslationService, 'translateText').mockRejectedValue(new Error('crash'));

    const call = {
      name: 'translate_text',
      args: { text: 'crash me' },
    };
    const result = await handlers.processToolCall(call);

    expect(result.status).toBe('error');
    expect(result.result).toContain('Service temporarily unavailable');
  });

  it('handles translate_text gracefully when unconfigured', async () => {
    const result = await handlers.processToolCall({
      name: 'translate_text',
      args: { text: 'Hello', targetLang: 'hi' },
    });
    expect(result.status).toBe('success');
    expect(result.toolName).toBe('translate_text');
  });

  it('preserves args in the result object', async () => {
    const args = { age: 30 };
    const result = await handlers.processToolCall({
      name: 'check_voter_eligibility',
      args,
    });
    expect(result.args).toEqual(args);
  });
});
