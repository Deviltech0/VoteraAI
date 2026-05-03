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
import {
  setupFontSizeToggle,
  setupLanguageAnnouncements,
  setupThemeToggle,
  setupScrollProgress,
  setupScrollToTop,
  setupScrollAnimations,
  setupScrollSpy,
  supportsWebGL,
} from './ui/GlobalListeners';

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
 *
 * @param appContainer - The #app DOM element for the WebGL canvas.
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

  announce(
    'Votera AI is ready. Navigate through the election journey to learn about Indian elections.',
  );

  setupScrollSpy();
  setupThemeToggle();
  setupScrollProgress();
  setupScrollToTop();
  setupScrollAnimations();
  setupFontSizeToggle();
  setupLanguageAnnouncements();
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', bootstrap);

export { bootstrap };
