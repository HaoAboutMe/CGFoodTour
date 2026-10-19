# Initial incident runbook

## First five minutes

1. Confirm impact using an external request and `/api/actuator/health/readiness`.
2. Record start time, release version and representative `X-Request-ID` values.
3. Check 5xx rate, latency, JVM, Hikari pool, disk and dependency status.
4. Stop deployments and preserve relevant logs.
5. Choose mitigation: rollback app, disable one feature, enter maintenance mode or escalate database recovery.

## Database

- Check connectivity, disk, connection pool and provider status.
- Do not repeatedly restart the backend if readiness correctly reports DB failure.
- Do not run Flyway repair before comparing failed migration/checksum evidence.

## SMTP/email

- Check `cgfoodtour.email.delivery` outcomes and provider status.
- Critical verification/reset calls must not claim delivery after bounded retry failure.
- Best-effort administrative notifications do not roll back an already committed action; notify admins of delivery failure.

## OAuth

- Confirm provider status, redirect URI, allowed origin, CSP console and SDK readiness.
- Keep email/password login available when safe; do not weaken token validation as a workaround.

## Cloudinary/media

- Pause new upload actions if the provider is failing persistently.
- Inspect cleanup queue metrics/logs; do not delete database references to compensate for an unverified provider outage.

## Closeout

Document impact, timeline, root cause, corrective action and whether alert/backup/runbook changes are needed. Never paste raw tokens, OTPs, cookies or credentials into the incident report.
