# CG FoodTour — Feature Completeness Matrix

> Baseline: `527b849d08ae6cb8b0a3295fb8160691df165c6c`  
> Status vocabulary: **Complete-in-code**, **Partially verified**, **Incomplete**, **Not implemented**, **Not verified**.  
> A rendered screen or mocked browser test is not treated as end-to-end completion.

## 1. Authentication and accounts

| Feature | Frontend | Backend/API | Database | Contract/validation/authorization | Automated evidence | Real integration | Current status / gap |
|---|---|---|---|---|---|---|---|
| Registration | Auth modal collects all required fields and waits for response | `POST /auth/register`, normalized email, age/password validation, abuse limits, synchronous email | User, role, verification token, pending-expiry/IP hash | FE fields align with `UserCreationRequest`; public endpoint | Controller, user/password, abuse and email tests | Not run with SMTP/MySQL now | **Partially verified**; real email/db E2E required |
| Email verification | Token input and email landing flow | POST JSON and GET landing handlers | Unique per-user verification token; replacement on resend | Invalid/expired token returns failure; escaped HTML | Controller and service tests | Mail link flow not run now | **Partially verified** |
| Resend verification | UI waits and displays localized result | `POST /auth/resend-verification?email=`; rate-limited | Existing token replaced, not duplicated | Generic response policy and account state checks | User service/abuse tests | SMTP not verified | **Partially verified** |
| Password login | Email/password UI plus social buttons | `POST /auth/token`; BCrypt dummy verification prevents enumeration | User/roles/tokenVersion | Generic invalid-credentials; unverified only after correct password | Auth service/controller tests | Browser/backend flow not run | **Partially verified** |
| Logout | UI calls server then clears all in-memory domain state | `POST /auth/logout`; refresh/access invalidation and cookie clear | Invalidated token table | Custom CSRF required; bounded client timeout | Auth tests and mocked session tests | HTTPS cookie flow not run | **Partially verified** |
| Refresh/session expiry | Auto-refresh, single-flight lock, tab broadcast | Rotates refresh token; checks type, JTI, tokenVersion | Invalidated token table | Refresh in HttpOnly cookie; access JSON only | Cookie/auth tests | Secure/SameSite browser behavior not run | **Partially verified** |
| Forgot password | Email form and OTP steps | Forgot, verify OTP, reset endpoints | Hashed OTP, expiry, use and failed-attempt state | Rate/attempt limit; password policy | Auth/user tests | SMTP and complete browser flow not run | **Partially verified** |
| Change password | Profile form; logout after success | `PUT /users/me/change-password` verifies old password and bumps tokenVersion | User tokenVersion | Authenticated self endpoint | Password tests | Two-browser revocation not rerun | **Partially verified** |
| Google login | SDK/button and callback wired | Google JWT signature/issuer/audience/email checks | googleId unique user link | `idToken` field matches, but DTO lacks `@NotBlank` | Social logic tests are focused, provider absent | **Not verified** on real provider/domain |
| Facebook login | SDK/button and callback wired | Debug token + profile lookup and account-link policy | facebookId unique user link | `accessToken` matches and is `@NotBlank` | Focused auth tests | **Not verified**; query-string token/timeout risk |
| Profile update | Profile form, age validation, errors | `GET/PUT /users/me` | User fields | Client/server age rule aligns at 18 | Utility/service coverage | Real DB/browser not run | **Partially verified** |
| Avatar update | Local preview and multipart submit | Validated managed upload, DB-first swap and cleanup | Public ID + URL, cleanup queue | Authenticated self endpoint | Managed image tests | Cloudinary not run | **Partially verified** |
| Disable/enable account | Admin modal with reason; distinct actions | Admin service, reason, last-admin guard, token revoke, notices | Disabled metadata/tokenVersion | Admin method security | User password/authorization tests | Multi-session real workflow not run | **Partially verified** |
| Role assignment | Admin edit UI | Admin update path, last-admin protection, token revoke | User-role join | Admin-only service | Authorization/password tests | Multi-role E2E not run | **Partially verified** |
| Self account deletion | No user-facing action | No `/users/me` delete workflow | Admin deletion infrastructure only | N/A | None | N/A | **Not implemented**; public process/policy required |

## 2. Explore and public stores

| Feature | Frontend | Backend/API | Database | Authorization/visibility | Automated evidence | Real integration | Current status / gap |
|---|---|---|---|---|---|---|---|
| Discovery/list | Grid/list cards, loading/empty/error | `GET /v1/stores` page wrapper | Store/category/owner | APPROVED + enabled owner | Mocked UI and repository query validation | Not run on real data now | **Complete-in-code**, integration pending |
| Search | Debounced query | Name/address/landmark query | SQL LIKE | Public visible records only | Mocked UI | Scale not tested | **Partially verified** |
| Multi-category filter | Filter UI | category ID collection | Category FK/index | Public | Mocked UI | Not run real API | **Partially verified** |
| Open-now filter | Quick filter | Business-zone clock and overnight rules | Open/close times | Public | Service logic indirect | Timezone runtime not tested | **Partially verified** |
| Distance/radius sort | “Gần tôi” GPS flow | Haversine distance, max radius validation | Lat/lng | Public | UI mocks | Real device permission not tested | **Partially verified**; query is in-memory/unbounded |
| Pagination | “Xem thêm” and page metadata | Page response | Repository supports page, but public service fetches unpaged before slice | Public | Contract tests | Load not tested | **Incomplete for scale** |
| Facets | Category counts | `/facets` | Same public query | Public | Static match | Not load-tested | **Incomplete for scale**; unpaged aggregation in Java |
| Store detail | Drawer with rich states | `GET /v1/stores/{id}` | Store relations | Policy returns non-public as not found | Drawer/deep-link mocks | Real API not run | **Partially verified** |
| Share/deep link | Web Share then clipboard fallback; `/quan/...` | Detail endpoint supports ID | N/A | Public visible only | URL utility + deep-link specs | Browser execution not current | **Partially verified** |
| External Maps | Validated Google Maps link | URL normalized/validated during store workflow | `map_url`, lat/lng | Only supported HTTPS Google hosts rendered | URL tests/resolver tests | Live Google redirect not run | **Partially verified** |
| Menu/dishes | Menu tab/cards | Food item store/detail reads | Food item FK | Inherits store visibility | Visibility tests | Real API not run | **Partially verified** |
| Sentiment rating | Three-level rating UI and aggregates | Authenticated rate mutation with row lock | Unique user/store rating, counters | Visible approved store | Code/unit policy; no concurrency test | Real concurrent requests not run | **Partially verified** |
| Text reviews/comments | UI names a reviews/rating area but no text corpus | No review/comment endpoint/entity | None | N/A | None | N/A | **Not implemented**; deferable MVP choice |
| Bookmark | Save/unsave and saved page | Auth mutation, row lock and page | Unique user/store save, count | Authenticated | Mocked UI | Concurrency not run | **Partially verified** |
| Closed-store report | GPS flow and feedback | Daily limit + 100m location rule | Daily report unique key | Authenticated | Code inspection | Device GPS/real DB not run | **Partially verified** |
| Random/ranking | CS2 spinner/ranking loaders | Public endpoints | Store counters | Approved + enabled owner | Mocked/browser historical | Current real execution absent | **Partially verified** |

## 3. Store ownership and management

| Feature | Frontend | Backend/API | Database | Authorization/state | Automated evidence | Real integration | Current status / gap |
|---|---|---|---|---|---|---|---|
| Create store | Multi-section form; selected image uploads only on save | `POST /v1/stores` JSON/multipart workflows | Store/category/owner/audit | Authenticated owner; starts PENDING | State/history tests, mocked UI | Store lifecycle spec exists but not run | **Partially verified** |
| Edit store | Owner edit form, draft image preview/cancel | `PUT /v1/stores/{id}`; transactional media handling | Store/audit/cleanup | Owner/admin policy; owner edit can return to PENDING | Transition/media tests | Cloudinary/MySQL not run | **Partially verified** |
| Banner upload | Explicit save, no upload on cancel | Patch endpoint and managed swap | Public ID/URL | Can-manage check | Managed image tests | Real provider not run | **Partially verified** |
| Owner list | Paginated dashboard | `/mine` page | Owner FK | Authenticated owner | Mocked UI | Real API not run | **Partially verified** |
| Submit/approval lifecycle | Status cards and reason copy | Submit/approve/reject/hide/recover policies | Status and audit | Owner/admin transition policy | Transition policy tests | Full multi-role E2E not run | **Partially verified** |
| Recovery request | Owner form and status | Request/reject/recover endpoints | Recovery fields/audit | Owner/admin policy | Transition/history tests | Real workflow not run | **Partially verified** |
| Dish management | Create/edit/delete/image UI | Food item CRUD and image endpoint | Food item/store FK | Store manage policy | Visibility tests; UI mocks | Cloudinary/API not run | **Partially verified** |
| Owner history | Timeline/filter/pagination/detail actions | `/mine/history`, sanitized owner-visible reasons | V2 snapshot fields/indexes | Current owner snapshot, safe action list | 5 service tests + UI utility/mocks | V2 MySQL and lifecycle not run | **Partially verified** |
| Owner hard-delete | Confirmation/reason | Transactional dependent delete and retained audit | Multiple child tables/audit snapshots | Owner/admin-specific policy | Focused tests | MySQL workflow not run | **Partially verified** |
| Ownership authorization | UI only exposes owned items | Service checks ownership or admin | Owner FK | Method + policy checks | Policy tests | Dynamic IDOR matrix absent | **Partially verified** |

## 4. Administration

| Feature | Frontend | Backend/API | Database | Authorization | Automated evidence | Real integration | Current status / gap |
|---|---|---|---|---|---|---|---|
| Dashboard summary | Cards/counts | `/v1/stores/admin/summary` | Count queries | Admin | Mocked UI | Not run real DB | **Partially verified** |
| Store moderation | Search/filter/page/table/cards | Admin page endpoint and actions | Store/audit | Admin method security | Transition tests/UI mocks | Multi-role E2E absent | **Partially verified** |
| Approve/reject | Reason modal where required | Guarded state transitions + email | Store/audit | Admin | Policy/history/email tests | SMTP/workflow absent | **Partially verified** |
| Hide/recover | Reason modal and distinct states | Guarded actions | Store/audit/recovery | Admin/owner rules | Policy tests | Workflow absent | **Partially verified** |
| Permanent store deletion | Typed confirmation/reason | Explicit cleanup, audit retained | Child rows/media queue | Owner/admin rules | Service-focused tests | Real MySQL absent | **Partially verified** |
| User list/search/filter/page | Admin table/cards | `/users` page query | User/role | Admin service | Static/UI mocks | Real DB absent | **Partially verified** |
| Disable/enable | Custom reason modal and color distinction | Last-admin guard, token revoke, emails | Disabled metadata | Admin | Focused service tests | Cross-session/SMTP absent | **Partially verified** |
| User deletion | Confirmation and reason | Transactional cascade/anonymize | User-related rows and audits | Admin; cannot self/delete last admin | Deletion service test | MySQL absent | **Partially verified** |
| Role assignment | Checkbox edit form | Update service | User-role join | Admin; last-admin guard | Authorization tests | Multi-role absent | **Partially verified** |
| Categories | CRUD and icon picker | Category CRUD | Unique category and store FK | Public reads/admin writes | UI mocks; validation | FK failure behavior not run MySQL | **Partially verified** |
| Role/permission API | No normal admin UI consumer found | CRUD services exist | Role/permission tables | Admin service annotations | No dedicated tests found | Not run | **Implemented but unused**; restrict/document or remove later |

## 5. Supporting and operational features

| Feature | Implementation | Test/evidence | Current status |
|---|---|---|---|
| Header/navigation | Desktop header, bottom navigation, route titles | Mocked navigation specs/historical screenshots | **Phase 3 complete-in-code; Phase 4 pending** |
| Loading/error/empty states | Shared skeletons and page-level retry states | Unit/mocked Playwright | **Partially verified** |
| Vietnamese errors/toasts | Error-code dictionary; backend English retained | 38 frontend unit/contract suite includes error mapping | **Verified at utility level** |
| Dev/debug UI | Dev-only admin console, redacted data | Build contract | **Production-restricted correctly** |
| Transactional email | HTML/plain text, escaped content, SMTP timeouts/retries/metrics | Email tests pass | **Partially verified**; no outbox/live SMTP |
| Health/metrics/correlation | Actuator probes, DB readiness, Prometheus, request ID | Backend operational tests | **Complete-in-code**, collector/alerts absent |
| Migrations | Flyway V1/V2; validate in prod/rehearsal | Two Testcontainers tests | **Not verified now** because Docker skipped |
| Backup/restore | Runbooks and guarded scripts | Static inspection only | **Not executed** |
| Docker rehearsal | MySQL/Mailpit/backend/frontend compose | Config exists | **Not executed now** |
| CI | Backend clean tests; FE lint/tests/build/audit; Playwright listing | Workflow inspection | **Incomplete**: no actual browser E2E, no backend dependency scan |
| Privacy/Terms | No frontend pages/routes found | Static search | **Not implemented** |
| Contact/support | About page and email in templates | Static inspection | **Implemented** |
| SEO | Deep links/title updates | Static inspection | **Partial**; no server-rendered metadata/dynamic sitemap |

## 6. Completion interpretation

- **MVP business code:** broad and mostly present.
- **Locally proven:** unit/contract/build gates, excluding real MySQL.
- **Operationally proven:** not yet; runbooks are preparation, not evidence.
- **Public-ready:** no. Phase 4, legal baseline, MySQL migration rehearsal, real E2E, HTTPS/OAuth/email/upload, restore, and monitoring gates remain.
