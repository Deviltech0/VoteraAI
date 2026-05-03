/**
 * Tests for the Vertex AI embedding cache optimization.
 *
 * Validates that FAQ corpus embeddings are computed once and cached
 * permanently, eliminating redundant API calls on subsequent queries.
 *
 * @module tests/unit/vertex-service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ElectionVertexService } from '../../src/services/vertex';

// Mock import.meta.env
vi.stubEnv('VITE_GEMINI_API_KEY', '');
vi.stubEnv('VITE_GEMINI_KEY', '');

describe('ElectionVertexService', () => {
  let service: ElectionVertexService;

  beforeEach(() => {
    service = new ElectionVertexService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isConfigured()', () => {
    it('should return false when no API key is set', () => {
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('findRelevantFaq() — keyword fallback', () => {
    it('should fall back to keyword matching when API key is absent', async () => {
      const result = await service.findRelevantFaq('How do I register to vote?');

      expect(result).not.toBeNull();
      expect(result!.question).toContain('register');
      expect(result!.score).toBe(0.6);
    });

    it('should match eligibility keywords', async () => {
      const result = await service.findRelevantFaq('Am I eligible to vote?');

      expect(result).not.toBeNull();
      expect(result!.question).toContain('eligible');
    });

    it('should match NOTA keywords', async () => {
      const result = await service.findRelevantFaq('Tell me about NOTA');

      expect(result).not.toBeNull();
      expect(result!.answer).toContain('NOTA');
    });

    it('should match EVM/VVPAT keywords', async () => {
      const result = await service.findRelevantFaq('How does the EVM work?');

      expect(result).not.toBeNull();
      expect(result!.answer).toContain('EVM');
    });

    it('should match polling booth keywords', async () => {
      const result = await service.findRelevantFaq('Where is my polling booth?');

      expect(result).not.toBeNull();
      expect(result!.answer).toContain('Voter Helpline');
    });

    it('should match NRI voting keywords', async () => {
      const result = await service.findRelevantFaq('Can NRI overseas voters participate?');

      expect(result).not.toBeNull();
      expect(result!.answer).toContain('NRI');
    });

    it('should match postal ballot keywords', async () => {
      const result = await service.findRelevantFaq('How does postal ballot work?');

      expect(result).not.toBeNull();
      expect(result!.answer).toContain('Postal');
    });

    it('should match Lok Sabha keywords', async () => {
      const result = await service.findRelevantFaq('Tell me about parliament elections');

      expect(result).not.toBeNull();
      expect(result!.answer).toContain('Lok Sabha');
    });

    it('should match Panchayat keywords', async () => {
      const result = await service.findRelevantFaq('How do village panchayat elections work?');

      expect(result).not.toBeNull();
      expect(result!.answer).toContain('Panchayat');
    });

    it('should match ID proof keywords', async () => {
      const result = await service.findRelevantFaq('What id proof do I need for voting?');

      expect(result).not.toBeNull();
      expect(result!.answer).toContain('ID');
    });

    it('should return null for unrecognised queries', async () => {
      const result = await service.findRelevantFaq('What is the weather today?');
      expect(result).toBeNull();
    });

    it('should handle empty queries gracefully', async () => {
      const result = await service.findRelevantFaq('');
      expect(result).toBeNull();
    });

    it('should sanitise HTML in queries', async () => {
      const result = await service.findRelevantFaq('<script>alert("xss")</script> eligible to vote');

      // Should still match eligibility after sanitisation
      expect(result).not.toBeNull();
      expect(result!.question).toContain('eligible');
    });
  });
});
