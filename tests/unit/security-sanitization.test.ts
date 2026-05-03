/**
 * Security-Focused Tests — XSS, injection, and sanitization attack vectors.
 *
 * Tests the sanitization pipeline against real-world attack payloads
 * to verify defence-in-depth against XSS, injection, and protocol attacks.
 */

import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  stripHtmlTags,
  sanitizeUserInput,
  sanitizeUrl,
  truncate,
  removeControlChars,
  sanitizeFull,
} from '../../src/utils/sanitize';

describe('Security — XSS Attack Vector Tests', () => {
  describe('Script injection prevention', () => {
    it('escapes <script> tags', () => {
      const input = '<script>alert("XSS")</script>';
      expect(sanitizeFull(input)).not.toContain('<script>');
      expect(sanitizeFull(input)).not.toContain('</script>');
    });

    it('strips nested script tags', () => {
      const input = '<scr<script>ipt>alert(1)</scr</script>ipt>';
      const result = sanitizeFull(input);
      expect(result).not.toContain('<script>');
    });

    it('escapes event handler attributes', () => {
      const input = '<img onerror="alert(1)" src=x>';
      const result = sanitizeFull(input);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('<img');
    });

    it('escapes svg-based XSS', () => {
      const input = '<svg onload="alert(1)">';
      const result = sanitizeFull(input);
      expect(result).not.toContain('<svg');
    });

    it('escapes iframe injection', () => {
      const input = '<iframe src="javascript:alert(1)"></iframe>';
      const result = sanitizeFull(input);
      expect(result).not.toContain('<iframe');
    });

    it('escapes JavaScript in href', () => {
      const input = '<a href="javascript:alert(1)">click</a>';
      const result = sanitizeFull(input);
      expect(result).not.toContain('javascript:');
    });

    it('escapes data URI in tags', () => {
      const input = '<object data="data:text/html,<script>alert(1)</script>">';
      const result = sanitizeFull(input);
      expect(result).not.toContain('<object');
    });

    it('escapes style-based injection', () => {
      const input = '<div style="background:url(javascript:alert(1))">';
      const result = sanitizeFull(input);
      expect(result).not.toContain('<div');
    });
  });

  describe('HTML entity escaping', () => {
    it('escapes ampersand', () => {
      expect(escapeHtml('a&b')).toBe('a&amp;b');
    });

    it('escapes less-than', () => {
      expect(escapeHtml('a<b')).toBe('a&lt;b');
    });

    it('escapes greater-than', () => {
      expect(escapeHtml('a>b')).toBe('a&gt;b');
    });

    it('escapes double quotes', () => {
      expect(escapeHtml('a"b')).toBe('a&quot;b');
    });

    it('escapes single quotes', () => {
      expect(escapeHtml("a'b")).toBe('a&#x27;b');
    });

    it('escapes forward slashes', () => {
      expect(escapeHtml('a/b')).toBe('a&#x2F;b');
    });

    it('escapes backticks', () => {
      expect(escapeHtml('a`b')).toBe('a&#96;b');
    });

    it('escapes all characters in one string', () => {
      const result = escapeHtml('&<>"\'`/');
      expect(result).toBe('&amp;&lt;&gt;&quot;&#x27;&#96;&#x2F;');
    });
  });

  describe('URL sanitization', () => {
    it('allows https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('allows http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('allows mailto URLs', () => {
      expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    it('blocks javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('blocks data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('blocks vbscript: protocol', () => {
      expect(sanitizeUrl('vbscript:MsgBox("XSS")')).toBe('');
    });

    it('allows relative paths', () => {
      expect(sanitizeUrl('/about')).toBe('/about');
    });

    it('allows hash links', () => {
      expect(sanitizeUrl('#section')).toBe('#section');
    });

    it('allows dot-relative paths', () => {
      expect(sanitizeUrl('./file.html')).toBe('./file.html');
    });

    it('blocks file: protocol', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBe('');
    });

    it('returns empty for non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeUrl(123 as any)).toBe('');
    });

    it('trims whitespace from URLs', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
    });
  });

  describe('Input length enforcement', () => {
    it('truncates input exceeding default 2000 chars', () => {
      const input = 'a'.repeat(3000);
      const result = truncate(input);
      expect(result.length).toBe(2000);
    });

    it('truncates to custom length', () => {
      const result = truncate('hello world', 5);
      expect(result).toBe('hello');
    });

    it('preserves input under limit', () => {
      const result = truncate('hello', 2000);
      expect(result).toBe('hello');
    });

    it('returns empty for non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(truncate(null as any)).toBe('');
    });
  });

  describe('Control character removal', () => {
    it('removes null bytes', () => {
      expect(removeControlChars('hello\x00world')).toBe('helloworld');
    });

    it('removes bell character', () => {
      expect(removeControlChars('test\x07data')).toBe('testdata');
    });

    it('removes backspace', () => {
      expect(removeControlChars('test\x08data')).toBe('testdata');
    });

    it('preserves newlines and tabs', () => {
      expect(removeControlChars('line1\nline2\ttab')).toBe('line1\nline2\ttab');
    });

    it('removes DEL character', () => {
      expect(removeControlChars('test\x7Fdata')).toBe('testdata');
    });
  });

  describe('Full sanitization pipeline', () => {
    it('applies all layers in order: truncate → control chars → strip HTML → escape → trim', () => {
      const input = '  <b>Hello</b> \x00world  ';
      const result = sanitizeFull(input);
      // Should strip tags, remove control chars, escape residual, and trim
      expect(result).not.toContain('<b>');
      expect(result).not.toContain('\x00');
      // After stripping <b> tags and trimming, we get 'Hello world'
      expect(result).toBe('Hello world');
    });

    it('returns empty for non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeFull(42 as any)).toBe('');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeFull(null as any)).toBe('');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeFull(undefined as any)).toBe('');
    });

    it('handles unicode characters correctly', () => {
      const input = 'नमस्ते 🇮🇳 Election';
      const result = sanitizeFull(input);
      expect(result).toContain('नमस्ते');
      expect(result).toContain('Election');
    });
  });

  describe('stripHtmlTags', () => {
    it('strips simple tags', () => {
      expect(stripHtmlTags('<b>bold</b>')).toBe('bold');
    });

    it('strips nested tags', () => {
      expect(stripHtmlTags('<div><p>text</p></div>')).toBe('text');
    });

    it('strips self-closing tags', () => {
      expect(stripHtmlTags('line1<br/>line2')).toBe('line1line2');
    });
  });

  describe('sanitizeUserInput', () => {
    it('returns empty for non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeUserInput(42 as any)).toBe('');
    });

    it('trims whitespace', () => {
      expect(sanitizeUserInput('  hello  ')).toBe('hello');
    });
  });
});
