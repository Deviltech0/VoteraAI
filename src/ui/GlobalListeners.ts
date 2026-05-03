/**
 * Global UI Event Listeners — Extracted from main.ts.
 *
 * Handles scroll-based UI behaviors, theme toggling, font size controls,
 * and language change announcements.
 *
 * @module ui/GlobalListeners
 */

import { announce, prefersReducedMotion } from '../utils/a11y';
import { store } from '../state/store';

/**
 * Set up font-size toggle buttons (A-/A/A+).
 *
 * Implements WCAG 2.2 requirement for text resizing by adjusting
 * the root font-size via a CSS custom property.
 */
export function setupFontSizeToggle(): void {
  const fontSizeBtns = document.querySelectorAll('[data-font-size]');
  if (fontSizeBtns.length === 0) {
    return;
  }

  const FONT_SIZES: Record<string, string> = {
    small: '87.5%',
    default: '100%',
    large: '112.5%',
  };

  fontSizeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = (btn as HTMLElement).getAttribute('data-font-size') || 'default';
      const fontSize = FONT_SIZES[size] || '100%';
      document.documentElement.style.fontSize = fontSize;

      fontSizeBtns.forEach((b) => {
        b.setAttribute(
          'aria-pressed',
          (b as HTMLElement).getAttribute('data-font-size') === size ? 'true' : 'false',
        );
      });

      announce(`Font size changed to ${size}.`);
      localStorage.setItem('font-size', size);
    });
  });

  // Restore saved preference
  const saved = localStorage.getItem('font-size');
  if (saved && FONT_SIZES[saved]) {
    document.documentElement.style.fontSize = FONT_SIZES[saved];
    fontSizeBtns.forEach((b) => {
      b.setAttribute(
        'aria-pressed',
        (b as HTMLElement).getAttribute('data-font-size') === saved ? 'true' : 'false',
      );
    });
  }
}

/**
 * Set up language change announcements.
 *
 * Listens for changes to the language selector and announces
 * the new language via the a11y live region.
 */
export function setupLanguageAnnouncements(): void {
  const langSelect = document.getElementById('language-select') as HTMLSelectElement;
  if (!langSelect) {
    return;
  }

  langSelect.addEventListener('change', () => {
    const selectedOption = langSelect.options[langSelect.selectedIndex];
    const langName = selectedOption?.textContent || langSelect.value;
    announce(`Language changed to ${langName}.`);
  });
}

/**
 * Set up theme toggle (dark/light mode).
 */
export function setupThemeToggle(): void {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) {
    return;
  }

  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    toggle.textContent = '☀️';
  }

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'light') {
      document.documentElement.removeAttribute('data-theme');
      toggle.textContent = '🌙';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      toggle.textContent = '☀️';
      localStorage.setItem('theme', 'light');
    }
  });
}

/**
 * Set up scroll progress indicator bar.
 */
export function setupScrollProgress(): void {
  const bar = document.getElementById('scroll-progress');
  if (!bar) {
    return;
  }

  window.addEventListener(
    'scroll',
    () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = `scaleX(${progress})`;
    },
    { passive: true },
  );
}

/**
 * Set up scroll-to-top floating button.
 */
export function setupScrollToTop(): void {
  const btn = document.getElementById('scroll-top-btn');
  if (!btn) {
    return;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    },
    { passive: true },
  );

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Set up Intersection Observer for section entry animations.
 */
export function setupScrollAnimations(): void {
  if (prefersReducedMotion()) {
    return;
  }

  const elements = document.querySelectorAll('.animate-in');
  if (elements.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
  );

  elements.forEach((el) => observer.observe(el));
}

/**
 * Set up intersection observer for scroll-based nav highlighting.
 */
export function setupScrollSpy(): void {
  const sections = document.querySelectorAll('main > section[id]');
  if (sections.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          store.setState({ activeSection: entry.target.id });
        }
      });
    },
    { threshold: 0.3 },
  );

  sections.forEach((section) => observer.observe(section));
}

/**
 * Check if the browser supports WebGL.
 *
 * @returns True if WebGL is available.
 */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
