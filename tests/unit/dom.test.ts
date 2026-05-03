/**
 * DOM Utility Tests — Comprehensive tests for renderSafeHTML.
 *
 * Verifies safe HTML parsing, XSS prevention, container clearing,
 * and edge case handling.
 *
 * @module tests/unit/dom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderSafeHTML } from '../../src/utils/dom';

describe('renderSafeHTML()', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders valid HTML into the container', () => {
    renderSafeHTML(container, '<p>Hello World</p>');
    expect(container.querySelector('p')?.textContent).toBe('Hello World');
  });

  it('clears previous container content', () => {
    container.textContent = 'Old content';
    renderSafeHTML(container, '<p>New content</p>');
    expect(container.textContent).not.toContain('Old content');
    expect(container.textContent).toContain('New content');
  });

  it('handles nested elements correctly', () => {
    renderSafeHTML(container, '<div><ul><li>Item 1</li><li>Item 2</li></ul></div>');
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(2);
  });

  it('handles empty input without error', () => {
    expect(() => renderSafeHTML(container, '')).not.toThrow();
  });

  it('handles self-closing tags', () => {
    renderSafeHTML(container, '<input type="text" /><br />');
    expect(container.querySelector('input')).not.toBeNull();
  });

  it('preserves attributes on rendered elements', () => {
    renderSafeHTML(container, '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>');
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
  });

  it('renders ARIA attributes correctly', () => {
    renderSafeHTML(container, '<div role="region" aria-label="Test region" aria-live="polite"></div>');
    const region = container.querySelector('[role="region"]');
    expect(region?.getAttribute('aria-label')).toBe('Test region');
    expect(region?.getAttribute('aria-live')).toBe('polite');
  });

  it('handles multiple top-level elements', () => {
    renderSafeHTML(container, '<p>First</p><p>Second</p><p>Third</p>');
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(3);
  });

  it('handles special characters in text content', () => {
    renderSafeHTML(container, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    const p = container.querySelector('p');
    expect(p?.textContent).toContain('<script>');
    // But it should be text, not an actual script element
    expect(container.querySelector('script')).toBeNull();
  });
});
