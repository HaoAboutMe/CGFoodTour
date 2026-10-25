# CG FoodTour — Audit Evidence Index

> Audit date: 2026-10-25  
> This index contains references and sanitized outcomes, not credentials, tokens, personal data, or source-code copies.

## 1. Evidence confidence model

| Label | Meaning |
|---|---|
| VERIFIED-CODE | Directly observed in current source/configuration |
| VERIFIED-TEST | Executed in this audit and passed on the stated environment |
| HISTORICAL | Claimed by an existing report/commit but not rerun now |
| NOT VERIFIED | Required service/environment/data was absent |
| POTENTIAL RISK | Feasible from code/design, but exploitation or runtime consequence not demonstrated |

## 2. Baseline evidence

| Claim ID | Claim | Source/command | Observation | Confidence |
|---|---|---|---|---|
| BASE-001 | Current branch | `git branch --show-current` | `feature/frontend-desktop-redesign` | VERIFIED-TEST |
| BASE-002 | Current commit | `git rev-parse HEAD` | `527b849d08ae6cb8b0a3295fb8160691df165c6c` | VERIFIED-TEST |
| BASE-003 | Phase 3 checkpoint match | `git log -1 --oneline`, ancestor/ref checks | Reported hash exactly equals HEAD and remote feature ref | VERIFIED-TEST |
| BASE-004 | Worktree baseline | `git status --short` | Only pre-existing untracked PNG screenshots | VERIFIED-TEST |
| BASE-005 | No tracked real env file by inventory | `git ls-files` filters | Only `.example` env files and prod/rehearsal YAML tracked; local `application-dev.yaml` is untracked/ignored | VERIFIED-TEST |

## 3. Commands executed and outcomes

| Command/gate | Environment | Result | Limitation |
|---|---|---|---|
| `mvn --batch-mode --no-transfer-progress clean test` | Machine default JDK 24 | FAIL: 105 tests discovered, 1 failure/1 error/2 skipped; email bytecode unresolved | JDK 24 is outside stated Java 17 toolchain; useful reproducibility finding, not canonical product result |
| Same clean Maven command with process JDK 21, release target 17 | JDK 21.0.6 | PASS: 105 tests, 0 failure, 0 error, 2 skipped | Not exact JDK 17 runtime; compiler targets 17. Skips are both Docker/MySQL migration tests |
| `docker info --format ...` | Local machine | FAIL: daemon/pipe unavailable | No Docker/rehearsal/MySQL execution possible |
| Frontend `npm run lint` | Installed Node dependencies | PASS, zero warnings/errors | Static analysis only |
| Frontend `npm test` | Node test runner | PASS: 38/38 | Unit/contract, not browser integration |
| Frontend production build with valid-shaped non-secret audit OAuth IDs | Vite production mode | PASS; artifact verifier passed | No real provider IDs/SDK login |
| `npm audit --audit-level=high` | npm registry on audit date | PASS: 0 vulnerabilities | Only frontend dependency tree and current advisory database |
| `npx playwright test --list` | No application server required | PASS: 1,148 discovered cases, 30 specs, 4 projects | Discovery only; zero claim of browser execution |

The first non-clean backend run was discarded as authoritative evidence because stale `target/` reports contained a test class no longer present in source. The clean JDK 21 run is the canonical backend result for this audit.

## 4. Test suite classification

### Backend

| Category | Representative sources | Current evidence |
|---|---|---|
| Unit/service | `AuthenticationServiceTest`, `AuthAbuseProtectionServiceTest`, `StoreTransitionPolicyTest`, `StoreHistoryServiceTest`, `ManagedImageServiceTest`, `UserServicePasswordTest` | PASS on clean supported-like toolchain |
| Controller/contract | `AuthenticationControllerTest`, `GlobalExceptionHandlerTest` | PASS |
| Authorization/visibility | `UserServiceAuthorizationTest`, `StoreVisibilityPolicyTest`, `FoodItemVisibilityTest` | PASS, focused scope |
| Application/H2 integration | `OperationalEndpointsTest`, `RepositoryQueryValidationTest` | PASS using H2/test profile |
| Configuration | `ProductionConfigurationValidatorTest`, `AuthCookieServiceTest`, `ClientIpResolverTest`, `RequestCorrelationFilterTest` | PASS |
| MySQL migration | `FlywayMigrationTest`, `FlywayJpaValidationTest` | SKIPPED: Docker unavailable |
| Concurrency | No real concurrent rating/save test found | NOT VERIFIED |
| Security dynamic | No DAST/penetration suite found | NOT VERIFIED |

### Frontend

| Category | Representative sources | Current evidence |
|---|---|---|
| Utility/unit | `apiErrorMessages`, `googleMapsUrl`, `storeUrl`, `redactSensitiveData`, history presentation | PASS within 38-test run |
| UI primitive/contract | `primitives.test.mjs`, confirmation modal, design/build/nginx contract | PASS |
| Mocked browser E2E | admin/auth/modal/explore/owner/navigation specs use `page.route` | Discovered; not executed now |
| Screenshot capture/visual | capture and visual-regression specs | Discovered; historical images exist; not executed now |
| Real local integration | `launch-smoke.spec.js`, `auth-session.spec.js`, `store-lifecycle.spec.js` | Sources verified; not run. Auth/store skip without env |
| Provider E2E | Social SDK loader tests exist; real provider credentials/origin absent | NOT VERIFIED |
| Accessibility/device | Some DOM assertions/historical screenshots | Full manual/device/screen-reader gate NOT VERIFIED |

## 5. Architecture and technology evidence

| Claim ID | Evidence sources | Finding |
|---|---|---|
| ARCH-001 | `frontend/package.json`, `vite.config.js`, `Dockerfile` | React 19/Vite 8/Tailwind 4; Node 22 container/CI |
| ARCH-002 | `backend/pom.xml`, backend Dockerfile | Spring Boot 3.5.9, Java release 17, JPA/Security/Mail/Actuator/Flyway/MySQL |
| ARCH-003 | `compose.rehearsal.yml` | MySQL 8.0, Mailpit, backend, frontend; local HTTP rehearsal |
| ARCH-004 | `App.jsx` and page line counts | App 2,635; MyStores 2,632; Admin 2,580; Detail drawer 1,015 |
| ARCH-005 | `App.jsx:217-310`, `main.jsx` | BrowserRouter plus manual path-to-activeTab routing; deep link `/quan/...` |
| ARCH-006 | `SseNotificationService`, abuse/cache services | process-local state; one backend replica constraint |

## 6. Functional/API compatibility evidence

| Claim ID | Frontend reference | Backend reference | Finding |
|---|---|---|---|
| API-001 | `App.jsx:1013-1291` | `AuthenticationController.java:49-461` | Core auth paths and field names align |
| API-002 | `App.jsx:831-984` | `StoreController.java:79-164,347-359` | Explore/facets/mine/saved paths and page wrappers align |
| API-003 | `App.jsx:1599-1871` | `StoreController.java:67-348`, `FoodItemController.java:34-83` | Owner/store/menu mutation paths align |
| API-004 | `App.jsx:2008-2189` | `UserController.java:29-121`, store admin mappings | Admin list/action paths align |
| API-005 | `App.jsx:659-759`, `AuthCookieService` | refresh/logout controller methods | Cookie+CSRF design aligns; real HTTPS remains unverified |
| API-006 | `GoogleLoginRequest.java`, `FacebookLoginRequest.java` | social controller methods | Fields align; Google request lacks `@NotBlank` |
| API-007 | `AuthenticationController.java:83` | Same file import block | Facebook handler still uses fully qualified request type inline; style only |

No frontend caller to a missing backend handler was confirmed by static inventory. This does not replace runtime contract testing.

## 7. Security evidence

| Claim/issue | Sources | Observation | Classification |
|---|---|---|---|
| SEC-E01 session storage | `App.jsx:55-76,640-759`; repository search for storage | access token in memory; refresh cookie; no token persistence in local/session storage | VERIFIED-CODE |
| SEC-E02 refresh/logout CSRF | `AuthCookieService`, controller refresh/logout | double-submit token/origin check | VERIFIED-CODE/TEST |
| SEC-E03 token revocation | `AuthenticationService`, `CustomJwtDecoder`, user services | JTI invalidation and tokenVersion checks | VERIFIED-CODE/TEST |
| SEC-E04 enumeration/rate limit | auth service/abuse service tests | generic credentials, dummy BCrypt, per-IP/email limits | VERIFIED-CODE/TEST |
| SEC-E05 proxy trust | `ClientIpResolver` and tests | forwarded headers trusted only for configured CIDRs | VERIFIED-CODE/TEST |
| SEC-E06 SSRF defense | `GoogleMapsUrlResolver.java:48+`, protection service/tests | HTTPS host allowlist, DNS/IP checks, redirects/size/time/concurrency/cache | VERIFIED-CODE/TEST |
| SEC-E07 uploads | `ManagedImageService` and tests | type/size/decode/dimensions/pixels/cleanup | VERIFIED-CODE/TEST |
| SEC-E08 output/errors | exception handler, error tests, email template tests | generic DB/500 responses; dynamic email content escaped | VERIFIED-CODE/TEST |
| AUD-SEC-001 | `AuthenticationService.java:423-425,531,670` | provider clients constructed ad hoc; no explicit Facebook timeout | POTENTIAL RISK |
| AUD-SEC-002 | `AuthenticationService.java:524-534,664-670` | Facebook tokens in query strings | VERIFIED-CODE risk; leakage runtime NOT VERIFIED |
| AUD-SEC-003 | `SecurityConfig.java:28-31,61-65`; controller annotations | broad store GET matcher; current sensitive methods protected | POTENTIAL FUTURE RISK |
| SEC-E12 secrets | tracked file inventory and production config | production values externalized; local dev credential file untracked | VERIFIED-CODE; operational rotation NOT VERIFIED |

## 8. Database evidence

| Claim/issue | Sources | Observation |
|---|---|---|
| DB-E01 engine | MySQL connector, Compose, prod validator, Testcontainers | MySQL 8 is canonical; not PostgreSQL |
| DB-E02 migrations | `db/migration/V1...`, `V2...` | ordered baseline and owner history migration exist |
| DB-E03 profiles | application base/dev/prod/rehearsal | dev may use Hibernate update; prod/rehearsal Flyway+validate |
| DB-E04 constraints | V1 schema/entities | unique email/username/social IDs/token user/save/rating/daily report; FKs/indexes present |
| DB-E05 deletion | `UserDeletionService.java:33-139` | transaction, child cleanup, counter rebuild, audit anonymization, after-commit media cleanup |
| DB-E06 owner history | V2 and `StoreHistoryService.java:55-175` | snapshot survives store deletion; owner-visible action/reason filtering |
| DB-E07 counter safety | `StoreRepository.java:18-20`, `StoreService.java:585-716` | pessimistic store lock plus reconciliation job |
| AUD-DATA-001 | skipped Testcontainers output | actual MySQL migration/JPA validation not demonstrated |
| AUD-PERF-001 | `StoreService.java:142-165,200-206` | unpaged public dataset filtered/sorted/faceted in Java |

## 9. Operational evidence

| Claim | Sources | Observation |
|---|---|---|
| Production fail-fast | `ProductionConfigurationValidator.java:20-141`, tests | required values, HTTPS, MySQL TLS, key length/distinct peppers validated |
| Health/metrics | `application-prod.yaml`, `SecurityConfig`, operational tests | liveness/readiness/DB, Prometheus admin-only, no health details |
| Correlation ID | request correlation filter/tests, Nginx config | generated/propagated ID and structured log pattern |
| SMTP timeouts/retries | `application-prod.yaml` mail properties; `EmailService.java:151+` | 5s SMTP deadlines, bounded exponential retry, metrics |
| Backup/restore | `ops/BACKUP_RESTORE_RUNBOOK.md`, scripts | procedures/helpers exist; no execution evidence |
| Deployment rollback | `ops/DEPLOYMENT_RUNBOOK.md` | immutable/health/forward-fix guidance exists |
| Alerts | Actuator/metrics exist | no external collector, thresholds, routing or drill evidence |

## 10. Documentation discrepancy evidence

| Claim ID | Documents | Code truth |
|---|---|---|
| DOC-E01 | root README token/API/technology claims | controllers/config show evolved contracts and 15-minute access default |
| DOC-E02 | historical known issues | many items are fixed in current code; file is a ledger, not current open list |
| DOC-E03 | Phase 3 QA test totals | clean current backend run is 105 with 2 skipped |
| DOC-E04 | Phase 3 “core integration” section | document itself identifies mocked contracts; no current real E2E execution |

## 11. Evidence limitations

- Docker daemon was unavailable, so no Compose, Testcontainers MySQL, Mailpit or container health checks ran.
- No staging or public endpoint was available.
- No real OAuth, SMTP, Cloudinary, DNS, TLS, proxy, backup store or monitoring account was accessed.
- No production/personal database was inspected or mutated.
- No load, soak, destructive, penetration or Internet scan was performed.
- Browser tests were listed but not executed; historical screenshots were not treated as current functional proof.
- No screen reader or physical mobile device was used.
- Backend dependency vulnerability status was not assessed by a dedicated SCA tool.
- JDK 17 was not installed locally; JDK 21 targeting release 17 passed, while CI/container declare JDK 17.

## 12. Audit file integrity check

The required deliverables are:

- `docs/project-audit/FULL_PROJECT_AUDIT.md`
- `docs/project-audit/PUBLIC_RELEASE_BLOCKERS.md`
- `docs/project-audit/RELEASE_READINESS_BLUEPRINT.md`
- `docs/project-audit/FEATURE_COMPLETENESS_MATRIX.md`
- `docs/project-audit/AUDIT_EVIDENCE_INDEX.md`

Final verification must confirm these are the only newly created non-user files and that no application source is modified.
