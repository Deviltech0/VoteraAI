/**
 * Status Feedback Utility — Premium UX alerts for system states.
 *
 * Provides a centralised way to notify users (and developers) about
 * service availability, specifically for missing API configurations.
 */

export class StatusFeedback {
  private static container: HTMLDivElement | null = null;

  /**
   * Initialise the notification container in the DOM.
   */
  private static ensureContainer(): HTMLDivElement {
    if (this.container) {
      return this.container;
    }

    // Inject animation styles lazily (only when first needed)
    if (!document.getElementById('status-feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'status-feedback-styles';
      style.textContent = `
        @keyframes toast-in {
          from { transform: translateX(100%) translateY(0); opacity: 0; }
          to { transform: translateX(0) translateY(0); opacity: 1; }
        }
        @keyframes toast-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    this.container = document.createElement('div');
    this.container.id = 'status-feedback-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: var(--space-6);
      right: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
    return this.container;
  }

  /**
   * Show a premium configuration warning toast.
   *
   * @param service - Name of the service (e.g., 'Google Translation').
   * @param helpUrl - Optional URL to documentation or settings.
   */
  static showConfigWarning(service: string, helpUrl?: string): void {
    const container = this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = 'status-toast warning-toast';
    toast.setAttribute('role', 'alert');
    toast.style.cssText = `
      background: rgba(15, 15, 15, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 159, 67, 0.3);
      border-left: 4px solid var(--color-warning, #ff9f43);
      color: white;
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      max-width: 350px;
      pointer-events: auto;
      animation: toast-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      font-family: var(--font-family, sans-serif);
    `;

    const header = document.createElement('div');
    header.style.cssText =
      'display: flex; align-items: center; gap: var(--space-2); font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: #ff9f43;';

    // Safe SVG construction
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01');

    svg.appendChild(path);
    header.appendChild(svg);

    const titleText = document.createTextNode(' SERVICE UNAVAILABLE');
    header.appendChild(titleText);

    const message = document.createElement('div');
    message.style.cssText =
      'font-size: 0.85rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9);';
    message.textContent = `The ${service} feature is not active because its API Key is missing from the environment.`;

    const help = document.createElement('a');
    help.href = helpUrl || '#';
    help.style.cssText =
      'font-size: 0.75rem; color: #ff9f43; text-decoration: underline; font-weight: 600; opacity: 0.8;';
    help.textContent = helpUrl ? 'Learn how to configure it' : 'Check .env.example for setup';
    if (!helpUrl) {
      help.style.pointerEvents = 'none';
    }

    toast.appendChild(header);
    toast.appendChild(message);
    toast.appendChild(help);
    container.appendChild(toast);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      toast.style.animation = 'toast-out 0.5s ease forwards';
      setTimeout(() => toast.remove(), 500);
    }, 6000);
  }
}
