# Contributing to Votera AI

Thank you for your interest in contributing to Votera AI! This document provides guidelines and standards for contributing to this project.

## Code of Conduct

All contributors are expected to maintain a respectful and inclusive environment. We are committed to providing a welcoming experience for everyone.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/trialcorp/Votera AI.git
cd Votera AI

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Code Quality Standards

### TypeScript

- **Strict mode** is enforced (`strict: true`, `noImplicitAny: true`)
- All functions must have **explicit return types**
- Use `readonly` for immutable data structures
- Prefer `interface` over `type` for object shapes
- Use **branded types** for domain-specific values (e.g., `JourneyStageId`)

### Linting & Formatting

- ESLint with `typescript-eslint` recommended rules
- Prettier for consistent formatting (see `.prettierrc`)
- Maximum **80 lines per function** (ESLint enforced)
- Maximum **cyclomatic complexity of 15** (ESLint enforced)

```bash
# Run linter
npm run lint

# Run type checker
npm run typecheck

# Run full validation pipeline
npm run validate
```

### Security

- All user input must pass through `sanitizeFull()` before use
- Never use `innerHTML` with user-provided content — use `textContent`
- API keys must only be loaded via environment variables (`import.meta.env`)
- All external HTTP requests must go through `SafeApiClient`
- URL validation must use `isValidUrl()` from `utils/sanitize`

### Accessibility (WCAG 2.2)

- Every interactive element must have an `aria-label` or visible label
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`)
- All images and icons must have `alt` text or `aria-hidden="true"`
- Screen reader announcements via the `announce()` utility
- Respect `prefers-reduced-motion` for all animations
- Maintain **4.5:1 contrast ratio** for all text

### Testing

- All utility functions must have **100% test coverage**
- Tests use **Vitest** with `jsdom` environment
- Test files live in `tests/unit/` and `tests/integration/`
- Mock external APIs — never make real network calls in tests

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test -- --coverage
```

## Pull Request Process

1. **Branch naming**: `feature/description`, `fix/description`, or `refactor/description`
2. **Commit messages**: Use conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
3. **Before submitting**:
   - Run `npm run validate` (must pass with zero errors)
   - Ensure test coverage meets thresholds (90%+ statements, branches, functions, lines)
   - Add/update JSDoc comments for any new public APIs
4. **PR description**: Clearly explain what changes were made and why

## Architecture Overview

```
src/
├── data/          # Static election content (stages, types, FAQ, timeline)
├── services/      # Google Cloud service integrations (Gemini, Maps, Translation, Vertex, Analytics)
├── state/         # Application state management (ElectionStore)
├── scene/         # Three.js 3D visualisation
├── ui/            # DOM-based UI components
├── utils/         # Shared utilities (sanitize, validate, cache, logger, a11y, debounce)
└── types/         # TypeScript type definitions
```

## Google Cloud Services

Votera AI integrates the following Google services:

| Service | Purpose | Env Variable |
|---------|---------|-------------|
| Gemini AI | Conversational election coach | `VITE_GEMINI_API_KEY` |
| Vertex AI | Semantic FAQ search (embeddings) | `VITE_GOOGLE_CLOUD_PROJECT` |
| Cloud Translation | Multi-language support (11+ languages) | `VITE_GOOGLE_TRANSLATION_API_KEY` |
| Google Maps | Polling booth finder | `VITE_GOOGLE_MAPS_API_KEY` |
| Cloud Firestore | Anonymised analytics logging | `VITE_GOOGLE_CLOUD_API_KEY` |
| Cloud NL API | Intent classification | `VITE_GOOGLE_CLOUD_API_KEY` |

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
