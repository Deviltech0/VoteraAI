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
import { StatusFeedback } from '../utils/status-feedback';
import { CoachUIBuilder } from './CoachUIBuilder';
import { COACH_CONTENT } from '../data/ui-content';

/** Minimum interval between chat submissions (ms). */
const SUBMIT_DEBOUNCE_MS = 500;

/**
 * The Election Coach chat panel.
 *
 * Renders a floating panel with message history, input field,
 * and suggested quick-action buttons for common election questions.
 */
export class ElectionCoachPanel {
  /** The root container element. */
  private container: HTMLElement;
  
  /** The Gemini-powered reasoning service. */
  private coach: ElectionCoachService;

  /** Tracks whether a request is currently in flight. */
  private isProcessing = false;

  /** Timestamp of last submission for debounce. */
  private lastSubmitTime = 0;

  /**
   * Initialize the Coach Panel and render the initial UI.
   *
   * @throws Error if the #coach-panel element is missing.
   */
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
   */
  private render(): void {
    this.container.textContent = '';

    const chatCard = document.createElement('div');
    chatCard.id = 'coach-chat';
    chatCard.className = 'card';

    chatCard.appendChild(this.renderMessageArea());
    chatCard.appendChild(this.renderSuggestions());
    chatCard.appendChild(CoachUIBuilder.createInputForm('coach-form'));
    chatCard.appendChild(this.renderStatusLine());

    this.container.appendChild(chatCard);
    this.setupEventListeners();
  }

  /**
   * Create the scrollable message log area.
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

    const welcomeMsg = CoachUIBuilder.createMessageElement(
      'assistant',
      COACH_CONTENT.officialLabel,
      COACH_CONTENT.welcomeMessage,
      generateA11yId('welcome')
    );
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
    ];

    for (const { label, query } of suggestions) {
      suggestionsDiv.appendChild(CoachUIBuilder.createSuggestionButton(label, query));
    }

    return suggestionsDiv;
  }

  /**
   * Create the status line showing Gemini configuration state.
   *
   * @returns The status paragraph element.
   */
  private renderStatusLine(): HTMLParagraphElement {
    const statusText = document.createElement('p');
    statusText.className = 'coach-status';
    statusText.textContent = `${COACH_CONTENT.statusLine}${this.coach.isConfigured() ? '' : COACH_CONTENT.limitedModeNote}`;

    if (!this.coach.isConfigured()) {
      statusText.addEventListener('click', () => StatusFeedback.showConfigWarning('Google Gemini AI'));
    }

    return statusText;
  }

  /**
   * Set up form submission and suggestion click handlers.
   */
  private setupEventListeners(): void {
    const form = document.getElementById('coach-form') as HTMLFormElement;
    const input = document.getElementById('coach-input') as HTMLInputElement;

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - this.lastSubmitTime < SUBMIT_DEBOUNCE_MS || this.isProcessing) {return;}

      const query = input.value.trim();
      if (query) {
        this.lastSubmitTime = now;
        void this.handleQuery(query);
        input.value = '';
      }
    });

    this.container.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.coach-suggestion');
      if (btn) {
        const now = Date.now();
        if (now - this.lastSubmitTime < SUBMIT_DEBOUNCE_MS || this.isProcessing) {return;}

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

    this.isProcessing = true;
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = '⏳';
    }

    try {
      this.appendMessage('user', sanitised);
      const loadingId = this.appendMessage('assistant', COACH_CONTENT.thinkingMessage);
      const response = await this.coach.chat(sanitised);
      this.replaceMessage(loadingId, response.content);
      announce(`Election Coach: ${response.content.slice(0, 100)}`);
    } finally {
      this.isProcessing = false;
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = COACH_CONTENT.sendButton;
      }
    }
  }

  /**
   * Append a message to the chat log.
   *
   * @param role - Message role.
   * @param content - Message content.
   * @returns The message element's ID.
   */
  private appendMessage(role: 'user' | 'assistant', content: string): string {
    const messages = document.getElementById('coach-messages');
    if (!messages) {return '';}

    const id = generateA11yId('msg');
    const label = role === 'user' ? COACH_CONTENT.youLabel : COACH_CONTENT.officialLabel;
    const el = CoachUIBuilder.createMessageElement(role, label, content, id);

    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return id;
  }

  /**
   * Replace a message's content.
   *
   * @param id - Message element ID.
   * @param content - New content.
   */
  private replaceMessage(id: string, content: string): void {
    const p = document.getElementById(id)?.querySelector('.message-content');
    if (p) {p.textContent = content;}
  }
}
