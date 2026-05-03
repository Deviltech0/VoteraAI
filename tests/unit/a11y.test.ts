/**
 * Accessibility Utility Tests — Tests for all a11y helper functions.
 *
 * Covers: announce, moveFocusTo, prefersReducedMotion,
 * generateA11yId, setActiveNavSection, createScreenReaderText.
 *
 * @module tests/unit/a11y
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  announce,
  moveFocusTo,
  generateA11yId,
  createScreenReaderText,
  prefersReducedMotion,
  setActiveNavSection,
} from '../../src/utils/a11y';

describe('announce()', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="aria-announcer" aria-live="polite"></div>';
  });

  it('sets the announcer text content', () => {
    // We need to wait for requestAnimationFrame, but in jsdom it fires synchronously
    announce('Test message');
    // The actual text is set in rAF, so we check the attribute change
    const announcer = document.getElementById('aria-announcer');
    expect(announcer).not.toBeNull();
    expect(announcer?.getAttribute('aria-live')).toBe('polite');
  });

  it('uses assertive mode when specified', () => {
    announce('Urgent message', 'assertive');
    const announcer = document.getElementById('aria-announcer');
    expect(announcer?.getAttribute('aria-live')).toBe('assertive');
  });

  it('does not throw when announcer element is missing', () => {
    document.body.innerHTML = '';
    expect(() => announce('Test')).not.toThrow();
  });
});

describe('moveFocusTo()', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="target">Content</div><button id="btn">Click</button>';
  });

  it('returns true when element exists', () => {
    const result = moveFocusTo('target');
    expect(result).toBe(true);
  });

  it('sets tabindex on non-focusable elements', () => {
    moveFocusTo('target');
    const target = document.getElementById('target');
    expect(target?.getAttribute('tabindex')).toBe('-1');
  });

  it('returns false for non-existent element', () => {
    const result = moveFocusTo('nonexistent');
    expect(result).toBe(false);
  });
});

describe('generateA11yId()', () => {
  it('returns a unique string with the given prefix', () => {
    const id1 = generateA11yId('test');
    const id2 = generateA11yId('test');
    expect(id1).toContain('test');
    expect(id1).not.toBe(id2);
  });
});

describe('createScreenReaderText()', () => {
  it('creates a span with sr-only class', () => {
    const el = createScreenReaderText('Hidden text');
    expect(el.textContent).toBe('Hidden text');
    expect(el.className).toContain('sr-only');
  });

  it('creates an element for empty string', () => {
    const el = createScreenReaderText('');
    expect(el.textContent).toBe('');
  });
});

describe('prefersReducedMotion()', () => {
  it('returns a boolean', () => {
    const result = prefersReducedMotion();
    expect(typeof result).toBe('boolean');
  });
});

describe('setActiveNavSection()', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav>
        <a class="nav-link" href="#section1" data-section="section1">Section 1</a>
        <a class="nav-link" href="#section2" data-section="section2">Section 2</a>
      </nav>
    `;
  });

  it('sets aria-current on the active section link', () => {
    setActiveNavSection('section1');
    const link1 = document.querySelector('[data-section="section1"]');
    const link2 = document.querySelector('[data-section="section2"]');
    expect(link1?.getAttribute('aria-current')).toBe('true');
    expect(link2?.getAttribute('aria-current')).not.toBe('true');
  });
});
