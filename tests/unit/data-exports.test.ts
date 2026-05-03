import { describe, it, expect } from 'vitest';
import { COACH_CONTENT, JOURNEY_CONTENT, ELECTION_TYPES_CONTENT, TIMELINE_CONTENT } from '../../src/data/ui-content';
import type { QueryIntent, AnalyticsEvent, NLApiResponse } from '../../src/services/analytics-types';

describe('Data Exports & Types', () => {
  it('exports UI content constants', () => {
    expect(COACH_CONTENT).toBeDefined();
    expect(JOURNEY_CONTENT).toBeDefined();
    expect(ELECTION_TYPES_CONTENT).toBeDefined();
    expect(TIMELINE_CONTENT).toBeDefined();
    expect(COACH_CONTENT.welcomeMessage).toContain('Namaste');
  });

  it('Analytics types are structurally valid (typecheck only)', () => {
    const mockIntent: QueryIntent = 'general';
    const mockEvent: AnalyticsEvent = {
      sessionId: '123',
      queryCategory: mockIntent,
      languageCode: 'en',
      timestamp: '2026',
      entities: ['test'],
      sentiment: 'neutral',
    };
    const mockResponse: NLApiResponse = {
      language: 'en',
    };
    expect(mockEvent.queryCategory).toBe('general');
    expect(mockResponse.language).toBe('en');
  });
});
