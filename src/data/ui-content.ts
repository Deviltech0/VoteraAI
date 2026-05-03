/**
 * UI Content — Centralised string literals for the Votera AI interface.
 *
 * Moving strings out of component logic improves maintainability,
 * enables easier internationalisation, and follows professional
 * coding standards for large-scale applications.
 *
 * @module data/ui-content
 */

export const COACH_CONTENT = {
  welcomeMessage: "Namaste! I'm your Election Assistant. Ask me anything about Indian elections — eligibility, registration, EVMs, polling booths, or any election type. How can I help you today?",
  officialLabel: '🏛️ Official Helpdesk',
  youLabel: 'You',
  inputPlaceholder: 'Ask about Indian elections…',
  sendButton: 'Send',
  thinkingMessage: '🤔 Thinking about your question...',
  statusLine: 'Powered by Google Gemini AI',
  limitedModeNote: ' (limited mode)',
  cooldownMessage: 'Please wait — your previous question is still being processed.',
} as const;

export const JOURNEY_CONTENT = {
  sectionLabel: 'Interactive Guide',
  heading: 'Your Election Journey',
  description: 'Navigate through every step of the Indian election process — from checking your eligibility to casting your vote and tracking results.',
} as const;

export const ELECTION_TYPES_CONTENT = {
  sectionLabel: 'Democracy at Every Level',
  heading: 'Types of Indian Elections',
  description: 'India conducts elections at every level of governance. Learn about each type below.',
} as const;

export const TIMELINE_CONTENT = {
  sectionLabel: 'Key Dates & Deadlines',
  heading: 'Election Timeline',
  description: 'Important deadlines and dates for upcoming elections, registration cutoffs, and voting days.',
} as const;
