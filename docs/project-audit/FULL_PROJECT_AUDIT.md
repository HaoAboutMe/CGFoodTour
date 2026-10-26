# CG FoodTour — Full Project Audit

> Audit date: 2026-10-25  
> Scope: repository, static analysis, safe local quality gates, and release planning  
> Baseline: branch `feature/frontend-desktop-redesign`, commit `527b849d08ae6cb8b0a3295fb8160691df165c6c`  
> Decision: **NOT READY FOR PUBLIC RELEASE**; suitable to become a staging candidate after Track A gates pass.  
> Constraint: this audit did not modify application source, schema, configuration, or data.

## 1. Executive summary

CG FoodTour is no longer a prototype-only codebase. Its core product surface exists end to end: account lifecycle, secure refresh-cookie sessions, public store discovery, owner store/menu workflows, moderation, saved stores, rating/reporting, media lifecycle, owner-visible audit history, Flyway migrations, production validation, container rehearsal, health/metrics, and operational runbooks.

The strongest verified areas are authentication hardening, store visibility/state policy, upload validation/cleanup, production fail-fast configuration, and the breadth of local unit/contract tests. Phase 3's Git checkpoint is genuine and exactly equals current `HEAD`.

The repository is nevertheless **not ready to be exposed publicly today**. The main reasons are evidence gaps rather than a single catastrophic source defect:

1. The two real-MySQL Flyway tests were skipped because Docker was unavailable. A clean database and an upgraded/restored database have not been proven in this audit.
2. Real browser E2E, SMTP delivery, OAuth providers, secure cookies, TLS/reverse-proxy behavior, Cloudinary, backup restore, and monitoring alerts require a running rehearsal/staging environment and were not verified.
3. CI discovers 1,148 Playwright cases but does not execute them. Many UI cases mock APIs or capture screenshots; that is not real integration evidence.
4. Facebook token handling places credentials in outbound query strings and both social providers lack an explicitly configured outbound timeout/client boundary.
5. Public store filtering/pagination currently materializes all matching approved stores in memory, which will degrade with growth.
6. Phase 4 responsive work remains intentionally pending, and public-facing privacy/terms/data-deletion information is absent.

No confirmed CRITICAL vulnerability was found by this static/local audit. That is not a declaration of security: dynamic authorization, provider, proxy, and deployment testing remain unverified.

## 2. Repository baseline

| Item | Verified state |
|---|---|
| Branch | `feature/frontend-desktop-redesign` |
| HEAD | `527b849d08ae6cb8b0a3295fb8160691df165c6c` |
| Reported Phase 3 checkpoint | Exact match with `HEAD` |
| Remote branch | `origin/feature/frontend-desktop-redesign` at the same commit |
| Worktree before audit | 34 untracked PNG screenshots only |
| Audit modifications | Only five Markdown files under `docs/project-audit/` |
| CI | `.github/workflows/ci.yml`, triggers on PR and pushes to `main`/`master` |

The existing screenshots were preserved. They are user-owned untracked files and are not audit artifacts.

## 3. Current architecture and technology inventory

### 3.1 Frontend

- React 19.2.8 and React DOM 19.2.8.
- Vite 8.2.4; Node 22 in CI/container.
- Tailwind CSS 4.3.3 plus project design tokens and shared primitives.
- React Router DOM 7.18.2, but route-to-view resolution is mostly centralized manually in `frontend/src/App.jsx`.
- Leaflet for maps; Lucide for icons.
- Native `fetch` API, state held primarily in `App.jsx`; no external query/state library.
- Playwright across Chromium, WebKit, mobile Chrome, and mobile WebKit profiles.
- Nginx unprivileged container serves the SPA and reverse-proxies `/api`.

Primary routes/views found:

| Route | View | Access |
|---|---|---|
| `/explore` and `/` | Explore/search/filter/store cards | Public |
| `/quan/{id}/{slug}` | Shareable store detail drawer/deep link | Public only for visible stores |
| `/saved` | Saved stores | Authenticated behavior; route is reachable but content depends on session |
| `/profile` | Profile/avatar/password | Authenticated |
| `/my-stores` | Owner dashboard, create/edit/menu/history | Authenticated |
| `/admin` | Users, stores, categories, moderation | Admin |
| `/about` | Product/contact information | Public |
| `/cs2-spinner` | Random-store gamification | Public |

The largest orchestration units are `App.jsx` (2,635 lines), `MyStoresSection.jsx` (2,632), `AdminSection.jsx` (2,580), and `StoreDetailDrawer.jsx` (1,015). Size alone is not a defect, but these files combine state, API calls, navigation, validation, and presentation, increasing regression cost and making isolated tests difficult.

### 3.2 Backend

- Java target 17, Spring Boot 3.5.9.
- Spring MVC, Security resource server/JWT, Method Security, Validation, JPA/Hibernate.
- Nimbus JOSE JWT, MapStruct, Lombok, Spring Mail, Actuator, Prometheus.
- Cloudinary integration with validated image upload and durable cleanup queue.
- Flyway for managed environments.
- MySQL Connector/J; H2 for most tests; Testcontainers MySQL for schema tests.
- Controllers: authentication, users, stores, food items, categories, roles, permissions.
- Fifteen Spring Data repositories and corresponding entities for users/roles, stores/menu, ratings/reports/saves, verification/OTP/revocation, audit, deletion audit, and media cleanup.

The backend is a conventional layered monolith. This is appropriate for the current product scale. The main scale constraint is process-local state (SSE emitters, caches, and rate-limit counters), so the supported initial topology is one backend instance.

### 3.3 Database and migration

- Canonical engine: MySQL 8 (`compose.rehearsal.yml`, JDBC driver, prod validator, Testcontainers).
- `V1__baseline_schema.sql` creates the full baseline schema.
- `V2__owner_store_history.sql` adds owner history snapshot/visibility fields and indexes.
- Production/rehearsal: Flyway enabled, validation enabled, Hibernate `ddl-auto=validate`.
- Development: Flyway disabled and schema may predate Flyway; this requires deliberate baseline handling for existing data.
- `baseline-on-migrate=false` is correctly fail-safe.

The schema includes useful unique constraints and indexes for identity, verification tokens, saved stores, daily reports, ratings, audit history, and cleanup. Audit snapshots deliberately avoid foreign keys so history can survive entity deletion. Admin user deletion is transactional, removes public dependent data/media references, recalculates affected counters, and anonymizes retained audit entries.

### 3.4 Runtime and operations

- Production configuration requires explicit database, SMTP, OAuth, JWT, peppers, CORS/base URL, Cloudinary, and admin email values.
- Production validator rejects localhost, placeholder values, non-MySQL DBs, non-HTTPS public URLs, weak JWT secrets, reused peppers, and MySQL without `sslMode=VERIFY_IDENTITY`.
- Health liveness/readiness, DB readiness, correlation ID, Prometheus endpoint, and generic error handling exist.
- Dockerfiles use non-root runtime images; the Nginx edge has CSP/security header contracts and upload limits.
- Rehearsal Compose provides MySQL, Mailpit, backend, and frontend; it is local HTTP and does not prove secure-cookie/OAuth behavior.
- Deployment, incident, backup/restore runbooks and guarded shell helpers exist.

## 4. Functional completeness assessment

The detailed matrix is in `FEATURE_COMPLETENESS_MATRIX.md`. Summary:

| Domain | Implemented | Main unresolved evidence/gap |
|---|---|---|
| Registration and email verification | FE/BE/DB wired; synchronous SMTP with bounded retry | Real SMTP and full E2E not run |
| Password login/logout/refresh | Memory access token; HttpOnly rotating refresh cookie; CSRF checks | HTTPS/cookie/proxy E2E not run |
| Forgot/reset/password change | OTP rate/attempt controls; token version revocation | Cross-browser real E2E not run |
| Google/Facebook login | UI and backend handlers exist; disabled-account policy present | Provider E2E absent; outbound-client risks remain |
| Profile/avatar | Update, validation, transactional media swap/cleanup | Cloudinary real failure/recovery not run |
| Explore/search/filter/sort | Backend parameters and frontend controls wired | In-memory full-result filtering is a scale risk |
| Store detail/menu/share/map | Deep link, menu, share, validated Google URL | SEO/prerender remains backlog; browser E2E not current |
| Ratings | Aggregate sentiment rating implemented | No textual review/comment feature |
| Save/report closed | Persisted, authorization and GPS restriction implemented | No real concurrency/browser workflow run |
| Owner create/edit/banner/menu | Implemented with staged upload and state transitions | Real MySQL/Cloudinary lifecycle E2E not run |
| Owner store history | V2 migration, service, endpoint, UI, tests | V2 on MySQL and lifecycle browser flow unverified now |
| Admin moderation/users/categories | Pagination/filtering/actions/reasons/confirmation implemented | Real multi-role E2E not run |
| Permanent deletion | Transactional dependent-data cleanup plus retained anonymized audit | Only focused service test, not real MySQL workflow |
| Emails | HTML/plain text, escaped data, timeouts, retries, metrics | No outbox; best-effort notices can be lost on process failure |
| Responsive/mobile | Existing responsive styles and historical screenshots | Phase 4 is still planned; device/zoom/keyboard verification pending |
| Legal/trust | About/contact exists | Privacy, Terms, public deletion process absent |

## 5. Frontend audit

### Verified strengths

- Refresh token is not stored in `localStorage`; it is an HttpOnly cookie. Access token remains in memory.
- Refresh rotation is serialized with Web Locks when supported; `BroadcastChannel` coordinates session state across tabs.
- Session generation/request sequence guards reduce stale-response leakage after logout or rapid navigation.
- API error codes map to Vietnamese user-facing messages; sensitive request fields are redacted before dev logging.
- `DevConsole` is lazy-loaded only in development for admins.
- Store deep links preserve reload/back behavior and use canonical slug paths.
- Public, owner, and admin screens include loading/empty/error patterns and server-side page metadata in major lists.
- Production build contract rejects localhost, placeholders, and missing public OAuth IDs.

### Technical debt and risks

1. **No root render error boundary.** A render-time exception can blank the SPA without a recoverable user screen (`AUD-FE-001`).
2. **General API calls have no timeout/cancellation.** `makeRequest` can wait indefinitely on a dead network; only logout and selected search actions use abort/timeout (`AUD-FE-002`).
3. **Central orchestration is highly coupled.** `App.jsx` owns session, routing, most API calls, admin/owner/public state, and mutations. The large owner/admin components also mix domain and presentation (`AUD-ARCH-001`).
4. **Routing is hybrid/manual.** BrowserRouter exists, but view selection parses `location.pathname` into `activeTab`; adding nested routes is error-prone.
5. **No self-service account deletion UI/API.** Admin deletion exists, but a public data-deletion process is not represented (`AUD-PRODUCT-001`).
6. **Phase 4 remains open.** Historical mocked/screenshot tests are not a substitute for actual mobile devices, 200% zoom, virtual keyboard, and assistive technology (`AUD-PH4-001`).
7. Main production JS is about 430 KiB raw, with owner/admin chunks split. This is acceptable for a staging candidate but should be measured with Lighthouse/RUM rather than judged from raw size alone.

## 6. Backend and API audit

### API compatibility summary

Static comparison found no confirmed frontend call to a nonexistent handler and no confirmed response-shape mismatch in core flows.

| Frontend caller | Method/path | Backend handler | Request/response | Authorization | Status |
|---|---|---|---|---|---|
| Auth modal/App | `POST /auth/register` | `AuthenticationController.register` | Registration DTO and `ApiResponse<UserResponse>` align | Public + rate limits | MATCH |
| Auth modal/App | `POST /auth/token` | `authenticate` | Email/password; access in JSON, refresh in cookie | Public + generic failure/rate limits | MATCH |
| Session manager | `POST /auth/refresh`, `/logout` | `refresh`, `logout` | Cookie + CSRF header/origin; rotated/cleared cookie | Public transport endpoint, custom CSRF | MATCH |
| Verification/reset UI | verify/resend/forgot/OTP/reset endpoints | Authentication controller | Payloads align | Public + abuse controls | MATCH |
| Social buttons | Google/Facebook login endpoints | Social handlers | Token field names align | Public + IP limit | MATCH, risks noted |
| Explore | `GET /v1/stores`, `/facets`, `/ranking`, `/random` | Store controller | Query/page wrappers align | Public visible stores | MATCH |
| Detail/menu | store ID and food item reads | Store/FoodItem controllers | Public DTO and menu arrays align | Visibility policy | MATCH |
| Saved/rate/report | save/rate/report endpoints | Store controller | Mutation responses align | Authenticated | MATCH |
| Owner | create/mine/mine-history/edit/banner/hide/recover/delete | Store controller | JSON/multipart and page DTOs align | Authenticated + ownership/service policy | MATCH |
| Menu owner | food item create/update/image/delete | FoodItem controller | JSON/multipart align | Authenticated + manage policy | MATCH |
| Admin | users, stores/admin/summary, approve/reject, enable/disable/delete | User/Store controllers | Query/action DTOs align | Admin method security | MATCH |
| Categories | list/create/update/delete | Category controller | DTOs align | Public reads, admin writes | MATCH |

### Verified safeguards

- Service/method authorization covers owner/admin resources; food items inherit store visibility.
- Public store repository requires approved status and enabled owner.
- State transitions are centralized and audited.
- Password/role/account-state changes bump `tokenVersion`; revoked JTIs are retained and cleaned.
- Login response does not reveal whether an email exists before password success.
- Login, social, registration, OTP, resend, and Maps resolver have bounded in-memory limits.
- Client IP only trusts forwarded headers from configured proxies.
- Maps resolver is authenticated, HTTPS/hostname/IP/redirect constrained, time-bounded, concurrency-limited, and cached.
- Image type, byte size, dimensions, pixel count, ownership, DB/media ordering, and cleanup retries are handled.
- Database exceptions and unexpected exceptions return generic responses; server logs retain stack/correlation evidence.

### Findings

- `AuthenticationService` constructs social HTTP clients ad hoc. Facebook `RestTemplate` calls have no explicit connection/read timeout; Google creates a decoder per login. Under provider degradation, application threads may be occupied (`AUD-SEC-001`).
- Facebook profile/debug requests place user/app access tokens in query strings. HTTPS protects transit contents, but URLs can enter exception/proxy/diagnostic logs (`AUD-SEC-002`).
- `GoogleLoginRequest.idToken` lacks `@NotBlank`, unlike Facebook. Invalid values are caught later, but the validation contract is inconsistent (`AUD-API-001`).
- Broad `GET /v1/stores/**` is permitted at request level, with sensitive subpaths relying on method security. Current methods are annotated, but a future added handler could become public by omission (`AUD-SEC-003`).
- Email has SMTP timeouts, bounded retry, metrics, HTML escaping, and truthful failure for verification/OTP. It has no transactional outbox. Best-effort account/store notices can be lost if the process dies after DB commit (`AUD-REL-006`).
- `ApplicationInitConfig` mutates reference roles/permissions on startup and requires a bootstrap admin password only when creating the first admin. This is safe enough with current validator but should be treated as a one-time bootstrap secret and removed/rotated after initialization.
- `open-in-view` remains enabled by default, observed in test startup. It can hide lazy-loading/N+1 behavior and prolong DB sessions (`AUD-BE-001`).

## 7. Database and data-integrity audit

### Verified in code/tests

- Multi-table mutations use transactions.
- Rating/save paths lock the store row before updating denormalized counters.
- A scheduled reconciliation job can rebuild counters from source rows.
- Unique constraints prevent duplicate rating, daily report, and saved-store relationships.
- Store/user deletion explicitly orders dependent deletes and retains anonymized audits.
- Store audit logs use snapshots, owner visibility rules, pagination, and deterministic ordering.
- Security artifacts, pending unverified accounts, old daily reports, and failed media deletions have cleanup jobs.

### Not verified against MySQL in this audit

- Clean V1→V2 migration.
- Hibernate `validate` against the Flyway-created MySQL schema.
- Upgrade/baseline from the current populated local schema.
- Transaction rollback and locking under concurrent real requests.
- Admin hard-delete cascade and retained audit rows on MySQL.
- Backup creation, checksum, restore, Flyway validation, and application startup.

### Data issues/backlog

- Existing databases that predate Flyway must not be automatically baselined. Schema inventory comparison on a restored copy is mandatory (`AUD-DATA-001`).
- Audit/data retention durations are not fully codified for owner history and deletion audit (`AUD-DATA-002`).
- Public store filters/facets query `Pageable.unpaged()` and filter/sort in Java. This is correct for small data but unbounded at scale (`AUD-PERF-001`).

## 8. Security assessment

| Area | Assessment | Classification |
|---|---|---|
| Password/JWT session lifecycle | Rotation, HttpOnly refresh cookie, token version and blacklist present | VERIFIED safeguard |
| CSRF | Global Spring CSRF off; bearer APIs are not cookie-authenticated; refresh/logout use custom double-submit/origin checks | VERIFIED design; staging test needed |
| CORS/TLS cookies | Strict production config and fail-fast validation | CODE VERIFIED, runtime NOT VERIFIED |
| IDOR/BOLA | Store/food/user service policies exist and have focused tests | No confirmed flaw; dynamic matrix NOT VERIFIED |
| SSRF | Maps resolver defenses are substantial | CODE/UNIT VERIFIED |
| XSS/output | React escaping, email escaping, map URL validation, CSP config | CODE VERIFIED; dynamic CSP report NOT VERIFIED |
| Upload | Content parse, type/size/dimension/pixel and ownership checks | CODE/UNIT VERIFIED; Cloudinary NOT VERIFIED |
| Account enumeration/abuse | Generic login failure and bounded auth/registration/OTP/maps controls | CODE/UNIT VERIFIED; distributed behavior NOT VERIFIED |
| Proxy IP | Trusted CIDR resolver exists | CODE/UNIT VERIFIED; reverse proxy NOT VERIFIED |
| Social HTTP/token transport | Query-string Facebook tokens and explicit timeout gap | POTENTIAL RISK |
| Secrets | Production uses env variables; secret-like local dev file is untracked | No committed secret found; rotate/inject operationally |
| Dependency risk | Frontend `npm audit --audit-level=high`: 0 vulnerabilities | VERIFIED on audit date |
| Backend dependencies | No OWASP/Dependabot backend scan configured in repository | NOT VERIFIED |
| Actuator/Swagger | Health public without details; metrics admin; prod docs disabled | CODE VERIFIED |

No destructive penetration test, Internet scan, or production-data test was performed.

## 9. Test coverage and evidence quality

### Current clean results

| Gate | Result | Evidence meaning |
|---|---|---|
| Backend `mvn clean test`, JDK 21 targeting 17 | PASS: 105 tests, 0 failure/error, 2 skipped | Unit/slice/H2 pass; MySQL migration not exercised |
| Backend with machine-default JDK 24 | FAIL in email test bytecode resolution | Unsupported-toolchain reproducibility issue; JDK 17/21 path passes |
| Frontend lint | PASS, zero warnings/errors | Static quality only |
| Frontend unit/contract suite | PASS: 38/38 | Utilities/primitives/build/nginx contracts |
| Frontend production build | PASS with valid-shaped non-secret OAuth IDs | Build and forbidden-string verification |
| Frontend npm audit high | PASS: 0 vulnerabilities | Registry result at audit time |
| Playwright `--list` | PASS: 1,148 cases across 30 specs/4 projects | Discovery only, not execution |
| Docker/MySQL tests | NOT RUN; Docker daemon unavailable | Release gate remains open |

The backend suite is primarily unit/service/slice tests plus an H2 application test. The only MySQL tests are `FlywayMigrationTest` and `FlywayJpaValidationTest`; both are annotated to skip without Docker and did skip. There is no demonstrated coverage metric, and no current real-DB concurrency test for ratings/saves.

Playwright includes three meaningful real-service specs: launch smoke, auth session with Mailpit, and store lifecycle with an isolated admin. The auth/store tests skip without their environment variables. Many other specs intentionally use `page.route` mocks or screenshots. CI runs `playwright test --list`, not `playwright test`, so browser behavior is not a CI gate.

Documentation discrepancy: Phase 3 reports describe earlier test totals and passes. Current clean source produced 105 backend tests; claims about full E2E remain historical unless rerun on this commit.

## 10. Documentation discrepancies

- Root `README.md` contains stale contracts and runtime claims, including older endpoint shapes, token duration wording, technology descriptions, and Java “17 or newer” wording that does not reflect the observed JDK 24 incompatibility.
- `KNOWN_ISSUES.md` is a historical ledger; many listed defects have since been fixed. It should not be read as current open status without source verification.
- Phase 3 QA correctly labels several core flows as mocked contract tests, but some summary wording can be mistaken for real integration acceptance.
- The authoritative current deployment material is under `ops/` and production/rehearsal configuration, not the root README.

## 11. Verified versus unverified claims

### Verified

- Git checkpoint and branch.
- Buildable frontend artifact and contract scans.
- Backend tests pass on JDK 21 targeting Java 17, excluding Docker tests.
- Core frontend/backend endpoint names and payload fields align statically.
- MySQL/Flyway/prod-validation configuration exists.
- Security controls listed above exist in code and focused tests.
- No tracked real environment/secret file was found by filename/status checks.

### Not verified

- Public hosting, domain, TLS, DNS, and CDN/reverse proxy.
- Real MySQL migrations and upgrade from user data.
- Real Gmail/SMTP deliverability and SPF/DKIM/DMARC.
- Google/Facebook OAuth on authorized HTTPS origins.
- Secure/SameSite cookies in actual target browsers.
- Cloudinary quotas, upload/delete consistency, and outage behavior.
- Full real-backend E2E and multi-user role matrix.
- Safari/iOS/Android devices, screen reader, 200% zoom, virtual keyboard.
- Backup restore RPO/RTO.
- Load, soak, dynamic security, and distributed rate-limit behavior.
- External alert routing/log retention.

## 12. Overall health and recommendation

| Dimension | Assessment |
|---|---|
| Functional breadth | Strong MVP breadth; textual reviews and self-delete/legal flow absent |
| Correctness confidence | Good unit/contract confidence; insufficient real integration evidence |
| Security posture | Materially hardened; social outbound boundary and deployment validation remain |
| Data readiness | Sound intent and migrations; real MySQL/baseline/restore gates open |
| Operability | Good repository scaffolding; no deployed monitoring/backup evidence |
| Frontend readiness | Desktop Phase 3 complete; architecture debt and Phase 4 remain |
| Public release | **NOT READY FOR PUBLIC RELEASE** |

Recommended next state: finish the immediate local gates in Track A, proceed with Phase 4 as planned, then provision an isolated HTTPS staging environment for Track C. Public release review should occur only after the go/no-go checklist in `RELEASE_READINESS_BLUEPRINT.md` is evidenced.
