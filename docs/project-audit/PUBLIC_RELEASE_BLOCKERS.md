# CG FoodTour — Public Release Blockers

> Baseline: `527b849d08ae6cb8b0a3295fb8160691df165c6c`  
> Verdict: **NOT READY FOR PUBLIC RELEASE**  
> Severity and release impact are independent. A missing proof can block release without being a confirmed vulnerability.

## 1. Release decision summary

### Confirmed software blockers

No source defect was confirmed at CRITICAL severity. One release-blocking data gate is confirmed open: MySQL migration/upgrade validation did not run. The application must not be called public-ready until that evidence exists.

### Confirmed infrastructure blockers

- No confirmed production/staging domain, TLS termination, secret injection, MySQL host, SMTP provider, backup target, monitoring collector, or alert channel.
- Repository runbooks/configuration exist, but availability and execution were not demonstrated.
- Initial deployment must run exactly one backend replica because rate limits, SSE, and caches are process-local.

### Quality blockers

- Actual Playwright E2E is not a CI gate and was not run in this audit.
- OAuth, secure cookies, real email, upload provider, reverse-proxy client IP, restore, load, and dynamic security remain unverified.
- Responsive/mobile validation remains Phase 4.

## 2. Prioritized issue registry

### AUD-DATA-001 — MySQL migration and existing-database upgrade path are unproven

- **Affected module:** Database/Flyway/deployment.
- **Location:** `backend/src/main/resources/db/migration/V1__baseline_schema.sql:1`, `V2__owner_store_history.sql:1`, `backend/src/test/java/com/cangiuoc/cgfoodtour/migration/FlywayMigrationTest.java:16`, `FlywayJpaValidationTest.java:11`, `ops/BACKUP_RESTORE_RUNBOOK.md:32`.
- **Evidence:** both Testcontainers cases were skipped during clean tests because Docker was unavailable. Development explicitly disables Flyway; current local data may predate V1.
- **Reproduction:** stop Docker, run backend `mvn clean test`, inspect Surefire: 2 skipped migration tests. Compare dev/prod Flyway settings.
- **Root cause:** migration tests are conditional on Docker and no restored real snapshot was supplied.
- **Severity:** HIGH.
- **Release impact:** **BLOCKER**.
- **Confidence:** High.
- **Business consequence:** a first deployment or upgrade can fail startup, reject schema validation, or encounter incompatible real data.
- **Recommended fix:** run clean V1→V2 MySQL migration; run Hibernate validate; restore a sanitized current snapshot, inventory/diff it, apply reviewed baseline/upgrade, then rerun; document rollback/forward-fix decision.
- **Complexity:** M.
- **Dependencies:** Docker/MySQL 8; sanitized snapshot for legacy upgrade proof.
- **Verification:** both Testcontainers tests pass; row/index/FK inventory diff approved; restored application reaches readiness; owner history works.
- **Current status:** PARTIALLY RESOLVED (Track A2: Clean Flyway V1→V2 migration & Hibernate schema validation verified 100% PASS on isolated MySQL 8.4 via Testcontainers; existing database snapshot upgrade/baseline remains OPEN for Track A3).

### AUD-QA-001 — Real browser E2E is not executed by CI or this audit

- **Affected module:** Whole product integration.
- **Location:** `.github/workflows/ci.yml:55`, `frontend/e2e/auth-session.spec.js:1`, `store-lifecycle.spec.js:1`, `launch-smoke.spec.js:1`.
- **Evidence:** CI runs `npx playwright test --list`; current discovery found 1,148 cases but no browser case was executed. Auth/store specs skip without Mailpit/admin variables.
- **Reproduction:** inspect workflow; run Playwright listing; observe discovery succeeds without a server.
- **Root cause:** browser runtime/services/fixtures are not provisioned in CI.
- **Severity:** HIGH.
- **Release impact:** **BLOCKER**.
- **Confidence:** High.
- **Business consequence:** UI/API/cookie/provider regressions can pass CI and reach users.
- **Recommended fix:** add a rehearsal/staging E2E job that boots the stack, seeds isolated data, runs smoke/auth/store lifecycle and a critical RBAC matrix; keep screenshot-only specs separate.
- **Complexity:** L.
- **Dependencies:** AUD-DATA-001; Docker rehearsal; later HTTPS staging for provider/cookie cases.
- **Verification:** CI publishes traces/reports and fails on actual critical-flow failures; skipped critical cases are treated as failure in release workflow.
- **Current status:** OPEN.

### AUD-INFRA-001 — HTTPS production topology and mandatory services do not yet exist as verified infrastructure

- **Affected module:** Deployment/platform.
- **Location:** `backend/src/main/resources/application-prod.yaml:1`, `frontend/nginx.conf`, `ops/DEPLOYMENT_RUNBOOK.md:1`.
- **Evidence:** repository contains production contracts/runbooks but no confirmed domain, TLS certificate, deployed database, secret store, SMTP, backup store, or alert destination. Product context explicitly remains local.
- **Reproduction:** not applicable; this is an environment inventory gap.
- **Root cause:** production hosting has not been provisioned.
- **Severity:** HIGH.
- **Release impact:** **BLOCKER**.
- **Confidence:** High.
- **Business consequence:** Secure cookies/OAuth origins/TLS/data durability cannot operate or be validated as public production.
- **Recommended fix:** provision isolated staging first, then production; inject secrets; terminate HTTPS; private/TLS MySQL; persistent/off-host backups; SMTP/OAuth/Cloudinary credentials; DNS and monitoring.
- **Complexity:** XL.
- **Dependencies:** provider accounts, domain, hosting decision.
- **Verification:** production validator passes; TLS and DNS checks pass; runbooks executed; no localhost/fallback; smoke tests and observability active.
- **Current status:** BLOCKED BY INFRASTRUCTURE DECISION.

### AUD-REL-001 — OAuth, secure-cookie and reverse-proxy behavior is not verified on a real HTTPS origin

- **Affected module:** Authentication/deployment.
- **Location:** `frontend/index.html` social SDK tags; `frontend/src/App.jsx:659`, `1226`, `1250`; `AuthCookieService`; `ClientIpResolver`; `application-prod.yaml`.
- **Evidence:** code/config tests exist, but no authorized real domain/provider/browser execution occurred. Rehearsal profile is HTTP and explicitly cannot prove these behaviors.
- **Reproduction:** requires staging; currently unavailable.
- **Root cause:** provider redirect/origin and cookie security depend on final HTTPS host/proxy.
- **Severity:** HIGH.
- **Release impact:** **BLOCKER**.
- **Confidence:** High that evidence is missing; vulnerability status NOT VERIFIED.
- **Business consequence:** users may be unable to log in, refresh, or log out; incorrect proxy trust can collapse rate limits or spoof client IP.
- **Recommended fix:** test Google/Facebook on authorized staging origins; inspect `Secure`, `HttpOnly`, `SameSite`, rotation and CSRF; test trusted/untrusted forwarded headers through the actual proxy.
- **Complexity:** M.
- **Dependencies:** AUD-INFRA-001.
- **Verification:** provider matrix plus cookie/network traces on Chrome, Safari/WebKit and mobile; spoofed forwarding header is ignored from untrusted peer.
- **Current status:** NOT VERIFIED.

### AUD-SEC-001 — Social-provider outbound HTTP clients lack an explicit shared timeout boundary

- **Affected module:** Backend authentication.
- **Location:** `backend/src/main/java/com/cangiuoc/cgfoodtour/service/AuthenticationService.java:423-425`, `518-534`, `664-670`.
- **Evidence:** Google decoder and Facebook `RestTemplate` are constructed in the request method; Facebook calls do not set connect/read timeouts. Social rate limiting is per process/IP, not a substitute for network deadlines.
- **Reproduction:** point provider traffic at a connection that stalls in an isolated test and observe request-thread duration; not dynamically executed here.
- **Root cause:** no injected, configured provider client abstraction.
- **Severity:** HIGH (availability risk).
- **Release impact:** **PRE-RELEASE**; becomes BLOCKER if dynamic timeout test confirms unbounded hang.
- **Confidence:** Medium-high; code path is clear, default network behavior needs runtime measurement.
- **Business consequence:** provider degradation or distributed abuse can exhaust request threads.
- **Recommended fix:** inject one configured HTTP client/decoder with strict connect/read/overall deadlines, bounded response size, metrics, and safe exception mapping; reuse Google JWK cache/client.
- **Complexity:** M.
- **Dependencies:** none; fully local with stub server.
- **Verification:** provider stub delays beyond thresholds; requests fail within budget, no token in logs, thread pool recovers.
- **Current status:** OPEN, local-fixable.

### AUD-SEC-002 — Facebook access/app tokens are placed in URL query strings

- **Affected module:** Backend Facebook login.
- **Location:** `AuthenticationService.java:524-534`, `664-670`.
- **Evidence:** profile URL appends user access token and app secret proof; debug URL appends input token and `appId|appSecret`. Exception messages are logged in one path.
- **Reproduction:** statically inspect constructed URIs; exercise a failing stub and inspect sanitized logs.
- **Root cause:** provider call uses URL concatenation/query parameters rather than a safer credential transport/client boundary.
- **Severity:** HIGH.
- **Release impact:** **PRE-RELEASE**.
- **Confidence:** High for URL construction; actual log leakage depends on client/proxy.
- **Business consequence:** credentials can be exposed in diagnostic URLs, proxy access logs, traces, or exception messages.
- **Recommended fix:** use Facebook-supported authorization header/body mechanisms where possible; never log full URI/exception containing it; central redaction tests; treat app secret as non-loggable.
- **Complexity:** M.
- **Dependencies:** provider API contract validation.
- **Verification:** failing integration stub and log capture contain neither token nor app secret; provider login still succeeds.
- **Current status:** OPEN.

### AUD-SEC-003 — Broad public store GET matcher relies on every sensitive handler retaining method security

- **Affected module:** Backend security configuration.
- **Location:** `SecurityConfig.java:28-31`, `StoreController.java:149-192`.
- **Evidence:** `/v1/stores/**` is request-level public; `/mine`, `/mine/history`, `/mine/{id}`, `/admin`, and `/parse-gmaps` are protected by method annotations (parse matcher is explicitly ordered first). Current code is protected, but future omission would silently expose a new GET.
- **Reproduction:** inspect matcher order and controller annotations.
- **Root cause:** public and protected endpoints share an overly broad ant pattern.
- **Severity:** MEDIUM.
- **Release impact:** **PRE-RELEASE**.
- **Confidence:** High.
- **Business consequence:** future maintenance can create BOLA/data disclosure despite a seemingly secure controller suite.
- **Recommended fix:** explicitly enumerate public GET patterns, place protected patterns first, and add HTTP security tests for anonymous/user/admin across every non-public GET.
- **Complexity:** S.
- **Dependencies:** none.
- **Verification:** anonymous requests to mine/history/admin/parse return 401/403; public list/detail/facets/ranking remain accessible.
- **Current status:** RISK, not a confirmed current bypass.

### AUD-PERF-001 — Public search/filter/facets materialize all approved stores before pagination

- **Affected module:** Store discovery backend.
- **Location:** `StoreService.java:118-176`, `190-206`; `StoreRepository.java:22-33`.
- **Evidence:** `searchPublic(..., Pageable.unpaged())`, followed by Java filtering, sorting and sub-list pagination; facets repeat the unpaged query.
- **Reproduction:** seed a large approved-store set, call list/facets and observe heap/query/latency growth with total rows rather than page size.
- **Root cause:** open-now/distance/multi-category behavior was moved to backend logic but not pushed into bounded SQL/spatial queries.
- **Severity:** MEDIUM now, HIGH at scale.
- **Release impact:** **PRE-RELEASE** for open public launch; deferable only for a controlled small-data beta with monitoring/row cap.
- **Confidence:** High.
- **Business consequence:** slow pages, memory pressure, DB load and easy resource exhaustion.
- **Recommended fix:** SQL predicates for categories/open state, bounding box then `ST_Distance_Sphere` (or verified equivalent), database sort/page, aggregate facet query, proper indexes; preserve response contract.
- **Complexity:** L.
- **Dependencies:** MySQL integration tests and representative dataset.
- **Verification:** explain plans/index usage, bounded query count, correct nearest results, load budget at agreed store count.
- **Current status:** OPEN.

### AUD-FE-001 — SPA has no root error boundary

- **Affected module:** Frontend application shell.
- **Location:** `frontend/src/main.jsx`, `frontend/src/App.jsx`; repository search found no `ErrorBoundary`, `componentDidCatch`, or `getDerivedStateFromError`.
- **Evidence:** no root recovery component exists.
- **Reproduction:** throw from a child render in a test build; React tree is not replaced by a product recovery screen.
- **Root cause:** async error states exist, but render exception handling was not added.
- **Severity:** MEDIUM.
- **Release impact:** **PRE-RELEASE**.
- **Confidence:** High.
- **Business consequence:** an isolated unexpected render error can leave a blank or unusable application.
- **Recommended fix:** root boundary with Vietnamese recovery UI, correlation/support guidance, safe reload, and production error reporting without sensitive state.
- **Complexity:** S.
- **Dependencies:** logging/monitoring decision for client errors.
- **Verification:** component test and Playwright injection show fallback, navigation/reload recovery, no token/state disclosure.
- **Current status:** OPEN, local-fixable.

### AUD-FE-002 — General frontend requests have no common timeout/cancellation policy

- **Affected module:** Frontend API/session orchestration.
- **Location:** `frontend/src/App.jsx:659-759`; only logout at `1318-1400` has a 3-second abort.
- **Evidence:** core `fetch` and retry calls have no `signal` or deadline.
- **Reproduction:** route a request that never fulfills; loading can persist indefinitely and stale work continues after navigation.
- **Root cause:** API client is embedded in `App.jsx` rather than a configured transport abstraction.
- **Severity:** MEDIUM.
- **Release impact:** **PRE-RELEASE**.
- **Confidence:** High.
- **Business consequence:** poor recovery on mobile networks, resource retention, duplicate mutations, confusing infinite loading.
- **Recommended fix:** shared request client with read/mutation timeout classes, caller cancellation, idempotency-aware retry, normalized network errors; never auto-retry non-idempotent mutations without a key.
- **Complexity:** M.
- **Dependencies:** component/API refactor sequencing.
- **Verification:** slow/hanging route tests; navigation abort; mutation not duplicated; localized retry UI.
- **Current status:** OPEN, local-fixable.

### AUD-QA-002 — Rating/save concurrency guarantees lack real-database integration tests

- **Affected module:** Store counters.
- **Location:** `StoreService.java:585-716`, `StoreRepository.java:18-20`, `StoreCounterReconciliationService.java`.
- **Evidence:** pessimistic locking and unique constraints exist, but repository search found no concurrent `rateStore`/`toggleSaveStore` test.
- **Reproduction:** issue parallel mutations against MySQL and compare denormalized counters with source rows.
- **Root cause:** unit suite does not exercise DB locks/concurrent transactions.
- **Severity:** MEDIUM.
- **Release impact:** **PRE-RELEASE**.
- **Confidence:** High that test is absent; defect itself unconfirmed.
- **Business consequence:** stale/incorrect popularity metrics if lock/isolation behavior differs from assumptions.
- **Recommended fix:** Testcontainers concurrency test plus reconciliation assertion; define isolation/deadlock retry behavior.
- **Complexity:** M.
- **Dependencies:** Docker/MySQL gate.
- **Verification:** repeated parallel run leaves one relation per user/store and exact counters; no unhandled deadlock.
- **Current status:** NOT VERIFIED.

### AUD-REL-006 — Important notification email has no transactional outbox

- **Affected module:** Email and moderation/account workflows.
- **Location:** `EmailService.java:86-149`; calling transaction synchronizations in `UserService`/`StoreService`.
- **Evidence:** verification/OTP fail truthfully; account/store notices are best-effort with bounded retry and metrics. No outbox entity/worker exists.
- **Reproduction:** terminate the process after DB commit/before SMTP success; notice is not durably queued.
- **Root cause:** direct SMTP delivery rather than transactionally persisted event.
- **Severity:** MEDIUM.
- **Release impact:** **DEFERABLE** for controlled MVP if alerts/manual resend exist; PRE-RELEASE if notices are a policy obligation.
- **Confidence:** High.
- **Business consequence:** owners/users can miss moderation or account-state notices.
- **Recommended fix:** transactional outbox, idempotent worker, bounded exponential retry/dead-letter/admin retry; until then alert on `cgfoodtour.email.delivery{outcome="failed"}`.
- **Complexity:** L.
- **Dependencies:** retention/operations policy.
- **Verification:** crash/restart integration test sends once; failures alert and remain retryable.
- **Current status:** OPEN.

### AUD-PRODUCT-001 — Privacy, Terms and self-service data-deletion path are absent

- **Affected module:** Public trust/product/legal.
- **Location:** no matching frontend routes/components; `AboutSection.jsx:145-218` only provides general/contact information; admin deletion exists at `UserController.java:121`.
- **Evidence:** repository search found no Privacy/Terms page and no `/users/me` deletion endpoint/action.
- **Reproduction:** navigate current public routes/profile and search source.
- **Root cause:** legal/trust blueprint has not been implemented.
- **Severity:** MEDIUM.
- **Release impact:** **PRE-RELEASE**; exact legal obligations require human/legal confirmation.
- **Confidence:** High for absence.
- **Business consequence:** unclear consent/data handling/support expectations and no direct user path to request deletion.
- **Recommended fix:** Product Owner/legal-approved Privacy and Terms; visible support/contact; deletion request/self-delete policy with re-authentication, grace/confirmation, audit/retention rules.
- **Complexity:** M/L.
- **Dependencies:** human policy decisions.
- **Verification:** routes/footer/profile links exist; content approved; deletion workflow tested without erasing required audit unlawfully.
- **Current status:** OPEN.

### AUD-PH4-001 — Responsive/device/accessibility acceptance remains incomplete

- **Affected module:** Entire frontend.
- **Location:** `docs/frontend-audit/FRONTEND_REDESIGN_BLUEPRINT.md`; large pages under `frontend/src/pages`; Playwright project matrix.
- **Evidence:** historical screenshots/mock checks exist, but user roadmap explicitly places responsive in Phase 4; no current real device, virtual keyboard, screen reader, or 200% zoom run.
- **Reproduction:** execute Phase 4 matrix on 320–1024 widths and physical/remote devices.
- **Root cause:** planned phase not started/completed.
- **Severity:** HIGH user-impact.
- **Release impact:** **PHASE-4** and required before broad public release.
- **Confidence:** High.
- **Business consequence:** mobile users may face hidden controls, overflow, unusable modals/tables or inaccessible interactions.
- **Recommended fix:** execute Phase 4 without reopening accepted desktop redesign unless regression is evidenced; prioritize auth, explore/detail, owner forms/history, admin moderation and navigation.
- **Complexity:** XL.
- **Dependencies:** Track A baseline and regression suite.
- **Verification:** viewport/device matrix, keyboard/focus, 200% zoom, reduced motion, axe/manual screen reader smoke, no horizontal overflow.
- **Current status:** PLANNED PHASE 4.

### AUD-ARCH-001 — Frontend orchestration and high-value pages are excessively coupled

- **Affected module:** Frontend architecture.
- **Location:** `App.jsx` 2,635 lines; `MyStoresSection.jsx` 2,632; `AdminSection.jsx` 2,580; `StoreDetailDrawer.jsx` 1,015.
- **Evidence:** `App` owns manual routing, session, API transport, public/owner/admin state and mutations; pages mix data orchestration with markup.
- **Reproduction:** trace a store mutation from UI through props/App state and note cross-module changes/testing requirements.
- **Root cause:** evolutionary growth without domain hooks/client modules.
- **Severity:** MEDIUM.
- **Release impact:** **DEFERABLE**, except extracting transport/session seams needed by AUD-FE-002.
- **Confidence:** High.
- **Business consequence:** slower fixes and higher regression probability during Phase 4.
- **Recommended fix:** evolutionary split into API client, auth/session provider, route shell, and domain hooks; split owner/admin subsections; preserve props/contracts and add characterization tests first.
- **Complexity:** XL if done at once; use incremental M batches.
- **Dependencies:** stable E2E baseline.
- **Verification:** behavior unchanged, smaller ownership boundaries, tests target hooks/modules, no request duplication.
- **Current status:** OPEN technical debt.

### AUD-TOOL-001 — Supported Java toolchain is not enforced and JDK 24 clean build fails

- **Affected module:** Build/developer experience.
- **Location:** `backend/pom.xml:1-165`, root `README.md` quick-start, Docker/CI Java settings.
- **Evidence:** machine-default JDK 24 `mvn clean test` generated unresolved `EmailTemplateBuilder` bytecode and failed 2 email tests. The same clean command under JDK 21 targeting release 17 passed 105 tests. CI and container specify Java 17.
- **Reproduction:** run clean test under JDK 24, then under JDK 21/17.
- **Root cause:** POM declares release 17 but does not enforce Maven runtime JDK/toolchain range; README says 17 or newer.
- **Severity:** LOW for deployment, MEDIUM for reproducibility.
- **Release impact:** **PRE-RELEASE** quick win.
- **Confidence:** High.
- **Business consequence:** false build failures or, worse, stale artifacts masking failures on developer machines.
- **Recommended fix:** enforce supported JDK 17 (or verified range) via Maven Enforcer/toolchains and update README; CI must always use `clean test`.
- **Complexity:** S.
- **Dependencies:** human decision whether to support 21.
- **Verification:** unsupported JDK fails early with clear message; JDK 17 clean CI passes.
- **Current status:** RESOLVED (Track A1: Maven Enforcer `[17,18),[21,22)` rule active, fail-fast verified on JDK 22/24, READMEs standardized).

### AUD-DOC-001 — Root documentation is stale relative to current contracts

- **Affected module:** Documentation/onboarding.
- **Location:** `README.md`, compared with controllers, prod config and `ops/`.
- **Evidence:** stale token duration, endpoint/technology wording, old workflow descriptions, and ambiguous Java compatibility.
- **Reproduction:** compare README feature/API claims with `AuthenticationController`, `StoreController`, `application-prod.yaml` and `API_REFERENCE.md`.
- **Root cause:** implementation evolved faster than root documentation.
- **Severity:** LOW.
- **Release impact:** **PRE-RELEASE**.
- **Confidence:** High.
- **Business consequence:** incorrect setup, tests against wrong contracts and unsafe deployment assumptions.
- **Recommended fix:** rewrite quick start and link authoritative API/ops docs; mark historical issue files as historical.
- **Complexity:** S.
- **Dependencies:** final Track A decisions.
- **Verification:** fresh checkout following README reaches supported local state; all documented paths match mappings.
- **Current status:** OPEN.

### AUD-API-001 — Google login request validation is inconsistent with Facebook login

- **Affected module:** Authentication DTO/API validation.
- **Location:** `backend/src/main/java/com/cangiuoc/cgfoodtour/dto/request/GoogleLoginRequest.java:1-16`, compared with `FacebookLoginRequest.java:1-18`.
- **Evidence:** `idToken` has no `@NotBlank`; Facebook `accessToken` does. Invalid Google input is rejected later by decoder exception handling rather than at the DTO boundary.
- **Reproduction:** POST a missing/blank `idToken` and compare the response path with blank Facebook token.
- **Root cause:** DTO validation annotation was omitted.
- **Severity:** LOW.
- **Release impact:** **PRE-RELEASE** quick win.
- **Confidence:** High.
- **Business consequence:** inconsistent 400/error semantics and unnecessary provider-decoder work.
- **Recommended fix:** add `@NotBlank` with a stable validation code/message and controller contract tests; retain generic invalid-token behavior externally where appropriate.
- **Complexity:** S.
- **Dependencies:** coordinate with A5 social-client tests.
- **Verification:** missing/blank Google token returns the expected standard envelope before decoder invocation; valid token path unchanged.
- **Current status:** OPEN.

### AUD-BE-001 — Open Session in View remains implicitly enabled

- **Affected module:** Backend JPA/runtime configuration.
- **Location:** base/prod application YAML; test startup emitted Spring's `open-in-view is enabled by default` warning.
- **Evidence:** no explicit `spring.jpa.open-in-view=false` was found; clean application-context test logs the warning.
- **Reproduction:** start the test/application context and inspect startup logs.
- **Root cause:** framework default was not overridden; mapping code may rely on lazy relations without an explicit transaction.
- **Severity:** LOW/MEDIUM.
- **Release impact:** **DEFERABLE** unless profiling shows queries during serialization or connection pressure.
- **Confidence:** High for configuration state; runtime impact not measured.
- **Business consequence:** hidden N+1 queries, longer DB connection lifetime and failures appearing outside service transactions after later refactors.
- **Recommended fix:** first add repository/service query tests and inspect lazy mappings; then set `open-in-view=false` and fix only demonstrated missing fetch boundaries.
- **Complexity:** M.
- **Dependencies:** real MySQL integration/profiling.
- **Verification:** API regression suite passes with the setting disabled; query counts/serialization remain bounded.
- **Current status:** OPEN technical debt.

### AUD-DATA-002 — Audit and retained-data lifecycle is not fully codified

- **Affected module:** Store audit/user deletion audit/data governance.
- **Location:** `StoreAuditLog`, `UserDeletionAudit`, `StoreHistoryService`; no scheduled retention policy found for these records.
- **Evidence:** audits intentionally survive store/user deletion and actor/owner fields are anonymized, but retention duration, export, purge and legal-hold policy are not specified in active configuration.
- **Reproduction:** inspect scheduled cleanup services and entity/repository lifecycle; audit tables have no retention worker.
- **Root cause:** preservation behavior was implemented before a final data-governance policy.
- **Severity:** MEDIUM.
- **Release impact:** **PRE-RELEASE policy decision**; implementation may be deferable if indefinite minimal audit retention is explicitly approved.
- **Confidence:** High.
- **Business consequence:** excessive retention, unclear user-deletion semantics, unbounded table growth, or premature deletion of moderation evidence.
- **Recommended fix:** Product Owner/legal decision for purpose, fields, access, retention and purge; encode retention only after approval; keep anonymized moderation evidence separate from personal profile data.
- **Complexity:** S for policy, M for lifecycle implementation.
- **Dependencies:** Privacy/Terms/data deletion decisions.
- **Verification:** approved retention matrix; tests prove anonymization and age-based purge while protected evidence remains.
- **Current status:** OPEN policy gap.

## 3. Infrastructure requirement matrix

| Requirement | Mandatory before public? | Can complete local? | Requires staging/domain? | Current evidence |
|---|---:|---:|---:|---|
| MySQL clean migration | Yes | Yes, with Docker | No | Skipped now |
| Legacy snapshot upgrade | Yes if retaining local data | Partly | Representative snapshot | Not run |
| Domain and HTTPS | Yes | No | Yes | Absent/unconfirmed |
| Secret injection/rotation | Yes | Config test local; operation external | Yes | Validator exists |
| SMTP delivery + SPF/DKIM/DMARC | Yes for public registration/reset | Mailpit local only | Yes | Not verified |
| OAuth origins/redirects | If social login ships | No | Yes | Not verified |
| Cloudinary upload/delete | If media ships | Mock/rehearsal partly | Provider credential | Not verified |
| Off-host backup and restore | Yes | Script/rehearsal local partly | Backup storage/DB | Not executed |
| Logging/metrics/alerts | Yes | Endpoints local | Collector/channel | Not configured externally |
| One backend replica | Yes initially | N/A | Deployment setting | Documented constraint |
| Load/security tests | Minimum targeted tests yes | Partly | Best on staging | Not run |

## 4. Go/no-go rule

Do not approve public release while any **BLOCKER** above lacks evidence. A staging deployment may begin after local Track A gates pass, but staging existence itself does not close OAuth, cookie, email, backup, monitoring, mobile, or security validation. See `RELEASE_READINESS_BLUEPRINT.md` for task order and definitions of done.
