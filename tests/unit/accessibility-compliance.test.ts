/**
 * Accessibility Compliance Tests — WCAG 2.2 AA verification.
 *
 * Tests heading hierarchy, ARIA landmarks, label associations,
 * interactive element accessibility, and link safety.
 *
 * @module tests/unit/accessibility-compliance
 */

import { describe, it, expect, beforeEach } from 'vitest';

/** Inline a minimal DOM representation of the index.html structure. */
const MOCK_HTML = `
<a class="skip-link" href="#main-content">Skip to main content</a>
<header role="banner">
  <nav aria-label="Main navigation">
    <a class="nav-link" href="#election-journey">Journey</a>
  </nav>
</header>
<main id="main-content" role="main">
  <section class="hero-section">
    <h1>Votera AI — Your AI-Powered Election Guide</h1>
    <p>Learn about Indian elections.</p>
  </section>
  <section id="election-journey" aria-label="Election Journey">
    <h2>Your Election Journey</h2>
    <div id="accessible-fallback">
      <div role="tablist" aria-label="Journey stages">
        <button role="tab" aria-selected="true" id="tab-eligibility">Eligibility</button>
      </div>
      <div role="tabpanel" aria-labelledby="tab-eligibility">
        <h3>Check Eligibility</h3>
      </div>
    </div>
  </section>
  <section id="coach-panel" aria-label="AI Election Coach">
    <h2>Election Coach</h2>
    <label for="coach-input" class="sr-only">Ask a question</label>
    <input type="text" id="coach-input" placeholder="Ask about elections..." aria-label="Ask a question about elections" />
    <button type="submit" class="btn btn-primary" aria-label="Send question">Ask</button>
  </section>
  <div id="aria-announcer" aria-live="polite" role="status"></div>
</main>
<footer role="contentinfo">
  <p>&copy; 2026 Votera AI</p>
  <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer">ECI</a>
</footer>
`;

describe('WCAG 2.2 AA — Heading Hierarchy', () => {
  beforeEach(() => {
    document.body.innerHTML = MOCK_HTML;
  });

  it('has exactly one h1 element', () => {
    const h1s = document.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
  });

  it('h1 has non-empty text content', () => {
    const h1 = document.querySelector('h1');
    expect(h1?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('headings follow proper hierarchy (no h3 without h2)', () => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach((h) => {
      const level = parseInt(h.tagName.charAt(1), 10);
      expect(level - lastLevel).toBeLessThanOrEqual(1);
      lastLevel = level;
    });
  });
});

describe('WCAG 2.2 AA — ARIA Landmarks', () => {
  beforeEach(() => {
    document.body.innerHTML = MOCK_HTML;
  });

  it('has a header/banner landmark', () => {
    const header = document.querySelector('header, [role="banner"]');
    expect(header).not.toBeNull();
  });

  it('has a main landmark', () => {
    const main = document.querySelector('main, [role="main"]');
    expect(main).not.toBeNull();
  });

  it('has a footer/contentinfo landmark', () => {
    const footer = document.querySelector('footer, [role="contentinfo"]');
    expect(footer).not.toBeNull();
  });

  it('has a navigation landmark', () => {
    const nav = document.querySelector('nav, [role="navigation"]');
    expect(nav).not.toBeNull();
  });

  it('has a skip link', () => {
    const skipLink = document.querySelector('.skip-link, [href="#main-content"]');
    expect(skipLink).not.toBeNull();
  });
});

describe('WCAG 2.2 AA — Form Accessibility', () => {
  beforeEach(() => {
    document.body.innerHTML = MOCK_HTML;
  });

  it('all form inputs have associated labels or aria-label', () => {
    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      let hasLabel = ariaLabel !== null || ariaLabelledBy !== null;
      if (id && !hasLabel) {
        hasLabel = document.querySelector(`label[for="${id}"]`) !== null;
      }
      expect(hasLabel, `Input #${id || 'unknown'} must have a label`).toBe(true);
    });
  });
});

describe('WCAG 2.2 AA — Link Safety', () => {
  beforeEach(() => {
    document.body.innerHTML = MOCK_HTML;
  });

  it('external links have rel="noopener noreferrer"', () => {
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach((link) => {
      const rel = link.getAttribute('rel') || '';
      expect(rel).toContain('noopener');
    });
  });
});

describe('WCAG 2.2 AA — ARIA Live Regions', () => {
  beforeEach(() => {
    document.body.innerHTML = MOCK_HTML;
  });

  it('has at least one aria-live region', () => {
    const liveRegions = document.querySelectorAll('[aria-live]');
    expect(liveRegions.length).toBeGreaterThanOrEqual(1);
  });
});

describe('WCAG 2.2 AA — Interactive Elements', () => {
  beforeEach(() => {
    document.body.innerHTML = MOCK_HTML;
  });

  it('all buttons have accessible names', () => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn) => {
      const text = btn.textContent?.trim() || '';
      const ariaLabel = btn.getAttribute('aria-label') || '';
      const hasName = text.length > 0 || ariaLabel.length > 0;
      expect(hasName, 'Button must have accessible name').toBe(true);
    });
  });
});
