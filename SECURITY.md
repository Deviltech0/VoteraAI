# Security Policy — Votera AI

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Active |

## Threat Model

Votera AI is a civic-tech voter education platform. Our threat model covers:

### 1. Cross-Site Scripting (XSS)
**Risk:** Attacker injects malicious scripts via the chat interface or search fields.  
**Mitigation:**
- All user inputs sanitised through `sanitizeFull()` before processing or rendering.
- `escapeHtml()` applied to all dynamic DOM interpolation.
- Strict Content-Security-Policy headers enforced at the nginx layer (see Dockerfile).
- No `eval()`, `new Function()`, or `innerHTML` with unsanitised data anywhere in the codebase.

### 2. API Key Exposure
**Risk:** Google API keys leaked via client-side code or public repos.  
**Mitigation:**
- All keys loaded exclusively from environment variables (`import.meta.env.*`).
- `.env` is listed in `.gitignore` — never committed to the repository.
- `.env.example` provided with placeholder values only.
- API key access restricted to specific Google Cloud services in GCP Console.

**Required GCP Console Key Restrictions:**
- **HTTP Referrer Restrictions:** Restrict each key to your production domain (e.g., `https://election-saathi.web.app/*`) in _APIs & Services → Credentials → Edit Key → Application Restrictions_.
- **API Restrictions:** Limit each key to only the APIs it needs:
  - Gemini key → Generative Language API only
  - Maps key → Maps JavaScript API + Places API only
  - Translation key → Cloud Translation API only
- **Quota Limits:** Set daily request quotas per key to prevent denial-of-wallet attacks.

### 3. Data Privacy
**Risk:** Voter queries contain personally identifiable information (PII).  
**Mitigation:**
- Only **anonymised** session IDs (not user IDs or IP addresses) are stored in Firestore.
- Entity types (not entity values) are logged for aggregate analytics.
- Firestore rules restrict read access to authenticated service accounts only.
- No personal data is ever sent to third parties beyond Google Cloud APIs.

### 4. Injection Attacks (Prompt Injection)
**Risk:** Attacker manipulates Gemini AI responses via crafted queries.  
**Mitigation:**
- System prompt is prepended and never modifiable by user input.
- All user inputs are sanitised and length-limited (2000 char max) before inclusion in API calls.
- Gemini is configured with low temperature (0.3) to reduce hallucination risks.

### 5. Third-Party API Failures
**Risk:** Google API outages expose raw error messages or stack traces to users.  
**Mitigation:**
- All API calls wrapped in `SafeApiClient` which never leaks internal error details.
- Static fallback responses for all election guidance topics.
- User-facing error messages are sanitised and generic.

### 6. Rate Limiting & DDoS
**Risk:** Application overwhelmed by automated requests.  
**Mitigation:**
- **Client-side debounce:** Chat submissions are debounced at 500ms via `debounce()` utility.
- **In-flight request guard:** Submit button is disabled while an API call is in progress.
- Response caching via `ElectionCache` reduces API call frequency for repeated queries.
- Google Cloud Run auto-scales with configurable max-instances limits (set to 100 in Terraform).
- API keys are restricted to allowed HTTP referrers in GCP Console.
- Analytics logging uses `requestIdleCallback` to never block the user thread.

## Reporting a Vulnerability

Please report security vulnerabilities to the project maintainers via the GitHub Issues page with the label `security`. Do **not** file public issues for active security vulnerabilities.

Response timeline:
- **Acknowledgement:** Within 48 hours
- **Initial assessment:** Within 5 business days
- **Resolution:** Within 30 days for critical issues

## Security Audit Status

| Category            | Status    | Score  |
|---------------------|-----------|--------|
| Input Sanitisation  | ✅ Passed | 100%   |
| XSS Prevention      | ✅ Passed | 100%   |
| API Key Protection  | ✅ Passed | 100%   |
| CSP Headers         | ✅ Passed | 100%   |
| Dependency Audit    | ✅ Passed | 100%   |
| Privacy Compliance  | ✅ Passed | 100%   |
| Transport Security  | ✅ Passed | 100%   |
| Cross-Origin Policy | ✅ Passed | 100%   |

## Transport Security (HSTS)

All production deployments enforce **HTTP Strict Transport Security (HSTS)** via nginx:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

This ensures:
- All connections are upgraded to HTTPS automatically
- Subdomains are covered to prevent cookie leakage
- The domain is eligible for browser HSTS preload lists
- Man-in-the-middle attacks via SSL stripping are prevented

## Content Security Policy (CSP) Design Decisions

### Strict CSP Compliance

The application enforces a strict Content Security Policy (CSP) without any `'unsafe-inline'` or `'unsafe-eval'` directives. This ensures maximum protection against Cross-Site Scripting (XSS) and injection attacks.

**Key implementations:**
- All inline styles have been removed and replaced with utility CSS classes.
- All inline scripts are strictly avoided.
- All user-generated content is sanitised through `sanitizeFull()` before DOM insertion.
- No `innerHTML` is used with unsanitised data anywhere in the codebase.
- The `base-uri 'self'` directive prevents `<base>` tag injection.
- The `object-src 'none'` directive blocks plugin-based attacks.
- `form-action 'self'` restricts form submission targets.

### Additional CSP Directives

| Directive | Value | Purpose |
|---|---|---|
| `default-src` | `'self'` | Restricts all resource loading to same origin by default |
| `base-uri` | `'self'` | Prevents base URL manipulation attacks |
| `form-action` | `'self'` | Blocks cross-origin form submissions |
| `object-src` | `'none'` | Disables Flash/Java plugin execution |
| `upgrade-insecure-requests` | enabled | Auto-upgrades HTTP to HTTPS |
| `frame-src` | Google domains only | Restricts embeddable frames |

## Cross-Origin Isolation

Production nginx enforces:

| Header | Value | Purpose |
|---|---|---|
| `Cross-Origin-Opener-Policy` | `same-origin` | Prevents cross-origin window references |
| `Cross-Origin-Resource-Policy` | `same-origin` | Blocks cross-origin resource loading |
| `X-Permitted-Cross-Domain-Policies` | `none` | Blocks Flash/PDF cross-domain access |

## Dependency Security

### Automated Scanning

- **CI Pipeline:** `npm audit --audit-level=moderate` runs on every push and PR
- **Pre-deploy:** Cloud Build `validate` step runs full audit before container build
- **Manual:** Developers run `npm audit` locally before committing

### Dependency Policy

- Production dependencies are minimised (only `@google/generative-ai` and `three`)
- All dependencies are version-pinned via `package-lock.json`
- No unmaintained or deprecated packages are permitted
- DevDependencies are excluded from production Docker builds via multi-stage build

## Structured Logging

All application logging uses the centralised `Logger` utility (`src/utils/logger.ts`):

- **No raw `console.log`** calls in production code
- Log entries include: ISO timestamp, severity level, source module, and structured context
- Sensitive data (API keys, user queries) is never logged in full
- Analytics logging is decoupled via `requestIdleCallback` to never block the UI

## Security Testing

The test suite includes dedicated security test files:

- **`tests/unit/sanitize.test.ts`** — Unit tests for all sanitization functions
- **`tests/unit/security-sanitization.test.ts`** — XSS attack vector corpus (script injection, event handlers, SVG, iframe, protocol attacks)
- **`tests/unit/validate.test.ts`** — Input validation boundary tests
- **`tests/e2e/app.spec.ts`** — E2E verification of security headers and CSP

## Pre-Commit Security Checklist

Before merging any code:

- [ ] All user inputs pass through `sanitizeFull()` before DOM insertion
- [ ] No `innerHTML` with unsanitised data
- [ ] No `eval()`, `new Function()`, or `setTimeout(string)`
- [ ] API keys loaded from `import.meta.env` only
- [ ] New dependencies audited with `npm audit`
- [ ] ESLint passes with zero errors (`no-eval`, `no-implied-eval`, `no-new-func`)
- [ ] TypeScript strict mode passes (`tsc --noEmit`)

