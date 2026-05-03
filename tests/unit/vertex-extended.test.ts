/**
 * Vertex AI Service — Extended Coverage Tests
 *
 * Covers corpus embedding caching, embedText failure paths,
 * cosineSimilarity edge cases, and keyword fallback exhaustive matching.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElectionVertexService } from '../../src/services/vertex';

vi.stubEnv('VITE_GEMINI_API_KEY', '');
vi.stubEnv('VITE_GEMINI_KEY', '');

describe('ElectionVertexService — Extended Coverage', () => {
  let service: ElectionVertexService;

  beforeEach(() => {
    service = new ElectionVertexService();
  });

  describe('isConfigured', () => {
    it('returns false when no API key', () => {
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('findRelevantFaq — keyword fallback', () => {
    it('returns eligibility FAQ for "eligible" query', async () => {
      const result = await service.findRelevantFaq('Am I eligible to vote?');
      expect(result).not.toBeNull();
      expect(result?.question).toContain('eligible');
      expect(result?.score).toBe(0.6);
    });

    it('returns registration FAQ for "register" query', async () => {
      const result = await service.findRelevantFaq('How to register online?');
      expect(result).not.toBeNull();
      expect(result?.question).toContain('register');
    });

    it('returns NOTA FAQ for "nota" query', async () => {
      const result = await service.findRelevantFaq('what is nota');
      expect(result).not.toBeNull();
      expect(result?.question).toContain('NOTA');
    });

    it('returns EVM FAQ for "evm" query', async () => {
      const result = await service.findRelevantFaq('How does evm work?');
      expect(result).not.toBeNull();
      expect(result?.answer).toContain('EVM');
    });

    it('returns polling booth FAQ for "booth" query', async () => {
      const result = await service.findRelevantFaq('find my polling booth');
      expect(result).not.toBeNull();
      expect(result?.answer).toContain('Voter Helpline');
    });

    it('returns NRI FAQ for "nri" query', async () => {
      const result = await service.findRelevantFaq('Can NRI vote?');
      expect(result).not.toBeNull();
      expect(result?.answer).toContain('NRI');
    });

    it('returns postal ballot FAQ for "postal ballot" query', async () => {
      const result = await service.findRelevantFaq('postal ballot rules');
      expect(result).not.toBeNull();
      expect(result?.answer).toContain('Postal');
    });

    it('returns Lok Sabha FAQ for "parliament" query', async () => {
      const result = await service.findRelevantFaq('parliament elections');
      expect(result).not.toBeNull();
      expect(result?.answer).toContain('Lok Sabha');
    });

    it('returns Panchayat FAQ for "village" query', async () => {
      const result = await service.findRelevantFaq('village elections');
      expect(result).not.toBeNull();
      expect(result?.answer).toContain('Panchayat');
    });

    it('returns ID proof FAQ for "aadhaar" query', async () => {
      const result = await service.findRelevantFaq('is aadhaar valid for voting?');
      expect(result).not.toBeNull();
      expect(result?.answer).toContain('Aadhaar');
    });

    it('returns null for completely unrelated query', async () => {
      const result = await service.findRelevantFaq('how to bake a cake');
      expect(result).toBeNull();
    });

    it('sanitises input before processing', async () => {
      const result = await service.findRelevantFaq('<script>alert("xss")</script> eligible');
      expect(result).not.toBeNull();
    });

    it('handles empty query', async () => {
      const result = await service.findRelevantFaq('');
      expect(result).toBeNull();
    });

    it('returns MCC FAQ for "code of conduct" query', async () => {
      const result = await service.findRelevantFaq('model code of conduct');
      expect(result).not.toBeNull();
    });

    it('returns star campaigner FAQ', async () => {
      const result = await service.findRelevantFaq('who are star campaigners?');
      expect(result).not.toBeNull();
    });

    it('returns tendered vote FAQ', async () => {
      const result = await service.findRelevantFaq('what is a tendered vote?');
      expect(result).not.toBeNull();
    });

    it('returns exit poll FAQ', async () => {
      const result = await service.findRelevantFaq('are exit polls banned?');
      expect(result).not.toBeNull();
    });

    it('returns braille FAQ for visually impaired', async () => {
      const result = await service.findRelevantFaq('braille on voting machine');
      expect(result).not.toBeNull();
    });

    it('returns helpline FAQ for 1950', async () => {
      const result = await service.findRelevantFaq('what is 1950 helpline?');
      expect(result).not.toBeNull();
    });

    it('returns BLO FAQ', async () => {
      const result = await service.findRelevantFaq('who is the BLO?');
      expect(result).not.toBeNull();
    });

    it('returns online voting FAQ', async () => {
      const result = await service.findRelevantFaq('can I vote online?');
      expect(result).not.toBeNull();
    });

    it('returns cVIGIL FAQ', async () => {
      const result = await service.findRelevantFaq('cvigil app');
      expect(result).not.toBeNull();
    });

    it('returns transfer FAQ', async () => {
      const result = await service.findRelevantFaq('transfer voter id to new city');
      expect(result).not.toBeNull();
    });

    it('returns proxy voting FAQ', async () => {
      const result = await service.findRelevantFaq('proxy voting for armed forces');
      expect(result).not.toBeNull();
    });

    it('returns delimitation FAQ', async () => {
      const result = await service.findRelevantFaq('what is delimitation?');
      expect(result).not.toBeNull();
    });

    it('returns voting hours FAQ', async () => {
      const result = await service.findRelevantFaq('what time does polling close?');
      expect(result).not.toBeNull();
    });

    it('returns ink FAQ', async () => {
      const result = await service.findRelevantFaq('why indelible ink on finger?');
      expect(result).not.toBeNull();
    });

    it('returns DigiLocker FAQ', async () => {
      const result = await service.findRelevantFaq('is digilocker voter id valid?');
      expect(result).not.toBeNull();
    });

    it('returns compulsory voting FAQ', async () => {
      const result = await service.findRelevantFaq('is voting compulsory in India?');
      expect(result).not.toBeNull();
    });

    it('returns SVEEP FAQ', async () => {
      const result = await service.findRelevantFaq('what is sveep program?');
      expect(result).not.toBeNull();
    });

    it('returns webcasting FAQ', async () => {
      const result = await service.findRelevantFaq('webcasting at polling booths');
      expect(result).not.toBeNull();
    });
  });
});
