# CG FoodTour — Release Readiness Blueprint

> Baseline: `527b849d08ae6cb8b0a3295fb8160691df165c6c`  
> Purpose: implementation-ready plan; no work in this document has been implemented by the audit.  
> Roadmap constraint: **Phase 4 remains Responsive Design**.

## 1. Strategy and critical path

The project should use an evidence-first progression, not buy hosting and immediately call it production:

```text
Track A: supported toolchain + clean MySQL + critical local integration
      ├──────────────┐
      ↓              ↓
Track B: Phase 4     Local security/reliability hardening
      └──────┬───────┘
             ↓
Track C1: isolated HTTPS staging + real providers
             ↓
Track C2: restore rehearsal + full critical E2E + mobile/accessibility
             ↓
Track C3: observability/load/security/UAT and release review
             ↓
                   PUBLIC MVP
             ↓
Track D: scale/architecture/product enhancements
```

Critical path:

1. Enforce/use Java 17 and make every clean gate deterministic.
2. Prove Flyway on clean MySQL and an upgraded/restored representative database.
3. Run real local auth/store lifecycle E2E against Compose/Mailpit.
4. Fix confirmed pre-release social HTTP and security matcher risks.
5. Execute Phase 4 responsive without destabilizing desktop behavior.
6. Provision HTTPS staging and validate OAuth/cookies/proxy/SMTP/Cloudinary.
7. Restore a backup; execute full UAT, load and targeted security tests.
8. Collect signed go/no-go evidence before public release.

Work that can proceed in parallel:

- Phase 4 after the Track A baseline is captured.
- Legal text/policy decisions alongside engineering.
- Hosting/domain/provider selection alongside local hardening, without treating it as deployment approval.
- Error boundary/API timeout work alongside responsive components if characterization tests are established first.

## 2. Global implementation rules

- Preserve current API contracts unless a task explicitly includes a versioned migration.
- Never use production credentials or personal data in tests.
- Keep access tokens out of persistent browser storage and refresh tokens out of JSON.
- Do not enable `baselineOnMigrate` to bypass schema mismatch.
- Do not weaken production validator, TLS, CSRF, CORS, upload, visibility, or state policies to make a test pass.
- Never auto-retry non-idempotent mutations without an idempotency design.
- Separate mocked UI, screenshot, real-service E2E and provider E2E results.
- Record command, commit, environment, skipped tests and artifacts for every gate.
- Deploy one backend instance until distributed state is implemented.

## 3. Track A — Immediate Local Blockers

### A1. Lock the supported toolchain and clean baseline

- **Goal:** eliminate stale artifacts and JDK-dependent ambiguity.
- **Issues:** AUD-TOOL-001, AUD-DOC-001.
- **Files/modules expected:** `backend/pom.xml`, Maven wrapper/toolchain/enforcer config, `README.md`, CI if necessary.
- **Dependencies:** Product Owner decision: Java 17 only, or Java 17/21. Do not claim JDK 24 support without proof.
- **Implementation approach:** enforce Maven runtime JDK range; document exact JDK/Node/Docker versions; use `clean test` everywhere; do not reuse test totals from old `target`.
- **Test requirements:** clean checkout on supported JDK; explicit fail-fast on unsupported JDK; CI parity.
- **Acceptance criteria:** JDK 17 clean build passes; unsupported runtime exits before compile with actionable text; README matches.
- **Rollback:** revert enforcement only together with a documented supported toolchain; never silently accept unknown JDK.
- **Definition of Done:** reproducible clean results recorded in CI and local evidence.

### A2. Prove clean Flyway migration and Hibernate validation

- **Goal:** close the immediate data release gate.
- **Issues:** AUD-DATA-001.
- **Files/modules expected:** tests/Compose/ops evidence; migration files change only if a reproducible schema defect is found and then only through a new versioned migration.
- **Dependencies:** Docker Desktop/MySQL 8.
- **Sequence:** start Docker → run `FlywayMigrationTest` and `FlywayJpaValidationTest` → start rehearsal stack from empty volume → verify readiness/history schema → rerun from a clean volume.
- **Detailed tasks:** capture Flyway history; compare tables/indexes/FKs with entity expectations; test V2 owner history query; verify no Hibernate DDL mutation occurs.
- **Acceptance criteria:** zero skipped migration tests; V1 then V2 applied once; Hibernate validate passes; second startup is idempotent.
- **Verification:** Surefire XML + MySQL schema inventory + health result.
- **Rollback:** destroy only the explicitly named rehearsal volume; never alter current local DB for the clean test.
- **Definition of Done:** clean-schema evidence attached to the release record.

### A3. Rehearse upgrade/baseline on a sanitized local snapshot

- **Goal:** ensure current useful data can move to Flyway safely.
- **Issues:** AUD-DATA-001, AUD-DATA-002.
- **Files/modules expected:** `ops/sql/schema_inventory.sql`, runbook/evidence; a new Flyway migration only after reviewed diff.
- **Dependencies:** sanitized copy of the current DB and explicit approval before any baseline marker.
- **Sequence:** dump → restore isolated → inventory restored schema and clean V1/V2 schema → review diff → decide transform/baseline → apply → validate → app smoke → discard isolated copy.
- **Acceptance criteria:** no data loss in sampled counts/relations; owner history/backfill correct; rollback/forward-fix plan documented.
- **Verification:** row counts, constraints, Flyway history and critical API reads.
- **Rollback:** restore the isolated snapshot; never experiment on the source database.
- **Definition of Done:** human-approved migration report for the actual starting schema.

### A4. Run critical real-service local E2E

- **Goal:** distinguish integration truth from mocks.
- **Issues:** AUD-QA-001, AUD-QA-002.
- **Files/modules expected:** Compose/test fixtures/CI workflow; application behavior changes only for reproduced defects.
- **Dependencies:** A2; rehearsal-only admin credentials and Mailpit.
- **Sequence:** boot Compose → launch smoke → auth session → store lifecycle → owner history → user role/account-state/session revocation → concurrent rating/save.
- **Test requirements:** registration→email→verify→login→refresh rotation→logout; password change revokes other session; create/edit/upload/approve/deep-link; reject/hide/recover/audit; admin authorization.
- **Acceptance criteria:** no critical spec skipped; database assertions use MySQL; Cloudinary uses an isolated safe adapter/provider; traces contain no secrets.
- **Verification:** Playwright report, server logs with correlation IDs, DB assertions.
- **Rollback:** dispose rehearsal data/volume only by explicit Compose project name.
- **Definition of Done:** current commit has a repeatable local integration report.

### A5. Harden social outbound calls

- **Goal:** bound provider failures and prevent credential leakage.
- **Issues:** AUD-SEC-001, AUD-SEC-002, AUD-API-001.
- **Files/modules expected:** `AuthenticationService`, provider HTTP configuration/client, social DTOs and tests.
- **Dependencies:** verify Facebook's current official transport contract before implementation.
- **Sequence:** characterize existing behavior → inject client with deadlines → move credentials away from loggable URL where supported → redact all failures → reuse/cached Google decoder → add `@NotBlank` → regression tests.
- **Acceptance criteria:** connect/read/overall timeout; no token/secret in URL logs/exceptions; invalid blank token is 400 with standard envelope; valid mock/provider contract unchanged.
- **Verification:** delayed/failing local stub, captured logs, auth unit/integration tests.
- **Rollback:** retain old provider behavior behind no production flag only if provider incompatibility is discovered; never roll back redaction.
- **Definition of Done:** abuse/timeout/log tests pass.

### A6. Narrow public routes and strengthen authorization tests

- **Goal:** remove fragile reliance on annotations under broad matchers.
- **Issues:** AUD-SEC-003.
- **Files/modules expected:** `SecurityConfig`, MVC/security tests.
- **Dependencies:** complete route inventory.
- **Implementation approach:** enumerate public store GET paths; explicitly protect mine/history/admin/parse before public paths; build anonymous/user/admin matrix.
- **Acceptance criteria:** public discovery remains 200; protected routes deny anonymous and wrong role; no handler depends solely on frontend hiding.
- **Verification:** MockMvc integration with real filter chain and method security.
- **Rollback:** route matcher change can be reverted only if tests prove equivalent protection.
- **Definition of Done:** every backend mapping has an explicit access classification.

### A7. Frontend failure recovery and request deadlines

- **Goal:** avoid blank screens and indefinite loading before Phase 4 multiplies UI states.
- **Issues:** AUD-FE-001, AUD-FE-002.
- **Files/modules expected:** root entry/App shell, new error boundary, API client module, focused tests.
- **Dependencies:** capture current API/session behavior first.
- **Sequence:** add root boundary → extract transport without changing endpoints → add safe deadlines/cancellation → migrate one domain at a time → remove duplicate wrapper only after parity.
- **Acceptance criteria:** render failures show Vietnamese recovery UI; request hangs terminate; navigation aborts obsolete reads; token refresh remains single-flight; mutations are not duplicated.
- **Verification:** component tests, mocked slow network Playwright, session regression suite.
- **Rollback:** module-by-module; keep current wrapper until each caller is proven.
- **Definition of Done:** failure behavior is deterministic and observable.

## 4. Track B — Phase 4 Responsive

### B1. Establish responsive baseline

- **Goal:** preserve accepted desktop Phase 3 while measuring real responsive defects.
- **Issues:** AUD-PH4-001.
- **Files/modules expected:** frontend pages/layouts/styles/tests only after audit evidence.
- **Dependencies:** A1, A4 baseline; use existing Phase 4/frontend audit blueprint.
- **Tasks:** capture 320×568, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1280×800 and desktop controls; test intermediate widths.
- **Acceptance criteria:** defects have reproduction/screenshots before fixes; no blanket redesign.
- **Verification:** visual diffs and DOM overflow/focus assertions.
- **Definition of Done:** signed responsive issue list.

### B2. Critical consumer flows

- **Goal:** make discovery/auth/detail/saved/profile usable by touch and keyboard.
- **Scope:** header/bottom nav, AuthModal, Explore, StoreCard, StoreDetailDrawer, Saved, Profile.
- **Tasks:** prevent overflow; 44px targets; modal→sheet where appropriate; sticky controls do not cover content; GPS/error states; virtual keyboard; focus restore/trap; 200% zoom.
- **Acceptance criteria:** no horizontal scroll; full keyboard completion; readable at zoom; no content hidden behind fixed navigation.
- **Verification:** Playwright viewport matrix + manual iOS Safari/Android Chrome + keyboard.
- **Regression risks:** deep-link history, social SDK callbacks, map sizing.

### B3. Owner flows

- **Goal:** make create/edit/menu/history safe on mobile.
- **Scope:** `MyStoresSection`, dishes, history components, image previews, map picker.
- **Tasks:** step/section reflow; keep primary action reachable; cancel must not upload; table/timeline adaptation; reason/status readability; upload progress/error.
- **Acceptance criteria:** one-hand form completion; no data loss on back/cancel; history filters/pagination usable at 320px.
- **Verification:** real-service lifecycle plus mobile visual assertions.
- **Regression risks:** staged image state and status transitions.

### B4. Admin flows

- **Goal:** preserve moderation capability on tablet/mobile without compressing desktop tables.
- **Scope:** Admin dashboard/users/stores/categories, action dialogs.
- **Tasks:** tables become cards or controlled horizontal regions; action priority; typed confirmations; reason modal; pagination/filter drawer; last-admin feedback.
- **Acceptance criteria:** every destructive action retains context/confirmation; role/status labels not clipped; no accidental adjacent action taps.
- **Verification:** admin role E2E at target viewports.
- **Regression risks:** pagination/search race and stale row actions.

### B5. Accessibility closeout

- **Goal:** WCAG 2.2 AA for applicable core journeys.
- **Tasks:** semantic landmarks/headings, labels/descriptions, focus visibility/order, live error/status announcements, dialog names/traps, reduced motion, contrast, touch target, screen-reader smoke.
- **Acceptance criteria:** no serious automated violations; complete critical flows keyboard-only; documented manual screen-reader result.
- **Verification:** axe plus manual NVDA/VoiceOver or equivalent, zoom and reduced motion.
- **Definition of Done for Track B:** responsive acceptance matrix passes without desktop regression; Phase 4 is signed off separately.

## 5. Track C — Pre-Production Readiness

### C1. Provision isolated HTTPS staging

- **Goal:** reproduce production topology without production data.
- **Issues:** AUD-INFRA-001, AUD-REL-001.
- **Required components:** domain/subdomain, DNS, TLS, one backend instance, Nginx, MySQL 8 with TLS/private access, secret store/injection, SMTP sandbox/provider, Cloudinary staging folder/account, log/metric collector.
- **Acceptance criteria:** production profile starts only with explicit values; readiness is UP; HTTP redirects to HTTPS; no localhost/placeholder; Swagger disabled; health details hidden.
- **Verification:** config validator, TLS scan, headers/CSP, origin/CORS tests.
- **Rollback:** immutable previous images; database forward-fix policy; no destructive automatic down migration.

### C2. Provider and session validation

- **Goal:** close authentication environment gaps.
- **Tasks:** register/verify/login/refresh/logout; Google and Facebook; password change/reset revokes another browser; disabled/reenabled accounts; cookies across Chrome/WebKit/mobile; trusted proxy/IP quota tests.
- **Acceptance criteria:** refresh never appears in JSON/JS; old refresh reuse denied; CSRF/origin attacks denied; social-disabled user not reenabled; pending unverified account may activate by verified social per policy.
- **Verification:** browser/network traces with redaction and provider console evidence.

### C3. External services and email durability

- **Goal:** verify SMTP and media behavior under success/failure.
- **Issues:** AUD-REL-006.
- **Tasks:** SPF/DKIM/DMARC; deliverability; template mobile clients; SMTP timeout/retry/alert; Cloudinary upload/cancel/replace/delete/retry/dead task; quota failure.
- **Acceptance criteria:** critical email API reports failure truthfully; best-effort failures alert; orphan media is eventually removed or visible in dead queue.
- **Verification:** provider dashboards, metrics and controlled outage tests.

### C4. Backup/restore and migration deployment rehearsal

- **Goal:** prove recoverability rather than merely create dumps.
- **Tasks:** off-host encrypted backup/checksum; isolated restore; Flyway validate; application startup; row and relationship checks; measured RPO/RTO.
- **Acceptance criteria:** one successful restore from a recent backup; documented duration/data age; credentials and dumps excluded from Git.
- **Verification:** signed restore record.

### C5. Observability and incident response

- **Goal:** detect user-impacting failure.
- **Tasks:** scrape Prometheus; dashboards for 5xx/latency/Hikari/email/media/SSE/JVM/disk; structured log retention; request ID propagation; uptime and backup alerts; incident contacts.
- **Acceptance criteria:** synthetic failure triggers alert; on-call can correlate request ID; logs contain no secrets/PII beyond approved fields.
- **Verification:** alert drill and incident-runbook exercise.

### C6. Performance and security validation

- **Goal:** establish an MVP operating envelope.
- **Issues:** AUD-PERF-001, AUD-QA-002.
- **Tasks:** representative store/menu/user dataset; list/facet/explore load; concurrent rating/save; login/maps rate limits; upload size; targeted OWASP authorization/input tests; dependency scans for both stacks.
- **Acceptance criteria:** agreed p95/error/CPU/memory budgets; counters exact; no cross-role data; no high/critical dependency issue accepted without disposition.
- **Verification:** repeatable scripts/results linked to commit and staging version.

### C7. Legal/trust and public UAT

- **Goal:** close product trust requirements.
- **Issues:** AUD-PRODUCT-001.
- **Tasks:** approved Privacy/Terms/support/deletion policy; owner/admin moderation wording; consent/analytics policy if analytics is added; full Product Owner UAT.
- **Acceptance criteria:** public links are visible and versioned; deletion/request flow documented/tested; all release blockers have owner/evidence.
- **Verification:** Product Owner/legal sign-off and UAT checklist.

### Track C Definition of Done

- No BLOCKER open.
- Phase 4 accepted.
- Clean and upgraded migrations pass.
- Critical E2E passes on HTTPS staging with no required skip.
- OAuth/email/upload/backup/alerts verified.
- Security/load findings have no unresolved critical/high release risk.
- Rollback and incident exercises completed.

## 6. Track D — Post-MVP Improvements

### D1. Database-native discovery at scale

- **Issues:** AUD-PERF-001.
- Move category/open/radius/distance/sort/facets into bounded MySQL queries; use bounding box/spatial function and measured indexes.
- Can be deferred only if initial catalog is capped/monitored and latency remains within budget.

### D2. Distributed state and horizontal scaling

- Move rate limits/cache to Redis or equivalent; SSE notification fan-out through pub/sub/message broker; then test multiple replicas.
- Until complete, keep one backend instance.

### D3. Transactional email outbox

- **Issues:** AUD-REL-006.
- Durable outbox, idempotent sender, retry/dead-letter, operator replay and retention.

### D4. Frontend architecture extraction

- **Issues:** AUD-ARCH-001.
- Incrementally extract session/auth provider, API transport, route shell and domain hooks; split owner/admin views after characterization tests.

### D5. Product growth

- Decide whether textual reviews/comments are in product scope.
- Server-render/prerender metadata, dynamic sitemap and social previews for stores.
- Privacy-respecting analytics for registration, view, save, directions, rating and drop-off.
- Content quality/seeding and moderation operations.

## 7. Suggested execution order

| Order | Work item | Why now | Environment |
|---:|---|---|---|
| 1 | A1 toolchain | Makes all later evidence trustworthy | Local/CI |
| 2 | A2 clean MySQL migration | Highest local release blocker | Local Docker |
| 3 | A3 snapshot upgrade | Protects existing data | Isolated local DB |
| 4 | A4 real local E2E/concurrency | Finds contract/transaction defects before UI changes | Local Docker |
| 5 | A5/A6 security hardening | Public attack surface; independent of hosting | Local |
| 6 | A7 failure recovery | Stabilizes user feedback before responsive work | Local |
| 7 | Track B Phase 4 | Roadmap-preserved responsive implementation | Local/devices |
| 8 | C1 staging | Enables environment-specific proof | Staging |
| 9 | C2–C6 | Close provider, durability, performance, security gaps | Staging |
| 10 | C7/go-no-go | Human/product approval | Staging/review |

## 8. Release test strategy

### Required suites

- Backend unit/service/security tests on Java 17.
- MySQL Testcontainers migration/JPA validation with zero skips.
- Frontend lint, complete unit/contract suite, production build and artifact scan.
- Real-service Playwright smoke/auth/store lifecycle/RBAC; mocked visual tests reported separately.
- Concurrency tests for rating/save/delete interactions.
- OAuth/SMTP/Cloudinary staging tests.
- Responsive/accessibility browser/device matrix.
- Backup restore and incident/alert drills.
- Targeted dependency and dynamic security checks.

### Release evidence template

For each gate record:

- Git commit and image digest.
- Date/time, environment and database version.
- Exact command/test suite.
- Pass/fail/skip count and artifact link.
- Sanitized correlation IDs for failures.
- Owner and expiry for any accepted risk.

## 9. Final public-release Definition of Done

- [ ] All BLOCKER issues closed with evidence.
- [ ] No unresolved CRITICAL security/data finding.
- [ ] All accepted HIGH risks have Product Owner owner/date/mitigation.
- [ ] Java 17 clean backend and frontend gates pass.
- [ ] MySQL clean + upgrade + restore paths pass.
- [ ] Critical real E2E passes on HTTPS staging without required skips.
- [ ] Phase 4 responsive and accessibility gates accepted.
- [ ] OAuth, SMTP, Cloudinary, cookies, CORS and proxy trust verified.
- [ ] Backup restore, monitoring and incident response exercised.
- [ ] Privacy/Terms/support/deletion policy approved and accessible.
- [ ] One-backend-instance constraint encoded in deployment.
- [ ] Immutable rollback identifiers recorded.
- [ ] Product Owner signs the final go/no-go record.

## 10. Explicit non-goals

- No microservice rewrite.
- No Kubernetes or multiple backend replicas for MVP.
- No automatic Flyway baseline or destructive down migration.
- No replacement of the accepted desktop visual language without a proven regression.
- No mandatory textual review feature unless Product Owner chooses it.
- No production launch directly from local without staging validation.
