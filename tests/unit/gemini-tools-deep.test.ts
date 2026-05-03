/**
 * Gemini Deep Tool Handler Tests — 100% Coverage for Tool Logic.
 *
 * This test suite targets the internal tool handler methods of ElectionCoachService
 * by mocking the SafeApiClient and simulating real Gemini tool-call responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElectionCoachService } from '../../src/services/gemini';

// Mock the API client
vi.mock('../../src/services/api-client', () => {
  return {
    SafeApiClient: vi.fn().mockImplementation(() => ({
      post: vi.fn(),
      get: vi.fn(),
    })),
  };
});

describe('ElectionCoachService — Deep Tool Coverage', () => {
  let coach: ElectionCoachService;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    coach = new ElectionCoachService();
    mockClient = (coach as any).client;
  });

  it('handles translate_text tool call from Gemini', async () => {
    // Simulate Gemini responding with a tool call
    mockClient.post.mockResolvedValueOnce({
      ok: true,
      data: {
        candidates: [{
          content: {
            parts: [{
              functionCall: {
                name: 'translate_text',
                args: { text: 'Hello', targetLang: 'hi' }
              }
            }]
          }
        }]
      }
    });

    const msg = await coach.chat('Translate Hello to Hindi');
    expect(msg.content).toContain('[translate_text]');
    expect(mockClient.post).toHaveBeenCalled();
  });

  it('handles find_polling_location tool call from Gemini', async () => {
    mockClient.post.mockResolvedValueOnce({
      ok: true,
      data: {
        candidates: [{
          content: {
            parts: [{
              functionCall: {
                name: 'find_polling_location',
                args: { query: 'Mumbai' }
              }
            }]
          }
        }]
      }
    });

    const msg = await coach.chat('Where is my booth in Mumbai?');
    expect(msg.content).toContain('[find_polling_location]');
  });

  it('handles lookup_election_faq tool call from Gemini', async () => {
    mockClient.post.mockResolvedValueOnce({
      ok: true,
      data: {
        candidates: [{
          content: {
            parts: [{
              functionCall: {
                name: 'lookup_election_faq',
                args: { search_query: 'NOTA' }
              }
            }]
          }
        }]
      }
    });

    const msg = await coach.chat('What is NOTA?');
    expect(msg.content).toContain('[lookup_election_faq]');
  });

  it('handles check_voter_eligibility tool call from Gemini', async () => {
    mockClient.post.mockResolvedValueOnce({
      ok: true,
      data: {
        candidates: [{
          content: {
            parts: [{
              functionCall: {
                name: 'check_voter_eligibility',
                args: { age: 18, is_indian_citizen: true }
              }
            }]
          }
        }]
      }
    });

    const msg = await coach.chat('Can I vote at 18?');
    expect(msg.content).toContain('[check_voter_eligibility]');
  });

  it('handles get_election_timeline tool call from Gemini', async () => {
    mockClient.post.mockResolvedValueOnce({
      ok: true,
      data: {
        candidates: [{
          content: {
            parts: [{
              functionCall: {
                name: 'get_election_timeline',
                args: { election_type: 'LOK_SABHA' }
              }
            }]
          }
        }]
      }
    });

    const msg = await coach.chat('When are the elections?');
    expect(msg.content).toContain('[get_election_timeline]');
  });

  it('handles unknown tool call gracefully', async () => {
    mockClient.post.mockResolvedValueOnce({
      ok: true,
      data: {
        candidates: [{
          content: {
            parts: [{
              functionCall: {
                name: 'unknown_tool',
                args: {}
              }
            }]
          }
        }]
      }
    });

    const msg = await coach.chat('Do something unknown');
    expect(msg.content).toContain('Unknown tool');
  });

  it('handles tool call error gracefully', async () => {
    mockClient.post.mockResolvedValueOnce({
      ok: true,
      data: {
        candidates: [{
          content: {
            parts: [{
              functionCall: {
                name: 'translate_text',
                args: { text: 'Hello', targetLang: 'hi' }
              }
            }]
          }
        }]
      }
    });

    // Mock translateText to throw
    vi.spyOn((coach as any).translationService, 'translateText').mockRejectedValueOnce(new Error('API Error'));

    const msg = await coach.chat('Translate Hello');
    expect(msg.content).toContain('Service temporarily unavailable');
  });
});
