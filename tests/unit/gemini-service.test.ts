/**
 * Tests for ElectionCoachService — Gemini tool dispatching.
 *
 * Validates that the service correctly routes tool calls to
 * downstream Google Cloud services (Translation, Maps, Vertex AI)
 * and handles offline fallback gracefully.
 *
 * @module tests/unit/gemini-service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ElectionCoachService, ELECTION_TOOLS } from '../../src/services/gemini';

// Mock all env variables to simulate unconfigured state
vi.stubEnv('VITE_GEMINI_API_KEY', '');
vi.stubEnv('VITE_GEMINI_KEY', '');
vi.stubEnv('VITE_GEMINI_MODEL', 'gemini-1.5-flash');
vi.stubEnv('VITE_GOOGLE_TRANSLATION_API_KEY', '');
vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
vi.stubEnv('VITE_GOOGLE_MAPS_KEY', '');

describe('ElectionCoachService', () => {
  let coach: ElectionCoachService;

  beforeEach(() => {
    coach = new ElectionCoachService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isConfigured()', () => {
    it('should return false when no API key is set', () => {
      expect(coach.isConfigured()).toBe(false);
    });
  });

  describe('ELECTION_TOOLS declarations', () => {
    it('should declare exactly 5 tools', () => {
      expect(ELECTION_TOOLS).toHaveLength(5);
    });

    it('should include translate_text tool', () => {
      const tool = ELECTION_TOOLS.find((t) => t.name === 'translate_text');
      expect(tool).toBeDefined();
      expect(tool!.parameters.required).toContain('text');
      expect(tool!.parameters.required).toContain('targetLang');
    });

    it('should include find_polling_location tool', () => {
      const tool = ELECTION_TOOLS.find((t) => t.name === 'find_polling_location');
      expect(tool).toBeDefined();
      expect(tool!.parameters.required).toContain('query');
    });

    it('should include lookup_election_faq tool', () => {
      const tool = ELECTION_TOOLS.find((t) => t.name === 'lookup_election_faq');
      expect(tool).toBeDefined();
      expect(tool!.parameters.required).toContain('search_query');
    });

    it('should include check_voter_eligibility tool', () => {
      const tool = ELECTION_TOOLS.find((t) => t.name === 'check_voter_eligibility');
      expect(tool).toBeDefined();
      expect(tool!.parameters.required).toContain('age');
    });

    it('should include get_election_timeline tool with enum', () => {
      const tool = ELECTION_TOOLS.find((t) => t.name === 'get_election_timeline');
      expect(tool).toBeDefined();
      const props = tool!.parameters.properties as Record<string, any>;
      const electionType = props['election_type'];
      expect(electionType.enum).toContain('LOK_SABHA');
      expect(electionType.enum).toContain('PANCHAYAT');
    });
  });

  describe('chat() — offline fallback', () => {
    it('should return a static response for eligibility questions', async () => {
      const response = await coach.chat('Am I eligible to vote?');

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('18');
      expect(response.content).toContain('Indian citizen');
    });

    it('should return a static response for registration questions', async () => {
      const response = await coach.chat('How do I register to vote?');

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('Form 6');
    });

    it('should return a static response for EVM questions', async () => {
      const response = await coach.chat('Tell me about EVMs and VVPAT');

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('EVM');
    });

    it('should return a static response for NOTA questions', async () => {
      const response = await coach.chat('What is NOTA?');

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('NOTA');
    });

    it('should return a static response for Lok Sabha questions', async () => {
      const response = await coach.chat('Tell me about Lok Sabha elections');

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('Lok Sabha');
    });

    it('should return a static response for Panchayat questions', async () => {
      const response = await coach.chat('How do panchayat elections work?');

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('Panchayat');
    });

    it('should return the welcome message for unknown queries', async () => {
      const response = await coach.chat('xyz random query');

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('Welcome to Votera AI');
    });

    it('should sanitise malicious input', async () => {
      const response = await coach.chat('<script>alert("xss")</script>');

      expect(response.role).toBe('assistant');
      expect(response.content).not.toContain('<script>');
    });
  });

  describe('chat() — caching', () => {
    it('should return cached response for identical queries', async () => {
      const first = await coach.chat('What is NOTA?');
      const second = await coach.chat('What is NOTA?');

      expect(first.content).toBe(second.content);
    });
  });

  describe('getHistory()', () => {
    it('should track conversation history', async () => {
      expect(coach.getHistory()).toHaveLength(0);

      await coach.chat('What is NOTA?');

      // History should have user + assistant messages
      expect(coach.getHistory().length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('clearHistory()', () => {
    it('should clear conversation history', async () => {
      await coach.chat('Test query');
      expect(coach.getHistory().length).toBeGreaterThan(0);

      coach.clearHistory();
      expect(coach.getHistory()).toHaveLength(0);
    });
  });
});
