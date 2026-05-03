/**
 * StatusFeedback Utility Tests
 *
 * Covers DOM container creation, toast rendering, auto-removal,
 * and configuration warning display.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StatusFeedback } from '../../src/utils/StatusFeedback';

describe('StatusFeedback', () => {
  beforeEach(() => {
    // Reset the singleton container
    const existing = document.getElementById('status-feedback-container');
    if (existing) {
      existing.remove();
    }
    // Reset private static container reference
    // @ts-expect-error — accessing private static for test reset
    StatusFeedback.container = null;
  });

  afterEach(() => {
    const existing = document.getElementById('status-feedback-container');
    if (existing) {
      existing.remove();
    }
    // @ts-expect-error — accessing private static for test reset
    StatusFeedback.container = null;
    vi.restoreAllMocks();
  });

  describe('ensureContainer', () => {
    it('creates a notification container in the DOM', () => {
      StatusFeedback.showConfigWarning('Test Service');
      const container = document.getElementById('status-feedback-container');
      expect(container).not.toBeNull();
      expect(container?.style.position).toBe('fixed');
      expect(container?.style.zIndex).toBe('9999');
    });

    it('reuses existing container on subsequent calls', () => {
      StatusFeedback.showConfigWarning('Service A');
      StatusFeedback.showConfigWarning('Service B');
      const containers = document.querySelectorAll('#status-feedback-container');
      expect(containers.length).toBe(1);
    });
  });

  describe('showConfigWarning', () => {
    it('renders a warning toast with the service name', () => {
      StatusFeedback.showConfigWarning('Google Translation');
      const container = document.getElementById('status-feedback-container');
      const toasts = container?.querySelectorAll('.status-toast');
      expect(toasts?.length).toBe(1);
      // Check the message contains the service name
      const toastText = toasts?.[0]?.textContent ?? '';
      expect(toastText).toContain('Google Translation');
    });

    it('sets role=alert for accessibility', () => {
      StatusFeedback.showConfigWarning('Maps');
      const container = document.getElementById('status-feedback-container');
      const toast = container?.querySelector('.status-toast');
      expect(toast?.getAttribute('role')).toBe('alert');
    });

    it('includes SERVICE UNAVAILABLE header', () => {
      StatusFeedback.showConfigWarning('Gemini AI');
      const container = document.getElementById('status-feedback-container');
      const toast = container?.querySelector('.status-toast');
      expect(toast?.textContent).toContain('SERVICE UNAVAILABLE');
    });

    it('shows default help text when no helpUrl provided', () => {
      StatusFeedback.showConfigWarning('Vertex AI');
      const container = document.getElementById('status-feedback-container');
      const link = container?.querySelector('a');
      expect(link?.textContent).toBe('Check .env.example for setup');
      expect(link?.style.pointerEvents).toBe('none');
    });

    it('shows help link when helpUrl is provided', () => {
      StatusFeedback.showConfigWarning('Calendar', 'https://docs.example.com');
      const container = document.getElementById('status-feedback-container');
      const link = container?.querySelector('a');
      expect(link?.textContent).toBe('Learn how to configure it');
      expect(link?.href).toContain('https://docs.example.com');
    });

    it('renders multiple toasts when called multiple times', () => {
      StatusFeedback.showConfigWarning('Service A');
      StatusFeedback.showConfigWarning('Service B');
      StatusFeedback.showConfigWarning('Service C');
      const container = document.getElementById('status-feedback-container');
      const toasts = container?.querySelectorAll('.status-toast');
      expect(toasts?.length).toBe(3);
    });

    it('auto-removes toast after timeout', () => {
      vi.useFakeTimers();
      StatusFeedback.showConfigWarning('Temp Service');
      const container = document.getElementById('status-feedback-container');
      expect(container?.querySelectorAll('.status-toast').length).toBe(1);

      // Advance past the 6-second auto-remove + 500ms animation
      vi.advanceTimersByTime(6500);

      expect(container?.querySelectorAll('.status-toast').length).toBe(0);
      vi.useRealTimers();
    });

    it('includes SVG warning icon in the header', () => {
      StatusFeedback.showConfigWarning('Test');
      const container = document.getElementById('status-feedback-container');
      const svg = container?.querySelector('svg');
      expect(svg).not.toBeNull();
    });
  });
});
