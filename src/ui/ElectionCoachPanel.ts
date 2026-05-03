/**
 * Election Coach Panel — Conversational UI powered by Gemini AI.
 *
 * Provides an interactive chat interface for election guidance,
 * with tool-call routing to Translation and Maps services.
 * Implements debounce and in-flight request guarding for security.
 *
 * @module ui/ElectionCoachPanel
 */

import { ElectionCoachService } from '../services/gemini';
import { sanitizeFull } from '../utils/sanitize';
import { validateCoachQuery } from '../utils/validate';
import { announce, generateA11yId } from '../utils/a11y';
import { StatusFeedback } from '../utils/StatusFeedback';

/** Minimum interval between chat submissions (ms). */
const SUBMIT_DEBOUNCE_MS = 500;

/**
 * The Election Coach chat panel.
 *
 * Renders a floating panel with message history, input field,
 * and suggested quick-action buttons for common election questions.
 *
 * Implements:
 * - Debounce on submissions (500ms) to prevent API spam
 * - In-flight request guard to block concurrent requests
 * - Safe DOM construction (no innerHTML for user content)
 */
export class ElectionCoachPanel {
  private container: HTMLElement;
  private coach: ElectionCoachService;

  /** Tracks whether a request is currently in flight. */
  private isProcessing = false;

  /** Timestamp of last submission for debounce. */
  private lastSubmitTime = 0;

  constructor() {
    const el = document.getElementById('coach-panel');
    if (!el) {
      throw new Error('[CoachPanel] #coach-panel container not found.');
    }
    this.container = el;
    this.coach = new ElectionCoachService();
    this.render();
  }

  /**
   * Render the coach panel UI using safe DOM construction.
   *
   * Uses createElement + textContent instead of innerHTML
   * for all dynamic content to eliminate XSS risk.
   * Sub-renderers keep each method focused and under 80 lines.
   */
  private render(): void {
    this.container.textContent = '';

    const chatCard = document.createElement('div');
    chatCard.id = 'coach-chat';
    chatCard.className = 'card';

    chatCard.appendChild(this.renderMessageArea());
    chatCard.appendChild(this.renderSuggestions());
    chatCard.appendChild(this.renderInputForm());
    chatCard.appendChild(this.renderStatusLine());

    this.container.appendChild(chatCard);
    this.setupEventListeners();
  }

  /**
   * Create the scrollable message log area with welcome message.
   *
   * @returns The messages container element.
   */
  private renderMessageArea(): HTMLDivElement {
    const messagesDiv = document.createElement('div');
    messagesDiv.id = 'coach-messages';
    messagesDiv.setAttribute('role', 'log');
    messagesDiv.setAttribute('aria-label', 'Election Coach conversation');
    messagesDiv.setAttribute('aria-live', 'polite');
    messagesDiv.className = 'coach-messages-container';

    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'coach-message coach-assistant';

    const welcomeLabel = document.createElement('p');
    welcomeLabel.className = 'coach-label coach-label--assistant';
    welcomeLabel.textContent = '🏛️ Official Helpdesk';
    welcomeMsg.appendChild(welcomeLabel);

    const welcomeText = document.createElement('p');
    welcomeText.className = 'coach-text';
    welcomeText.textContent =
      "Namaste! I'm your Election Assistant. Ask me anything about Indian elections — eligibility, registration, EVMs, polling booths, or any election type. How can I help you today?";
    welcomeMsg.appendChild(welcomeText);
    messagesDiv.appendChild(welcomeMsg);

    return messagesDiv;
  }

  /**
   * Create suggestion quick-action buttons.
   *
   * @returns The suggestions container element.
   */
  private renderSuggestions(): HTMLDivElement {
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.id = 'coach-suggestions';
    suggestionsDiv.className = 'coach-suggestions';

    const suggestions = [
      { label: 'Am I eligible?', query: 'Am I eligible to vote?' },
      { label: 'Register to vote', query: 'How do I register to vote online?' },
      { label: 'Find my booth', query: 'Where is my polling booth?' },
      { label: 'About NOTA', query: 'What is NOTA?' },
      { label: 'Lok Sabha', query: 'Tell me about Lok Sabha elections' },
      { label: 'Panchayat', query: 'How do panchayat elections work?' },
    ];

    for (const { label, query } of suggestions) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary coach-suggestion';
      btn.setAttribute('data-query', query);
      btn.textContent = label;
      suggestionsDiv.appendChild(btn);
    }

    return suggestionsDiv;
  }

  /**
   * Create the chat input form with label, text input, and send button.
   *
   * @returns The form element.
   */
  private renderInputForm(): HTMLFormElement {
    const form = document.createElement('form');
    form.id = 'coach-form';
    form.setAttribute('role', 'search');
    form.setAttribute('aria-label', 'Ask the Election Coach a question');

    const formRow = document.createElement('div');
    formRow.className = 'coach-form-row';

    const label = document.createElement('label');
    label.setAttribute('for', 'coach-input');
    label.className = 'sr-only';
    label.textContent = 'Type your election question';
    formRow.appendChild(label);

    const input = document.createElement('input');
    input.id = 'coach-input';
    input.type = 'text';
    input.placeholder = 'Ask about Indian elections…';
    input.autocomplete = 'off';
    input.maxLength = 2000;
    input.className = 'coach-input';
    formRow.appendChild(input);

    const sendBtn = document.createElement('button');
    sendBtn.type = 'submit';
    sendBtn.className = 'btn btn-primary';
    sendBtn.id = 'coach-send';
    sendBtn.setAttribute('aria-label', 'Send question to Election Coach');
    sendBtn.textContent = 'Send';
    formRow.appendChild(sendBtn);

    form.appendChild(formRow);
    return form;
  }

  /**
   * Create the status line showing Gemini configuration state.
   *
   * @returns The status paragraph element.
   */
  private renderStatusLine(): HTMLParagraphElement {
    const statusText = document.createElement('p');
    statusText.className = 'coach-status';
    statusText.textContent = `Powered by Google Gemini AI${this.coach.isConfigured() ? '' : ' (limited mode)'}`;

    if (!this.coach.isConfigured()) {
      statusText.style.cursor = 'help';
      statusText.title = 'Click to see why this is in limited mode';
      statusText.addEventListener('click', () => {
        StatusFeedback.showConfigWarning('Google Gemini AI');
      });
    }

    return statusText;
  }

  /**
   * Set up form submission and suggestion click handlers.
   *
   * Includes debounce guard (500ms) and in-flight request protection
   * to prevent API spam and denial-of-wallet attacks.
   */
  private setupEventListeners(): void {
    const form = document.getElementById('coach-form') as HTMLFormElement;
    const input = document.getElementById('coach-input') as HTMLInputElement;

    // Form submit with debounce and in-flight guard
    form?.addEventListener('submit', (e) => {
      e.preventDefault();

      // Debounce: reject if within cooldown period
      const now = Date.now();
      if (now - this.lastSubmitTime < SUBMIT_DEBOUNCE_MS) {
        return;
      }

      // In-flight guard: reject if a request is already processing
      if (this.isProcessing) {
        announce('Please wait — your previous question is still being processed.');
        return;
      }

      const query = input.value.trim();
      if (query) {
        this.lastSubmitTime = now;
        void this.handleQuery(query);
        input.value = '';
      }
    });

    // Suggestion buttons
    this.container.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.coach-suggestion');
      if (btn) {
        // Apply same debounce and in-flight guard to suggestions
        const now = Date.now();
        if (now - this.lastSubmitTime < SUBMIT_DEBOUNCE_MS || this.isProcessing) {
          return;
        }

        const query = btn.getAttribute('data-query') || '';
        if (query) {
          this.lastSubmitTime = now;
          void this.handleQuery(query);
        }
      }
    });
  }

  /**
   * Handle a user query: validate, display, send to coach, display response.
   *
   * Manages the in-flight state to prevent concurrent API calls
   * and disables the submit button during processing.
   *
   * @param query - Raw user question.
   */
  private async handleQuery(query: string): Promise<void> {
    const validation = validateCoachQuery(query);
    if (!validation.isValid) {
      announce(validation.errors.join('. '), 'assertive');
      return;
    }

    const sanitised = validation.sanitizedValue || sanitizeFull(query);
    const sendBtn = document.getElementById('coach-send') as HTMLButtonElement;

    // Set in-flight state
    this.isProcessing = true;
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = '⏳';
    }

    try {
      // Show user message
      this.appendMessage('user', sanitised);

      // Show loading state
      const loadingId = this.appendMessage('assistant', '🤔 Thinking about your question...');

      // Get response
      const response = await this.coach.chat(sanitised);

      // Replace loading with actual response
      this.replaceMessage(loadingId, response.content);

      // Announce response
      announce(`Election Coach: ${response.content.slice(0, 200)}`);
    } finally {
      // Always clear in-flight state
      this.isProcessing = false;
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
      }
    }
  }

  /**
   * Append a message to the chat log using safe DOM APIs.
   *
   * Uses createElement + textContent (never innerHTML) to prevent XSS.
   *
   * @param role - Message role.
   * @param content - Message content.
   * @returns The message element's ID.
   */
  private appendMessage(role: 'user' | 'assistant', content: string): string {
    const messages = document.getElementById('coach-messages');
    if (!messages) {
      return '';
    }

    const id = generateA11yId('msg');
    const div = document.createElement('div');
    div.id = id;
    div.className = `coach-message coach-${role}`;

    const labelText = role === 'user' ? 'You' : '🏛️ Official Helpdesk';
    const labelP = document.createElement('p');
    labelP.className = `coach-label coach-label--${role}`;
    labelP.textContent = labelText;
    div.appendChild(labelP);

    const contentP = document.createElement('p');
    contentP.className = 'coach-text message-content';
    contentP.textContent = content;
    div.appendChild(contentP);

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;

    return id;
  }

  /**
   * Replace a message's content (used for loading → response transition).
   *
   * @param id - Message element ID.
   * @param content - New content.
   */
  private replaceMessage(id: string, content: string): void {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }

    const p = el.querySelector('.message-content');
    if (p) {
      p.textContent = content;
    }
  }
}
