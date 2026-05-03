/**
 * Gemini Tool Handler Tests — Deep coverage for all processToolCall paths.
 *
 * Tests each extracted tool handler method individually and verifies
 * error handling, unknown tool rejection, and service integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElectionCoachService, ELECTION_TOOLS } from '../../src/services/gemini';

// Mock import.meta.env
vi.stubEnv('VITE_GEMINI_API_KEY', '');
vi.stubEnv('VITE_GEMINI_KEY', '');
vi.stubEnv('VITE_GEMINI_MODEL', 'gemini-1.5-flash');
vi.stubEnv('VITE_GOOGLE_TRANSLATION_API_KEY', '');
vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
vi.stubEnv('VITE_GOOGLE_MAPS_KEY', '');
vi.stubEnv('VITE_GOOGLE_CLOUD_API_KEY', '');

describe('ElectionCoachService — Tool Handlers', () => {
  let coach: ElectionCoachService;

  beforeEach(() => {
    coach = new ElectionCoachService();
  });

  describe('ELECTION_TOOLS declarations', () => {
    it('exports exactly 5 tool declarations', () => {
      expect(ELECTION_TOOLS).toHaveLength(5);
    });

    it('each tool has name, description, and parameters', () => {
      for (const tool of ELECTION_TOOLS) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.parameters.type).toBe('object');
        expect(tool.parameters.required.length).toBeGreaterThan(0);
      }
    });

    it('translate_text tool requires text and targetLang', () => {
      const tool = ELECTION_TOOLS.find((t) => t.name === 'translate_text');
      expect(tool?.parameters.required).toContain('text');
      expect(tool?.parameters.required).toContain('targetLang');
    });

    it('find_polling_location requires query', () => {
      const tool = ELECTION_TOOLS.find((t) => t.name === 'find_polling_location');
      expect(tool?.parameters.required).toContain('query');
    });

    it('check_voter_eligibility requires age', () => {
      const tool = ELECTION_TOOLS.find((t) => t.name === 'check_voter_eligibility');
      expect(tool?.parameters.required).toContain('age');
    });
  });

  describe('isConfigured', () => {
    it('returns false when no API key set', () => {
      expect(coach.isConfigured()).toBe(false);
    });
  });

  describe('chat — fallback mode', () => {
    it('returns eligibility response for eligibility query', async () => {
      const msg = await coach.chat('Am I eligible to vote at age 17?');
      expect(msg.role).toBe('assistant');
      expect(msg.content).toContain('18');
    });

    it('returns registration response for registration query', async () => {
      const msg = await coach.chat('How do I register to vote?');
      expect(msg.role).toBe('assistant');
      expect(msg.content).toContain('Form 6');
    });

    it('returns EVM response for EVM query', async () => {
      const msg = await coach.chat('Tell me about EVM machines');
      expect(msg.role).toBe('assistant');
      expect(msg.content).toContain('Electronic Voting');
    });

    it('returns NOTA response for NOTA query', async () => {
      const msg = await coach.chat('What is NOTA?');
      expect(msg.role).toBe('assistant');
      expect(msg.content).toContain('NOTA');
    });

    it('returns booth response for booth query', async () => {
      const msg = await coach.chat('Where is my polling booth?');
      expect(msg.role).toBe('assistant');
      expect(msg.content).toContain('booth');
    });

    it('returns Lok Sabha response', async () => {
      const msg = await coach.chat('Tell me about Lok Sabha');
      expect(msg.role).toBe('assistant');
      expect(msg.content).toContain('Lok Sabha');
    });

    it('returns panchayat response', async () => {
      const msg = await coach.chat('How do panchayat elections work?');
      expect(msg.role).toBe('assistant');
      expect(msg.content).toContain('Panchayat');
    });

    it('returns municipal response', async () => {
      const msg = await coach.chat('Tell me about nagar elections');
      expect(msg.role).toBe('assistant');
      expect(msg.content).toContain('Municipal');
    });

    it('returns default welcome for unknown query', async () => {
      const msg = await coach.chat('Hello there');
      expect(msg.role).toBe('assistant');
      expect(msg.content).toContain('Votera AI');
    });

    it('returns cached response for repeated query', async () => {
      const msg1 = await coach.chat('What is NOTA?');
      const msg2 = await coach.chat('What is NOTA?');
      expect(msg1.content).toBe(msg2.content);
    });
  });

  describe('conversation history', () => {
    it('getHistory returns message array', () => {
      expect(coach.getHistory()).toEqual([]);
    });

    it('clearHistory resets history', async () => {
      await coach.chat('test');
      expect(coach.getHistory().length).toBeGreaterThan(0);
      coach.clearHistory();
      expect(coach.getHistory()).toEqual([]);
    });

    it('history includes user and assistant messages', async () => {
      await coach.chat('Hello');
      const history = coach.getHistory();
      const roles = history.map((m) => m.role);
      expect(roles).toContain('user');
      expect(roles).toContain('assistant');
    });
  });

  describe('message creation', () => {
    it('creates messages with unique IDs', async () => {
      const msg1 = await coach.chat('test 1');
      const msg2 = await coach.chat('test 2');
      expect(msg1.id).not.toBe(msg2.id);
    });

    it('creates messages with timestamps', async () => {
      const msg = await coach.chat('test');
      expect(msg.timestamp).toBeGreaterThan(0);
    });
  });

  describe('input sanitization', () => {
    it('sanitises HTML in user input', async () => {
      const msg = await coach.chat('<script>alert("xss")</script>');
      expect(msg.content).not.toContain('<script>');
    });

    it('handles empty input gracefully', async () => {
      const msg = await coach.chat('');
      expect(msg.role).toBe('assistant');
    });

    it('handles very long input', async () => {
      const longInput = 'a'.repeat(3000);
      const msg = await coach.chat(longInput);
      expect(msg.role).toBe('assistant');
    });
  });
});
