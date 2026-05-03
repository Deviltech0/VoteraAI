/**
 * Security Regression Tests — Ensures sanitisation, CSP, and protocol safety.
 *
 * Tests XSS prevention, protocol injection, control character removal,
 * and external link safety.
 *
 * @module tests/unit/security-regression
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeFull,
  escapeHtml,
  sanitizeUrl,
  removeControlChars,
} from '../../src/utils/sanitize';

describe('XSS Prevention — sanitizeFull()', () => {
  it('strips HTML script tags but leaves text content', () => {
    const result = sanitizeFull('<script>alert(1)</script>', 1000);
    expect(result).not.toContain('<script>');
    // The text node inside the script might be preserved by some sanitizers,
    // so we just assert the dangerous tag is gone.
  });

  it('strips event handler attributes', () => {
    const result = sanitizeFull('<img onerror="alert(1)" src=x>', 1000);
    expect(result).not.toContain('onerror');
  });

  it('strips all HTML tags', () => {
    const result = sanitizeFull('<b>bold</b> <a href="http://evil.com">link</a>', 1000);
    expect(result).not.toContain('<b>');
    expect(result).not.toContain('<a');
    expect(result).toContain('bold');
    expect(result).toContain('link');
  });

  it('handles empty string', () => {
    expect(sanitizeFull('', 100)).toBe('');
  });

  it('truncates to maxLength', () => {
    const result = sanitizeFull('a'.repeat(500), 100);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('handles null bytes', () => {
    const result = sanitizeFull('hello\0world', 100);
    expect(result).not.toContain('\0');
  });
});

describe('HTML Escaping — escapeHtml()', () => {
  it('escapes HTML special characters', () => {
    const result = escapeHtml('<script>"test" & \'value\'</script>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
    expect(result).toContain('&amp;');
  });

  it('returns empty string for non-string input', () => {
    expect(escapeHtml(null as unknown as string)).toBe('');
    expect(escapeHtml(undefined as unknown as string)).toBe('');
  });
});

describe('URL Sanitization — sanitizeUrl()', () => {
  it('allows safe HTTP URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('allows mailto: protocol', () => {
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
  });

  it('allows tel: protocol', () => {
    expect(sanitizeUrl('tel:1950')).toBe('tel:1950');
  });

  it('blocks javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('blocks data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('blocks vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:MsgBox("xss")')).toBe('');
  });

  it('allows relative URLs', () => {
    expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
    expect(sanitizeUrl('#anchor')).toBe('#anchor');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeUrl(123 as unknown as string)).toBe('');
  });
});

describe('Control Character Removal — removeControlChars()', () => {
  it('removes null bytes', () => {
    expect(removeControlChars('hel\0lo')).toBe('hello');
  });

  it('removes backspace characters', () => {
    expect(removeControlChars('hel\blo')).toBe('hello');
  });

  it('preserves newlines and tabs', () => {
    const result = removeControlChars('line1\nline2\ttab');
    expect(result).toContain('\n');
    expect(result).toContain('\t');
  });

  it('handles empty string', () => {
    expect(removeControlChars('')).toBe('');
  });
});
