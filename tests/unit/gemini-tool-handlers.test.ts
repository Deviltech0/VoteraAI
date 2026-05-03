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

  beforeEach(() => {
    handlers = new GeminiToolHandlers(
      new ElectionTranslationService(),
      new ElectionMapsService(),
      new ElectionVertexService(),
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
