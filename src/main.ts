/**
 * Votera AI — Main Entry Point
 *
 * Bootstraps the complete election education application:
 * 1. 3D WebGL election journey scene
 * 2. Accessible DOM fallback layer
 * 3. Election Coach (Gemini AI) panel
 * 4. Google Cloud Translation widget
 * 5. Google Maps polling location widget
 * 6. Google Calendar election reminders widget
 * 7. Google Cloud Natural Language API analytics
 * 8. Vertex AI semantic FAQ search
 *
 * @module main
 */

import { ElectionScene } from './scene/ElectionScene';
import { AccessibleFallback } from './ui/AccessibleFallback';
import { ElectionCoachPanel } from './ui/ElectionCoachPanel';
import { TranslationWidget } from './ui/TranslationWidget';
import { MapsWidget } from './ui/MapsWidget';
import { CalendarWidget } from './ui/CalendarWidget';
import { EligibilityCheckerWidget } from './ui/EligibilityCheckerWidget';
import { ElectionAnalyticsService } from './services/analytics';
import { ElectionVertexService } from './services/vertex';
import { StatusFeedback } from './utils/status-feedback';
import { store } from './state/store';
import { announce, onReducedMotionChange, prefersReducedMotion } from './utils/a11y';
import { Logger } from './utils/logger';

/** Track initialised modules for cleanup. */
let scene: ElectionScene | null = null;

/**
 * Bootstrap the Votera AI application.
 *
 * Initialises all UI layers in priority order:
 * 1. Accessible fallback (always first — ensures a11y from the start)
 * 2. 3D scene (progressive enhancement)
 * 3. Coach panel, Translation, Maps widgets
 *
 * @throws Error if the #app root element is missing.
 */
function bootstrap(): void {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('[Votera AI] #app root element not found.');
  }

  // 1. Accessible fallback — always renders first
  try {
    new AccessibleFallback();
  } catch (e) {
    Logger.warn('main', 'Accessible fallback failed to initialise', e);
  }

  init3DScene(appContainer);
  initWidgets();
  initCloudServices();
  initListeners();
}

/**
 * Initialize 3D scene (progressive enhancement).
 */
function init3DScene(appContainer: HTMLElement): void {
  const shouldEnable3D = !prefersReducedMotion() && supportsWebGL();
  if (shouldEnable3D) {
    try {
      scene = new ElectionScene(appContainer);
      store.setState({ is3DEnabled: true });
    } catch (e) {
      Logger.warn('main', '3D scene failed to initialise', e);
      store.setState({ is3DEnabled: false });
      appContainer.setAttribute('aria-hidden', 'true');
    }
  } else {
    store.setState({ is3DEnabled: false });
    appContainer.style.display = 'none';
    appContainer.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Initialize all standard UI widgets.
 */
function initWidgets(): void {
  const widgets = [
    { name: 'Coach Panel', constructor: ElectionCoachPanel },
    { name: 'Translation Widget', constructor: TranslationWidget },
    { name: 'Maps Widget', constructor: MapsWidget },
    { name: 'Calendar Widget', constructor: CalendarWidget },
    { name: 'Eligibility Checker', constructor: EligibilityCheckerWidget },
  ];

  for (const { name, constructor } of widgets) {
    try {
      new constructor();
    } catch (e) {
      Logger.warn('main', `${name} failed`, e);
    }
  }
}

/**
 * Initialize Google Cloud Analytics and Vertex services.
 */
function initCloudServices(): void {
  try {
    const analytics = new ElectionAnalyticsService();
    if (analytics.isConfigured()) {
      Logger.info('main', 'Google Cloud Analytics (NL API + Firestore) active');
    }
  } catch (e) {
    Logger.warn('main', 'Analytics service failed', e);
  }

  try {
    const vertex = new ElectionVertexService();
    if (vertex.isConfigured()) {
      Logger.info('main', 'Vertex AI text-embedding service active');
    } else {
      // Search fallback notice
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          StatusFeedback.showConfigWarning('Google Vertex AI');
        }
      });
    }
  } catch (e) {
    Logger.warn('main', 'Vertex AI service failed', e);
  }
}

/**
 * Set up global event listeners.
 */
function initListeners(): void {
  onReducedMotionChange((reduced) => {
    store.setState({ isReducedMotion: reduced });
    if (reduced && scene) {
      scene.dispose();
      scene = null;
      store.setState({ is3DEnabled: false });
    }
  });

  // Announce app ready
  announce(
    'Votera AI is ready. Navigate through the election journey to learn about Indian elections.',
  );

  // Scroll spy for nav
  setupScrollSpy();

  // Theme toggle
  setupThemeToggle();

  // Scroll progress bar
  setupScrollProgress();

  // Scroll to top button
  setupScrollToTop();

  // Section entry animations
  setupScrollAnimations();

  // Font size toggle (Accessibility)
  setupFontSizeToggle();

  // Language change announcements (Accessibility)
  setupLanguageAnnouncements();
}

/**
 * Set up font-size toggle buttons (A-/A/A+).
 *
 * Implements WCAG 2.2 requirement for text resizing by adjusting
 * the root font-size via a CSS custom property.
 */
function setupFontSizeToggle(): void {
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

      // Update aria-pressed states
      fontSizeBtns.forEach((b) => {
        b.setAttribute(
          'aria-pressed',
          (b as HTMLElement).getAttribute('data-font-size') === size ? 'true' : 'false',
        );
      });

      // Announce the change
      announce(`Font size changed to ${size}.`);

      // Save preference
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
function setupLanguageAnnouncements(): void {
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
function setupThemeToggle(): void {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) {
    return;
  }

  // Check saved preference or system preference
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
function setupScrollProgress(): void {
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
function setupScrollToTop(): void {
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
function setupScrollAnimations(): void {
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
 * Check if the browser supports WebGL.
 *
 * @returns True if WebGL is available.
 */
function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Set up intersection observer for scroll-based nav highlighting.
 */
function setupScrollSpy(): void {
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

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', bootstrap);

export { bootstrap };
