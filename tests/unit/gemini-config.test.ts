/**
 * Gemini Config Tests — Tests for static tool declarations and config data.
 *
 * Verifies the correctness of tool schemas, system prompt,
 * and static response maps.
 *
 * @module tests/unit/gemini-config
 */

import { describe, it, expect } from 'vitest';
import {
  ELECTION_TOOLS,
  ELECTION_COACH_SYSTEM_PROMPT,
  STATIC_RESPONSE_MAP,
  DEFAULT_STATIC_RESPONSE,
} from '../../src/services/gemini-config';

describe('ELECTION_TOOLS', () => {
  it('contains exactly 5 tool declarations', () => {
    expect(ELECTION_TOOLS.length).toBe(5);
  });

  it('every tool has a name, description, and parameters', () => {
    ELECTION_TOOLS.forEach((tool) => {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toBeDefined();
      expect(tool.parameters.type).toBe('object');
      expect(tool.parameters.required).toBeDefined();
    });
  });

  it('covers all required Google service integrations', () => {
    const names = ELECTION_TOOLS.map((t) => t.name);
    expect(names).toContain('translate_text');
    expect(names).toContain('find_polling_location');
    expect(names).toContain('lookup_election_faq');
    expect(names).toContain('check_voter_eligibility');
    expect(names).toContain('get_election_timeline');
  });

  it('each tool has at least one required parameter', () => {
    ELECTION_TOOLS.forEach((tool) => {
      expect(tool.parameters.required.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('ELECTION_COACH_SYSTEM_PROMPT', () => {
  it('mentions Votera AI', () => {
    expect(ELECTION_COACH_SYSTEM_PROMPT).toContain('Votera AI');
  });

  it('contains safety rules', () => {
    expect(ELECTION_COACH_SYSTEM_PROMPT).toContain('Never provide legal advice');
    expect(ELECTION_COACH_SYSTEM_PROMPT).toContain('Never ask for or store personal');
  });

  it('references official ECI resources', () => {
    expect(ELECTION_COACH_SYSTEM_PROMPT).toContain('eci.gov.in');
    expect(ELECTION_COACH_SYSTEM_PROMPT).toContain('nvsp.in');
    expect(ELECTION_COACH_SYSTEM_PROMPT).toContain('1950');
  });
});

describe('STATIC_RESPONSE_MAP', () => {
  it('contains at least 5 fallback entries', () => {
    expect(STATIC_RESPONSE_MAP.length).toBeGreaterThanOrEqual(5);
  });

  it('every entry has keywords and a response', () => {
    STATIC_RESPONSE_MAP.forEach((entry) => {
      expect(entry.keywords.length).toBeGreaterThan(0);
      expect(entry.response.length).toBeGreaterThan(20);
    });
  });

  it('covers NOTA queries', () => {
    const nota = STATIC_RESPONSE_MAP.find((e) =>
      e.keywords.some((kw) => kw.includes('nota')),
    );
    expect(nota).toBeDefined();
    expect(nota?.response).toContain('NOTA');
  });
});

describe('DEFAULT_STATIC_RESPONSE', () => {
  it('is a non-empty welcome message', () => {
    expect(DEFAULT_STATIC_RESPONSE.length).toBeGreaterThan(50);
    expect(DEFAULT_STATIC_RESPONSE).toContain('Votera AI');
  });

  it('lists key features', () => {
    expect(DEFAULT_STATIC_RESPONSE).toContain('eligibility');
    expect(DEFAULT_STATIC_RESPONSE).toContain('Lok Sabha');
  });
});
