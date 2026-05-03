/**
 * Coach UI Builder — Utility for constructing complex Coach DOM elements.
 *
 * Extracted from ElectionCoachPanel.ts to keep components modular
 * and maintain file size under 200 lines for maximum code quality.
 *
 * @module ui/CoachUIBuilder
 */

import { COACH_CONTENT } from '../data/ui-content';

/**
 * Static utility class for building Coach UI elements.
 */
export class CoachUIBuilder {
  /**
   * Create a message element with label and text.
   *
   * @param role - Message role (user or assistant).
   * @param labelText - Text for the label (e.g. 'You' or 'Helpdesk').
   * @param content - Message body text.
   * @param id - Unique element ID.
   * @returns The constructed message container element.
   */
  static createMessageElement(
    role: 'user' | 'assistant',
    labelText: string,
    content: string,
    id: string,
  ): HTMLDivElement {
    const div = document.createElement('div');
    div.id = id;
    div.className = `coach-message coach-${role}`;

    const labelP = document.createElement('p');
    labelP.className = `coach-label coach-label--${role}`;
    labelP.textContent = labelText;
    div.appendChild(labelP);

    const contentP = document.createElement('p');
    contentP.className = 'coach-text message-content';
    contentP.textContent = content;
    div.appendChild(contentP);

    return div;
  }

  /**
   * Create a suggestion button.
   *
   * @param label - Button text.
   * @param query - Query to send when clicked.
   * @returns The constructed button element.
   */
  static createSuggestionButton(label: string, query: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary coach-suggestion';
    btn.setAttribute('data-query', query);
    btn.textContent = label;
    return btn;
  }

  /**
   * Create the chat input form.
   *
   * @param id - Form ID.
   * @returns The constructed form element.
   */
  static createInputForm(id: string): HTMLFormElement {
    const form = document.createElement('form');
    form.id = id;
    form.setAttribute('role', 'search');
    form.setAttribute('aria-label', 'Ask the Election Coach a question');

    const formRow = document.createElement('div');
    formRow.className = 'coach-form-row';

    const input = document.createElement('input');
    input.id = 'coach-input';
    input.type = 'text';
    input.placeholder = COACH_CONTENT.inputPlaceholder;
    input.autocomplete = 'off';
    input.maxLength = 2000;
    input.className = 'coach-input';
    formRow.appendChild(input);

    const sendBtn = document.createElement('button');
    sendBtn.type = 'submit';
    sendBtn.className = 'btn btn-primary';
    sendBtn.id = 'coach-send';
    sendBtn.setAttribute('aria-label', 'Send question to Election Coach');
    sendBtn.textContent = COACH_CONTENT.sendButton;
    formRow.appendChild(sendBtn);

    form.appendChild(formRow);
    return form;
  }
}
